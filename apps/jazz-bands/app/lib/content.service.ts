import { sanityClient } from "./sanity.server";
import type { ContentService, Band, Musician } from "./types";

export class SanityContentService implements ContentService {
  private readonly BAND_QUERY = `
    *[_type == "band" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      description,
      logo,
      heroImage,
      "members": members[]-> { _id, name, bio, instrument, photo, gallery },
      tourDates,
      recordings,
      contact,
      socialMedia,
      branding
    }
  `;

  private readonly MUSICIAN_QUERY = `
    *[_type == "musician" && slug.current == $slug][0] {
      _id,
      name,
      slug,
      bio,
      instrument,
      photo,
      gallery,
      "bands": bands[]-> { name, slug }
    }
  `;

  private readonly MUSICIANS_BY_BAND_QUERY = `
    *[_type == "musician" && references($bandId)] {
      _id,
      name,
      slug,
      bio,
      instrument,
      photo,
      gallery
    }
  `;

  private readonly ALL_BANDS_QUERY = `
    *[_type == "band"] {
      _id,
      name,
      "slug": slug.current
    }
  `;

  async getAllBands(): Promise<Band[]> {
    try {
      const bands = await sanityClient.fetch(this.ALL_BANDS_QUERY);
      return bands || [];
    } catch (error) {
      console.error("Error fetching all bands:", error);
      return [];
    }
  }

  async getBandBySlug(slug: string): Promise<Band | null> {
    try {
      const band = await sanityClient.fetch(this.BAND_QUERY, { slug });
      return band || null;
    } catch (error) {
      console.error(`Error fetching band ${slug}:`, error);
      return null;
    }
  }

  async getMusiciansByBandId(bandId: string): Promise<Musician[]> {
    try {
      const musicians = await sanityClient.fetch(this.MUSICIANS_BY_BAND_QUERY, { bandId });
      return musicians || [];
    } catch (error) {
      console.error(`Error fetching musicians for band ${bandId}:`, error);
      return [];
    }
  }

  async getMusicianBySlug(slug: string): Promise<Musician | null> {
    try {
      const musician = await sanityClient.fetch(this.MUSICIAN_QUERY, { slug });
      return musician || null;
    } catch (error) {
      console.error(`Error fetching musician ${slug}:`, error);
      return null;
    }
  }
}

export const contentService = new SanityContentService();
