import { defineType, defineField } from "sanity";

export const bandMemberOverrideType = defineType({
  name: "bandMemberOverride",
  title: "Band Member Override",
  type: "object",
  fields: [
    defineField({
      name: "musician",
      title: "Musician",
      type: "reference",
      to: [{ type: "musician" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Biography Override",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "images",
      title: "Images Override",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "caption",
              title: "Caption",
              type: "string",
            }),
          ],
        },
      ],
      description: "Override images for this specific band - first image is the main one",
    }),
    defineField({
      name: "instrument",
      title: "Instrument Override",
      type: "string",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
    }),
  ],
});
