# frontrunner

A mobile-friendly workspace for AI chat, model runners, and a generation gallery. Built with React, TypeScript, and Vite, with Subscribe.dev providing user authentication, model access, billing, and cloud storage.

## Features

- Chat with supported language models, with Markdown and image attachments.
- Browse model runners for text, images, video, and audio.
- Save generations, favorite models and outputs, and reuse results as inputs.
- Customize the theme and use responsive desktop and mobile layouts.

Model availability and usage costs depend on your Subscribe.dev project. This repository contains the frontend; it does not include a standalone model backend or provider credentials.

## Local development

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
cp .env.local.example .env.local
npm run dev
```

In PowerShell, use `Copy-Item .env.local.example .env.local` for the copy step.

Set `VITE_SUBSCRIBEDEV_PROJECT_SLUG` in `.env.local` to your own Subscribe.dev project slug, then restart the development server. Configure authentication and model access for that project in Subscribe.dev. Without a slug, the app displays an unconfigured workspace page and does not initialize the provider.

The project slug is public configuration. Vite embeds `VITE_*` values in browser assets; never put API keys, passwords, or other secrets in these variables. Local environment files are ignored by Git.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Type-check and build the production app into `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

The production build includes TypeScript checks. The inherited codebase still has ESLint errors, including loose types and conditional hooks; lint is not currently a passing quality gate. Authentication, billing, and model requests require a configured Subscribe.dev project for end-to-end testing.

## Deployment

Import `borwood/frontrunner` into your Vercel account. The included `vercel.json` configures the Vite build and single-page app routing, so direct visits to `/chat`, `/gallery`, `/profile`, and `/runners` resolve correctly.

Set `VITE_SUBSCRIBEDEV_PROJECT_SLUG` for each Vercel environment you intend to use, then deploy. Rebuild after changing the slug. Configure the deployed domain with your authentication provider as required by your Subscribe.dev project.

Alternatively, authenticate and deploy from this directory:

```sh
npx vercel login
npx vercel link
npx vercel --prod
```

## Source layout

- `src/pages/`: home, chat, model catalog, individual runners, gallery, and profile.
- `src/components/`: shared interface components and input/output renderers.
- `src/contexts/` and `src/hooks/`: authentication, generation queues, favorites, and storage.
- `src/theme/`: theme tokens and customization.
- `src/types/models.ts`: model definitions and input/output schemas.

## Data and privacy

Signed-in requests use your configured Subscribe.dev project. Chat and generation data may be stored in browser storage and synchronized to that service. Treat prompts, attachments, and outputs as data shared with the configured providers. Provider terms and charges apply independently of this project's license.

## License

MIT. See [LICENSE](LICENSE).
