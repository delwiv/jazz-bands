import { type LoaderFunctionArgs } from "react-router";
import { contentService } from "~/lib/content.service";

export async function loader({ request }: LoaderFunctionArgs) {
  const bands = await contentService.getAllBands();
  const url = new URL(request.url);
  const hostname = url.hostname;
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${bands
    .map(
      (band: any) => `
  <url>
    <loc>${protocol}://${band.slug}.${hostname}/</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${protocol}://${band.slug}.${hostname}/music</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${protocol}://${band.slug}.${hostname}/tour</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${protocol}://${band.slug}.${hostname}/musicians</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${protocol}://${band.slug}.${hostname}/contact</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  `
    )
    .join("")}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}

export default function Sitemap() {
  return null;
}
