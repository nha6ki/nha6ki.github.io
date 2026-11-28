# Sync the public Invoice Review

InvoiceFlow is the source of truth for review rules and the original screen. To
update the GitHub Pages copy, check out the intended InvoiceFlow revision and run
these commands from the portfolio's `site/` directory.

```bash
python3 scripts/sync-invoice-review.py /path/to/InvoiceFlow
python3 scripts/sync-invoice-review.py /path/to/InvoiceFlow --check
npm run build
```

Commit the resulting changes in `public/projects/invoiceflow/review/`. Do not
edit the generated `index.html`, `review_flow.py`, `review_ui.py` or `three_way.py`
directly. The browser transport, sample PDFs and fixture bundle are maintained
separately in the portfolio.

In the built site, open `/projects/invoiceflow/review/` and check that
`DEMO-INV-002` changes from 要確認 to 承認待ち when the extra receipt is added.
Approval must fail without the total from the sample PDF and succeed with
`300.00`. Reloading should restore the initial sample data.

## Current review scope

`transcription.py` is synchronized from InvoiceFlow with the review modules. The browser worker confirms saved transcriptions and exports CSV without a PO. This does not bypass matching approval, trigger n8n, or approve payment. Confirmations are per-tab and reset on reload. Run both correction and browser checks after regenerating assets.
