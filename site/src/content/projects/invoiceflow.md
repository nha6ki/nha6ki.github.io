---
title: "InvoiceFlow — Invoice Review & Three-Way Matching"
categories: ["ai", "data", "web"]
summary: "Extract invoice fields locally, reconcile partial invoices against orders and receipts, and review discrepancies before approval."
date: "2026-11"
technologies:
  - Python
  - Ollama
  - Qwen 3.5
  - SQLite
  - n8n
  - Google Sheets API
  - Playwright
  - GitHub Actions
order: 13
featured: false
links:
  - label: "GitHub"
    url: "https://github.com/nha6ki/InvoiceFlow"
---

The review queue opens with two invoices on hold and one already approved. Start with the amount discrepancy, then try a partial invoice that needs another receipt.

## Correct a line amount

Open **F202500003** and compare the first line with the sample PDF. The extracted amount is 9,600, but 200 units at 40 each gives 8,000. Correct the line amount and run the checks again. Enter a reviewer name and reason to approve it, then open the history to see both the extracted and approved values.

## Release a partial invoice

Open **DEMO-INV-002**. The purchase order covers 100 units, but only 60 have arrived. The third invoice in the queue, **DEMO-INV-001**, already accounts for 40 of them. That leaves 20 available for a new invoice requesting 30.

Add the sample receipt for 10 more units and check how the available balance changes. Read the tax-inclusive total from the PDF, enter it in the confirmation field, and approve the invoice. The approval history records the receipts and earlier invoice used in the decision.

## What the extraction checks showed

The evaluator compares selected fields with the Factur-X XML embedded in the [official example PDFs](https://github.com/fnfempe/France_RFE). The model receives page images, and the evaluator reads the XML after inference. Explicitly asking for the amount excluding tax corrected two line amounts in UC11, the sample used to develop the prompt. Two other examples already had matching line amounts and remained unchanged. One complex example still had invoice-number and item-name differences.

Two related example invoices were also taken through the Google Sheets workflow. Approval and delivery are separate actions, and a sequential resend uses the same row key. These examples document the tested behavior. The current matcher requires unambiguous item names, and the extraction comparison covers a small set of public examples.
