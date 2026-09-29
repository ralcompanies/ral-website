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

## Adding a project: where else it should appear
A project file only creates the project page and its card on the Projects page. Check each of these, and update the ones that apply:

| Where | File | When |
| --- | --- | --- |
| About page timeline | `src/content/timeline/*.yml` (`text` and `projects`) | Always. Current work goes in `06-today.yml`; older work goes in its era. |
| Homepage featured strip | `src/content/settings/homepage.yml` (`featured_projects`) | Flagship work. The strip shows projects in pairs, so keep an even count. |
| Homepage hero slideshow | `src/content/settings/homepage.yml` (`hero_slides`) | Only for a strong landscape image. |
| Press coverage | `src/content/press/*.yml` (`projects`) | Tag existing articles about the project, and add new ones. The project page's "In the press" section reads these tags. |
| Team bios | `src/content/people/*.md` | Where a bio lists that person's projects and they worked on this one. |
| Partners and company stats | `src/content/settings/company.yml` (`partners_list`, `stats`) | New operator, capital or public partners, or a change to a stat (for example a hotel count). |
| Featured order | `display_order` on the other Featured projects | When the new project should not go last. |
| Old-site redirects | `public/_redirects` | When the old site had a page for this project. |

## Commands
- `npm install` then `npm run dev` (local), `npm run build` (static output in `dist/`).
- `PUBLIC_PREVIEW=true npm run build` adds noindex and the Type A/B switch.
- `python3 scripts/checklist.py` regenerates `docs/PRELAUNCH_CHECKLIST.md` from all internal notes.
- `python3 scripts/make_web_masters.py` rebuilds web masters from staged originals (originals are never modified).

## Images
`src/assets/images/` holds web masters (max 2800px, sRGB). Astro generates AVIF/WebP/JPEG at several widths at build time. Full-resolution originals stay in the Google Drive project folders.

## Status
Gate 1 (design system + homepage). Pages built: `/`, `/design-system/`. Next: Projects, project detail, Team, bio, About, Press, Contact.
