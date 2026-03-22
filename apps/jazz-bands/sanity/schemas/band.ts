import { defineType, defineField } from 'sanity'

export const bandType = defineType({
  name: 'band',
  title: 'Groupe',
  type: 'document',
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
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'heroImage',
      title: 'Image Principale',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'members',
      title: 'Membres (Simple)',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'musician' }], weak: true }],
      description:
        "⚠️ Obsolète: Utilisez 'bandMembers' pour les nouvelles entrées afin de prendre en charge les substitutions par groupe",
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'bandMembers',
      title: 'Membres du Groupe',
      type: 'array',
      of: [{ type: 'bandMember' }],
      description:
        'Ajoutez les musiciens ici. Vous pouvez personnaliser bio, photo ou instrument pour ce groupe spécifiquement.',
    }),
    defineField({
      name: 'tourDates',
      title: 'Dates de Concerts',
      type: 'array',
      of: [{ type: 'tourDate' }],
      description: 'Les concerts les plus récents apparaissent en premier sur le site web.',
      options: {
        sortable: false, // trié automatiquement par date à l'affichage
      },
    }),
    defineField({
      name: 'recordings',
      title: 'Enregistrements',
      type: 'array',
      of: [{ type: 'recording' }],
    }),
    defineField({
      name: 'images',
      title: 'Images du Groupe',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
      description: 'Photos de groupe, affiches, fonds d\'écran, photos de concerts.',
    }),
    defineField({
      name: 'contact',
      title: 'Coordonnées',
      type: 'object',
      fields: [
        defineField({
          name: 'email',
          title: 'Email',
          type: 'string',
        }),
        defineField({
          name: 'phone',
          title: 'Téléphone',
          type: 'string',
        }),
      ],
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
                  { title: 'Twitter', value: 'twitter' },
                  { title: 'YouTube', value: 'youtube' },
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
    defineField({
      name: 'branding',
      title: 'Identité Visuelle',
      type: 'object',
      fields: [
        defineField({
          name: 'primaryColor',
          title: 'Couleur Principale',
          type: 'color',
          initialValue: { hue: 231, saturation: 70, lightness: 35, alpha: 1 },
        }),
        defineField({
          name: 'secondaryColor',
          title: 'Couleur Secondaire',
          type: 'color',
          initialValue: { hue: 0, saturation: 88, lightness: 54, alpha: 1 },
        }),
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
            'Titre de page pour les moteurs de recherche (max 60 caractères). Laissez vide pour générer automatiquement à partir du nom du groupe.',
          validation: (Rule) => Rule.max(60),
        }),
        defineField({
          name: 'metaDescription',
          title: 'Description Meta',
          type: 'text',
          rows: 3,
          description:
            "Description de page pour les moteurs de recherche (max 160 caractères). Laissez vide pour générer automatiquement à partir de la description.",
          validation: (Rule) => Rule.max(160),
        }),
        defineField({
          name: 'metaKeywords',
          title: 'Mots-clés Meta',
          type: 'array',
          of: [{ type: 'string' }],
          description:
            "Mots-clés séparés par des virgules pour les moteurs de recherche (facultatif, la plupart des moteurs de recherche l'ignorent).",
        }),
      ],
    }),
    defineField({
      name: 'openGraph',
      title: 'Open Graph (Réseaux Sociaux)',
      type: 'object',
      group: 'seo',
      description:
        "Contrôle l'apparence de votre groupe lorsqu'il est partagé sur Facebook, LinkedIn et d'autres plateformes sociales.",
      fields: [
        defineField({
          name: 'title',
          title: 'Titre OG',
          type: 'string',
          description:
            'Titre affiché dans les aperçus des réseaux sociaux (max 65 caractères).',
          validation: (Rule) => Rule.max(65),
        }),
        defineField({
          name: 'description',
          title: 'Description OG',
          type: 'text',
          rows: 3,
          description:
            "Description affichée dans les aperçus des réseaux sociaux (max 200 caractères).",
          validation: (Rule) => Rule.max(200),
        }),
        defineField({
          name: 'image',
          title: 'Image OG',
          type: 'image',
          options: { hotspot: true },
          description:
            'Image affichée dans les aperçus des réseaux sociaux (recommandé: 1200×630px).',
        }),
        defineField({
          name: 'type',
          title: 'Type OG',
          type: 'string',
          options: {
            list: [
              { title: 'Site Web', value: 'website' },
              { title: 'Groupe de Musique', value: 'music.band' },
            ],
          },
          initialValue: 'website',
        }),
      ],
    }),
    defineField({
      name: 'twitterCard',
      title: 'Carte Twitter',
      type: 'object',
      group: 'seo',
      description: "Contrôle l'apparence de votre groupe lorsqu'il est partagé sur Twitter/X.",
      fields: [
        defineField({
          name: 'card',
          title: 'Type de Carte',
          type: 'string',
          options: {
            list: [
              { title: 'Résumé', value: 'summary' },
              {
                title: 'Résumé avec Grande Image (Recommandé)',
                value: 'summary_large_image',
              },
              { title: 'Application', value: 'app' },
            ],
          },
          initialValue: 'summary_large_image',
        }),
        defineField({
          name: 'title',
          title: 'Titre',
          type: 'string',
          description: 'Titre affiché dans les cartes Twitter (max 70 caractères).',
          validation: (Rule) => Rule.max(70),
        }),
        defineField({
          name: 'description',
          title: 'Description',
          type: 'text',
          rows: 3,
          description:
            "Description affichée dans les cartes Twitter (max 200 caractères).",
          validation: (Rule) => Rule.max(200),
        }),
        defineField({
          name: 'image',
          title: 'Image',
          type: 'image',
          options: { hotspot: true },
          description:
            'Image affichée dans les cartes Twitter (recommandé: 1200×600px ou 1200×400px).',
        }),
        defineField({
          name: 'creator',
          title: 'Identifiant du Créateur',
          type: 'string',
          description: 'Identifiant Twitter du créateur (par exemple: @boheme_jazz).',
          validation: (Rule) => Rule.regex(/^@?[a-zA-Z0-9_]+$/),
        }),
      ],
    }),
    defineField({
      name: 'structuredData',
      title: 'Données Structurées (Schema.org)',
      type: 'object',
      group: 'seo',
      description:
        "Données structurées supplémentaires pour les moteurs de recherche. La plupart des champs sont automatiquement remplis à partir des données du groupe.",
      fields: [
        defineField({
          name: 'genre',
          title: 'Genre(s)',
          type: 'array',
          of: [{ type: 'string' }],
          description:
            "Genres musicaux (par exemple: 'Jazz', 'Bebop', 'Swing'). Utilisé dans le schéma MusicGroup.",
        }),
        defineField({
          name: 'formedYear',
          title: 'Année de Formation',
          type: 'number',
          description:
            'Année de formation du groupe (par exemple: 2010). Utilisé dans le schéma MusicGroup.',
          validation: (Rule) => Rule.min(1900).max(new Date().getFullYear()),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'name',
      media: 'logo',
    },
  },
})
