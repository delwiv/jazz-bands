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
  title: "Membre de Groupe",
  type: "object",
  fields: [
    defineField({
      name: "musician",
      title: "Musicien",
      type: "reference",
      to: [{ type: "musician" }],
      weak: true,
      validation: (Rule) => Rule.required(),
      description: "Sélectionnez le musicien membre de ce groupe",
    }),
    defineField({
      name: "bio",
      title: "Substitution de Biographie",
      type: "array",
      of: [{ type: "block" }],
      description:
        "Facultatif: Substituer la biographie du musicien pour ce groupe spécifique. Laissez vide pour utiliser la biographie par défaut du musicien.",
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
        "Facultatif: Substituer les images pour ce groupe spécifique. La première image est principale. Laissez vide pour utiliser les images par défaut du musicien.",
    }),
    defineField({
      name: "instrument",
      title: "Substitution d'Instrument",
      type: "string",
      description:
        "Facultatif: Substituer l'instrument pour ce groupe spécifique. Laissez vide pour utiliser l'instrument par défaut du musicien.",
    }),
    defineField({
      name: "sortOrder",
      title: "Ordre d'Affichage",
      type: "number",
      description:
        "Facultatif: Ordre d'affichage personnalisé. Les nombres plus bas apparaissent en premier. Laissez vide pour l'ordonnancement par défaut.",
    }),
  ],
  preview: {
    select: {
      title: "musician.name",
      subtitle: "musician.instrument",
      media: "musician.images.0.asset",
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || "Musicien Sans Titre",
        subtitle: subtitle || "Instrument non spécifié",
        media,
      };
    },
  },
});
