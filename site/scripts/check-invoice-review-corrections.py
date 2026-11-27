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
    for name in ('review_flow.py', 'review_ui.py', 'three_way.py', 'review_bridge.py', 'fixtures.json'):
        shutil.copy(assets / name, directory)
    os.chdir(directory)
    sys.path.insert(0, directory)
    bridge = runpy.run_path('review_bridge.py')
    request = bridge['handle']
    rows = request('/api/reviews', None)
    assert len(rows) == 7
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
    bridge['db'].close()
print('Public correction bridge checks passed: seven samples, null saved, audit retained, approval blocked.')
