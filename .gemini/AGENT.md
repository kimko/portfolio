# Portfolio Agent Context

## Quick Summary

Woodworking portfolio -- static SPA, Vite + React + Chakra UI v2, deployed to GitHub Pages via Actions.

## Architecture

```
src/
  data/
    projects.js           # Project content + image refs (imports manifest)
    projects.json         # Project content, written by the content tool
    image-manifest.json   # Web copies per photo, written by the content tool
  components/
    Header.jsx            # Site title and project count
    ProjectGrid.jsx       # Responsive SimpleGrid (1/2/3 cols)
    ProjectCard.jsx       # Card with blur-up image loading
    ProjectModal.jsx      # Full detail view with image gallery
  theme.js                # Chakra UI theme (warm palette, Zilla Slab + IBM Plex)
  App.jsx                 # Root: ChakraProvider + state + composition
  main.jsx                # Entry point
public/
  images-optimized/       # Generated WebP (thumb + full per photo), committed
  models/                 # 3D models (.fbx) per project
content/
  originals/              # Full-size photos, local only (gitignored); also the drop folder
  photo-map.json          # Which original became which site photo
scripts/content/          # Content tool (npm run content)
.claude/skills/portfolio-content/  # How Claude drives the content tool
```

## Key Patterns

- **No em-dashes.** Use `--` instead. User preference, enforced everywhere.
- **Image pipeline:** Originals (HEIC or JPEG) live in `content/originals/<project-id>/`, which git ignores. `npm run content` makes a 1000px-wide card copy (WebP q72), a 2400px long-edge full copy (WebP q75) and a 20px blur placeholder, upright and without location data.
- **Blur-up loading:** Cards and modal use tiny base64 blur placeholders (inline in JS bundle). Real images fade in with `opacity` transition on `onLoad`.
- **Base-aware paths:** All image paths use `import.meta.env.BASE_URL` because GitHub Pages serves from `/portfolio/`.
- **Initial loader:** Pure HTML/CSS spinner in `index.html` `<div id="root">` -- shows before React mounts, replaced automatically.
- **Theme:** Warm paper background (#F7F6F3), warm near-black project view, amber accent. Zilla Slab headings, IBM Plex Sans body, IBM Plex Mono labels, via Google Fonts.
- **Incremental commits.** Each logical change gets its own commit.

## Adding or Updating Projects

Use the `portfolio-content` skill (`.claude/skills/portfolio-content/SKILL.md`). In short:

1. Drop photos into `content/originals/<project-id>/` (a new folder means a new project)
2. `npm run content -- status` to see what's new
3. `npm run content -- new` / `add-photo` / `edit` / `remove-photo` (try `--dry-run` first)
4. `npm run content -- check`, then commit

Never hand-edit `projects.json` or `image-manifest.json`.

## Link Previews

iMessage, Slack and other apps build a link preview from the tags in a page's head; they don't run JavaScript and ignore everything after `#`. So `npm run build` also runs `scripts/share-pages.mjs`, which writes a small page per project (`/portfolio/p/<project>/`) and per photo (`/portfolio/p/<project>/<photo>/`) with its own title, caption and 1200x630 preview image, then forwards to the project view. The Share button shares these addresses. The site-wide preview for the plain address comes from `index.html` and `public/og-image.jpg`.

## Commands

```bash
npm run dev          # Dev server with HMR
npm run build        # Production build to dist/
npm run content      # Add or update projects and photos (see --help)
npm run deploy       # Build + deploy to GitHub Pages (gh-pages)
```

## Deployment

GitHub Actions on push to `main`. Workflow at `.github/workflows/deploy.yml`. Builds with Vite, deploys `dist/` to `gh-pages` branch.

## Dependencies of Note

- `@chakra-ui/react` v2 (not v3) -- uses `extendTheme`, `ChakraProvider`
- `framer-motion` -- required by Chakra v2, also used for card animations
- `sharp` -- dev dependency for image optimization, native module

## Build Notes

- **Chunk size limit** is set to 600KB in `vite.config.js`. The single bundle is ~530KB (Chakra UI + Framer Motion + React). This is expected -- code-splitting has no benefit for a single-page portfolio where all code loads on first paint. Do not try to fix the warning by splitting; just raise the limit if it grows.
- **`npm run build` must produce zero warnings.** If the build emits warnings, fix them before committing.
