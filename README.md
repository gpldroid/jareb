# Jareb Content Hub

A modern content aggregation app that combines:

- News RSS feeds
- YouTube video feeds
- GitHub trending repositories
- Search and category filtering

## Features

- Aggregates multiple public sources
- Category filters: All, News, Video, GitHub
- Search by keyword, title, or source
- Mobile-friendly responsive layout
- Ready for extension with favorites, bookmarks, or saved articles

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- RSS Parser

## Getting started

1. Install dependencies

```bash
npm install
```

2. Run the development server

```bash
npm run dev
```

3. Open the app in your browser

```bash
http://localhost:3000
```

## Project structure

- `app/page.tsx` – homepage
- `components/content-grid.tsx` – UI + filters
- `lib/content.ts` – source aggregation logic

## Notes

This version uses public RSS feeds and GitHub API endpoints. Some feeds may rate-limit or change format over time, but the app is designed to gracefully handle failures.
