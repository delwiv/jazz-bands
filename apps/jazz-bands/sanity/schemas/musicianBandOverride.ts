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
  title: "Substitution de Groupe",
  type: "object",
  fields: [
    defineField({
      name: "band",
      title: "Groupe",
      type: "reference",
      to: [{ type: "band" }],
      weak: true,
      validation: (Rule) => Rule.required(),
      description: "Sélectionnez le groupe concerné par cette substitution",
    }),
    defineField({
      name: "bio",
      title: "Substitution de Biographie",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Facultatif: Substituer votre biographie pour ce groupe spécifique. Laissez vide pour utiliser votre biographie par défaut.",
    }),
    defineField({
      name: "images",
      title: "Substitution d'Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "caption",
              title: "Légende",
              type: "string",
            }),
          ],
        },
      ],
      description:
        "Facultatif: Substituer les images pour ce groupe spécifique. La première image est principale. Laissez vide pour utiliser vos images par défaut.",
    }),
    defineField({
      name: "instrument",
      title: "Substitution d'Instrument",
      type: "string",
      description:
        "Facultatif: Substituer votre instrument pour ce groupe spécifique. Laissez vide pour utiliser votre instrument par défaut.",
    }),
  ],
});
