---
title: "Personal Portfolio Website"
summary: "A responsive portfolio website built with Astro, featuring project pages, DEV.to integration, and automated deployment."
date: "2026-11"
technologies:
  - Astro
  - TypeScript
  - JavaScript
  - CSS
  - GitHub Actions
  - GitHub Pages
  - DEV.to API
order: 3
featured: false
image: "/images/projects/personal-portfolio-website.webp"
links:
  - label: "View Live Website"
    url: "https://nha6ki.github.io/"
  - label: "View Source Code"
    url: "https://github.com/nha6ki/nha6ki.github.io/tree/redesign-astro/site"
---

## Overview

I designed and developed this personal portfolio website to present my professional background, research projects, software development work, and technical articles.

The website is built with Astro and uses a responsive layout designed for desktop and mobile devices.

## Architecture & Content Management

The site uses Astro's static site generation and reusable components to keep the codebase lightweight and maintainable.

Project descriptions are managed as Markdown files through Astro Content Collections. Structured metadata is used to automatically generate project cards and individual project pages.

## Blog Integration

The website integrates with the DEV.to API to display my published technical articles.

The homepage features recent articles, while the Blog page provides category filtering and incremental loading of additional articles.

## Deployment & SEO

The website is hosted on GitHub Pages and deployed automatically through GitHub Actions.

The deployment workflow includes automated type checking and production builds.

The site also implements canonical URLs, Open Graph metadata, Twitter Cards, an XML sitemap, and a custom 404 page.
