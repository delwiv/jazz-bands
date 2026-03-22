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
  preview: {
    select: {
      date: 'date',
      city: 'city',
      venue: 'venue',
      soldOut: 'soldOut',
    },
    prepare(selection) {
      const { date, city, venue, soldOut } = selection
      const dateStr = date ? new Date(date).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : ''
      return {
        title: `${venue} — ${city}`,
        subtitle: `${dateStr}${soldOut ? ' ❌ Complet' : ''}`,
      }
    },
  },
})
