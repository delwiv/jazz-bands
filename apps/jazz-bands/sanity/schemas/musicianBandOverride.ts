import { defineType, defineField } from "sanity";

/**
 * Musician Band Override - Used in musician.bandOverrides[] array
 * 
 * This object represents band-specific overrides for a musician.
 * Unlike bandMember, this MUST include a band reference because it's used
 * within the musician document context where the band is not implicit.
 * 
 * Allows musicians to have different:
 * - Bios for different bands
 * - Photos for different bands
 * - Instrument designations for different bands
 */
export const musicianBandOverride = defineType({
  name: "musicianBandOverride",
  title: "Band Override",
  type: "object",
  fields: [
    defineField({
      name: "band",
      title: "Band",
      type: "reference",
      to: [{ type: "band" }],
      validation: (Rule) => Rule.required(),
      description: "Select the band this override applies to",
    }),
    defineField({
      name: "bio",
      title: "Biography Override",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Optional: Override your bio for this specific band. Leave empty to use your default bio.",
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
        "Optional: Override images for this specific band. First image is the main one. Leave empty to use your default images.",
    }),
    defineField({
      name: "instrument",
      title: "Instrument Override",
      type: "string",
      description:
        "Optional: Override your instrument for this specific band. Leave empty to use your default instrument.",
    }),
  ],
});
