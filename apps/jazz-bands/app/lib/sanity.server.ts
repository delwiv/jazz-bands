import { createClient, type ClientConfig } from "@sanity/client";
import { createImageUrlBuilder, type ImageMetadata } from "@sanity/image-url";

const config: ClientConfig = {
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: process.env.SANITY_DATASET || "production",
  apiVersion: "2025-01-10",
  useCdn: true, // CDN for better performance
  token: process.env.SANITY_API_READ_TOKEN, // Optional for public reads
};

// Server client (with write token for draft access if needed)
export const sanityClient = createClient({
  ...config,
  useCdn: false, // Real-time data on server
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
});

// Browser client (read-only, CDN enabled)
export const sanityClientBrowser = createClient(config);

// Image URL builder
export const urlForImage = createImageUrlBuilder({
  projectId: config.projectId!,
  dataset: config.dataset!,
});

export function imageurl(source: ImageMetadata) {
  return urlForImage(source).url();
}
