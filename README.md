# frontrunner

> **Showcase notice:** The hosted Vercel deployment is provided for exploring the UI and UX. AI generation is currently unavailable through its Subscribe.dev integration, so chat and model requests will not produce new results. You can still explore the model catalog, layouts, controls, and appearance settings.

frontrunner is a UI/UX showcase for a generative AI workspace: browse a model, shape a request, carry on a conversation, and revisit the results in a personal gallery. It explores how those workflows can share one visual language while adapting to desktop and touch screens.

[Explore the showcase](https://frontrunner-chi.vercel.app)

Built with React, TypeScript, and Vite. Subscribe.dev supplies the integration for authentication, model requests, billing, and cloud storage. This repository contains the frontend, with no standalone model backend or bundled provider credentials.

<img width="1464" height="878" alt="image" src="https://github.com/user-attachments/assets/73c0c15d-1c33-40f3-bf60-6aab4fcec100" />

## Explore the interfaces

### Runners

[Runners](https://frontrunner-chi.vercel.app/runners) organizes the model catalog by output type or provider, with search, category filters, and favorites. Each runner turns a model's input schema into a form with the appropriate text fields, sliders, toggles, and file inputs.

On mobile, longer forms use swipeable pages; desktop layouts give inputs and outputs more room. Parameter templates let users save and reload a setup. Image inputs can come from uploads or the gallery, and reprompting a saved generation restores its original form values. The catalog reflects the models configured in the source, rather than a guarantee of current provider availability.

### Chat

[Chat](https://frontrunner-chi.vercel.app/chat) presents conversations in a desktop sidebar or a mobile drawer. It includes conversation search, editable titles, model selection, system prompts, and adjustable message text size.

Messages support Markdown, code blocks, and image attachments for compatible models. An image-history option keeps attachments in only the latest request to reduce repeated image input. The interface is built around moving between conversations and models without leaving the workspace; generating replies requires a working provider connection.

### Gallery

[Gallery](https://frontrunner-chi.vercel.app/gallery) brings text, image, and video results into one library, with a desktop masonry layout and a mobile grid. Search covers model names, prompts, and text output, alongside output-type filters.

The detail view combines media inspection with the original inputs and generation metadata. It includes image zoom and pan, favorites, downloads, and a reprompt action that returns to the runner with the saved settings. Mobile controls use a draggable details drawer. Saved images can also be selected as inputs in runners and chat, connecting the library to the next request.

The hosted showcase does not include a seeded gallery or sample conversations. Views that depend on saved results may be empty, and some actions require sign-in.

### Themes

Open [Profile → Appearance](https://frontrunner-chi.vercel.app/profile) to explore the theme system:

- **Brightness:** Light, Paper, Dark, and OLED.
- **Corners:** Sharp or Round.
- **Accent:** Eleven gradient presets, or a custom pair of colors.

Shared theme tokens carry colors, typography, spacing, borders, shadows, and transitions through the interface. Changing appearance updates forms, navigation, dialogs, and scrollbars together. Preferences use the app's local and cloud storage integration.

## Local development

Requires Node.js 22.12 or newer and npm.

```sh
npm ci
cp .env.local.example .env.local
npm run dev
```

In PowerShell, use `Copy-Item .env.local.example .env.local` for the copy step.

Set `VITE_SUBSCRIBEDEV_PROJECT_SLUG` in `.env.local` to your own Subscribe.dev project slug, then restart the development server. Authentication and generation depend on that project's provider configuration and service availability; running this frontend alone does not enable generation. Without a slug, the app displays an unconfigured workspace page and does not initialize the provider. There is no offline mock mode.

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
