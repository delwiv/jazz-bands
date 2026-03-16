import { defineCliConfig } from 'sanity/cli'
import { SANITY_PROJECT_ID, SANITY_DATASET } from './lib/sanity-settings'

export default defineCliConfig({
  api: {
    projectId: SANITY_PROJECT_ID || '94fpfdn8',
    dataset: SANITY_DATASET || 'staging',
  },
})
