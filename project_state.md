# Project State

> Source of Truth for this project. Never delete entries—only append.

---

## 📋 Project Overview

**Name:** Russabuss Music Production Website
**Type:** WEB
**North Star:** A fast, beautiful 2-page website (Home + Blog) that showcases music production services, displays beat licensing pricing, captures leads via contact form, and hosts blog content from Contentful.
**Started:** 2026-01-26

---

## 🔗 Integrations

| Service | Purpose | Status | Rate Limits | Auth Method |
|---------|---------|--------|-------------|-------------|
| Vercel | Hosting/Deployment | ✅ Ready | N/A | GitHub integration |
| Resend | Contact form emails | ⏳ Pending | 100/day free tier | API key in .env |
| Contentful | Blog CMS | ⏳ Setup during build | N/A | Space ID + Access Token |

---

## 📊 Data Schema

### Contact Form Input
```json
{
  "firstName": "string (required)",
  "lastName": "string (required)",
  "email": "string (required, validated)",
  "services": ["Mix & Master", "Custom Tracks", "Instrumentals", "Studio Time", "Vox", "DJ", "Other"],
  "message": "string (required)"
}
```

### Contact Form Output (to Resend)
```json
{
  "to": "audio@russabuss.com",
  "from": "noreply@russabuss.com",
  "subject": "New inquiry from {firstName} {lastName}",
  "html": "formatted email body"
}
```

### Blog Post (from Contentful)
```json
{
  "title": "string",
  "slug": "string",
  "publishDate": "ISO date",
  "excerpt": "string",
  "content": "rich text",
  "featuredImage": "asset URL (optional)"
}
```

---

## 🎯 Behavioral Rules

- **No Tailwind CSS** — Use custom CSS with design tokens
- **No component libraries** — Build only what's needed
- **No three.js** — Unless explicitly requested later
- **React only for ContactForm** — Everything else is Astro components
- **Static output** — No SSR, pre-render everything at build time
- **Minimal dependencies** — Audit before adding any package

---

## 📝 Context Handoffs

| Date | Update |
|------|--------|
| 2026-01-26 | Fresh start. Previous build had 25-min deploy times. Starting clean with minimal deps. |

---

## 🧠 Lessons Learned

- Previous build bloated to 25-min deploys — cause unknown but likely heavy deps or SSR misconfiguration
- Keeping three.js out until proven necessary
- Static builds only — no SSR needed for this content

---

## 🔧 Maintenance Log

<!-- Populated during Trigger phase -->

---
