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

InvoiceFlow is a local invoice review tool. It reads rendered PDF pages with a vision model and places the extracted values beside the original document. The reviewer can check why an invoice was held, correct the fields, and record the reason for approval. Approved records can then be sent to Google Sheets through n8n.

[Try the interactive demo](/projects/invoiceflow/demo/)

## Reconciling partial invoices

In the demo, a purchase order covers 100 units. The supplier has delivered 60, and an earlier approved invoice accounts for 40. A new invoice for 30 exceeds the remaining received quantity by 10, so InvoiceFlow holds it. After a receipt for another 10 units is recorded, the reviewer can recheck and approve the same invoice.

At approval, SQLite checks the available quantity again against both the order and recorded receipts, after subtracting prior approvals. The approval history retains the quantities, receipt IDs, and prior invoice numbers used in that decision. The demo uses synthetic purchase orders and receipts.

## Checking an incorrect amount

The amount review demo starts with 9,600 entered for a line with 200 units at a net unit price of 40. InvoiceFlow displays the calculated amount of 8,000 and the difference of 1,600. After checking the PDF, a reviewer can correct the amount and rerun the checks. The history shows both the previous and approved values. This check applies to lines with a quantity and unit price.

## What the extraction checks showed

The evaluator compares selected fields with the Factur-X XML embedded in the [official example PDFs](https://github.com/fnfempe/France_RFE). The model receives page images, and the evaluator reads the XML after inference. Explicitly asking for the amount excluding tax corrected two line amounts in UC11, the sample used to develop the prompt. Two other examples already had matching line amounts and remained unchanged. One complex example still had invoice-number and item-name differences.

Two related example invoices were also taken through the Google Sheets workflow. Approval and delivery are separate actions, and a sequential resend uses the same row key. These examples document the tested behavior. The current matcher requires unambiguous item names, and the extraction comparison covers a small set of public examples.
