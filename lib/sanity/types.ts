export type CmsSeo = { title?: string; description?: string };

export type CmsSlide = {
  label: string;
  titleLead: string;
  titleAccent: string;
  text: string;
  cta: string;
  href: string;
  image: string;
  alt: string;
  focus: string;
};

export type CmsHome = {
  seo?: CmsSeo;
  sections?: CmsSection[];
};

export type CmsSection =
  | { _type: "heroSection"; _key: string; assurances?: string[]; slides?: CmsSlide[] }
  | { _type: "bannerSection"; _key: string; eyebrow?: string; title?: string; text?: string; cta?: string; href?: string; image?: string; alt?: string }
  | { _type: "campaignSection"; _key: string; campaign?: { title?: string; eyebrow?: string; summary?: string; cta?: string; href?: string; image?: string; alt?: string } }
  | {
      _type: "productRailSection";
      _key: string;
      title?: string;
      subtitle?: string;
      href?: string;
      tag?: string;
      feature?: { eyebrow?: string; title?: string; text?: string; href?: string; cta?: string; image?: string; alt?: string };
    }
  | { _type: "trustSection"; _key: string; items?: Array<{ icon?: string; title?: string; text?: string }> }
  | { _type: "faqSection"; _key: string; eyebrow?: string; title?: string; faqs?: Array<{ question?: string; answer?: string }> }
  | { _type: "editorialSplit"; _key: string; eyebrow?: string; title?: string; paragraphs?: string[]; cta?: string; href?: string; image?: string; alt?: string };

export type CmsNavigation = {
  deliveryLabel?: string;
  deliveryDetail?: string;
  paymentLabel?: string;
  paymentShort?: string;
  secureLabel?: string;
  phone?: string;
  phoneHref?: string;
  trackLabel?: string;
  trackHref?: string;
  helpLabel?: string;
  helpHref?: string;
  links?: Array<{ label: string; href: string }>;
};

export type CmsFooter = {
  newsletterEyebrow?: string;
  newsletterText?: string;
  email?: string;
  phone?: string;
  address?: string;
  legal?: string;
  socials?: Array<{ name: string; label: string; href: string }>;
  columns?: Array<{ title: string; links?: Array<{ label: string; href: string }> }>;
};

export type CmsSite = { title?: string; titleTemplate?: string; description?: string };

export type CmsFaq = { question: string; answer: string; group?: string };

export type CmsPolicy = {
  title: string;
  eyebrow?: string;
  slug: string;
  blocks?: Array<{ heading?: string; paragraphs?: string[]; list?: string[]; table?: { headers?: string[]; rows?: string[][] } }>;
  seo?: CmsSeo;
};

export type CmsLanding = {
  title: string;
  eyebrow?: string;
  slug: string;
  sections?: CmsSection[];
  seo?: CmsSeo;
};

export type CmsPostCard = {
  title: string;
  excerpt?: string;
  author?: string;
  publishedAt?: string;
  slug: string;
  image?: string;
  alt?: string;
};

export type CmsSpan = { _type?: string; text?: string; marks?: string[] };
export type CmsBlock = {
  _type?: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: CmsSpan[];
  markDefs?: Array<{ _key: string; _type: string; href?: string }>;
};

export type CmsPost = CmsPostCard & { body?: CmsBlock[]; seo?: CmsSeo };

export type CmsCampaign = {
  title: string;
  eyebrow?: string;
  summary?: string;
  cta?: string;
  href?: string;
  startsAt?: string;
  endsAt?: string;
  slug: string;
  image?: string;
  alt?: string;
  body?: CmsBlock[];
  seo?: CmsSeo;
};

export type CmsCollection = { title?: string; eyebrow?: string; intro?: string; catalogSlug?: string; seo?: CmsSeo };

export type CmsProductEditorial = { productSlug?: string; headline?: string; paragraphs?: string[]; seoDescription?: string };
