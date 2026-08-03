import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { PassThrough } from 'node:stream';
import { createReadableStreamFromReadable } from '@react-router/node';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { ServerRouter, Link, UNSAFE_withComponentProps, useLoaderData, Meta, Links, Outlet, ScrollRestoration, Scripts } from 'react-router';
import { clsx } from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@sanity/client';
import createImageUrlBuilder from '@sanity/image-url';
import { ExternalLink, Mail, Phone, CalendarDays, Ticket, X } from 'lucide-react';
import { PortableText as PortableText$1 } from '@portabletext/react';

function handleRequest(request, responseStatusCode, responseHeaders, routerContext) {
  const url = new URL(request.url);
  isbot(url.pathname);
  return new Promise((resolve, reject) => {
    const { pipe } = renderToPipeableStream(
      /* @__PURE__ */ jsx(ServerRouter, { context: routerContext, url: request.url }),
      {
        onShellReady() {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html; charset=utf-8");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        }
      }
    );
  });
}

const entryServer = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: 'Module' }));

function Footer({ personName }) {
  return /* @__PURE__ */ jsx("footer", { className: "bg-ink text-ivory/70", children: /* @__PURE__ */ jsxs("div", { className: "container-hub py-10", children: [
    /* @__PURE__ */ jsx("div", { className: "hairline mb-8" }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-between gap-6 md:flex-row", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("span", { className: "flex h-9 w-9 items-center justify-center rounded-full border border-brass/70 font-display text-xs font-bold tracking-wider text-brass", children: "FR" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("p", { className: "font-display text-lg text-ivory", children: personName }),
          /* @__PURE__ */ jsx("p", { className: "text-xs tracking-[0.2em] uppercase text-brass", children: "Batteur de jazz" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { "aria-label": "Navigation pied de page", children: /* @__PURE__ */ jsxs("ul", { className: "flex flex-wrap justify-center gap-4 text-sm", children: [
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/", className: "hover:text-brass transition-colors", children: "Accueil" }) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          Link,
          {
            to: "/galerie",
            className: "hover:text-brass transition-colors",
            children: "Galerie"
          }
        ) }),
        /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          Link,
          {
            to: "/#contact",
            className: "hover:text-brass transition-colors",
            children: "Contact"
          }
        ) })
      ] }) }),
      /* @__PURE__ */ jsxs("p", { className: "text-xs text-ivory/50", children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " ",
        personName,
        " — Tous droits réservés"
      ] })
    ] })
  ] }) });
}

const NAV_LINKS = [
  { href: "/#a-propos", label: "À propos" },
  { href: "/#groupes", label: "Les groupes" },
  { href: "/#actualites", label: "Actualités" },
  { href: "/galerie", label: "Galerie" },
  { href: "/#contact", label: "Contact" }
];
function Header({ personName }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return /* @__PURE__ */ jsx(
    "header",
    {
      className: clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "bg-ivory/90 backdrop-blur-md shadow-[0_1px_0_0_var(--color-stone-line)]" : "bg-transparent"
      ),
      children: /* @__PURE__ */ jsxs("div", { className: "container-hub flex h-16 items-center justify-between md:h-20", children: [
        /* @__PURE__ */ jsxs(
          Link,
          {
            to: "/",
            className: clsx(
              "flex items-center gap-3 font-display text-xl font-semibold tracking-wide transition-colors",
              scrolled ? "text-ink" : "text-ivory"
            ),
            "aria-label": `${personName} — Accueil`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "flex h-10 w-10 items-center justify-center rounded-full border border-brass/70 font-display text-sm font-bold tracking-wider text-brass", children: "FR" }),
              /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: personName })
            ]
          }
        ),
        /* @__PURE__ */ jsx("nav", { "aria-label": "Navigation principale", children: /* @__PURE__ */ jsx("ul", { className: "flex items-center gap-1 md:gap-2", children: NAV_LINKS.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          Link,
          {
            to: link.href,
            className: clsx(
              "rounded-full px-3 py-2 text-sm font-medium tracking-wide transition-colors md:px-4",
              scrolled ? "text-ink/80 hover:text-wine hover:bg-ink/5" : "text-ivory/85 hover:text-white hover:bg-white/10"
            ),
            children: link.label
          }
        ) }, link.href)) }) })
      ] })
    }
  );
}

const getPersonHub = `
  *[_type == "person" && _id == "person_frederic-robert"][0] {
    _id,
    name,
    "slug": slug.current,
    tagline,
    heroImage,
    "musician": musician-> {
      _id,
      name,
      bio,
      instrument,
      "photo": images[0] { asset, hotspot, crop },
      "gallery": images[] { asset, hotspot, crop, metadata }
    },
    "gallery": coalesce(gallery, [])[] {
      _key,
      "image": image { asset, hotspot, crop },
      caption
    },
    socialMedia,
    bookingEmail,
    phone,
    "news": coalesce(news, [])[] {
      _key,
      date,
      title,
      body
    },
    "bands": coalesce(bands, [])[] {
      _key,
      description,
      url,
      "band": band-> {
        _id,
        name,
        "slug": slug.current,
        "logo": logo { asset, hotspot, crop },
        "shortDescription": pt::text(description),
        "tourDates": coalesce(tourDates, [])[] {
          _key,
          date,
          city,
          venue,
          region,
          soldOut,
          ticketsUrl
        }
      }
    },
    seo {
      metaTitle,
      metaDescription
    },
    openGraph {
      title,
      description,
      "image": image { asset, hotspot, crop }
    }
  }
`;
const getPersonForSitemap = `
  *[_type == "person" && _id == "person_frederic-robert"][0] {
    name,
    "slug": slug.current
  }
`;

