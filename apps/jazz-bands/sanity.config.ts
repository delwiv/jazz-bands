import { dashboardTool } from '@sanity/dashboard'
import { visionTool } from '@sanity/vision'
import { frFRLocale } from '@sanity/locale-fr-fr'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { colorInput } from '@sanity/color-input'
import { structure } from './sanity/deskStructure'
import { schemaTypes } from './sanity/schemas'
import { SANITY_PROJECT_ID, SANITY_DATASET } from './lib/sanity-settings'

export default defineConfig({
  name: 'jazz-bands',
  title: 'CMS Jazz Bands',
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,

  plugins: [
    frFRLocale(),
    visionTool({}),
    dashboardTool({}),
    structureTool({ structure }),
    colorInput(),
  ],

  schema: {
    types: schemaTypes,
  },
})
