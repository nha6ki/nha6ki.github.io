---
title: "InvoiceFlow — Invoice Review & Sheets Delivery"
categories: ["ai", "data", "web"]
summary: "Extract invoice fields with a local vision model, review them against a purchase order, and send approved records to Google Sheets through n8n."
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
  - label: "CI results"
    url: "https://github.com/nha6ki/InvoiceFlow/actions/runs/45978802484"
---

InvoiceFlow connects document extraction to a reviewable business record. A local vision model reads invoice page images, Python compares the extracted fields with a purchase-order fixture, and a reviewer checks the original PDF before approving the record. A separate action sends the approved values to Google Sheets through n8n.

## From PDF to an approved record

The extraction step renders each PDF page as an image and sends it to Qwen 3.5 through Ollama. The model returns invoice details and line items as JSON. Its original response is saved so the reviewer can distinguish what the model extracted from any later corrections.

In the browser, the reviewer sees the source PDF beside the extracted values and purchase-order lines. Checks cover the supplier, currency, purchase-order number, quantities, net unit prices, line amounts, and expected gross total. A mismatched value blocks approval. The reviewer can correct it, repeat the checks, and record a reason for the change.

SQLite stores the original extraction, normalization changes, purchase-order snapshot, and approval history. Repeating an approval does not create a second ledger entry for the same supplier and invoice number.

## Sending to Google Sheets

After approval, the reviewer can send the record from the same screen. The sender reads the approved values and their approval event from the database, then posts them to an n8n webhook. The Google Sheets node uses a stable record key to append a new invoice or update its existing row on a sequential resend.

Delivery history distinguishes a confirmed response from an uncertain outcome. For example, a timeout can happen after the sheet has already been updated. The reviewer can inspect the n8n execution and sheet before retrying. Approval and delivery remain separate actions, and the sheet includes the recorded approver name and approval timestamp.

## What I verified

I took two related [FNFE-MPE example invoices](https://github.com/fnfempe/France_RFE) through extraction, review, approval, and delivery to Google Sheets. For the second invoice, `F202500004`, the vision output matched the selected reference fields. The evaluator reads the PDF’s embedded Factur-X XML after inference; that reference is not sent to the model.

[GitHub Actions](https://github.com/nha6ki/InvoiceFlow/actions/runs/45978802484) passed on Python 3.12 and 3.14 with browser testing enabled. The suite checks approval rules, duplicate handling, response validation, uncertain delivery outcomes, and a browser interaction that rejects an incorrect price before accepting its correction. Automated delivery tests use local HTTP endpoints and mocks; the live Google Sheets checks were performed separately.

The two invoices share a layout and purchase-order conditions, and the purchase-order fixtures are synthetic. This demonstrates the integration rather than broad extraction accuracy. The current matcher does not track remaining order quantities, combine partial deliveries, or recompute tax. The review interface runs locally; the repository includes setup and operating instructions for reproducing the workflow.