const __vite_import_meta_env__ = {"BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SSR": true};
function getEnv() {
  if (typeof process !== "undefined" && process.env) {
    return process.env;
  }
  if (typeof document !== "undefined") {
    const projectId2 = document.querySelector('meta[name="sanity-project-id"]')?.getAttribute("content") || "";
    const dataset2 = document.querySelector('meta[name="sanity-dataset"]')?.getAttribute("content") || "";
    if (projectId2) {
      return {
        SANITY_PROJECT_ID: projectId2,
        SANITY_DATASET: dataset2
      };
    }
  }
  if (typeof import.meta !== "undefined" && __vite_import_meta_env__) {
    return __vite_import_meta_env__;
  }
  return {};
}
const env = getEnv();
const projectId = env.VITE_SANITY_PROJECT_ID || env.SANITY_STUDIO_PROJECT_ID || env.SANITY_PROJECT_ID;
const dataset = env.VITE_SANITY_DATASET || env.SANITY_STUDIO_DATASET || env.SANITY_DATASET;
const apiReadToken = env.VITE_SANITY_API_READ_TOKEN || env.SANITY_STUDIO_API_READ_TOKEN || env.SANITY_API_READ_TOKEN;
if (!projectId) {
  throw new Error("Missing required environment variable: SANITY_PROJECT_ID");
}
if (!dataset) {
  throw new Error("Missing required environment variable: SANITY_DATASET");
}
const baseConfig = {
  projectId,
  dataset,
  apiVersion: "2025-01-10",
  useCdn: true,
  token: apiReadToken
};
const SANITY_PROXY = env.VITE_SANITY_PROXY_URL || env.SANITY_PROXY_URL || "";
const proxyConfig = SANITY_PROXY ? { useProjectHostname: false, apiHost: SANITY_PROXY } : {};
const sanityClient = typeof window === "undefined" ? createClient({
  ...baseConfig,
  ...proxyConfig,
  useCdn: false
}) : void 0;
const urlForImage = createImageUrlBuilder({
  projectId,
  dataset
});

function resolveBandUrl(bandSlug, override) {
  if (override?.trim()) return override.trim();
  const pattern = process.env.BAND_URL_PATTERN || "https://{slug}.jazz.wildredbeard.tech";
  return pattern.replace("{slug}", bandSlug);
}
async function loadHub(request) {
  const person = await sanityClient.fetch(getPersonHub);
  if (!person) {
    throw new Response("Person not found", { status: 404 });
  }
  const baseUrl = new URL(request.url).origin;
  return {
    person,
    baseUrl
  };
}

async function loader$4({
  request
}) {
  const {
    person,
    baseUrl
  } = await loadHub(request);
  return {
    person,
    baseUrl,
    umamiWebsiteId: process.env.UMAMI_WEBSITE_ID || "",
    sanityProjectId: process.env.SANITY_PROJECT_ID || "",
    sanityDataset: process.env.SANITY_DATASET || ""
  };
}
function meta$2({
  data
}) {
  const personName = data?.person?.name || "Frédéric Robert";
  return [{
    charset: "utf-8"
  }, {
    title: `${personName} — Batteur de Jazz`
  }, {
    name: "description",
    content: "Frédéric Robert, batteur de jazz et manager de groupes : Boheme, Canto, Jazzola, Swing Family, Trio RSH, West Side Trio."
  }, {
    tagName: "link",
    rel: "icon",
    type: "image/svg+xml",
    href: "/favicon.svg"
  }];
}
const root = UNSAFE_withComponentProps(function App() {
  const {
    person,
    umamiWebsiteId,
    sanityProjectId,
    sanityDataset
  } = useLoaderData();
  return /* @__PURE__ */jsxs("html", {
    lang: "fr",
    children: [/* @__PURE__ */jsxs("head", {
      children: [/* @__PURE__ */jsx(Meta, {}), /* @__PURE__ */jsx(Links, {}), /* @__PURE__ */jsx("meta", {
        name: "sanity-project-id",
        content: sanityProjectId
      }), /* @__PURE__ */jsx("meta", {
        name: "sanity-dataset",
        content: sanityDataset
      }), /* @__PURE__ */jsx("link", {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      }), /* @__PURE__ */jsx("link", {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: ""
      }), /* @__PURE__ */jsx("link", {
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@400;500;600&display=swap",
        rel: "stylesheet"
      }), umamiWebsiteId && /* @__PURE__ */jsx("script", {
        src: "https://analytics.jazz.wildredbeard.tech/script.js",
        "data-website-id": umamiWebsiteId,
        defer: true
      })]
    }), /* @__PURE__ */jsxs("body", {
      children: [/* @__PURE__ */jsx(Header, {
        personName: person.name
      }), /* @__PURE__ */jsx("main", {
        children: /* @__PURE__ */jsx(Outlet, {})
      }), /* @__PURE__ */jsx(Footer, {
        personName: person.name
      }), /* @__PURE__ */jsx(ScrollRestoration, {}), /* @__PURE__ */jsx(Scripts, {})]
    })]
  });
});

const route0 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: root,
  loader: loader$4,
  meta: meta$2
}, Symbol.toStringTag, { value: 'Module' }));

function PersonStructuredData({
  person,
  bandLinks,
  baseUrl
}) {
  const photo = person.heroImage?.asset || person.musician?.photo?.asset;
  const sameAs = person.socialMedia?.filter((s) => s.url).map((s) => s.url) || [];
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.name,
    jobTitle: "Batteur de jazz",
    image: photo ? urlForImage.image(photo).width(1200).url() : void 0,
    url: baseUrl,
    sameAs,
    knowsAbout: (person.bands ?? []).map((entry) => entry.band?.name).filter(Boolean)
  };
  const bandsJsonLd = (person.bands ?? []).map((entry) => ({
    "@context": "https://schema.org",
    "@type": "MusicGroup",
    name: entry.band?.name,
    url: entry.band?.slug ? bandLinks.find((b) => b.name === entry.band?.name)?.url : void 0
  })).filter((b) => b.url);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(personJsonLd) }
      }
    ),
    bandsJsonLd.map((band) => /* @__PURE__ */ jsx(
      "script",
      {
        type: "application/ld+json",
        dangerouslySetInnerHTML: { __html: JSON.stringify(band) }
      },
      band.name
    ))
  ] });
}

