# Woodworks

Woodworking portfolio site featuring an interactive project gallery and inline 3D model viewers.

**Live:** [https://kimko.github.io/portfolio/](https://kimko.github.io/portfolio/)

## Dev

```bash
npm install
npm run dev          # http://localhost:5173/portfolio/
```

## Adding and Updating Projects

Projects are managed with a small command-line tool, designed to be driven by Claude Code (see `.claude/skills/portfolio-content/SKILL.md`) but usable by hand too.

```bash
npm run content -- status      # what's new in content/originals/
npm run content -- --help      # every command
```

1. Drop photos (HEIC or JPEG, any file name) into `content/originals/<project-id>/`. A new folder becomes a new project.
2. Ask Claude to add them, or run `new`, `add-photo`, `edit`, `remove-photo` and `set-cover` yourself. Every change command takes `--dry-run`.
3. Run `npm run content -- check` and commit.

## Asset Pipeline (Images & 3D)

- **Originals** stay on your computer in `content/originals/` (gitignored, so keep your own backup). `content/photo-map.json` records which original became which site photo.
- **Web copies** in `public/images-optimized/` are committed: a 1000px-wide card image (WebP, quality 72), a 2400px full image (WebP, quality 75) and a 20px blur placeholder. Copies are turned upright and saved without location data.
- **3D models** (`.fbx`) live in `public/models/<project-id>/`, with a preview image processed like any photo.
- `npm run content -- rebuild` remakes the web copies from the originals after a size change.

## Testing & Quality

- **Tests**: Run `npm test` (or `npm run test:watch`). We use `vitest` and `@testing-library/react` to guarantee routing and modal behaviors don't regress.
- **Linting**: Run `npm run lint`. We use `oxlint` (a blazing fast rust-based linter) with plugins for accessibility (`jsx-a11y`) and React. 
- **Git Hooks**: A `husky` pre-commit hook is configured to automatically run both the linter and test suite before allowing any commits.

## Deploy

Push to `main`. GitHub Actions builds and deploys to Pages automatically.

## Stack

- **Vite** -- build tool
- **React 19** -- UI
- **Chakra UI v2** -- component library
- **Framer Motion** -- animations
- **Three.js & R3F** -- 3D model rendering
- **Vitest & RTL** -- regression testing
- **Oxlint** -- static analysis
- **sharp** -- image optimization
