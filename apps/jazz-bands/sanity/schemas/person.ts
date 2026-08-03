import { defineType, defineField } from 'sanity'

export const personType = defineType({
  name: 'person',
  title: 'Personne (Hub)',
  type: 'document',
  __experimental_actions: ['update', 'publish'],
  constraints: [
    ({ value }) => {
      if (value._id === 'person_frederic-robert') return true
      return {
        message: 'Le document Person doit avoir _id: "person_frederic-robert"',
        intention: "Mettre à jour le _id vers 'person_frederic-robert'",
      }
    },
  ],
  groups: [
    {
      name: 'seo',
      title: 'SEO',
    },
  ],
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
      name: 'tagline',
      title: 'Accroche',
      type: 'string',
      description: 'Courte phrase affichée sous le nom, dans le hero.',
    }),
    defineField({
      name: 'heroImage',
      title: 'Image du Hero',
      type: 'image',
      options: { hotspot: true },
      description:
        'Image de fond du haut de page. Laissez vide pour utiliser la photo du musicien.',
    }),
    defineField({
      name: 'musician',
      title: 'Musicien lié',
      type: 'reference',
      to: [{ type: 'musician' }],
      description:
        "Document musicien de Frédéric Robert. Sa bio, son instrument et ses photos sont utilisés sur le hub. Ne pas modifier.",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'gallery',
      title: 'Galerie',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              options: { hotspot: true },
            }),
            defineField({
              name: 'caption',
              title: 'Légende',
              type: 'string',
            }),
          ],
          preview: {
            select: {
              media: 'image',
              title: 'caption',
            },
          },
        },
      ],
      description:
        "Photos supplémentaires du hub (les photos du musicien lié sont ajoutées automatiquement).",
    }),
    defineField({
      name: 'news',
      title: 'Annonces',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'date',
              title: 'Date',
              type: 'date',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'title',
              title: 'Titre',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'body',
              title: 'Contenu',
              type: 'array',
              of: [{ type: 'block' }],
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'date',
            },
          },
        },
      ],
      description:
        "Fil d'annonces édité à la main (sorties d'albums, projets, presse…). Les dates de concerts sont ajoutées automatiquement depuis les groupes.",
    }),
    defineField({
      name: 'bands',
      title: 'Groupes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'band',
              title: 'Groupe',
              type: 'reference',
              to: [{ type: 'band' }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description courte',
              type: 'string',
              description:
                'Texte affiché sur la carte du groupe. Laissez vide pour utiliser la description du groupe.',
            }),
            defineField({
              name: 'url',
              title: 'URL du site (optionnel)',
              type: 'url',
              description:
                'Adresse du site du groupe. Laissez vide pour utiliser le modèle par défaut ({slug}.jazz.wildredbeard.tech).',
            }),
          ],
          preview: {
            select: {
              title: 'band.name',
              media: 'band.logo',
            },
          },
        },
      ],
      description: 'Groupes présentés sur le hub, dans l\'ordre d\'affichage.',
    }),
    defineField({
      name: 'bookingEmail',
      title: 'Email de Réservation',
      type: 'string',
      description: 'Adresse utilisée pour les demandes de booking.',
    }),
    defineField({
      name: 'phone',
      title: 'Téléphone',
      type: 'string',
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
            }),
          ],
        },
      ],
    }),
    // SEO Fields
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'metaTitle',
          title: 'Titre Meta',
          type: 'string',
          description:
            'Titre de page pour les moteurs de recherche (max 60 caractères). Laissez vide pour la valeur par défaut.',
          validation: (Rule) => Rule.max(60),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Description Meta',
          type: 'text',
          rows: 3,
          description:
            'Description de page pour les moteurs de recherche (max 160 caractères).',
          validation: (Rule) => Rule.max(160),
        }),
      ],
    }),
    defineField({
      name: 'openGraph',
      title: 'Open Graph (Réseaux Sociaux)',
      type: 'object',
      group: 'seo',
      fields: [
        defineField({
          name: 'title',
          title: 'Titre OG',
          type: 'string',
          validation: (Rule) => Rule.max(65),
        }),
        defineField({
          name: 'description',
          title: 'Description OG',
          type: 'text',
          rows: 3,
          validation: (Rule) => Rule.max(200),
        }),
        defineField({
          name: 'image',
          title: 'Image OG',
          type: 'image',
          options: { hotspot: true },
          description: 'Recommandé: 1200×630px.',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'heroImage',
    },
  },
})