function Reveal({ children, className, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: clsx("reveal", visible && "is-visible", className),
      style: delay ? { transitionDelay: `${delay}ms` } : void 0,
      children
    }
  );
}

function Bands({ bandCards }) {
  if (bandCards.length === 0) return null;
  return /* @__PURE__ */ jsx(
    "section",
    {
      id: "groupes",
      className: "scroll-mt-24 bg-ink py-20 text-ivory md:py-28",
      "aria-labelledby": "groupes-title",
      children: /* @__PURE__ */ jsxs("div", { className: "container-hub", children: [
        /* @__PURE__ */ jsxs(Reveal, { children: [
          /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Les groupes" }),
          /* @__PURE__ */ jsx(
            "h2",
            {
              id: "groupes-title",
              className: "mt-3 font-display text-4xl font-semibold md:text-6xl",
              children: "Six formations, une signature"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-5 max-w-2xl text-ivory/70", children: "Au fil des années, Frédéric a monté et rejoint plusieurs formations. Chacune a son univers — découvrez-les." }),
          /* @__PURE__ */ jsx("div", { className: "hairline mt-8 max-w-2xl" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: bandCards.map((band, i) => /* @__PURE__ */ jsx(Reveal, { delay: i * 60, children: /* @__PURE__ */ jsxs(
          "a",
          {
            href: band.url,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "group flex h-full flex-col border border-ivory/15 bg-ivory/[0.03] p-8 transition-all duration-300 hover:border-brass/60 hover:bg-ivory/[0.06]",
            children: [
              /* @__PURE__ */ jsx("div", { className: "mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-ivory/20 bg-ivory/5", children: band.logo ? /* @__PURE__ */ jsx(
                "img",
                {
                  src: band.logo,
                  alt: `Logo ${band.name}`,
                  loading: "lazy",
                  className: "h-14 w-14 rounded-full object-cover"
                }
              ) : /* @__PURE__ */ jsx("span", { className: "font-display text-2xl font-semibold text-brass", children: band.name.charAt(0) }) }),
              /* @__PURE__ */ jsx("h3", { className: "font-display text-3xl font-semibold", children: band.name }),
              /* @__PURE__ */ jsx("p", { className: "mt-3 flex-1 text-sm leading-relaxed text-ivory/65", children: band.description || "Jazz" }),
              /* @__PURE__ */ jsxs("span", { className: "mt-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-brass", children: [
                "Découvrir",
                /* @__PURE__ */ jsx(ExternalLink, { className: "h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" })
              ] })
            ]
          }
        ) }, band.slug)) })
      ] })
    }
  );
}

function getImageUrl(image, width = 800) {
  if (!image?.asset) return "";
  return urlForImage.image(image.asset).width(width).auto("format").url();
}

const components = {
  block: {
    normal: ({ children }) => /* @__PURE__ */ jsx("p", { className: "mb-5 text-ink/85 leading-relaxed md:text-lg", children }),
    h2: ({ children }) => /* @__PURE__ */ jsx("h2", { className: "mt-8 mb-4 font-display text-2xl font-semibold text-ink", children }),
    h3: ({ children }) => /* @__PURE__ */ jsx("h3", { className: "mt-6 mb-3 font-display text-xl font-semibold text-ink", children }),
    blockquote: ({ children }) => /* @__PURE__ */ jsx("blockquote", { className: "my-6 border-l-2 border-brass pl-4 italic text-ink/80", children })
  },
  marks: {
    strong: ({ children }) => /* @__PURE__ */ jsx("strong", { className: "font-semibold text-ink", children }),
    em: ({ children }) => /* @__PURE__ */ jsx("em", { className: "italic text-ink/90", children }),
    link: ({
      children,
      value
    }) => /* @__PURE__ */ jsx(
      "a",
      {
        href: value?.href,
        target: value?.href?.startsWith("http") ? "_blank" : void 0,
        rel: value?.href?.startsWith("http") ? "noopener noreferrer" : void 0,
        className: "text-wine underline decoration-brass/60 underline-offset-4 hover:decoration-wine",
        children
      }
    )
  },
  list: {
    bullet: ({ children }) => /* @__PURE__ */ jsx("ul", { className: "mb-5 list-disc pl-6 text-ink/85 md:text-lg", children }),
    number: ({ children }) => /* @__PURE__ */ jsx("ol", { className: "mb-5 list-decimal pl-6 text-ink/85 md:text-lg", children })
  },
  listItem: {
    bullet: ({ children }) => /* @__PURE__ */ jsx("li", { className: "mb-1.5", children }),
    number: ({ children }) => /* @__PURE__ */ jsx("li", { className: "mb-1.5", children })
  }
};
function PortableText({ value }) {
  if (!value || value.length === 0) return null;
  return /* @__PURE__ */ jsx(PortableText$1, { value, components });
}

function Bio({ person }) {
  const musician = person.musician;
  const photo = musician?.photo;
  const photoUrl = getImageUrl(photo, 700);
  return /* @__PURE__ */ jsx(
    "section",
    {
      id: "a-propos",
      className: "scroll-mt-24 py-20 md:py-28",
      "aria-labelledby": "a-propos-title",
      children: /* @__PURE__ */ jsxs("div", { className: "container-hub", children: [
        /* @__PURE__ */ jsxs(Reveal, { children: [
          /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "À propos" }),
          /* @__PURE__ */ jsx(
            "h2",
            {
              id: "a-propos-title",
              className: "mt-3 font-display text-4xl font-semibold text-ink md:text-6xl",
              children: "Une vie à la batterie"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "hairline mt-8 max-w-2xl" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-14 grid gap-12 lg:grid-cols-[380px_1fr] lg:gap-16", children: [
          /* @__PURE__ */ jsx(Reveal, { className: "lg:sticky lg:top-28 lg:self-start", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            photoUrl ? /* @__PURE__ */ jsx(
              "img",
              {
                src: photoUrl,
                alt: `${musician?.name || person.name}, batteur de jazz`,
                loading: "lazy",
                className: "aspect-[4/5] w-full rounded-sm object-cover shadow-xl"
              }
            ) : /* @__PURE__ */ jsx("div", { className: "aspect-[4/5] w-full rounded-sm bg-ivory-deep" }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 rounded-sm ring-1 ring-brass/40 ring-offset-4 ring-offset-ivory" }),
            /* @__PURE__ */ jsxs("div", { className: "absolute -bottom-6 -right-4 bg-ink px-6 py-4 text-ivory shadow-lg", children: [
              /* @__PURE__ */ jsx("p", { className: "font-display text-2xl font-semibold", children: musician?.name || person.name }),
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.25em] text-brass", children: musician?.instrument || "Batterie" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx(Reveal, { delay: 100, children: /* @__PURE__ */ jsx("div", { className: "columns-1 gap-12 md:columns-2 [&>div>*:first-child]:mt-0", children: /* @__PURE__ */ jsx(PortableText, { value: musician?.bio }) }) })
        ] })
      ] })
    }
  );
}

const PLATFORM_MONOGRAMS = {
  facebook: "FB",
  instagram: "IG",
  youtube: "YT",
  spotify: "SP",
  tiktok: "TT",
  twitter: "X",
  bandcamp: "BC",
  soundcloud: "SC"
};
function Contact({ person }) {
  const socials = person.socialMedia?.filter((s) => s.url) || [];
  const hasContact = Boolean(
    person.bookingEmail || person.phone || socials.length > 0
  );
  if (!hasContact) return null;
  return /* @__PURE__ */ jsx(
    "section",
    {
      id: "contact",
      className: "scroll-mt-24 bg-ink py-20 text-ivory md:py-28",
      "aria-labelledby": "contact-title",
      children: /* @__PURE__ */ jsx("div", { className: "container-hub", children: /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl text-center", children: [
        /* @__PURE__ */ jsxs(Reveal, { children: [
          /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Contact & réservation" }),
          /* @__PURE__ */ jsx(
            "h2",
            {
              id: "contact-title",
              className: "mt-3 font-display text-4xl font-semibold md:text-6xl",
              children: "Un concert, un projet, une rencontre"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "mt-6 text-ivory/70", children: "Pour toute réservation, booking ou demande d'information, écrivez directement — réponse rapide garantie." })
        ] }),
        /* @__PURE__ */ jsx(Reveal, { delay: 100, children: /* @__PURE__ */ jsxs("div", { className: "mt-12 flex flex-wrap items-center justify-center gap-4", children: [
          person.bookingEmail && /* @__PURE__ */ jsxs(
            "a",
            {
              href: `mailto:${person.bookingEmail}`,
              className: "inline-flex items-center gap-3 rounded-full bg-brass px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-brass-light",
              children: [
                /* @__PURE__ */ jsx(Mail, { className: "h-4 w-4" }),
                person.bookingEmail
              ]
            }
          ),
          person.phone && /* @__PURE__ */ jsxs(
            "a",
            {
              href: `tel:${person.phone.replace(/\s/g, "")}`,
              className: "inline-flex items-center gap-3 rounded-full border border-ivory/40 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:border-brass hover:text-brass",
              children: [
                /* @__PURE__ */ jsx(Phone, { className: "h-4 w-4" }),
                person.phone
              ]
            }
          )
        ] }) }),
        socials.length > 0 && /* @__PURE__ */ jsx(Reveal, { delay: 200, children: /* @__PURE__ */ jsx("div", { className: "mt-12 flex items-center justify-center gap-6", children: socials.map((social) => /* @__PURE__ */ jsx(
          "a",
          {
            href: social.url,
            target: "_blank",
            rel: "noopener noreferrer",
            "aria-label": social.platform,
            className: "flex h-12 w-12 items-center justify-center rounded-full border border-ivory/25 font-display text-sm font-semibold tracking-wider text-ivory/80 transition-all hover:border-brass hover:text-brass",
            children: PLATFORM_MONOGRAMS[social.platform] || "FR"
          },
          social.platform
        )) }) })
      ] }) })
    }
  );
}

function buildGallery(person) {
  const items = [];
  (person.gallery ?? []).forEach((img, i) => {
    const src = getImageUrl(img.image, 900);
    if (src) {
      items.push({
        id: `person-${i}`,
        src,
        alt: img.caption || `${person.name} — photo`,
        caption: img.caption
      });
    }
  });
  (person.musician?.gallery ?? []).forEach((img, i) => {
    const src = getImageUrl(img, 900);
    if (src) {
      items.push({
        id: `musician-${i}`,
        src,
        alt: `${person.name} — photo`,
        caption: img.metadata?.caption
      });
    }
  });
  return items;
}

function Gallery({ person }) {
  const items = buildGallery(person);
  if (items.length === 0) return null;
  return /* @__PURE__ */ jsx(
    "section",
    {
      id: "galerie",
      className: "scroll-mt-24 bg-ivory-deep py-20 md:py-28",
      "aria-labelledby": "galerie-title",
      children: /* @__PURE__ */ jsxs("div", { className: "container-hub", children: [
        /* @__PURE__ */ jsxs(Reveal, { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-end justify-between gap-6", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Galerie" }),
              /* @__PURE__ */ jsx(
                "h2",
                {
                  id: "galerie-title",
                  className: "mt-3 font-display text-4xl font-semibold text-ink md:text-6xl",
                  children: "Instants de musique"
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              Link,
              {
                to: "/galerie",
                className: "inline-flex items-center gap-2 rounded-full border border-ink/30 px-6 py-2.5 text-sm font-semibold uppercase tracking-[0.2em] text-ink transition-colors hover:border-brass hover:text-brass",
                children: "Toute la galerie"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "hairline mt-8 max-w-2xl" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6", children: items.slice(0, 4).map((item, i) => /* @__PURE__ */ jsx(
          Reveal,
          {
            delay: i * 60,
            className: i % 5 === 0 ? "col-span-2 row-span-2" : "",
            children: /* @__PURE__ */ jsx(Link, { to: "/galerie", className: "group block h-full", children: /* @__PURE__ */ jsx(
              "img",
              {
                src: item.src,
                alt: item.alt,
                loading: "lazy",
                className: "h-full w-full rounded-sm object-cover shadow-sm transition-transform duration-500 group-hover:scale-[1.02]"
              }
            ) })
          },
          item.id
        )) })
      ] })
    }
  );
}

function Hero({ person }) {
  const heroImage = person.heroImage?.asset || person.musician?.photo?.asset;
  const heroUrl = getImageUrl({ asset: heroImage }, 1920);
  return /* @__PURE__ */ jsxs("section", { className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-ink text-ivory", children: [
    heroUrl && /* @__PURE__ */ jsx(
      "img",
      {
        src: heroUrl,
        alt: "",
        "aria-hidden": true,
        className: "absolute inset-0 h-full w-full object-cover object-top opacity-40"
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/50 to-ink" }),
    /* @__PURE__ */ jsxs("div", { className: "container-hub relative z-10 pb-20 pt-32 text-center", children: [
      /* @__PURE__ */ jsx(Reveal, { children: /* @__PURE__ */ jsx("p", { className: "eyebrow mb-6", children: "Batteur de jazz — Nantes" }) }),
      /* @__PURE__ */ jsx(Reveal, { delay: 100, children: /* @__PURE__ */ jsx("h1", { className: "font-display text-6xl font-semibold leading-none tracking-tight sm:text-8xl md:text-9xl", children: person.name }) }),
      person.tagline && /* @__PURE__ */ jsx(Reveal, { delay: 200, children: /* @__PURE__ */ jsx("p", { className: "mx-auto mt-8 max-w-2xl font-display text-xl italic text-ivory/85 md:text-2xl", children: person.tagline }) }),
      /* @__PURE__ */ jsx(Reveal, { delay: 300, children: /* @__PURE__ */ jsxs("div", { className: "mt-12 flex flex-wrap items-center justify-center gap-4", children: [
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "#groupes",
            className: "rounded-full bg-brass px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:bg-brass-light",
            children: "Découvrir les groupes"
          }
        ),
        /* @__PURE__ */ jsx(
          "a",
          {
            href: "#contact",
            className: "rounded-full border border-ivory/40 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-ivory transition-colors hover:border-brass hover:text-brass",
            children: "Contact"
          }
        )
      ] }) })
    ] })
  ] });
}

function formatDateShortFr(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}
function News({
  person,
  bandCards
}) {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const bandUrlBySlug = new Map(bandCards.map((b) => [b.slug, b.url]));
  const upcomingDates = (person.bands ?? []).flatMap(
    (entry) => (entry.band?.tourDates ?? []).map((d) => ({
      ...d,
      bandName: entry.band?.name,
      bandUrl: entry.band?.slug ? bandUrlBySlug.get(entry.band.slug) : void 0
    }))
  ).filter((d) => new Date(d.date) >= today).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 8);
  const news = person.news?.slice().sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  ) || [];
  if (upcomingDates.length === 0 && news.length === 0) return null;
  return /* @__PURE__ */ jsx(
    "section",
    {
      id: "actualites",
      className: "scroll-mt-24 py-20 md:py-28",
      "aria-labelledby": "actualites-title",
      children: /* @__PURE__ */ jsxs("div", { className: "container-hub", children: [
        /* @__PURE__ */ jsxs(Reveal, { children: [
          /* @__PURE__ */ jsx("p", { className: "eyebrow", children: "Actualités" }),
          /* @__PURE__ */ jsx(
            "h2",
            {
              id: "actualites-title",
              className: "mt-3 font-display text-4xl font-semibold text-ink md:text-6xl",
              children: "Sur scène & ailleurs"
            }
          ),
          /* @__PURE__ */ jsx("div", { className: "hairline mt-8 max-w-2xl" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-14 grid gap-14 lg:grid-cols-2 lg:gap-20", children: [
          upcomingDates.length > 0 && /* @__PURE__ */ jsxs(Reveal, { children: [
            /* @__PURE__ */ jsxs("h3", { className: "flex items-center gap-3 font-display text-2xl font-semibold text-ink", children: [
              /* @__PURE__ */ jsx(CalendarDays, { className: "h-5 w-5 text-brass" }),
              "Dates à venir"
            ] }),
            /* @__PURE__ */ jsx("ul", { className: "mt-8 space-y-6", children: upcomingDates.map((d) => /* @__PURE__ */ jsxs(
              "li",
              {
                className: "group flex items-baseline gap-5 border-b border-stone-line pb-5",
                children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex min-w-[64px] flex-col items-center rounded-sm border border-brass/50 bg-ivory-deep px-3 py-2 text-ink", children: [
                    /* @__PURE__ */ jsx("span", { className: "font-display text-2xl font-bold leading-none", children: new Date(d.date).toLocaleDateString("fr-FR", {
                      day: "numeric"
                    }) }),
                    /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-widest", children: new Date(d.date).toLocaleDateString("fr-FR", {
                      month: "short"
                    }) })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsxs("p", { className: "font-semibold text-ink", children: [
                      d.venue,
                      d.soldOut && /* @__PURE__ */ jsx("span", { className: "ml-2 rounded-full bg-wine px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-ivory", children: "Complet" })
                    ] }),
                    /* @__PURE__ */ jsxs("p", { className: "text-sm text-ink/60", children: [
                      d.city,
                      d.region ? `, ${d.region}` : ""
                    ] }),
                    /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-brass", children: d.bandName })
                  ] }),
                  d.ticketsUrl && /* @__PURE__ */ jsxs(
                    "a",
                    {
                      href: d.ticketsUrl,
                      target: "_blank",
                      rel: "noopener noreferrer",
                      className: "hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-wine hover:text-brass sm:inline-flex",
                      "aria-label": `Billets pour ${d.venue}`,
                      children: [
                        /* @__PURE__ */ jsx(Ticket, { className: "h-4 w-4" }),
                        "Billets"
                      ]
                    }
                  )
                ]
              },
              `${d.bandName}-${d._key}`
            )) }),
            /* @__PURE__ */ jsxs("p", { className: "mt-6 text-xs italic text-ink/50", children: [
              "Dates des ",
              person.bands?.length || "",
              " groupes du collectif."
            ] })
          ] }),
          news.length > 0 && /* @__PURE__ */ jsxs(Reveal, { delay: 100, children: [
            /* @__PURE__ */ jsx("h3", { className: "font-display text-2xl font-semibold text-ink", children: "Annonces" }),
            /* @__PURE__ */ jsx("ul", { className: "mt-8 space-y-8", children: news.map((item) => /* @__PURE__ */ jsxs("li", { className: "border-l-2 border-brass pl-5", children: [
              /* @__PURE__ */ jsx("p", { className: "text-xs uppercase tracking-[0.2em] text-brass", children: formatDateShortFr(item.date) }),
              /* @__PURE__ */ jsx("h4", { className: "mt-1 font-display text-2xl font-semibold text-ink", children: item.title }),
              item.body && /* @__PURE__ */ jsx("div", { className: "mt-2 text-sm text-ink/75 [&_p]:mb-2", children: /* @__PURE__ */ jsx(PortableText, { value: item.body }) })
            ] }, item._key)) })
          ] })
        ] })
      ] })
    }
  );
}

