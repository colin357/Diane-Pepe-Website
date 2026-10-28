# Diane Pepe — The Mortgage Pharmacist

Static marketing site for Diane Pepe, Loan Officer at Fairway Independent Mortgage Corporation (Denver Metro & Lexington, NE).

No build step. Plain HTML, CSS and a small JS file, deployed on Vercel.

## Deploy on Vercel

1. Import this repo in Vercel → Framework preset: **Other** → no build command, output directory `.` (root).
2. Add the custom domain. `vercel.json` turns on clean URLs (`/about`, `/loan-programs`, `/faq`) and sets cache and security headers.

## Pages

| URL | File |
| --- | --- |
| `/` | `index.html` |
| `/about` | `about.html` |
| `/loan-programs` | `loan-programs.html` |
| `/faq` | `faq.html` |
| 404 | `404.html` |

## AEO / answer-engine setup

- JSON-LD on every page: `Person`, `FinancialService`/`LocalBusiness`, `FAQPage`, `ItemList` of loan services, `BreadcrumbList`, `speakable`.
- Every FAQ answer and program section opens with a one-sentence, self-contained answer that AI engines can quote.
- "The short answer" boxes on inner pages.
- `llms.txt` holds a plain-text fact sheet for LLM crawlers.
- `robots.txt` explicitly allows GPTBot, ClaudeBot, PerplexityBot, Google-Extended and others. `sitemap.xml` is included.

## Before launch, replace these

- **Domain**: every absolute URL uses `https://www.dianepepe.com`. Find and replace it if the domain is different (HTML files, `sitemap.xml`, `robots.txt`, `llms.txt`).
- **Individual NMLS #**: 2061796 is set in the footer of every page and in `llms.txt`.
- **Email**: the site uses `diane.pepe@home.com` from her intake form. Confirm this, or switch it to her Fairway address.
- **Licensing states**: the copy assumes she is licensed in CO and NE. Confirm this.
- Have Fairway compliance review the disclosures and copy before going live.

## Editing

Header, footer and contact sections are repeated in each HTML file. If you change one, change it in all five files.
Photos in `assets/img/` come from Unsplash (free to use under the Unsplash License). The headshot comes from the client portal.
