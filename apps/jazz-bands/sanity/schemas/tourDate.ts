import { defineType, defineField } from 'sanity'

export const tourDateType = defineType({
  name: 'tourDate',
  title: 'Tour Date',
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
      title: 'City',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'venue',
      title: 'Venue',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'region',
      title: 'Region/Department',
      type: 'string',
    }),
    defineField({
      name: 'details',
      title: 'Details',
      type: 'text',
    }),
    defineField({
      name: 'ticketsUrl',
      title: 'Tickets URL',
      type: 'url',
    }),
    defineField({
      name: 'soldOut',
      title: 'Sold Out',
      type: 'boolean',
      initialValue: false,
    }),
  ],
})