const DEFAULT_TITLE = "Frédéric Robert — Batteur de Jazz";
const DEFAULT_DESCRIPTION = "Frédéric Robert, batteur de jazz et manager de groupes : Boheme, Canto, Jazzola, Swing Family, Trio RSH, West Side Trio.";
function buildHubMeta(person, page) {
  const seo = person.seo;
  const og = person.openGraph;
  const title = page === "home" ? seo?.metaTitle?.trim() || DEFAULT_TITLE : `Galerie — ${person.name || "Frédéric Robert"}`;
  const description = page === "home" ? seo?.metaDescription?.trim() || DEFAULT_DESCRIPTION : `Galerie photos de ${person.name || "Frédéric Robert"}, batteur de jazz.`;
  const ogImageSource = og?.image?.asset || person.heroImage?.asset || person.musician?.photo?.asset;
  const ogImage = ogImageSource ? urlForImage.image(ogImageSource).width(1200).format("jpg").url() : void 0;
  return { title, description, ogImage };
}

async function loader$3({
  request
}) {
  const data = await loadHub(request);
  const bandCards = [];
  for (const entry of data.person.bands ?? []) {
    const band = entry.band;
    if (!band?.slug) continue;
    const logo = getImageUrl(band.logo, 200);
    bandCards.push({
      name: band.name,
      slug: band.slug,
      url: resolveBandUrl(band.slug, entry.url),
      logo: logo || void 0,
      description: entry.description || band.shortDescription || void 0
    });
  }
  return {
    ...data,
    bandCards
  };
}
function meta$1({
  loaderData
}) {
  if (!loaderData?.person) return [];
  const {
    title,
    description,
    ogImage
  } = buildHubMeta(loaderData.person, "home");
  return [{
    title
  }, {
    name: "description",
    content: description
  }, {
    property: "og:type",
    content: "website"
  }, {
    property: "og:title",
    content: title
  }, {
    property: "og:description",
    content: description
  }, {
    property: "og:url",
    content: `${loaderData.baseUrl}/`
  }, ...(ogImage ? [{
    property: "og:image",
    content: ogImage
  }] : []), {
    name: "twitter:card",
    content: ogImage ? "summary_large_image" : "summary"
  }, {
    name: "twitter:title",
    content: title
  }, {
    name: "twitter:description",
    content: description
  }];
}
const index = UNSAFE_withComponentProps(function Index() {
  const {
    person,
    baseUrl,
    bandCards
  } = useLoaderData();
  const bandLinks = bandCards.map(b => ({
    name: b.name,
    url: b.url
  }));
  return /* @__PURE__ */jsxs(Fragment, {
    children: [/* @__PURE__ */jsx(PersonStructuredData, {
      person,
      bandLinks,
      baseUrl
    }), /* @__PURE__ */jsx(Hero, {
      person
    }), /* @__PURE__ */jsx(Bio, {
      person
    }), /* @__PURE__ */jsx(Bands, {
      bandCards
    }), /* @__PURE__ */jsx(News, {
      person,
      bandCards
    }), /* @__PURE__ */jsx(Gallery, {
      person
    }), /* @__PURE__ */jsx(Contact, {
      person
    })]
  });
});

