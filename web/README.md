# Web client (`web/`)

SPA scaffold: **Vite**, **React**, **TypeScript**, **Tailwind CSS v4** via `@tailwindcss/vite`.

Industrial **design tokens** (UX-DR1) and **Bebas Neue** + **DM Mono** (UX-DR2) are defined in `src/index.css` (`@theme`) and loaded via Google Fonts in `index.html`.

## Prerequisites

- **Node.js** must satisfy Vite’s requirement (pinned with this app): **Node `^20.19.0` or `>=22.12.0`** (see `package.json` → `engines`).

## Fonts (single entry point)

The app loads both faces from one stylesheet URL:

`https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Mono:wght@400;500&display=swap`

Referenced in **`index.html`** (`<link rel="stylesheet" href="...">`).

**Why `display=swap`:** Browsers show fallback text immediately, then swap to the webfont when it loads. That avoids an invisible “flash of invisible text” (FOIT) and keeps the shell readable if the font is slow or blocked—matching the fallback stacks defined on `--font-display` and `--font-ui` in `src/index.css`.

## Commands

```bash
npm install
npm run dev      # dev server + HMR
npm run build    # production build
npm run preview  # preview production build locally
```

## Tape color (UX-DR5 / Story 1.5)

The **`ColorPickerSwatch`** component uses the browser’s **native color input** (`<input type="color">`) so you get **full-spectrum** picking on supported browsers. The **hex value** is always shown next to the swatch (not color-only).

**Follow-up (optional later):** a custom HSL wheel / refined picker can replace the native control in a future polish pass; the MVP is intentionally simple and accessible.

## Verify

After `npm run dev`, open the app URL from the terminal. You should see the **tape creator**: **Warning Text** (CAUTION + input), **Tape color** (swatch + hex label), and **Live Preview** with the tape updating as you type and when you change color.

Typography: **Bebas Neue** (`font-display`) for tape/display; **DM Mono** (`font-ui`) for UI chrome.
