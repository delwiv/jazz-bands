import { defineType, defineField } from 'sanity'

export const recordingType = defineType({
  name: 'recording',
  title: 'Enregistrement',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Titre',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'audio',
      title: 'Fichier Audio',
      type: 'file',
      options: {
        accept: 'audio/*',
      },
    }),
    defineField({
      name: 'duration',
      title: 'Durée (secondes)',
      type: 'number',
    }),
    defineField({
      name: 'album',
      title: 'Album',
      type: 'string',
    }),
    defineField({
      name: 'releaseYear',
      title: 'Année de Sortie',
      type: 'number',
    }),
 defineField({
    name: 'composers',
    title: 'Compositeurs',
    type: 'array',
    of: [{ type: 'string' }],
  }),
    defineField({
      name: 'trackNumber',
      title: 'Numéro de piste',
      type: 'number',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'downloadEnabled',
      title: 'Activer le Téléchargement',
      type: 'boolean',
      initialValue: true,
    }),
  ],
})
