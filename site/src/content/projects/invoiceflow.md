---
title: "InvoiceFlow — Invoice Review, Export & PO Matching"
image: "/images/projects/invoiceflow/review-current.png"
imageAlt: "Invoice Review sample invoice list."
categories: ["ai", "data", "web"]
summary: "Extract invoice fields locally, verify them against the source and export confirmed data. Match orders and receipts when available."
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
featured: true
links:
  - label: "GitHub"
    url: "https://github.com/nha6ki/InvoiceFlow"
---

InvoiceFlow brings invoice extraction, human review and spreadsheet delivery together in one workflow. A reviewer compares invoice fields with the original document, corrects the transcription and exports confirmed lines as CSV. Purchase-order and receipt records can also be used for three-way matching.

[Open Invoice Review in English](/projects/invoiceflow/review/en.html) · [日本語版](/projects/invoiceflow/review/)

<link rel="stylesheet" href="/images/projects/invoiceflow/gallery.css">

## Review an invoice

The demo contains 15 sample invoices in several layouts. Select a document, compare the editable fields and line items with the original, and correct any differences. Enter a reviewer name and a note, check the original against the input, then select **Confirm and export CSV**.

Try **Big Corp** to review a discount line, or **Azure Interior** for grouped products and quantities with units. **NI57721** provides a Japanese invoice image. Source and license details are available beside each document.

The demo uses saved sample data. Edits and confirmations stay in the current browser tab and reset on reload. The Google Sheets panel shows saved delivery history; sending is available in the local installation.

## Processing flow

1. **Extract** invoice fields locally from PDF, PNG or JPEG files using Ollama and Qwen.
2. **Review** the original alongside the extracted fields, correct discrepancies and record the review.
3. **Export** confirmed line items as CSV. When order and receipt records are available, inspect three-way matching results.
4. **Send** the confirmed invoice header and review details from the local application through n8n to Google Sheets.

The browser demo starts with saved inputs and does not run model extraction. A transcription confirmation records the review of the source document. Purchase-order matching and payment approval are separate steps.

## Google Sheets integration

The local application sends a confirmed record to an n8n webhook. The Google Sheets node appends or updates the row using `record_key`. The response is checked against the invoice and confirmation fields. An uncertain response is retained in the delivery history for review.

<div class="invoice-figure" style="--figure-width:720px"><a href="/images/projects/invoiceflow/n8n-workflow.png"><img src="/images/projects/invoiceflow/n8n-workflow.png" alt="n8n workflow linking a webhook to the Google Sheets append or update node." width="560" height="275" loading="lazy"></a></div>

[Open the sample Google Sheets register](https://docs.google.com/spreadsheets/d/1lMzjNoQJdlf1jaMvwN8BAMunPins4vZB73U1CruHy88/edit?usp=sharing)