const route1 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: index,
  loader: loader$3,
  meta: meta$1
}, Symbol.toStringTag, { value: 'Module' }));

async function loader$2({
  request
}) {
  return loadHub(request);
}
function meta({
  loaderData
}) {
  if (!loaderData?.person) return [];
  const name = loaderData.person.name || "Frédéric Robert";
  return [{
    title: `Galerie — ${name}`
  }, {
    name: "description",
    content: `Galerie photos de ${name}, batteur de jazz à Nantes.`
  }];
}
const galerie = UNSAFE_withComponentProps(function Galerie() {
  const {
    person
  } = useLoaderData();
  const items = buildGallery(person);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    if (selected === null) return;
    const onKey = e => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "ArrowRight") setSelected(s => s === null ? s : (s + 1) % items.length);
      if (e.key === "ArrowLeft") setSelected(s => s === null ? s : (s - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [selected, items.length]);
  return /* @__PURE__ */jsxs("div", {
    className: "bg-ivory pb-24",
    children: [/* @__PURE__ */jsx("header", {
      className: "bg-ink pb-16 pt-32 text-ivory md:pb-20 md:pt-40",
      children: /* @__PURE__ */jsxs("div", {
        className: "container-hub",
        children: [/* @__PURE__ */jsx("p", {
          className: "eyebrow",
          children: "Galerie"
        }), /* @__PURE__ */jsx("h1", {
          className: "mt-3 font-display text-5xl font-semibold md:text-7xl",
          children: "Instants de musique"
        }), /* @__PURE__ */jsx("p", {
          className: "mt-4 max-w-xl text-ivory/70",
          children: "Concerts, studios et coulisses — un regard sur le parcours d'un batteur."
        })]
      })
    }), items.length === 0 ? /* @__PURE__ */jsx("p", {
      className: "container-hub mt-16 text-ink/60",
      children: "La galerie sera bientôt disponible."
    }) : /* @__PURE__ */jsx("div", {
      className: "container-hub columns-2 gap-4 pt-12 md:columns-3 md:gap-6",
      children: items.map((item, i) => /* @__PURE__ */jsx(Reveal, {
        className: "mb-4 break-inside-avoid md:mb-6",
        children: /* @__PURE__ */jsxs("button", {
          type: "button",
          onClick: () => setSelected(i),
          className: "group relative block w-full cursor-zoom-in overflow-hidden rounded-sm shadow-sm",
          "aria-label": `Agrandir la photo ${i + 1} : ${item.caption || item.alt}`,
          children: [/* @__PURE__ */jsx("img", {
            src: item.src,
            alt: item.alt,
            loading: "lazy",
            className: "w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          }), item.caption && /* @__PURE__ */jsx("span", {
            className: "absolute inset-x-0 bottom-0 bg-ink/70 px-4 py-2 text-left text-xs text-ivory opacity-0 transition-opacity group-hover:opacity-100",
            children: item.caption
          })]
        })
      }, item.id))
    }), selected !== null && items[selected] && /* @__PURE__ */jsxs("div", {
      className: "fixed inset-0 z-[60] flex items-center justify-center bg-ink/95 p-4 backdrop-blur-sm",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Photo agrandie",
      onClick: () => setSelected(null),
      children: [/* @__PURE__ */jsx("button", {
        type: "button",
        onClick: () => setSelected(null),
        className: "absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-ivory/30 text-ivory hover:border-brass hover:text-brass",
        "aria-label": "Fermer",
        children: /* @__PURE__ */jsx(X, {
          className: "h-5 w-5"
        })
      }), /* @__PURE__ */jsxs("figure", {
        className: "max-h-full max-w-4xl",
        onClick: e => e.stopPropagation(),
        children: [/* @__PURE__ */jsx("img", {
          src: items[selected].src,
          alt: items[selected].alt,
          className: "max-h-[80vh] w-auto rounded-sm object-contain shadow-2xl"
        }), items[selected].caption && /* @__PURE__ */jsx("figcaption", {
          className: "mt-4 text-center font-display text-lg italic text-ivory/80",
          children: items[selected].caption
        })]
      })]
    })]
  });
});

