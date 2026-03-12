import { defineType, defineField } from "sanity";

export const bandType = defineType({
  name: "band",
  title: "Band",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "heroImage",
      title: "Hero Image",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "members",
      title: "Members (Simple)",
      type: "array",
      of: [{ type: "reference", to: [{ type: "musician" }] }],
      description: "⚠️ Deprecated: Use 'bandMembers' for new entries to support per-band overrides",
    }),
    defineField({
      name: "bandMembers",
      title: "Members (with Overrides)",
      type: "array",
      of: [{ type: "bandMemberOverride" }],
      description: "Use this to add per-band customizations (bio, photo, order)",
    }),
    defineField({
      name: "tourDates",
      title: "Tour Dates",
      type: "array",
      of: [{ type: "tourDate" }],
    }),
    defineField({
      name: "recordings",
      title: "Recordings",
      type: "array",
      of: [{ type: "recording" }],
    }),
    defineField({
      name: "contact",
      title: "Contact Information",
      type: "object",
      fields: [
        defineField({
          name: "email",
          title: "Email",
          type: "string",
        }),
        defineField({
          name: "phone",
          title: "Phone",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "socialMedia",
      title: "Social Media",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            defineField({
              name: "platform",
              title: "Platform",
              type: "string",
              options: {
                list: [
                  { title: "Facebook", value: "facebook" },
                  { title: "Instagram", value: "instagram" },
                  { title: "Twitter", value: "twitter" },
                  { title: "YouTube", value: "youtube" },
                  { title: "SoundCloud", value: "soundcloud" },
                ],
              },
            }),
            defineField({
              name: "url",
              title: "URL",
              type: "url",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "branding",
      title: "Branding",
      type: "object",
      fields: [
        defineField({
          name: "primaryColor",
          title: "Primary Color",
          type: "color",
          initialValue: "#1e3a8a",
        }),
        defineField({
          name: "secondaryColor",
          title: "Secondary Color",
          type: "color",
          initialValue: "#dc2626",
        }),
      ],
    }),
    // SEO Fields
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      group: "seo",
      fields: [
        defineField({
          name: "metaTitle",
          title: "Meta Title",
          type: "string",
          description: "Page title for search engines (max 60 characters). Leave empty to auto-generate from band name.",
          validation: (Rule) => Rule.max(60),
        }),
        defineField({
          name: "metaDescription",
          title: "Meta Description",
          type: "text",
          rows: 3,
          description: "Page description for search engines (max 160 characters). Leave empty to auto-generate from description.",
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: "metaKeywords",
          title: "Meta Keywords",
          type: "array",
          of: [{ type: "string" }],
          description: "Comma-separated keywords for search engines (optional, most search engines ignore this).",
        }),
      ],
    }),
    defineField({
      name: "openGraph",
      title: "Open Graph (Social Media)",
      type: "object",
      group: "seo",
      description: "Controls how your band appears when shared on Facebook, LinkedIn, and other social platforms.",
      fields: [
        defineField({
          name: "title",
          title: "OG Title",
          type: "string",
          description: "Title shown in social media previews (max 65 characters).",
          validation: (Rule) => Rule.max(65),
        }),
        defineField({
          name: "description",
          title: "OG Description",
          type: "text",
          rows: 3,
          description: "Description shown in social media previews (max 200 characters).",
          validation: (Rule) => Rule.max(200),
        }),
        defineField({
          name: "image",
          title: "OG Image",
          type: "image",
          options: { hotspot: true },
          description: "Image shown in social media previews (recommended: 1200×630px).",
        }),
        defineField({
          name: "type",
          title: "OG Type",
          type: "string",
          options: {
            list: [
              { title: "Website", value: "website" },
              { title: "Music Band", value: "music.band" },
            ],
          },
          initialValue: "website",
        }),
      ],
    }),
    defineField({
      name: "twitterCard",
      title: "Twitter Card",
      type: "object",
      group: "seo",
      description: "Controls how your band appears when shared on Twitter/X.",
      fields: [
        defineField({
          name: "card",
          title: "Card Type",
          type: "string",
          options: {
            list: [
              { title: "Summary", value: "summary" },
              { title: "Summary with Large Image (Recommended)", value: "summary_large_image" },
              { title: "App", value: "app" },
            ],
          },
          initialValue: "summary_large_image",
        }),
        defineField({
          name: "title",
          title: "Title",
          type: "string",
          description: "Title shown in Twitter cards (max 70 characters).",
          validation: (Rule) => Rule.max(70),
        }),
        defineField({
          name: "description",
          title: "Description",
          type: "text",
          rows: 3,
          description: "Description shown in Twitter cards (max 200 characters).",
          validation: (Rule) => Rule.max(200),
        }),
        defineField({
          name: "image",
          title: "Image",
          type: "image",
          options: { hotspot: true },
          description: "Image shown in Twitter cards (recommended: 1200×600px or 1200×400px).",
        }),
        defineField({
          name: "creator",
          title: "Creator Handle",
          type: "string",
          description: "Twitter handle of the creator (e.g., @boheme_jazz).",
          validation: (Rule) => Rule.pattern(/^@?[a-zA-Z0-9_]+$/),
        }),
      ],
    }),
    defineField({
      name: "structuredData",
      title: "Structured Data (Schema.org)",
      type: "object",
      group: "seo",
      description: "Additional structured data for search engines. Most fields auto-populate from band data.",
      fields: [
        defineField({
          name: "genre",
          title: "Genre(s)",
          type: "array",
          of: [{ type: "string" }],
          description: "Music genres (e.g., 'Jazz', 'Bebop', 'Swing'). Used in MusicGroup schema.",
        }),
        defineField({
          name: "formedYear",
          title: "Formed Year",
          type: "number",
          description: "Year the band was formed (e.g., 2010). Used in MusicGroup schema.",
          validation: (Rule) => Rule.min(1900).max(new Date().getFullYear()),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "logo",
    },
  },
});
