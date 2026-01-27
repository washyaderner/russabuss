# Russabuss - Professional Music Production Website

Premium audio engineering services website featuring mixing, mastering, custom beats, and studio sessions. Built with performance and design excellence in mind.

## ✨ Features

- **Premium Design** - Dark glass morphism UI with teal accents
- **Lightning Fast** - < 1 second build time, 296KB bundle size
- **Responsive** - Mobile-first design with seamless tablet/desktop layouts
- **Contact Integration** - Resend API for professional email handling
- **Blog CMS** - Contentful integration for content management
- **SEO Optimized** - Complete meta tags, Open Graph, and semantic HTML

## 🚀 Tech Stack

- **[Astro 5.16.15](https://astro.build)** - Static site generator
- **[React 19.2.4](https://react.dev)** - Contact form component
- **[Vercel](https://vercel.com)** - Hosting & deployment
- **[Resend](https://resend.com)** - Email API
- **[Contentful](https://contentful.com)** - Headless CMS for blog
- **Custom CSS** - No frameworks, pure design system

## 📦 Project Structure

```
src/
├── layouts/
│   └── BaseLayout.astro       # Master layout with SEO
├── components/
│   ├── Header.astro           # Fixed navigation
│   ├── Footer.astro           # Contact info & links
│   ├── HeroSection.astro      # Landing hero
│   ├── PricingSection.astro   # Beat licensing tiers
│   ├── ContactForm.jsx        # React form with validation
│   └── ...                    # Additional sections
├── pages/
│   ├── index.astro            # Home page
│   ├── blog/
│   │   ├── index.astro        # Blog listing
│   │   └── [slug].astro       # Dynamic blog posts
│   └── api/
│       └── contact.ts         # Email API endpoint
├── lib/
│   └── contentful.ts          # CMS client helper
└── styles/
    ├── variables.css          # Design tokens
    └── global.css             # Global styles
```

## 🛠️ Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file:
```bash
# Resend API (for contact form)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Contentful CMS (for blog)
CONTENTFUL_SPACE_ID=xxxxxxxxxxxxx
CONTENTFUL_ACCESS_TOKEN=xxxxxxxxxxxxx
```

### 3. Run Development Server
```bash
npm run dev
```
Visit [http://localhost:4321](http://localhost:4321)

### 4. Build for Production
```bash
npm run build
```

## 📝 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Install dependencies                             |
| `npm run dev`             | Start dev server at `localhost:4321`            |
| `npm run build`           | Build production site to `./dist/`              |
| `npm run preview`         | Preview build locally before deploying          |

## 🚢 Deployment

### Deploy to Vercel

1. **Import Project**: Go to [vercel.com/new](https://vercel.com/new)
2. **Select Repository**: Choose `washyaderner/russabuss`
3. **Configure Environment Variables**:
   - `RESEND_API_KEY`
   - `CONTENTFUL_SPACE_ID`
   - `CONTENTFUL_ACCESS_TOKEN`
4. **Deploy**: Click "Deploy" - done!

Alternatively, use Vercel CLI:
```bash
vercel --prod
```

## 📧 Resend Setup

1. Sign up at [resend.com](https://resend.com)
2. Create an API key
3. Verify your domain or use their test domain
4. Add `RESEND_API_KEY` to environment variables

## 📚 Contentful Setup

1. Create account at [contentful.com](https://contentful.com)
2. Create content type `blogPost` with fields:
   - `title` (Short Text)
   - `slug` (Short Text, unique)
   - `publishDate` (Date & Time)
   - `excerpt` (Long Text)
   - `content` (Rich Text)
   - `featuredImage` (Media, optional)
3. Add `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN` to environment variables

## 🎨 Design System

- **Colors**: Black background with teal gradient (#2dd4bf)
- **Typography**: Space Grotesk (display), Inter (body), JetBrains Mono (code)
- **Effects**: Glass morphism with backdrop blur
- **Spacing**: 8px base unit with design tokens
- **Breakpoints**: 640px, 768px, 1024px, 1280px

## 📞 Contact

- **Email**: audio@russabuss.com
- **Phone**: (503) 734-5502
- **Web3**: russabuss.eth, russabuss.sol

## 📄 License

All rights reserved © 2026 Russabuss

---

Built with the PILOT framework using D.O.E. architecture
🤖 Generated with [Claude Code](https://claude.com/claude-code)
