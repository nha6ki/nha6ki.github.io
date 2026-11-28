"""Audited transcription confirmation, independent of PO approval and payment.

A confirmation attests to a saved snapshot, not a purchase or tax decision.
Confirmation does not enter the PO-approved ledger. Local Sheets delivery is explicit.
"""
import csv
import hashlib
import io
import json
import re
from datetime import datetime

import review_flow as flow


def snapshot(conn, ident):
    row = conn.execute('SELECT * FROM reviews WHERE id=?', (ident,)).fetchone()
    if row is None:
        raise ValueError('Review not found')
    ledger = conn.execute('SELECT invoice FROM ledger WHERE review_id=?', (ident,)).fetchone()
    invoice = json.loads(ledger['invoice'] if ledger else row['normalized'])
    revision = conn.execute("SELECT COALESCE(MAX(id),0) FROM events WHERE review_id=? AND action IN ('ingest','replace_context','save_draft','approve')", (ident,)).fetchone()[0]
    digest = hashlib.sha256(flow.dump(invoice).encode()).hexdigest()
    return row, invoice, revision, digest


def inspect(invoice):
    """Reject malformed values; surface missing and semantic issues for review."""
    try:
        flow.check_edited_invoice(invoice)
    except ValueError as exc:
        return {'errors': [str(exc)], 'warnings': []}
    errors, warnings = [], []
    for field in ('supplier', 'gross_total'):
        if not invoice.get(field):
            errors.append(field + ': required for export')
    for field in ('invoice_number', 'issue_date', 'currency'):
        if not invoice.get(field):
            warnings.append(field + ': not recorded; verify against source')
    if invoice.get('issue_date'):
        try:
            datetime.strptime(invoice['issue_date'], '%Y-%m-%d')
        except ValueError:
            errors.append('issue_date: use YYYY-MM-DD')
    if invoice.get('currency') and not re.fullmatch('[A-Z]{3}', invoice['currency']):
        errors.append('currency: use a three-letter code or leave missing')
    containers = [('invoice', invoice, ('gross_total',))] + [
        (f'line[{i}]', line, flow.NUMBERS) for i, line in enumerate(invoice['lines'], 1)]
    for label, container, fields in containers:
        for field in fields:
            value = container.get(field)
            if value is None or value == '':
                if label != 'invoice':
                    warnings.append(f'{label}.{field}: not recorded')
            else:
                try:
                    flow.num(value)
                except ValueError:
                    errors.append(f'{label}.{field}: invalid decimal')
    for i, line in enumerate(invoice['lines'], 1):
        try:
            expected = flow.num(line.get('quantity')) * flow.num(line.get('unit_price'))
            if abs(expected - flow.num(line.get('line_total'))) > flow.num('0.01'):
                warnings.append(f'line[{i}]: quantity × unit price differs from line amount; verify discounts, charges and price basis')
        except ValueError:
            pass
    if not invoice['lines']:
        warnings.append('lines: no line items recorded')
    if flow.structure_issues(invoice):
        warnings.append('lines: structured rows require manual verification; do not sum parent and child rows together')
    return {'errors': errors, 'warnings': warnings}


def state(conn, ident):
    row, invoice, revision, digest = snapshot(conn, ident)
    event = conn.execute("SELECT * FROM events WHERE review_id=? AND action='confirm_transcription' ORDER BY id DESC LIMIT 1", (ident,)).fetchone()
    confirmation = None
    if event:
        payload = json.loads(event['payload'])
        if payload['revision'] == revision and payload['sha256'] == digest and payload['invoice'] == invoice:
            confirmation = {'actor': event['actor'], 'note': event['note'], 'created': event['created'], 'sha256': digest}
    po = json.loads(row['po'])
    if po.get('matching') == 'review_only':
        matching = 'unavailable'
    elif row['status'] == 'registered':
        matching = 'registered'
    else:
        matching = 'issues' if flow.assess(conn, invoice, po, original=json.loads(row['raw']))['issues'] else 'matched'
    assessment = inspect(invoice)
    duplicates = []
    if invoice.get('invoice_number'):
        for other in conn.execute('SELECT id, normalized FROM reviews WHERE id<>?', (ident,)):
            value = json.loads(other['normalized'])
            if (value.get('supplier'), value.get('invoice_number')) == (invoice.get('supplier'), invoice.get('invoice_number')):
                duplicates.append(other['id'])
    if duplicates:
        assessment['warnings'].append('possible duplicate review IDs: ' + ', '.join(map(str, duplicates)))
    return {'status': 'confirmed' if confirmation else 'unconfirmed', 'revision': revision,
            'confirmation': confirmation, 'matching': matching, 'payment': 'not_approved',
            'possible_duplicate_review_ids': duplicates, **assessment}


