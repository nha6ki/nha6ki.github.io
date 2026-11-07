# Haruki Niwa — Personal Website

Source code for my personal website, built with Astro.

**Website:** https://nha6ki.github.io/

The website presents my professional background, selected research and software development projects, and technical articles published on DEV.to.

## Technology Stack

- Astro 7
- TypeScript, JavaScript, HTML, and CSS
- Astro Content Collections
- DEV.to API and RSS
- Simple Icons and Font Awesome
- GitHub Actions and GitHub Pages

## Getting Started

Requires Node.js 22.23.4 or later, within Astro's supported Node.js versions.

From the repository root:

```bash
cd site
npm ci
npm run dev
```

The development server runs at http://localhost:4321/.

## Validation and Build

Run the following commands from the `site/` directory:

```bash
npm run check
npm run build
npm run preview
```

The production build is generated in `site/dist/`, relative to the repository root.

## Project Structure

```text
.github/
└── workflows/               # CI and GitHub Pages deployment

site/
├── public/
│   └── images/projects/     # Project images
├── src/
│   ├── components/          # Reusable UI components
│   ├── content/projects/    # Project Markdown files
│   ├── data/                # Shared social profile data
│   ├── layouts/             # Shared page layout
│   ├── lib/                 # DEV.to data retrieval
│   ├── pages/               # Page routes
│   ├── styles/              # Global styles
│   └── content.config.ts    # Content collection schema
├── astro.config.mjs
├── package.json
└── README.md
```

## Managing Projects

Project descriptions are maintained as Markdown files in `site/src/content/projects/`.

Each file defines metadata in its frontmatter:

- `title`: Project title
- `summary`: Short description
- `technologies`: Tools and technologies
- `order`: Display order
- `featured`: Whether to feature the project on the homepage
- `date`: Optional month in YYYY-MM format
- `image`: Optional screenshot path
- `links`: Optional external resources

The filename determines the project URL. For example, `niwa-docs.md` generates `/projects/niwa-docs/`.

Project images are stored in `site/public/images/projects/`.

The homepage displays up to four featured projects, ordered by their metadata.

## DEV.to Integration

Technical articles are published and maintained on [DEV.to](https://dev.to/nha6ki).

Article listings are retrieved in the browser using JavaScript, without requiring a site rebuild when articles are published or updated.

The integration combines:

- DEV.to API for article metadata
- RSS feed for recently published articles
- Individual article API for refreshing cover images and filling missing image metadata

The implementation merges article records, removes duplicates, and sorts articles by publication date.

The homepage displays up to six recent articles in a horizontally scrollable layout.

The Blog page supports category filtering based on article tags and incremental loading through a Load more button.

Data availability and update timing depend on DEV.to and its caching behavior.

The data retrieval logic is maintained in `src/lib/devto.ts`, while `src/components/DevArticles.astro` handles article rendering and user interactions.

## Deployment

The Astro website is published at https://nha6ki.github.io/ using GitHub Pages.

The deployment source is the `redesign-astro` branch.

Two GitHub Actions workflows are configured:

- `astro-ci.yml`: Runs Astro checks, builds the site, and verifies generated files.
- `deploy-astro.yml`: Builds and deploys the Astro website to GitHub Pages.

The deployment workflow runs when relevant changes are pushed to `redesign-astro`, including changes under `site/`.

Changes to DEV.to articles do not require a new GitHub Pages deployment, because article data is retrieved by the browser at runtime.

## Third-Party Notices

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for third-party notices and attribution.
