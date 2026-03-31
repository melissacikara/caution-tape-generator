# Deferred work

## Resolved (2026-03-30)

- **App entry vs story docs:** The SPA shell is wired in `web/src/main.tsx` → `RouterProvider` → `web/src/router.tsx` (`AppLayout`, routes). There is no `App.tsx` in this project; prefer citing **`router.tsx`**, **`layout/AppLayout.tsx`**, and **`pages/HomePage.tsx`** when updating older story files.

## Deferred from: code review of 1-6-add-appheader-and-home-layout-with-command-center-structure.md (2026-03-30)

- ~~Story file list references `web/src/App.tsx`~~ — see **Resolved** above.
