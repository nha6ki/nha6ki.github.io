"""Check the published bridge and fixtures without making network requests."""
import copy
import json
import os
from pathlib import Path
import runpy
import shutil
import sys
import tempfile

assets = Path(__file__).resolve().parents[1] / 'public/projects/invoiceflow/review'
with tempfile.TemporaryDirectory() as directory:
    for name in ('review_flow.py', 'review_ui.py', 'three_way.py', 'transcription.py', 'review_bridge.py', 'fixtures.json'):
        shutil.copy(assets / name, directory)
    os.chdir(directory)
    sys.path.insert(0, directory)
    bridge = runpy.run_path('review_bridge.py')
    request = bridge['handle']
    rows = request('/api/reviews', None)
    assert len(rows) == 15
    ident = next(r['id'] for r in rows if r['invoice']['invoice_number'] == 'F202600025')
    before = request(f'/api/review/{ident}', None)['current']
    assert before['lines'][3]['unit_price'] == '0.00'
    after = copy.deepcopy(before)
    after['lines'][3]['unit_price'] = None
    request('/api/save-draft', dict(id=ident, invoice=after, expected_current=before,
                                  actor='Demo reviewer', note='Verified blank source price'))
    detail = request(f'/api/review/{ident}', None)
    assert detail['current']['lines'][3]['unit_price'] is None
    assert detail['raw']['lines'][3]['unit_price'] == '0,00'
    assert detail['events'][-1]['action'] == 'save_draft'
    assert detail['events'][-1]['payload']['before'] == before
    assert detail['events'][-1]['payload']['after'] == after
    result = request('/api/approve', dict(id=ident, invoice=after, actor='Demo', note='Check'))
    assert result['status'] == 'needs_review'
    assert not any(r['invoice_number'] == 'F202600025' for r in request('/api/ledger', None))
    try:
        request('/api/save-draft', dict(id=ident, invoice=before, expected_current=before,
                                      actor='Demo', note='Stale update'))
    except ValueError:
        pass
    else:
        raise AssertionError('Stale update was accepted')
    # Public originals remain unapproved; absent values must not become zeros.
    import hashlib
    sources = json.loads((assets / 'public-samples.json').read_text())
    assert len(sources) == 8
    assert sources == bridge['FIXTURES']['fixtures/public-layouts/sources.json']
    for source in sources:
        assert hashlib.sha256((assets / source['file']).read_bytes()).hexdigest() == source['sha256']
        assert ('Apache License' if source['license'] == 'Apache-2.0' else 'Permission is hereby granted') in (assets / source['license_file']).read_text()
        if source.get('notice_file'): assert 'Copyright' in (assets / source['notice_file']).read_text()
        ident = next(i for i, value in bridge['PUBLIC_SOURCES'].items() if value == source)
        detail = request(f'/api/review/{ident}', None)
        assert detail['sample_source'] == source
        assert detail['current'] == bridge['FIXTURES']['fixtures/public-layouts/model-reviews.json'][source['file']]['current'] if source.get('data_kind') == 'saved_model_output' else detail['current']['po_number'] is None
        if not source.get('data_kind') and source['file'] in ('sample-13.pdf', 'sample-14.pdf'): assert detail['current']['currency'] is None
        if source['file'] == 'sample-11.pdf': assert float(detail['current']['lines'][1]['line_total']) == -10
        if source['file'] == 'sample-15.pdf': assert len(detail['current']['lines']) == (6 if source.get('data_kind') else 4)
        assert detail['status'] == 'needs_review'
        result = request('/api/approve', dict(id=ident, invoice=detail['current'], actor='Tester', note='Source reviewed'))
        assert result['status'] == 'needs_review'
        assert any(i['reason'] == 'purchase_order_unavailable' for i in result['issues'])
        if source['author'] == 'Trey Hunner':
            assert detail['current']['invoice_number'] is None
            assert detail['current']['lines'][-1]['quantity'] is None
        if source['author'] == 'Sparksuite':
            assert all(l['quantity'] is None and l['unit_price'] is None for l in detail['current']['lines'])
        after = copy.deepcopy(detail['current'])
        after['lines'][0]['description'] = 'Reviewer annotation'
        request('/api/save-draft', dict(id=ident, invoice=after, expected_current=detail['current'], actor='Tester', note='Review annotation'))
        saved = request(f'/api/review/{ident}', None)
        assert saved['current'] == after and saved['raw'] == detail['raw']
        assert saved['events'][-1]['action'] == 'save_draft'
    confirmed = request('/api/confirm-transcription', dict(id=ident, invoice=saved['current'], revision=saved['transcription']['revision'], actor='Tester', note='Source and limitations checked', source_checked=True, exceptions_checked=True))
    assert confirmed['status'] == 'confirmed' and confirmed['matching'] == 'unavailable'
    exported = request('/api/export-transcription', dict(id=ident, revision=confirmed['revision']))
    assert 'not_approved' in exported['csv'] and 'transcription_status' in exported['csv']
    assert len(request('/api/ledger', None)) == 1
    bridge['db'].close()
print('Public correction bridge checks passed: fifteen samples, null saved, audit retained, approval blocked.')