def confirm(conn, ident, body):
    if not all(isinstance(body.get(k), str) and body[k].strip() for k in ('actor', 'note')):
        raise ValueError('Reviewer and reason are required')
    if body.get('source_checked') is not True:
        raise ValueError('Check the source document before confirming')
    with conn:
        conn.execute('BEGIN IMMEDIATE')
        row, invoice, revision, digest = snapshot(conn, ident)
        if body.get('invoice') != invoice or body.get('revision') != revision:
            raise ValueError('Save edits and reopen the invoice before confirming')
        assessment = state(conn, ident)
        if assessment['errors']:
            raise ValueError('; '.join(assessment['errors']))
        duplicates = assessment['possible_duplicate_review_ids']
        if (assessment['warnings'] or duplicates) and body.get('exceptions_checked') is not True:
            raise ValueError('Acknowledge missing values, exceptions and possible duplicates before confirming')
        if assessment['confirmation']:
            return assessment
        payload = {'invoice': invoice, 'revision': revision, 'sha256': digest,
                   'warnings': assessment['warnings'], 'possible_duplicate_review_ids': duplicates,
                   'source_checked': True, 'exceptions_checked': body.get('exceptions_checked') is True,
                   'scope': 'transcription_only', 'payment': 'not_approved'}
        conn.execute('INSERT INTO events(review_id,actor,note,action,payload,created) VALUES(?,?,?,?,?,?)',
                     (ident, body['actor'].strip(), body['note'].strip(), 'confirm_transcription', flow.dump(payload), flow.now()))
    return state(conn, ident)


def safe_cell(value):
    """Neutralize spreadsheet formulas while retaining ordinary signed numbers."""
    text = '' if value is None else str(value)
    if text.lstrip().startswith(('=', '+', '-', '@')) or text.startswith(('\t', '\r', '\n')):
        if not re.fullmatch(r'-?\d+(?:\.\d+)?', text):
            return "'" + text
    return text


def export_csv(conn, ident, expected_revision):
    # One read transaction prevents concurrent edits between checking and export.
    with conn:
        conn.execute('BEGIN')
        row, invoice, revision, digest = snapshot(conn, ident)
        status = state(conn, ident)
        if not status['confirmation'] or revision != expected_revision:
            raise ValueError('Confirm the current saved transcription before exporting')
        confirmation = status['confirmation']
        columns = ['review_id', *flow.FIELDS, 'row_type', 'line_id', 'item', 'description', 'quantity',
                   'unit', 'unit_price_excl_tax', 'line_amount_excl_tax', 'line_type', 'parent_line_id',
                   'transcription_status', 'po_matching_status', 'payment_status',
                   'confirmed_by', 'confirmed_at', 'confirmation_note', 'snapshot_sha256']
        out = io.StringIO(newline='')
        writer = csv.writer(out, quoting=csv.QUOTE_ALL)
        writer.writerow(columns)
        for line in invoice['lines'] or [None]:
            values = line or {}
            record = [ident, *[invoice.get(k) for k in flow.FIELDS], 'line' if line is not None else 'invoice',
                      *[values.get(k) for k in ('line_id','item','description','quantity','unit','unit_price','line_total','line_type','parent_line_id')],
                      'confirmed', status['matching'], 'not_approved', confirmation['actor'], confirmation['created'], confirmation['note'], digest]
            writer.writerow([safe_cell(value) for value in record])
        return {'filename': f'invoice-{ident}-confirmed-transcription.csv', 'csv': out.getvalue(), 'scope': 'transcription_only'}
