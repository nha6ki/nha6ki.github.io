# Haruki Niwa — Personal Website

Source code for my personal website, built with Astro.

The site presents my professional background, selected research
and software development projects, and technical articles
published on DEV.to.

## Technology Stack

- Astro 7
- TypeScript, JavaScript, and CSS
- Astro Content Collections
- DEV.to API
- Simple Icons and Font Awesome brand icons

## Getting Started

Requires Node.js 22.23.4 or later, subject to Astro's
supported Node.js versions.

From the repository root:

```bash
cd site
npm ci
npm run dev
```

The development server runs at http://localhost:4321/.

## Validation and Build

```bash
npm run check
npm run build
npm run preview
```

The production files are generated in `site/dist/`.

## Project Structure

```text
site/
├── public/
│   └── images/projects/      # Project screenshots
├── src/
│   ├── components/           # Reusable components
│   ├── content/projects/     # Project Markdown files
│   ├── layouts/              # Shared page layout
│   ├── pages/                # Page routes
│   ├── styles/               # Global CSS
│   └── content.config.ts     # Content collection schema
├── astro.config.mjs
└── package.json
```

## Managing Projects

Project descriptions are maintained as Markdown files in:

`src/content/projects/`

Each file defines metadata in its frontmatter:

- `title`: Project title
- `summary`: Short description
- `date`: Optional month in YYYY-MM format
- `technologies`: Tools and technologies
- `order`: Display order
- `featured`: Whether to feature the project on the homepage
- `image`: Optional screenshot path
- `links`: Optional external resources

The filename determines the project URL.

For example, `niwa-docs.md` generates
`/projects/niwa-docs/`.

Project images are stored in `public/images/projects/`.

The homepage displays up to four featured projects.

## Blog

Articles are published and maintained on DEV.to.

The homepage displays up to six recent articles in a
horizontally scrollable layout.

The Blog page retrieves public article metadata from the
DEV.to API and supports category filtering based on article
tags, along with incremental display of results.

Article listings are loaded in the browser using JavaScript.

## Deployment

The redesigned Astro website is developed on the
`redesign-astro` branch.

The existing Jekyll website remains the published version
until the migration to Astro is completed.

GitHub Pages deployment for Astro will be configured
as part of the migration.

## Third-Party Notices

See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
for third-party notices and attribution.
