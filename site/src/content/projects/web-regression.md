---
title: "Web Regression Testing"
categories: ["web"]
summary: "Fifty-five published regression cases check workflows across ten web applications, including shopping carts, file recovery and assignment grading."
date: "2026-11"
technologies: ["Playwright", "TypeScript", "Docker Compose", "GitHub Actions"]
order: 0
featured: false
image: "/demos/web-regression/media/V-01/1-V-01b.png"
imageAlt: "A newly created Japanese task in the Vikunja project list."
links:
  - label: "View demo"
    url: "https://nha6ki.github.io/demos/web-regression/en/overview.html"
  - label: "GitHub"
    url: "https://github.com/nha6ki/web-regression"
  - label: "CI results"
    url: "https://github.com/nha6ki/web-regression/actions/runs/45273687078"
---

This project uses Playwright to check how ten web applications handle changes to business records. The tests combine actions in Chromium with requests to each application's API. For example, after submitting a Gitea issue in Japanese, the test takes the issue number from the browser URL, retrieves that issue through the API, and compares its saved title and description with the text entered in the form.

## What the tests cover

**Shopify · 21 tests.** The storefront cases follow variant selection, cart updates, shipping changes and checkout. In the guest payment case, the checkout confirmation number identifies the paid test order in the Admin API. The test compares its line items, subtotal, shipping, tax and total with checkout. A declined test payment checks that the items and subtotal remain in checkout and the payment button is enabled again.

**WooCommerce · 6 tests.** Cart totals reflect quantity changes, store orders match purchases and coupons apply only to eligible items. Coupon tests cover removal on mobile, invalid codes and the line totals saved after discounted checkout.

**WordPress · 6 tests.** Readers see a post when it is published and see corrections at the same URL. A separate test checks access to an unpublished draft. The suite also follows a registration link on mobile, checks search and direct access after withdrawal, and verifies both category listings after moving a post.

**Moodle · 3 tests.** Teachers can retrieve submitted files, students can see their grades and comments, and grading one submission leaves the other student’s work ungraded.

**Nextcloud · 3 tests.** Moving and restoring a file preserves its contents. Updating a file leaves its namesake in another folder intact.

**Vikunja · 4 tests.** The suite checks that a task entered in Japanese belongs to the intended project, that a completed task stays complete after a reload, and that submitting an empty title leaves the project's task IDs unchanged. The fourth test gives two editorial teams a task called 校正を確認 (“check the proofs”). After marking one team's task complete in the browser, it retrieves both tasks by ID to confirm that the other team's task is still open.

**Grist · 3 tests.** Invoice lines retain their identity through edits, totals recalculate when quantities change, and deleting one line leaves the other intact.

**Paperless-ngx · 3 tests.** The suite compares an uploaded PDF with its downloaded original, checks that a document retains its correspondent and tag, and filters the document list by tag.

**Gitea · 3 tests.** One test checks the Japanese issue submission described above. Another renames an issue through the API, finds it by its new title in the browser, and verifies that the same issue can be closed through the API. The third checks access to an issue in a private repository. A collaborator with read access can see its title and description, while a signed-in nonmember is denied access in both the browser and the API.

**Snipe-IT · 3 tests.** The suite verifies the borrower after checkout, checks that a return clears the assignment, and confirms that checking out one PC leaves another of the same model unassigned.

## Running the suite and reviewing the results

For the 34 Docker cases, the same command, `bash run.sh`, runs the suite locally and in GitHub Actions. Docker Compose starts fresh application instances for each run. Playwright writes an HTML report, and the script removes the test environment when the run ends.

The [demo](/demos/web-regression/en/overview.html) pairs storefront and reader screenshots with recordings where available. For the discounted WooCommerce order, it includes the recorded order ID, line totals and discount. The [main CI run](https://github.com/nha6ki/web-regression/actions/runs/45273687078) passed all 34 Docker tests on `a1b867a`. The twenty-one Shopify cases passed across separate Edge runs against a development store on Windows.
