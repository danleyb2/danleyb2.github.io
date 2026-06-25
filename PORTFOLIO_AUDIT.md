# Portfolio Audit & Recommendations for danleyb2.github.io

## 🔴 Critical Issues Found

### 1. **Broken GitHub Links (20+ projects)**
Most project files point to `https://github.com/danleyb2/layout` or `"null"` instead of actual repositories. This includes ABSR, Bulk SMS, ChemFinder, Amazon Top 16, BadApples.ai, and many more.

### 2. **Stale/Fake Descriptions**
At least 8 projects use "A starter template for PHP projects" as their entire description — this is clearly a copy-paste leftover from a template. Other generic descriptions include "Chrome Extension" (one line) or "A simple App..." repeated verbatim.

### 3. **TODO Markers Left in Production**
Dozens of `> TODO` lines sitting in rendered content: "time period Jan 2017–Present", "check date period", etc. These look unfinished to visitors.

### 4. **Duplicate/Redundant Projects**
- USSDS Android + USSDS Web = same product (USSD shortcode lookup)
- ABSR Android + ABSR web = same product  
These should be consolidated or archived.

## 🟡 Formatting & Structure Issues

### 5. **No Screenshots/Demos**
Every project page is pure text. No screenshots, GIFs, live demos, or architecture diagrams. A portfolio without visuals loses impact.

### 6. **Experiences Page Hidden**
The nav header has `-# experiences.html` commented out — visitors can't see work history.

### 7. **Mixed Date Formats & Broken Links**
- Dates use inconsistent formats (`2023-10-15`, `Jan 2017–Present`, `Apr 2016`)
- DjangoStarter github points to `sifhic/django` (a fork, not the original)

### 8. **Dev Tools in Portfolio**
Projects like "Layout", "My Blog", and "Zahan Limited" are dev tooling or starter templates — they don't demonstrate value to potential employers/clients.

## 💡 Recommendations

### Immediate (This PR)
- ✅ Rewrote about.html with professional summary, stats, and tech stack
- ✅ Redesign home/index with card grid layout for projects
- ✅ Un-commented experiences from nav + redesigned page layout  
- ✅ Fixed key highlighted projects (helpdesk, passmark-cpu, ua-scrapper, dd-extension, instagram-api)
- ✅ Added proper `_config.yml` with SEO tags and social links

### High Priority Next Steps
1. **Fix all broken GitHub URLs** — Replace every `github: https://github.com/danleyb2/layout` with the actual repo URL
2. **Add screenshots/GIFs** to every highlighted project (even a single screenshot doubles engagement)
3. **Upload CV PDF** to `/assets/` and fix the download link on about page
4. **Consolidate duplicate projects** — pick USSDS or ABSR as the primary, archive the other
5. **Remove starter-template-only projects** or move them to a separate `/oss` page

### Strategic Improvements
6. **Group projects by category** (DevOps, Mobile, Web Apps, Browser Tools) rather than chronological
7. **Add case studies** for 2-3 flagship projects (problem → approach → results)
8. **Blog SEO** — all posts lack meta descriptions and have identical dates (`2008-10-19`)
9. **Dark mode toggle** if the theme supports it
10. **Add a "What I'm Building Now" section** with current work-in-progress

## Files Changed in This Branch
- `_config.yml` — SEO tags, social links, project sorting
- `about.html` — Complete redesign with stats, tech stack, professional summary
- `index.html` — Card grid layout for featured projects + latest posts
- `experiences.html` — Redesign + un-commented from nav
- `skills.md` — Categorized skills breakdown instead of bare list
- `_projects/` — Fixed 5 highlighted projects with proper descriptions

## Quick Win Checklist
- [ ] Add screenshots to DD-Extension project page
- [ ] Upload CV PDF (`/assets/cv-brian-nyaundi.pdf`)  
- [ ] Fix all remaining `github:` URLs in non-highlighted projects
- [ ] Remove "Layout", "My Blog", "Zahan Limited" from portfolio
- [ ] Add real dates to blog posts (currently 2008-10-19 for everything)
