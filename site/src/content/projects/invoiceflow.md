---
title: "InvoiceFlow — Invoice Review, Export & PO Matching"
image: "/images/projects/invoiceflow/review-cover-en.webp"
imageAlt: "Invoice Review demo showing two review tasks and the sample invoice queue."
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

InvoiceFlow helps a reviewer turn a supplier’s invoice into a checked spreadsheet record. Open the original PDF or image, correct the fields and export the reviewed lines.

[Open Invoice Review in English](/projects/invoiceflow/review/en.html) · [日本語版](/projects/invoiceflow/review/)

<link rel="stylesheet" href="/images/projects/invoiceflow/gallery.css">

## Try one invoice

Open **Big Corp** in the queue. Compare the two lines with the PDF: Nike Air Max has a line amount of 53 and the discount has a line amount of −10. Check the currency against the original and correct any discrepancy. Enter your reviewer name and a short note, mark the source as checked, and acknowledge any remaining exceptions you have reviewed. Select **Confirm and export CSV**.

Open the downloaded CSV and find the discount line and the reviewer details. The invoice total is repeated on each line; use it once when calculating totals per invoice.

<div class="invoice-figure" style="--figure-width:896px"><a href="/images/projects/invoiceflow/queue-en.png" aria-label="Open full-size image: Invoice Review in the browser with the sample invoice queue loaded."><img src="/images/projects/invoiceflow/queue-en.png" alt="Invoice Review in the browser with the sample invoice queue loaded." width="1344" height="744" loading="lazy"></a></div>

## Explore the 15 samples

For a different layout, open **NI57721**, a Japanese invoice supplied as a PNG. **Azure Interior** shows product groups, quantities with units and a discounted line. The source details beside each document identify its origin. Of the eight public template examples, three use manual transcriptions and five use saved local Qwen output with correction history.

The browser runs the review on saved data. You can try edits in this tab and start again by reloading. On a local installation, Ollama can extract fields from PDF, PNG and JPEG inputs, and SQLite retains the review history. Purchase orders and receipts support an additional matching step when those records are available.

## From a confirmed invoice to Google Sheets

After confirming the transcription locally, the reviewer can send its header and confirmation details to Google Sheets. An n8n webhook passes the record to the Sheets node. The node matches on `record_key` so that a sequential resend updates the existing row. The CSV contains the invoice lines. Payment approval is a separate decision.

<div class="invoice-figure" style="--figure-width:560px"><a href="/images/projects/invoiceflow/n8n-workflow.png" aria-label="Open full-size image: Published n8n workflow connecting a POST webhook to the Google Sheets append-or-update operation."><img src="/images/projects/invoiceflow/n8n-workflow.png" alt="Published n8n workflow connecting a POST webhook to the Google Sheets append-or-update operation." width="560" height="275" loading="lazy"></a></div>

The register below shows an earlier run for **F202500003** and **F202500004**, both for **EUR 12,000**. The approval columns belong to that earlier workflow. The current sender records the transcription reviewer, confirmation time and snapshot identifier.

<div class="invoice-figure invoice-register-image" style="--figure-width:1460px"><a href="/images/projects/invoiceflow/sheet.png" aria-label="Open full-size image: Two invoice rows in Google Sheets, including their record keys, invoice numbers, amounts, purchase order, approver and approval timestamps."><img src="/images/projects/invoiceflow/sheet.png" alt="Two invoice rows in Google Sheets, including their record keys, invoice numbers, amounts, purchase order, approver and approval timestamps." width="1460" height="90" loading="lazy"></a></div>

[Open the sample register in Google Sheets](https://docs.google.com/spreadsheets/d/1lMzjNoQJdlf1jaMvwN8BAMunPins4vZB73U1CruHy88/edit?usp=sharing)

A separate read-back returned the same two invoice numbers from rows 2 and 3.

<div class="invoice-figure" style="--figure-width:724px"><a href="/images/projects/invoiceflow/n8n-rows.png" aria-label="Open full-size image: Get Row(s) output listing the two invoice numbers returned from Google Sheets."><img src="/images/projects/invoiceflow/n8n-rows.png" alt="Get Row(s) output listing the two invoice numbers returned from Google Sheets." width="724" height="211" loading="lazy"></a></div>
