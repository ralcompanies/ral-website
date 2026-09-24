# RAL Companies website

Astro static site. All content lives in `src/content/` as small Markdown/YAML files, edited through the browser admin at `/admin` (Sveltia CMS) or by Claude Cowork. Every change is a Git commit; branches get private preview URLs on Cloudflare; only `main` is live.

## Content model
| Folder | What it holds |
| --- | --- |
| `src/content/projects/` | One file per project. `tier: featured` = full page, `portfolio` = card only, `hidden` = kept on file. |
| `src/content/people/` | One file per person (bio is the Markdown body). `active: false` removes them everywhere. |
| `src/content/team-sections/` | One file per Team section: name, order, visible, ordered `members`. |
| `src/content/press/` + `publications/` | Press items linked to projects/people; outlets entered once. |
| `src/content/settings/company.yml` | Founding year (1979), stats (`{years}` is calculated), offices, contacts, partners. |
| `src/content/settings/homepage.yml` | Hero images, ordered homepage projects, capability copy, quote. |
| `src/content/taxonomies/` | Editable lists: project types, regions, RAL roles. |
| `internal_notes` (any file) | Private pre-launch notes. Never rendered. |

Schemas and rules: `src/content.config.ts`. A Featured project without a hero image, summary, hook or status will not build.

## Commands
- `npm install` then `npm run dev` (local), `npm run build` (static output in `dist/`).
- `PUBLIC_PREVIEW=true npm run build` adds noindex and the Type A/B switch.
- `python3 scripts/checklist.py` regenerates `docs/PRELAUNCH_CHECKLIST.md` from all internal notes.
- `python3 scripts/make_web_masters.py` rebuilds web masters from staged originals (originals are never modified).

## Images
`src/assets/images/` holds web masters (max 2800px, sRGB). Astro generates AVIF/WebP/JPEG at several widths at build time. Full-resolution originals stay in the Google Drive project folders.

## Status
Gate 1 (design system + homepage). Pages built: `/`, `/design-system/`. Next: Projects, project detail, Team, bio, About, Press, Contact.
