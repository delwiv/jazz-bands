import { defineType, defineField } from "sanity";

export const musicianType = defineType({
  name: "musician",
  title: "Musician",
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
      name: "bio",
      title: "Biography",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "instrument",
      title: "Instrument",
      type: "string",
    }),
    defineField({
      name: "photo",
      title: "Photo",
      type: "image",
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: "gallery",
      title: "Photo Gallery",
      type: "array",
      of: [
        {
          type: "image",
          fields: [
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "bands",
      title: "Bands",
      type: "array",
      of: [{ type: "reference", to: [{ type: "band" }] }],
    }),
    defineField({
      name: "bandOverrides",
      title: "Band-Specific Overrides",
      type: "array",
      of: [{ type: "bandMemberOverride" }],
      description: "Override bio, photo, or instrument for specific bands",
    }),
  ],
  preview: {
    select: {
      title: "name",
      media: "photo",
    },
  },
});
