---
name: portfolio-content
description: Add or update woodworking projects on the portfolio site - new photos, new projects, tags, descriptions, cover photos. Use whenever the user mentions new photos, a new project, changing tags or a description, or removing pictures. Drives the content tool (npm run content); never hand-edits the data files.
---

# Portfolio content

All changes go through `npm run content -- <command>`. The tool converts photos (HEIC or JPEG), makes the web copies, and updates `src/data/projects.json`, `src/data/image-manifest.json` and `content/photo-map.json`. Run `npm run content -- --help` for every command and option.

## Rules

- Never edit `projects.json`, `image-manifest.json` or `photo-map.json` by hand, and never touch site code for a content change.
- Only change what the user asked about. Never run `rebuild` unless `status` reports a changed original or the user asks.
- Run every write command with `--dry-run` first, show the user what will happen, then run it for real after they agree.
- Keep the user's words. In descriptions fix only spelling and grammar; never add claims, adjectives or details they didn't give.
- No em dashes in anything you write.
- Photo order tells the build story: design first (renders, 3D models), then in progress, then the finished piece. Within a stage, oldest first; read when a photo was taken with `mdls -raw -name kMDItemContentCreationDate <file>`. The cover is the card image and doesn't need to be first.

## 1. Start: see what's new

Run `npm run content -- status` and tell the user in one or two lines what it found, for example "3 new photos in dresser, and a new folder walnut-desk with 6 photos". Originals live in `content/originals/<project-id>/`; a folder that isn't a project yet is a new project, and its folder name becomes the project id.

If nothing is new, ask what they want to change.

## 2. New project

1. Look at every photo in the folder with the Read tool. Read can't open HEIC; for those, make a throwaway JPEG in your scratch folder first (`sips -s format jpeg <file> --out <scratch>/<name>.jpg`) and read that.
2. Propose, in one short list:
   - the cover photo (the clearest shot of the whole finished piece),
   - alt text for each photo: what it shows, in plain words, under about 12 words ("Walnut nightstand with the top drawer open"),
   - which photos to skip (blurry, duplicates).
3. Ask for the title, the description, and the materials and techniques. Run `npm run content -- tags` and map their tags onto existing names where they mean the same thing ("dovetails" becomes "Half-Blind Dovetails" only if that's what they mean; ask when unsure). New names are fine when nothing matches.
4. Create the project with the cover, then add the rest:
   ```
   npm run content -- new <id> --title "<title>" --description "<text>" --photo <file> --alt "<alt>" --material "<m>" --technique "<t>"
   npm run content -- add-photo <id> <file> --alt "<alt>"
   npm run content -- skip <id> <file>
   npm run content -- order <id> <photo or model.fbx>...
   ```

## 3. Update a project

Run `npm run content -- list <id>`, then apply only what the user asked:

| They want to | Command |
|---|---|
| Add new photos | `add-photo <id> <file> --alt "<alt>" [--cover]` (look at the photo first to write the alt text) |
| Add a 3D model (`.fbx` from Fusion 360) | `add-model <id> <model.fbx> --preview <image> --alt "<alt>"` (the preview is a render or screenshot used as its thumbnail) |
| Not use a dropped photo | `skip <id> <file>` |
| Remove a photo or 3D model | `remove-photo <id> <photo or model.fbx>` (the cover needs `set-cover` to another photo first) |
| Change the cover | `set-cover <id> <photo>` (only the card image; the order stays) |
| Reorder | `order <id> <photo or model.fbx>...` (every item, once). After `add-photo`, use it to put new photos in their stage |
| Fix alt text | `set-alt <id> <photo> "<alt>"` |
| Add or remove tags | `edit <id> --add-material "<m>" --remove-technique "<t>"` (options repeat) |
| Change title or description | `edit <id> --title "<t>" --description "<text>"` |

## 4. Finish

1. Run `npm run content -- check` and `npm test`. Both must pass.
2. Offer to show the change locally (`npm run dev`, then open http://localhost:5173/portfolio/).
3. Commit only when the user asks. Originals in `content/originals/` are not in git; remind the user to keep their own backup when they add new ones.
