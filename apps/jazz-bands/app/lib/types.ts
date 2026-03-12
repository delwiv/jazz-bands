export interface Musician {
  _id: string;
  name: string;
  slug: { current: string };
  bio: Array<{ children: Array<{ text: string }> }>;
  instrument?: string;
  photo?: {
    _type: string;
    asset?: { _ref: string };
  };
  gallery?: Array<{
    _type: string;
    asset?: { _ref: string };
    caption?: string;
  }>;
}

export interface TourDate {
  date: string;
  city: string;
  venue: string;
  region?: string;
  details?: string;
  ticketsUrl?: string;
  soldOut?: boolean;
}

export interface Recording {
  _id: string;
  title: string;
  audio?: {
    _type: string;
    asset?: { _ref: string };
  };
  duration?: number;
  album?: string;
  releaseYear?: number;
  description?: string;
  downloadEnabled?: boolean;
}

export interface Band {
  _id: string;
  name: string;
  slug: { current: string };
  description: Array<{ children: Array<{ text: string }> }>;
  logo?: {
    _type: string;
    asset?: { _ref: string };
  };
  heroImage?: {
    _type: string;
    asset?: { _ref: string };
  };
  members: Array<{ _ref: string; _type: string }>;
  tourDates: TourDate[];
  recordings: Recording[];
  contact?: {
    email?: string;
    phone?: string;
  };
  socialMedia?: Array<{
    platform: string;
    url: string;
  }>;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
  };
}

export interface ContentService {
  getBandBySlug(slug: string): Promise<Band | null>;
  getMusiciansByBandId(bandId: string): Promise<Musician[]>;
  getMusicianBySlug(slug: string): Promise<Musician | null>;
}