const route2 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: galerie,
  loader: loader$2,
  meta
}, Symbol.toStringTag, { value: 'Module' }));

async function loader$1({
  request
}) {
  const baseUrl = new URL(request.url).origin;
  const robots = `User-agent: *
Allow: /
Disallow: /__health

Sitemap: ${baseUrl}/sitemap.xml
`;
  return new Response(robots, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

const route3 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  loader: loader$1
}, Symbol.toStringTag, { value: 'Module' }));

async function loader({
  request
}) {
  const baseUrl = new URL(request.url).origin;
  const person = await sanityClient.fetch(getPersonForSitemap);
  const urls = [{
    loc: `${baseUrl}/`,
    priority: "1.0"
  }, {
    loc: `${baseUrl}/galerie`,
    priority: "0.7"
  }];
  if (person?.slug) {
    urls.push({
      loc: `${baseUrl}/${person.slug}`,
      priority: "0.5"
    });
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>monthly</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join("\n")}
</urlset>`;
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

const route4 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  loader
}, Symbol.toStringTag, { value: 'Module' }));

const __catchall = UNSAFE_withComponentProps(function Catchall() {
  return /* @__PURE__ */jsx("div", {
    className: "flex min-h-screen items-center justify-center bg-ink px-6 text-ivory",
    children: /* @__PURE__ */jsxs("div", {
      className: "text-center",
      children: [/* @__PURE__ */jsx("p", {
        className: "font-display text-8xl font-semibold text-brass",
        children: "404"
      }), /* @__PURE__ */jsx("h1", {
        className: "mt-4 font-display text-3xl font-semibold",
        children: "Page introuvable"
      }), /* @__PURE__ */jsx("p", {
        className: "mt-3 text-ivory/60",
        children: "La page que vous cherchez n'existe pas ou a été déplacée."
      }), /* @__PURE__ */jsx(Link, {
        to: "/",
        className: "mt-8 inline-block rounded-full border border-ivory/40 px-8 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition-colors hover:border-brass hover:text-brass",
        children: "Retour à l'accueil"
      })]
    })
  });
});

const route5 = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: __catchall
}, Symbol.toStringTag, { value: 'Module' }));

const serverManifest = {'entry':{'module':'/assets/entry.client-e9-ytmKP.js','imports':['/assets/chunk-62JRHF6Z-D3ZMGkTz.js'],'css':[]},'routes':{'root':{'id':'root','parentId':undefined,'path':'','index':undefined,'caseSensitive':undefined,'hasAction':false,'hasLoader':true,'hasClientAction':false,'hasClientLoader':false,'hasClientMiddleware':false,'hasDefaultExport':true,'hasErrorBoundary':false,'module':'/assets/root-DelD4n0w.js','imports':['/assets/chunk-62JRHF6Z-D3ZMGkTz.js','/assets/clsx-B-dksMZM.js'],'css':['/assets/root-hkNEbeKc.css'],'clientActionModule':undefined,'clientLoaderModule':undefined,'clientMiddlewareModule':undefined,'hydrateFallbackModule':undefined},'routes/index':{'id':'routes/index','parentId':'root','path':'/','index':undefined,'caseSensitive':undefined,'hasAction':false,'hasLoader':true,'hasClientAction':false,'hasClientLoader':false,'hasClientMiddleware':false,'hasDefaultExport':true,'hasErrorBoundary':false,'module':'/assets/index-DehPllZS.js','imports':['/assets/chunk-62JRHF6Z-D3ZMGkTz.js','/assets/gallery-Dx8sUl6S.js','/assets/clsx-B-dksMZM.js'],'css':[],'clientActionModule':undefined,'clientLoaderModule':undefined,'clientMiddlewareModule':undefined,'hydrateFallbackModule':undefined},'routes/galerie':{'id':'routes/galerie','parentId':'root','path':'/galerie','index':undefined,'caseSensitive':undefined,'hasAction':false,'hasLoader':true,'hasClientAction':false,'hasClientLoader':false,'hasClientMiddleware':false,'hasDefaultExport':true,'hasErrorBoundary':false,'module':'/assets/galerie-DKtQqbXV.js','imports':['/assets/chunk-62JRHF6Z-D3ZMGkTz.js','/assets/gallery-Dx8sUl6S.js','/assets/clsx-B-dksMZM.js'],'css':[],'clientActionModule':undefined,'clientLoaderModule':undefined,'clientMiddlewareModule':undefined,'hydrateFallbackModule':undefined},'routes/robots.txt':{'id':'routes/robots.txt','parentId':'root','path':'/robots.txt','index':undefined,'caseSensitive':undefined,'hasAction':false,'hasLoader':true,'hasClientAction':false,'hasClientLoader':false,'hasClientMiddleware':false,'hasDefaultExport':false,'hasErrorBoundary':false,'module':'/assets/robots.txt-l0sNRNKZ.js','imports':[],'css':[],'clientActionModule':undefined,'clientLoaderModule':undefined,'clientMiddlewareModule':undefined,'hydrateFallbackModule':undefined},'routes/sitemap.xml':{'id':'routes/sitemap.xml','parentId':'root','path':'/sitemap.xml','index':undefined,'caseSensitive':undefined,'hasAction':false,'hasLoader':true,'hasClientAction':false,'hasClientLoader':false,'hasClientMiddleware':false,'hasDefaultExport':false,'hasErrorBoundary':false,'module':'/assets/sitemap.xml-l0sNRNKZ.js','imports':[],'css':[],'clientActionModule':undefined,'clientLoaderModule':undefined,'clientMiddlewareModule':undefined,'hydrateFallbackModule':undefined},'routes/__catchall':{'id':'routes/__catchall','parentId':'root','path':'*','index':undefined,'caseSensitive':undefined,'hasAction':false,'hasLoader':false,'hasClientAction':false,'hasClientLoader':false,'hasClientMiddleware':false,'hasDefaultExport':true,'hasErrorBoundary':false,'module':'/assets/__catchall-BK2NE_ko.js','imports':['/assets/chunk-62JRHF6Z-D3ZMGkTz.js'],'css':[],'clientActionModule':undefined,'clientLoaderModule':undefined,'clientMiddlewareModule':undefined,'hydrateFallbackModule':undefined}},'url':'/assets/manifest-c0fca32d.js','version':'c0fca32d','sri':undefined};

const assetsBuildDirectory = "build/client";
      const basename = "/";
      const future = {"unstable_optimizeDeps":false,"v8_passThroughRequests":false,"v8_trailingSlashAwareDataRequests":false,"unstable_previewServerPrerendering":false,"v8_middleware":false,"v8_splitRouteModules":false,"v8_viteEnvironmentApi":false};
      const ssr = true;
      const isSpaMode = false;
      const prerender = [];
      const routeDiscovery = {"mode":"lazy","manifestPath":"/__manifest"};
      const publicPath = "/";
      const entry = { module: entryServer };
      const routes = {
        "root": {
          id: "root",
          parentId: undefined,
          path: "",
          index: undefined,
          caseSensitive: undefined,
          module: route0
        },
  "routes/index": {
          id: "routes/index",
          parentId: "root",
          path: "/",
          index: undefined,
          caseSensitive: undefined,
          module: route1
        },
  "routes/galerie": {
          id: "routes/galerie",
          parentId: "root",
          path: "/galerie",
          index: undefined,
          caseSensitive: undefined,
          module: route2
        },
  "routes/robots.txt": {
          id: "routes/robots.txt",
          parentId: "root",
          path: "/robots.txt",
          index: undefined,
          caseSensitive: undefined,
          module: route3
        },
  "routes/sitemap.xml": {
          id: "routes/sitemap.xml",
          parentId: "root",
          path: "/sitemap.xml",
          index: undefined,
          caseSensitive: undefined,
          module: route4
        },
  "routes/__catchall": {
          id: "routes/__catchall",
          parentId: "root",
          path: "*",
          index: undefined,
          caseSensitive: undefined,
          module: route5
        }
      };
      
      const allowedActionOrigins = false;

export { allowedActionOrigins, serverManifest as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
