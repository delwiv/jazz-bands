/**
 * Structured Data (JSON-LD) Components
 * 
 * Generates schema.org markup for MusicGroup, MusicEvent, and MusicAlbum
 * to improve search engine understanding of band content.
 */

import { getBaseUrl } from "~/utils/seo";

/**
 * MusicGroup Schema for band homepage
 * https://schema.org/MusicGroup
 */
interface BandStructuredDataProps {
  band: {
    name: string;
    slug: { current: string };
    genre?: string[];
    formedYear?: number;
    logo?: { asset?: { url?: (params: any) => string } } | null;
    members?: Array<{
      _ref: string;
      name?: string;
      instrument?: string;
    }>;
    socialMedia?: Array<{
      platform: string;
      url: string;
    }>;
  };
  request?: Request;
}

export function BandStructuredData({ band, request }: BandStructuredDataProps) {
  const baseUrl = request ? getBaseUrl(request) : "https://jazzbands.com";
  const bandUrl = `${baseUrl}/${band.slug.current}`;
  
  const imageUrl = band.logo?.asset?.url?.({ width: 800, height: 800 });
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: band.name,
    url: bandUrl,
    sameAs: band.socialMedia?.map((s) => s.url).filter(Boolean) || [],
    genre: band.genre || ["Jazz"],
    ...(band.formedYear && {
      formed: `${band.formedYear}-01-01T00:00:00`,
    }),
    ...(imageUrl && {
      image: imageUrl,
    }),
    ...(band.members && band.members.length > 0 && {
      member: band.members
        .filter((m) => m.name)
        .map((m) => ({
          "@type": "Person",
          name: m.name,
          ...(m.instrument && { jobTitle: m.instrument }),
        })),
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface EventStructuredDataProps {
  event: {
    date: string;
    venue: string;
    city: string;
    region?: string;
    details?: string;
    ticketsUrl?: string;
    soldOut?: boolean;
  };
  band: {
    name: string;
    slug: { current: string };
  };
  request?: Request;
}

export function EventStructuredData({ event, band, request }: EventStructuredDataProps) {
  const baseUrl = request ? getBaseUrl(request) : "https://jazzbands.com";
  const bandUrl = `${baseUrl}/${band.slug.current}`;
  
  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "MusicEvent",
    name: `${band.name} at ${event.venue}`,
    startDate: event.date,
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city,
        ...(event.region && { addressRegion: event.region }),
        addressCountry: "FR",
      },
    },
    performer: {
      "@type": "MusicGroup",
      name: band.name,
      url: bandUrl,
    },
  };

  if (event.details) {
    structuredData.description = event.details;
  }

  if (event.ticketsUrl && !event.soldOut) {
    structuredData.offers = {
      "@type": "Offer",
      url: event.ticketsUrl,
      availability: "https://schema.org/InStock",
    };
  } else if (event.soldOut) {
    structuredData.offers = {
      "@type": "Offer",
      availability: "https://schema.org/SoldOut",
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * MusicAlbum Schema for recordings
 * https://schema.org/MusicAlbum
 */
interface AlbumStructuredDataProps {
  album: {
    title: string;
    releaseDate?: string;
    coverImage?: { asset?: { url?: (params: any) => string } } | null;
    tracks?: Array<{
      title: string;
      duration?: string;
      order: number;
    }>;
    streamingUrl?: string;
  };
  band: {
    name: string;
    slug: { current: string };
  };
  request?: Request;
}

export function AlbumStructuredData({ album, band, request }: AlbumStructuredDataProps) {
  const baseUrl = request ? getBaseUrl(request) : "https://jazzbands.com";
  const bandUrl = `${baseUrl}/${band.slug.current}`;
  
  const coverImageUrl = album.coverImage?.asset?.url?.({ width: 800, height: 800 });
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicAlbum",
    name: album.title,
    byArtist: {
      "@type": "MusicGroup",
      name: band.name,
      url: bandUrl,
    },
    ...(album.releaseDate && {
      albumRelease: {
        "@type": "MusicRelease",
        releaseDate: album.releaseDate,
      },
    }),
    ...(coverImageUrl && {
      image: coverImageUrl,
    }),
    ...(album.tracks && album.tracks.length > 0 && {
      numTracks: album.tracks.length,
      track: album.tracks.map((track) => ({
        "@type": "MusicRecording",
        name: track.title,
        position: track.order,
        ...(track.duration && { duration: track.duration }),
      })),
    }),
    ...(album.streamingUrl && {
      albumProductionType: "StudioAlbum",
    }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

/**
 * MusicRecording Schema for individual tracks
 * https://schema.org/MusicRecording
 */
interface TrackStructuredDataProps {
  track: {
    title: string;
    duration?: string;
    audioUrl?: string;
    order?: number;
  };
  album?: {
    title: string;
  };
  band: {
    name: string;
    slug: { current: string };
  };
  request?: Request;
}

export function TrackStructuredData({ track, album, band, request }: TrackStructuredDataProps) {
  const baseUrl = request ? getBaseUrl(request) : "https://jazzbands.com";
  const bandUrl = `${baseUrl}/${band.slug.current}`;
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    name: track.title,
    ...(track.duration && { duration: track.duration }),
    ...(track.audioUrl && {
      audio: track.audioUrl,
    }),
    ...(track.order && { position: track.order }),
    ...(album && {
      album: {
        "@type": "MusicAlbum",
        name: album.title,
      },
    }),
    byArtist: {
      "@type": "MusicGroup",
      name: band.name,
      url: bandUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

interface BreadcrumbStructuredDataProps {
  breadcrumbs: Array<{
    name: string;
    url: string;
  }>;
  request?: Request;
}

export function BreadcrumbStructuredData({ breadcrumbs, request }: BreadcrumbStructuredDataProps) {
  const baseUrl = request ? getBaseUrl(request) : "https://jazzbands.com";
  
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((breadcrumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: breadcrumb.name,
      item: `${baseUrl}/${breadcrumb.url}`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
