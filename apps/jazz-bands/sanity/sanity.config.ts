import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { schemaTypes } from "./schemas";

export default defineConfig({
  name: "jazz-bands",
  title: "Jazz Bands CMS",
  projectId: process.env.SANITY_PROJECT_ID || "your-project-id",
  dataset: process.env.SANITY_DATASET || "production",
  
  plugins: [deskTool()],
  
  schema: {
    types: schemaTypes,
  },
});
