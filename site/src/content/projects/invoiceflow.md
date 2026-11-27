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

InvoiceFlow helps a reviewer decide whether an invoice can be paid. Two examples show what holds an invoice back: an incorrect line amount and a delivery that only partly covers the quantity billed.

## From PDF to the invoice register

![InvoiceFlow workflow. A local model extracts fields from invoice images. Order and receipt checks route discrepancies to a reviewer. Approval writes to SQLite, and a separate delivery action updates Google Sheets.](/images/projects/invoiceflow/workflow.png)

In the local workflow, Ollama reads rendered invoice pages. InvoiceFlow compares the extracted fields with the purchase order and, for three-way matching, recorded receipts and previously approved quantities. The browser demo begins at the review queue with saved sample data.

## Inside Invoice Review

[Open Invoice Review](/projects/invoiceflow/review/) to work through the three sample records. Two invoices need attention. The third is an approved invoice whose quantity affects the next approval.

![Invoice Review in the browser with the sample invoice queue loaded.](/images/projects/invoiceflow/queue.png)

## Correct a line amount

Open **F202500003** and compare the first line with the sample PDF. The extracted amount is 9,600, but 200 units at 40 each gives 8,000. Correct the line amount and run the checks again. Enter a reviewer name and reason to approve it, then open the history to see both the extracted and approved values.

![Invoice Review shows the entered line amount, the amount calculated from quantity and unit price, and their difference.](/images/projects/invoiceflow/amount.webp)

## Release a partial invoice

Open **DEMO-INV-002**. The purchase order covers 100 units, but only 60 have arrived. The third invoice in the queue, **DEMO-INV-001**, already accounts for 40 of them. That leaves 20 available for a new invoice requesting 30.

Add the sample receipt for 10 more units and check how the available balance changes. Read the tax-inclusive total from the PDF, enter it in the confirmation field, and approve the invoice. The approval history records the receipts and earlier invoice used in the decision.

![The review screen shows 60 received, 40 previously approved, 30 requested and an excess of 10, alongside the receipt and earlier invoice used in the check.](/images/projects/invoiceflow/receipts.webp)

## Send an approved invoice to Google Sheets

Once the reviewer approves the invoice, the local sender reads its ledger entry and posts the approved values to an n8n webhook. The Google Sheets node uses the record key to append a new row or update the existing one on a sequential resend. The sender checks that the returned row matches the invoice fields and approval details.

![Published n8n workflow connecting a POST webhook to the Google Sheets append-or-update operation.](/images/projects/invoiceflow/n8n-workflow.png)

The webhook passes one approved record at a time to the Sheets node. Rows 2 and 3 of the register show **F202500003** and **F202500004**, each for **EUR 12,000** from **LE VENDEUR**. Both refer to purchase order **PO202525478**. The last two columns record who approved each invoice and when.

![Two invoice rows in Google Sheets, including their record keys, invoice numbers, amounts, purchase order, approver and approval timestamps.](/images/projects/invoiceflow/sheet.png)

[Open the invoice register in Google Sheets](https://docs.google.com/spreadsheets/d/1lMzjNoQJdlf1jaMvwN8BAMunPins4vZB73U1CruHy88/edit?usp=sharing)

A separate read-back workflow later returned **F202500003** and **F202500004** from rows 2 and 3. The three records in the browser demo and the two rows in this local read-back belong to different sample runs.

![Get Row(s) output listing the two invoice numbers returned from Google Sheets.](/images/projects/invoiceflow/n8n-rows.png)

<details>
<summary>Inspect the n8n test and column settings</summary>

**Waiting for a request.** The test workflow pauses at the webhook. Opening the node shows the local endpoint listening for a POST.

![Test workflow waiting at the webhook before the Sheets step.](/images/projects/invoiceflow/n8n-test.png)

![Webhook listening for a test POST.](/images/projects/invoiceflow/n8n-listen.png)

**Matching a row.** The write node targets the Invoices sheet and matches on `record_key`. A later send with the same key updates the matching row.

![Append or Update Row settings with record_key selected as the matching column.](/images/projects/invoiceflow/n8n-key.png)

**Checking the register.** A manual trigger runs Get Row(s). Its two output items are the two rows shown above.

![Manual trigger connected to Get Row(s) with two output items.](/images/projects/invoiceflow/n8n-read.png)

</details>

## What the extraction checks showed

The evaluator compares selected fields with the Factur-X XML embedded in the [official example PDFs](https://github.com/fnfempe/France_RFE). The model receives page images, and the evaluator reads the XML after inference. Explicitly asking for the amount excluding tax corrected two line amounts in UC11, the sample used to develop the prompt. Two other examples already had matching line amounts and remained unchanged. One complex example still had invoice-number and item-name differences.

Two related example invoices were also taken through the Google Sheets workflow. Approval and delivery are separate actions, and a sequential resend uses the same row key. These examples document the tested behavior. The current matcher requires unambiguous item names, and the extraction comparison covers a small set of public examples.
