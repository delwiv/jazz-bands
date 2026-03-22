import { defineType, defineField } from 'sanity'

export const musicianType = defineType({
  name: 'musician',
  title: 'Musicien',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nom',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Identifiant',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().unique("L'identifiant doit être unique"),
    }),
    defineField({
      name: 'bio',
      title: 'Biographie',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'instrument',
      title: 'Instrument',
      type: 'string',
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'caption',
              title: 'Légende',
              type: 'string',
            }),
          ],
        },
      ],
      description: 'Tableau d\'images - la première est principale',
    }),
    defineField({
      name: 'bands',
      title: 'Groupes',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'band' }], weak: true }],
    }),
    defineField({
      name: 'bandOverrides',
      title: 'Substitutions par Groupe',
      type: 'array',
      of: [{ type: 'musicianBandOverride' }],
      description: 'Substituer bio, photo ou instrument pour des groupes spécifiques',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'instrument',
      media: 'images.0.asset',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || 'Musicien Sans Titre',
        subtitle: subtitle || 'Instrument non spécifié',
        media,
      };
    },
  },
})
