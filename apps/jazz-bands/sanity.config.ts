import { defineConfig } from 'sanity'
import { visionTool } from '@sanity/vision'
import { dashboardTool } from '@sanity/dashboard'
import { structureTool } from 'sanity/structure'
import { schemaTypes } from './schemas'
import deskStructure from './deskStructure'

export default defineConfig({
  name: 'jazz-bands',
  title: 'Jazz Bands CMS',
  projectId: process.env.SANITY_PROJECT_ID || 'your-project-id',
  dataset: process.env.SANITY_DATASET || 'production',

  plugins: [
    visionTool(),
    dashboardTool(),
    structureTool({ structure: deskStructure }),
  ],

  schema: {
    types: schemaTypes,
  },
})
