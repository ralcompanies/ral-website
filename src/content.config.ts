/**
 * RAL Companies website: content model.
 *
 * Every editable thing on the site lives in src/content as small Markdown/YAML
 * files. These schemas are checked on every build. If a file is incomplete
 * (for example a Featured project without a hero image), the build stops with a
 * plain-English error and nothing is published.
 *
 * Fields starting with `internal_` are never rendered on the public site.
 */
import { defineCollection, reference } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { z } from 'astro/zod';

const internalNotes = z.array(z.string()).default([]).describe('Private pre-launch notes. Never shown publicly.');

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().max(170).optional(),
  })
  .default({});

/* ---------- Taxonomies (editable lists) ---------- */
const taxonomyItem = z.object({
  id: z.string(),
  label: z.string(),
  order: z.number().default(0),
});
const projectTypes = defineCollection({ loader: file('src/content/taxonomies/project-types.yml'), schema: taxonomyItem });
const regions = defineCollection({ loader: file('src/content/taxonomies/regions.yml'), schema: taxonomyItem });
const roles = defineCollection({
  loader: file('src/content/taxonomies/roles.yml'),
  schema: taxonomyItem.extend({ capability: z.enum(['design', 'develop', 'partner', 'manage']).optional() }),
});

/* ---------- Projects ---------- */
const galleryImage = (image: any) =>
  z.object({
    src: image(),
    alt: z.string(),
    caption: z.string().optional(),
    credit: z.string().optional(),
    kind: z.enum(['photo', 'rendering']).default('photo'),
  });

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z
      .object({
        name: z.string(),
        tier: z.enum(['featured', 'portfolio', 'hidden']).describe('Featured = full page. Portfolio = light card only. Hidden = kept on file, not shown.'),
        display_order: z.number().default(100),
        status: z.enum(['completed', 'current', 'in-development']).optional(),
        location: z.string().describe('Short, public: e.g. "Union Square, Manhattan"'),
        address: z.string().optional(),
        region: reference('regions'),
        types: z.array(reference('projectTypes')).min(1),
        roles: z.array(reference('roles')).default([]),
        public_private: z.boolean().default(false),
        public_partner: z.string().optional(),
        completion_year: z.number().optional(),
        hook: z.string().optional().describe('One line used on cards and page intros.'),
        summary: z.string().optional(),
        card_image: image().optional(),
        card_alt: z.string().optional(),
        hero_image: image().optional(),
        hero_alt: z.string().optional(),
        hero_kind: z.enum(['photo', 'rendering']).default('photo'),
        logo: image().optional(),
        facts: z
          .object({
            square_feet: z.number().optional(),
            stories: z.number().optional(),
            residences: z.number().optional(),
            keys: z.number().optional(),
            other: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
          })
          .default({ other: [] }),
        credits: z.array(z.object({ role: z.string(), name: z.string() })).default([]),
        partners: z.array(z.string()).default([]),
        website: z.string().url().optional(),
        stats: z.array(z.object({ value: z.string(), label: z.string() })).default([]),
        chapters: z
          .array(
            z.object({
              heading: z.string(),
              body: z.string(),
              image: galleryImage(image).optional(),
            }),
          )
          .default([]),
        quote: z.object({ text: z.string(), attribution: z.string() }).optional(),
        gallery: z.array(galleryImage(image)).default([]),
        milestones: z.array(z.object({ year: z.string(), text: z.string() })).default([]),
        team: z.array(reference('people')).default([]),
        seo,
        internal_notes: internalNotes,
      })
      .superRefine((p, ctx) => {
        if (p.tier === 'featured') {
          for (const f of ['hero_image', 'hero_alt', 'hook', 'summary', 'status'] as const) {
            if (!p[f]) ctx.addIssue({ code: 'custom', path: [f], message: `A Featured project needs "${f}". Add it, or set tier to "portfolio".` });
          }
        }
      }),
});

/* ---------- People & Team Sections ---------- */
const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      title: z.string(),
      headshot: image().optional(),
      headshot_focus: z.string().default('50% 30%').describe('CSS object-position, e.g. "50% 25%"'),
      short_bio: z.string().optional(),
      linkedin: z.string().url().optional(),
      email: z.string().email().optional(),
      show_email: z.boolean().default(false),
      active: z.boolean().default(true),
      seo,
      internal_notes: internalNotes,
    }),
});

