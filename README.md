<p align="center">
  <img
    alt="Drag banner"
    src="https://shiny-fennec-807.convex.cloud/api/storage/bde30790-f97d-4ecd-80eb-6b91bd79b3d2"
  />
</p>

<h1 align="center">Drag</h1>

<p align="center">
  A drag-and-drop email builder powered by <a href="https://react.email">React Email</a>, with AI-assisted generation/editing and code export.
</p>

<p align="center">
  <a href="./">Website</a>
  ·
  <a href="./issues">Issues</a>
</p>

<p align="center">
  <img alt="License" src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" />
  <img alt="Monorepo" src="https://img.shields.io/badge/monorepo-Turborepo-black" />
  <img alt="Runtime" src="https://img.shields.io/badge/runtime-Bun-black" />
  <img alt="Backend" src="https://img.shields.io/badge/backend-Convex-black" />
</p>

Built as a Bun + Turborepo monorepo.

## Features

- **Drag & drop editor**: compose emails from React Email components with drag & drap and AI assistant
- **Brand tools**: import brand identity via Firecrawl + generate marketing stunning market assets via fal.ai

## About

Drag helps you build production-ready marketing and even transactional emails with a component-based editor, then export clean JSX/HTML.

## Project structure

```
.
├── apps/
│   ├── app/                 # Main product - Email Builder (Next.js)
│   ├── web/                 # Marketing / waitlist site (Next.js)
│   └── api/                 # Reserved (currently empty)
├── packages/
│   ├── ui/                  # Shared UI components (shadcn)
│   ├── email/               # React Email templates/utilities
│   └── ...                  # analytics / jobs / kv / logger / (legacy/
├── env.example              # Example env vars (see per-app env.example too)
├── turbo.json               # Turborepo config
└── README.md
```

## Tech stack

- **Runtime**: [Bun](https://bun.sh)
- **Monorepo**: [Turborepo](https://turbo.build)
- **Apps**: [Next.js](https://nextjs.org) (App Router) + React 19
- **Email**: `@react-email/components` + `@react-email/render`
- **Drag & drop**: `@dnd-kit/*`
- **Backend/Auth**: [Convex](https://www.convex.dev) + `@convex-dev/auth`
- **Email sending**: [Resend](https://resend.com) (optional)
- **AI**: [Vercel AI SDK](https://sdk.vercel.ai) + Vercel AI Gateway (optional)
- **Lint/format**: [Biome](https://biomejs.dev)

## Quickstart (local)

### 1) Install dependencies

```bash
bun install
```

### 2) Configure environment variables

This repo includes `env.example` files you can copy locally:

```bash
cp apps/app/env.example apps/app/.env.local
cp apps/web/env.example apps/web/.env.local
```

Convex environment variables are separate (set in Convex Dashboard or via CLI). See:

- `apps/app/convex/env.example`

### 3) Start Convex (required for the builder app)

In one terminal:

```bash
cd apps/app
bunx convex dev
```

### 4) Start the Next.js apps

In another terminal from the repo root:

```bash
# Builder (http://localhost:3000)
bun dev:app

# Marketing (http://localhost:3001)
# bun dev:web
```

## Environment variables (what goes where)

There are **two runtimes** for the builder:

- **Next.js runtime**: `apps/app/.env.local` (browser + Next routes)
- **Convex runtime**: set via Convex Dashboard / CLI (Convex functions + Convex Auth)

### Next.js (`apps/app/.env.local`)

- **`NEXT_PUBLIC_CONVEX_URL`**: required (your deployment URL, e.g. `https://<name>.convex.cloud`)
- **`NEXT_PUBLIC_APP_URL`**: recommended (defaults to `http://localhost:3000`)
- **`AI_GATEWAY_API_KEY`**: required for AI assistant features
- **`RESEND_API_KEY`**: optional (enables sending emails from `/api/send-email`; otherwise it logs)

### Convex (Dashboard / CLI)

See `apps/app/convex/env.example`. Common ones:

- **`CONVEX_SITE_URL`**: required by Convex Auth config (typically `http://localhost:3000` for local)
- **`JWT_PRIVATE_KEY`**: required by Convex Auth
- **`RESEND_API_KEY`** + **`RESEND_FROM`**: required for OTP verification / password reset emails
- **`FIRECRAWL_API_KEY`**: optional (brand import on `/assets`)
- **`FAL_KEY`**: optional (marketing image generation on `/assets`)

To generate JWT keys locally:

```bash
cd apps/app
bun run generate-jwt-keys
```

## Scripts

```bash
bun dev        # dev all apps
bun dev:app    # dev builder only
bun dev:web    # dev marketing only
bun build      # build all
bun lint       # lint all
bun format     # biome format
bun check      # biome check --write
```

## License

AGPL-3.0 — see `LICENSE`.
