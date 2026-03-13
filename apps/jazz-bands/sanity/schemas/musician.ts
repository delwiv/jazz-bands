import { defineType, defineField } from 'sanity'

export const musicianType = defineType({
  name: 'musician',
  title: 'Musician',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().unique('Slug must be unique'),
    }),
    defineField({
      name: 'bio',
      title: 'Biography',
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
              title: 'Caption',
              type: 'string',
            }),
          ],
        },
      ],
      description: 'Array of images - first image is the main one',
    }),
    defineField({
      name: 'bands',
      title: 'Bands',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'band' }] }],
    }),
    defineField({
      name: 'bandOverrides',
      title: 'Band-Specific Overrides',
      type: 'array',
      of: [{ type: 'musicianBandOverride' }],
      description: 'Override bio, photo, or instrument for specific bands',
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'images[0]',
    },
  },
})
