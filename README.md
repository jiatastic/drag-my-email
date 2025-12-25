# React Email Builder

A drag-and-drop email builder using React Email components, AI-powered generation, and code export. Built with Next.js 15, React 19, and Turborepo.

## Project Structure

```
.
├── apps/                              # App workspace
│   ├── api/                           # Supabase (API, Auth, Storage, Edge Functions)
│   ├── app/                           # Main product - Email Builder
│   └── web/                           # Marketing site (coming soon)
├── packages/                          # Shared packages between apps
│   ├── analytics/                     # OpenPanel analytics
│   ├── email/                         # React email templates
│   ├── jobs/                          # Trigger.dev background jobs
│   ├── kv/                            # Upstash rate-limited key-value storage
│   ├── logger/                        # Logger library
│   ├── supabase/                      # Supabase - Queries, Mutations, Clients
│   └── ui/                            # Shared UI components (shadcn)
├── tooling/                           # Shared configuration
│   └── typescript/                    # Shared TypeScript configuration
├── biome.json                         # Biome configuration
├── turbo.json                         # Turbo configuration
└── README.md
```

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Monorepo**: [Turborepo](https://turbo.build)
- **Framework**: [Next.js 15](https://nextjs.org) (App Router)
- **React**: React 19
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Twitter Theme)
- **Email**: [@react-email/components](https://react.email)
- **Drag & Drop**: [@dnd-kit](https://dndkit.com)
- **Database**: [Supabase](https://supabase.com)
- **Linting**: [Biome](https://biomejs.dev)

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.3.0

### Installation

```bash
# Install dependencies
bun install

# Run the app in development mode
bun dev:app

# Or run all apps
bun dev
```

### Development

```bash
# Run only the email builder app
bun dev:app

# Run the marketing website (when implemented)
bun dev:web

# Build all apps
bun build

# Lint all apps
bun lint

# Format code
bun format
```

## Apps

### `apps/app` - Email Builder

The main product - a drag-and-drop email builder with:

- **Component Palette**: Drag React Email components (Button, Text, Image, Heading, etc.)
- **Canvas Editor**: Drop zone with live preview and component selection
- **Property Panel**: Edit component properties in real-time
- **Code Export**: View and copy React JSX or HTML code
- **Template Management**: Save and load email templates

#### Brand assets (`/assets`)

The app includes an `/assets` page that lets users:

- Import a brand identity profile via Firecrawl (`branding`, optionally `summary` / `screenshot`)
- Generate marketing images via fal.ai with flux-2-flex (JSON prompts, precise image sizes, commercial use)
- Use the selected brand context to guide AI email and image generation

Required environment variables (server-side / Convex actions):

- `FIRECRAWL_API_KEY`: Firecrawl API key (used by `apps/app/convex/brands.ts`)
- `FAL_KEY`: fal.ai API key for flux-2-flex image generation (used by `apps/app/convex/marketingAssets.ts`) - Get your key at https://fal.ai/dashboard/keys

### `apps/web` - Marketing Site (Coming Soon)

Landing page and marketing website for the product.

### `apps/api` - Supabase Backend (Coming Soon)

API routes, authentication, and database operations.

## Packages

| Package | Description |
|---------|-------------|
| `@react-email-builder/ui` | Shared UI components (shadcn with Twitter theme) |
| `@react-email-builder/email` | React Email templates and utilities |
| `@react-email-builder/supabase` | Supabase client, queries, and mutations |
| `@react-email-builder/analytics` | OpenPanel analytics integration |
| `@react-email-builder/jobs` | Trigger.dev background jobs |
| `@react-email-builder/kv` | Upstash rate-limited key-value storage |
| `@react-email-builder/logger` | Logging utilities |

## License

MIT