const teamSections = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/team-sections' }),
  schema: z.object({
    name: z.string(),
    order: z.number(),
    visible: z.boolean().default(true),
    card_size: z.enum(['large', 'standard']).default('standard'),
    intro: z.string().optional(),
    members: z.array(reference('people')).default([]),
  }),
});

/* ---------- Press ---------- */
const publications = defineCollection({
  loader: file('src/content/publications/publications.yml'),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    website: z.string().url().optional(),
    tier: z.enum(['national', 'trade', 'local']).default('trade'),
    // Monochrome wordmark in /public/press-logos. Without one, the outlet name is set in type.
    logo: z.string().optional(),
    // Optical size tweak: compact marks read small next to long wordmarks.
    logo_scale: z.number().min(0.5).max(2.5).default(1),
  }),
});

const press = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/press' }),
  schema: ({ image }) =>
    z
      .object({
        headline: z.string(),
        publication: reference('publications'),
        date: z.coerce.date(),
        date_precision: z.enum(['day', 'month', 'year']).default('day'),
        url: z.string().url().optional(),
        pdf: z.string().optional().describe('Path under /press/ for an archived clipping'),
        image: image().optional(),
        excerpt: z.string().optional(),
        category: z.enum(['coverage', 'announcement', 'interview', 'award']).default('coverage'),
        projects: z.array(reference('projects')).default([]),
        people: z.array(reference('people')).default([]),
        featured: z.boolean().default(false),
        hidden: z.boolean().default(false),
        internal_notes: internalNotes,
      })
      .refine((p) => p.url || p.pdf, { message: 'A press item needs a link (url) or an archived clipping (pdf).' }),
});

/* ---------- Timeline ---------- */
const timeline = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/timeline' }),
  schema: ({ image }) =>
    z.object({
      years: z.string(),
      title: z.string(),
      text: z.string(),
      order: z.number(),
      image: image().optional(),
      image_alt: z.string().optional(),
      projects: z.array(reference('projects')).default([]),
      internal_notes: internalNotes,
    }),
});

/* ---------- Settings ---------- */
const settings = defineCollection({
  loader: glob({ pattern: '**/*.yml', base: './src/content/settings' }),
  schema: ({ image }) =>
    z
      .object({
        // company.yml
        legal_name: z.string().optional(),
        short_name: z.string().optional(),
        founded: z.number().optional(),
        tagline: z.string().optional(),
        positioning: z.string().optional(),
        stats: z
          .array(
            z.object({
              value: z.string().describe('Use {years} to calculate years since founding automatically.'),
              label: z.string(),
              visible: z.boolean().default(true),
              internal_source: z.string().optional(),
            }),
          )
          .optional(),
        offices: z
          .array(
            z.object({
              name: z.string(),
              lines: z.array(z.string()),
              phone: z.string().optional(),
              map_url: z.string().url().optional(),
              primary: z.boolean().default(false),
            }),
          )
          .optional(),
        contacts: z.array(z.object({ label: z.string(), email: z.string().email(), note: z.string().optional() })).optional(),
        social: z.array(z.object({ network: z.string(), url: z.string().url() })).optional(),
        partners_list: z.array(z.object({ name: z.string(), kind: z.enum(['operator', 'public', 'capital', 'design']) })).optional(),
        // homepage.yml
        hero_slides: z.array(z.object({ image: image(), alt: z.string(), project: reference('projects').optional(), caption: z.string().optional() })).optional(),
        hero_headline: z.string().optional(),
        hero_subline: z.string().optional(),
        featured_intro: z.string().optional(),
        featured_projects: z
          .array(
            z.object({
              project: reference('projects'),
              image: image().optional().describe('Optional override of the project hero for the homepage'),
              alt: z.string().optional(),
              text: z.string().optional().describe('Optional override of the project hook for the homepage'),
            }),
          )
          .optional(),
        capabilities: z
          .array(z.object({ key: z.enum(['design', 'develop', 'partner']), title: z.string(), text: z.string(), proof: z.array(z.string()).optional() }))
          .optional(),
        leadership_quote: z.object({ text: z.string(), person: reference('people'), image: image().optional() }).optional(),
        press_count: z.number().optional(),
        internal_notes: internalNotes,
      })
      .passthrough(),
});

/* ---------- Pages (About, Contact, legal) ---------- */
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), eyebrow: z.string().optional(), lede: z.string().optional(), seo, internal_notes: internalNotes }).passthrough(),
});

export const collections = { projects, people, teamSections, press, publications, timeline, settings, pages, projectTypes, regions, roles };
