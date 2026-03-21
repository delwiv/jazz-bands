import { defineType, defineField } from 'sanity'

export const tourDateType = defineType({
  name: 'tourDate',
  title: 'Date de Concert',
  type: 'object',
  fields: [
    defineField({
      name: 'date',
      title: 'Date',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'city',
      title: 'Ville',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Lieu',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Région/Département',
      type: 'string',
    }),
    defineField({
      name: 'details',
      title: 'Détails',
      type: 'text',
    }),
    defineField({
      name: 'ticketsUrl',
      title: 'URL des Billets',
      type: 'url',
    }),
    defineField({
      name: 'soldOut',
      title: 'Complet',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
