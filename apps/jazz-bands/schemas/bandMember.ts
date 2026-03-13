import { defineType, defineField } from "sanity";

/**
 * Band Member - Used in band.bandMembers[] array
 * 
 * This object represents a musician as a member of a specific band.
 * Since the context is already within a band document, no band reference is needed.
 * 
 * Supports per-band customizations:
 * - Custom bio for this band
 * - Custom images for this band
 * - Custom instrument designation
 * - Sort order for display
 */
export const bandMember = defineType({
  name: "bandMember",
  title: "Band Member",
  type: "object",
  fields: [
    defineField({
      name: "musician",
      title: "Musician",
      type: "reference",
      to: [{ type: "musician" }],
      validation: (Rule) => Rule.required(),
      description: "Select the musician who is a member of this band",
    }),
    defineField({
      name: "bio",
      title: "Biography Override",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Optional: Override the musician's bio for this specific band. Leave empty to use the musician's default bio.",
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
      description:
        "Optional: Override images for this specific band. First image is the main one. Leave empty to use the musician's default images.",
    }),
    defineField({
      name: "instrument",
      title: "Instrument Override",
      type: "string",
      description:
        "Optional: Override the instrument for this specific band. Leave empty to use the musician's default instrument.",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort Order",
      type: "number",
      description:
        "Optional: Custom display order. Lower numbers appear first. Leave empty for default ordering.",
    }),
  ],
});
