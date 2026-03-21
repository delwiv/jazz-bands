import { defineType, defineField } from "sanity";

export const bandMemberOverrideType = defineType({
  name: "bandMemberOverride",
  title: "Substitution de Membre",
  type: "object",
  fields: [
    defineField({
      name: "musician",
      title: "Musicien",
      type: "reference",
      to: [{ type: "musician" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "bio",
      title: "Substitution de Biographie",
      type: "array",
      of: [{ type: "block" }],
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
      description: "Substituer les images pour ce groupe spécifique - la première image est principale",
    }),
    defineField({
      name: "instrument",
      title: "Substitution d'Instrument",
      type: "string",
    }),
    defineField({
      name: "sortOrder",
      title: "Ordre d'Affichage",
      type: "number",
    }),
  ],
});
