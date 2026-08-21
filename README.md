# PulseFeed

Real-time market-data visualization platform. A public demo board streams live crypto prices
over a Binance WebSocket with zero login; signed-in users get a personal, customizable board,
per-widget AI explanations of recent price action, full English/Arabic (RTL) support, and
token-driven dark/light theming.

Built on a deliberately small stack — Next.js on Vercel, PostgreSQL, Better Auth, and
OpenRouter — each dependency chosen for cost-effectiveness at expected scale.

---

## Features

- **Public demo board** — unauthenticated visitors see 4 live-updating widgets
(BTC/USDT, ETH/USDT, SOL/USDT, BNB/USDT) with D3 sparklines, no signup wall.
- **Sign in & personal board** — email/password, GitHub, or Google via Better Auth; a
board pre-populated with the 4 default pairs is auto-created on first login.
- **Customize & persist** — add, remove, reorder widgets (max 8); changes persist
automatically, reconciled on load.
- **AI-explained price action** — "Explain this" returns a plain-language summary of the
same ~200-tick window the sparkline draws; shared 5-minute cache, graceful
"resets at midnight UTC" state when the daily provider cap is exhausted.
- **Bilingual EN/AR + RTL** — full i18n via i18next, locale-prefixed routing, Arabic
rendered right-to-left; charts stay LTR by deliberate exception.
- **Dark/Light theming** — token-driven design system (CSS custom properties), OS-default
detection, persisted override, no flash-of-wrong-theme.
- **Accessible by default** — WCAG 2.1 AA, keyboard-operable, `prefers-reduced-motion`
respected, Lighthouse ≥ 90 gated in CI across both locales and themes.

---



## Tech Stack


| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------- |
| Framework | Next.js 16 (App Router), React 19, TypeScript strict          |
| Styling   | Tailwind CSS + Sass modules, token file (`styles/tokens.css`) |
| Charts    | D3 (sparklines), Recharts (expanded views)                    |
| Forms     | React Hook Form + Zod (shared schemas in `lib/forms/`)        |
| Icons     | react-icons / Lucide (`react-icons/lu`)                       |
| Data      | TanStack Query; native WebSocket → Binance public stream      |
| Auth      | Better Auth (self-hosted) + Prisma adapter                    |
| Database  | PostgreSQL                                                    |
| AI        | OpenRouter (auto-router), 5-min shared cache                  |
| i18n      | i18next + react-i18next, `en`/`ar`                            |
| Theming   | Token-driven CSS custom properties, OS `prefers-color-scheme` |
| Testing   | Vitest, Playwright, Storybook                                 |
| CI        | GitHub Actions + Lighthouse CI                                |


---



## Getting Started



### Prerequisites

- Node.js 20+
- npm
- A PostgreSQL database — pooled connection string



### Environment variables

A committed template lives at `.env.example`. Copy it per environment and fill in real
values — environment files are gitignored and never committed:

```bash
cp .env.example .env.local          # local development
cp .env.example .env.staging        # staging deployment
cp .env.example .env.production     # production deployment
```

Staging and production secrets are injected per environment at deploy time (Vercel project
environments) from the same key set:

```
# PostgreSQL connection string (pooled)
DATABASE_URL="postgresql://..."

# Better Auth
BETTER_AUTH_SECRET="generate-a-long-random-string"
BETTER_AUTH_URL="http://localhost:3000"

# OAuth providers (configure at the provider dashboards)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# OpenRouter AI
OPENROUTER_API_KEY=""
OPENROUTER_MODEL="<provider model id>"
```



### Install & run

```bash
npm install

# Apply the database schema
npx prisma migrate dev --name init

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (demo board) and [http://localhost:3000/board](http://localhost:3000/board) (after sign-in).
English and Arabic resolve at `/en` and `/ar`.

---



## Commands

```bash
npm run dev           # dev server
npm run build         # production build
npm start             # serve production build
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run test:unit     # Vitest unit tests
npx playwright test   # end-to-end tests
npm run storybook     # component browser (design system record)
```

CI runs typecheck → lint → unit tests → Playwright → Lighthouse (fail under 90 on any
category, both locales).

---



## Project Structure

```
pulsefeed/
├── proxy.ts                 # locale detection/redirect
├── next.config.js           # security headers, CSP
├── styles/
│   └── tokens.css           # design tokens: colors, spacing, type
├── app/
│   └── [locale]/            # /en/..., /ar/...
│       ├── page.tsx         # public demo board
│       ├── board/page.tsx   # authenticated personal board
│       └── layout.tsx       # lang/dir, ThemeProvider + I18nProvider
│   └── api/
│       ├── auth/[...all]    # Better Auth handler
│       ├── boards/...       # demo + personal board endpoints
│       ├── ai/explain       # AI explanation endpoint
│       └── user/...         # locale + theme preference
├── lib/
│   ├── market-data/         # Binance provider, tick buffer
│   ├── ai-insight/          # OpenRouter client + cache
│   ├── boards/              # persistence + ownership
│   ├── forms/               # shared RHF/zod form schemas
│   ├── auth/                # Better Auth config + session
│   └── i18n/                # locale settings + i18next init
├── locales/
│   ├── en/common.json
│   └── ar/common.json
├── components/
│   ├── providers/           # I18nProvider, ThemeProvider
│   ├── widget/              # Widget, Sparkline, ExplainButton
│   └── board/               # Board
├── prisma/
│   └── schema.prisma
└── tests/
    └── e2e/                 # Playwright specs
```

---



## Architecture notes

- **Library-first:** market data, AI insight, boards, and auth are isolated modules under
`lib/`; routes and components call them, never implementing logic inline. The Binance
provider can be swapped without touching UI code.
- **Test-first:** every module ships its failing unit test before implementation; every user
story has a Playwright spec. TDD is a hard gate, not a convention.
- **Server-side authority:** every mutation re-derives the acting user from the Better Auth
session — client-supplied identity is never trusted.
- **One source of truth for design:** every color/spacing/type value comes from
`styles/tokens.css`; components are not complete until verified in both themes and both
locales.

---

## Created by

© AHMED SALAH

---



## License

[MIT](LICENSE)