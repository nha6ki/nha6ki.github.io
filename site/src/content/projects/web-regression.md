---
title: "Web Regression Testing"
categories: ["web"]
summary: "Fifty-six published regression cases check workflows across ten web applications, including shopping carts, file recovery and assignment grading."
date: "2026-11"
technologies: ["Playwright", "TypeScript", "Docker Compose", "GitHub Actions"]
order: 0
featured: false
image: "/demos/web-regression/media/overview-cover.webp"
imageAlt: "The Web Regression Testing overview, with links to ten applications and three featured Shopify results."
links:
  - label: "View demo"
    url: "https://nha6ki.github.io/demos/web-regression/en/overview.html"
  - label: "GitHub"
    url: "https://github.com/nha6ki/web-regression"
  - label: "CI results"
    url: "https://github.com/nha6ki/web-regression/actions/runs/45287442348"
---

This project uses Playwright to check how ten web applications handle changes to business records. The tests combine actions in Chromium with requests to each application's API. For example, after submitting a Gitea issue in Japanese, the test takes the issue number from the browser URL, retrieves that issue through the API, and compares its saved title and description with the text entered in the form.

## What the tests cover

**Shopify · 21 tests.** These cases follow a purchase from the storefront to the order saved by the store. Three examples show what the tests compare:

- [Recover from a declined payment](/demos/web-regression/en/SH-12.html). The guest retries in the same checkout, then the test uses the confirmation number to find the paid order.
- [Change shipping before retrying](/demos/web-regression/en/SH-16.html). The order records $15 express shipping and a $45 total after the buyer switches from standard delivery.
- [Fulfill a personalized order](/demos/web-regression/en/SH-20.html). The store receives separate instructions for two blue notebooks engraved ALPHA and one engraved BRAVO.

[Browse all 21 Shopify tests by workflow](/demos/web-regression/en/overview.html#app-shopify).

**WooCommerce · 7 tests.** Cart totals reflect quantity changes, store orders match purchases and coupons apply only to eligible items. Coupon tests cover removal on mobile, invalid codes and the line totals saved after discounted checkout. [Changing the quantity after applying a coupon](/demos/web-regression/en/WC-07.html) doubles the discount on the eligible paper line and preserves the envelope price.

**WordPress · 6 tests.** Readers see a post when it is published and see corrections at the same URL. A separate test checks access to an unpublished draft. The suite also follows a registration link on mobile, checks search and direct access after withdrawal, and verifies both category listings after moving a post.

**Moodle · 3 tests.** Teachers can retrieve submitted files, students can see their grades and comments, and grading one submission leaves the other student’s work ungraded.

**Nextcloud · 3 tests.** Moving and restoring a file preserves its contents. Updating a file leaves its namesake in another folder intact.

**Vikunja · 4 tests.** The suite checks that a task entered in Japanese belongs to the intended project, that a completed task stays complete after a reload, and that submitting an empty title leaves the project's task IDs unchanged. The fourth test gives two editorial teams a task called 校正を確認 (“check the proofs”). After marking one team's task complete in the browser, it retrieves both tasks by ID to confirm that the other team's task is still open.

**Grist · 3 tests.** Invoice lines retain their identity through edits, totals recalculate when quantities change, and deleting one line leaves the other intact.

**Paperless-ngx · 3 tests.** The suite compares an uploaded PDF with its downloaded original, checks that a document retains its correspondent and tag, and filters the document list by tag.

**Gitea · 3 tests.** One test checks the Japanese issue submission described above. Another renames an issue through the API, finds it by its new title in the browser, and verifies that the same issue can be closed through the API. The third checks access to an issue in a private repository. A collaborator with read access can see its title and description, while a signed-in nonmember is denied access in both the browser and the API.

**Snipe-IT · 3 tests.** The suite verifies the borrower after checkout, checks that a return clears the assignment, and confirms that checking out one PC leaves another of the same model unassigned.

## Running the tests and reviewing the results

Run `bash run.sh` from the repository root to run the Docker suite. GitHub Actions uses the same command. Docker Compose starts a fresh test environment, Playwright saves an HTML report, and the script tears down the environment when the run ends. The [GitHub Actions run for commit `52a2903`](https://github.com/nha6ki/web-regression/actions/runs/45287442348) passed all 35 Docker cases.

The 21 Shopify cases passed in separate Edge runs on Windows against a development store. The [public demo](/demos/web-regression/en/overview.html) documents both sets of results, with screenshots, recordings where available, and data comparisons for selected cases. In [WC-07](/demos/web-regression/en/WC-07.html), for example, you can compare the cart after a quantity change with the saved WooCommerce order, including the discount and the final total.
