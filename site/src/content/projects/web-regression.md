---
title: "Web Regression Testing with Gitea and Vikunja"
category: "web"
summary: "Seven browser and API tests check Japanese text, private issue access, and task updates across two web applications."
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
    url: "https://github.com/nha6ki/web-regression/actions/runs/45102137868"
---

Two editorial teams each have a task called 校正を確認 (“check the proofs”). When one team marks its task complete, the other team's copy should stay open. Playwright selects the task in the second project, then reads both task IDs through the Vikunja API to check that only the selected record changed.

## What the suite checks

In Gitea, three tests cover creating a Japanese issue, finding a renamed issue and closing it, and viewing a private issue as a collaborator or a signed-in nonmember. In Vikunja, four tests cover creating a Japanese task in the intended project, retaining its completion state after reload, submitting an empty title, and distinguishing identically named tasks across projects.

## Recordings and results

The demo includes before-and-after screenshots and browser recordings from a local run of all seven cases at revision `72da163`. The recordings show the browser actions. The test code specifies how each API response contributes to the verdict.

The published revision, `82805f6`, passed all seven tests in 17.1 seconds on GitHub Actions. This is the Playwright execution time. Docker Compose starts fresh application instances for each run, and the same Bash command runs the suite locally or in CI.
