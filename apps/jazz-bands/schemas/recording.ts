import { defineType, defineField } from 'sanity'

export const recordingType = defineType({
  name: 'recording',
  title: 'Recording',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'audio',
      title: 'Audio File',
      type: 'file',
      options: {
        accept: 'audio/*',
      },
    }),
    defineField({
      name: 'duration',
      title: 'Duration (seconds)',
      type: 'number',
    }),
    defineField({
      name: 'album',
      title: 'Album',
      type: 'string',
    }),
    defineField({
      name: 'releaseYear',
      title: 'Release Year',
      type: 'number',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'downloadEnabled',
      title: 'Enable Download',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})
