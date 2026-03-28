import { defineType, defineField } from 'sanity'

export const contactType = defineType({
  name: 'contact',
  title: 'Contact',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  constraints: [
    ({ value }) => {
      if (value._id === 'contact_shared') return true
      return {
        message: 'Contact document must have _id: "contact_shared"',
        intention: 'Update the _id to "contact_shared"',
      }
    },
  ],
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      description: 'Email address for contact inquiries',
    }),
    defineField({
      name: 'phone',
      title: 'Téléphone',
      type: 'string',
      description: 'Phone number for contact inquiries',
    }),
    defineField({
      name: 'socialMedia',
      title: 'Réseaux Sociaux',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Plateforme',
              type: 'string',
              options: {
                list: [
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Instagram', value: 'instagram' },
                  { title: 'YouTube', value: 'youtube' },
                  { title: 'Spotify', value: 'spotify' },
                  { title: 'TikTok', value: 'tiktok' },
                  { title: 'Twitter', value: 'twitter' },
                  { title: 'Bandcamp', value: 'bandcamp' },
                  { title: 'SoundCloud', value: 'soundcloud' },
                ],
              },
            }),
            defineField({
              name: 'url',
              title: 'URL',
              type: 'url',
              description: 'Full URL to the social media profile',
            }),
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      email: 'email',
    },
    prepare(selection) {
      return {
        title: 'Contact Information',
        subtitle: selection.email || 'No email set',
      }
    },
  },
})
