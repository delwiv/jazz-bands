import { defineCliConfig } from 'sanity/cli'
import { SANITY_PROJECT_ID, SANITY_DATASET } from './lib/sanity-settings'

export default defineCliConfig({
  api: {
    projectId: SANITY_PROJECT_ID,
    dataset: SANITY_DATASET,
  },
})
