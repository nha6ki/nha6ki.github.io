---
title: "Web Regression Testing"
category: "web"
summary: "Nineteen regression tests cover publishing, document handling, inventory, invoices, issues and tasks across six web applications."
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
    url: "https://github.com/nha6ki/web-regression/actions/runs/45118960296"
---

This project uses Playwright to check how six web applications handle changes to business records. The tests combine actions in Chromium with requests to each application's API. For example, after submitting a Gitea issue in Japanese, the test takes the issue number from the browser URL, retrieves that issue through the API, and compares its saved title and description with the text entered in the form.

## What the tests cover

**Gitea · 3 tests.** One test checks the Japanese issue submission described above. Another renames an issue through the API, finds it by its new title in the browser, and verifies that the same issue can be closed through the API. The third checks access to an issue in a private repository. A collaborator with read access can see its title and description, while a signed-in nonmember is denied access in both the browser and the API.

**Vikunja · 4 tests.** The suite checks that a task entered in Japanese belongs to the intended project, that a completed task stays complete after a reload, and that submitting an empty title leaves the project's task IDs unchanged. The fourth test gives two editorial teams a task called 校正を確認 (“check the proofs”). After marking one team's task complete in the browser, it retrieves both tasks by ID to confirm that the other team's task is still open.

**Grist, Paperless-ngx, Snipe-IT and WordPress · 3 tests each.** The additional cases track invoice lines through edits and deletion, compare an uploaded PDF with its downloaded original, verify which borrower holds a particular PC, and check what readers can see as posts move from draft to publication and revision.

## Running the suite and reviewing the results

The same command, `bash run.sh`, runs the suite locally and in GitHub Actions. Docker Compose starts fresh application instances for each run. Playwright writes an HTML report, and the script removes the test environment when the run ends.

The [demo](/demos/web-regression/en/overview.html) includes local recordings of the original seven cases based on `72da163`. Evidence for the twelve additional cases comes from a local capture run based on `511d527`; the three API-only cases show recorded values. A separate [GitHub Actions run](https://github.com/nha6ki/web-regression/actions/runs/45118960296) on that commit passed all 19 tests.
