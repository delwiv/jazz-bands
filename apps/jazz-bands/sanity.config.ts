import { dashboardTool } from '@sanity/dashboard'
import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { colorInput } from '@sanity/color-input'
import { structure } from './sanity/deskStructure'
import { schemaTypes } from './sanity/schemas'

export default defineConfig({
  name: 'jazz-bands',
  title: 'Jazz Bands CMS',
  // Use SANITY_STUDIO_ prefix for auto-injection by Sanity Studio
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || '94fpfdn8',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    visionTool({}),
    dashboardTool({}),
    structureTool({ structure }),
    colorInput(),
  ],

  schema: {
    types: schemaTypes,
  },
})
