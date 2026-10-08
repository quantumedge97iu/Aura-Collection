import { defineQuery } from "groq";

const picture = `coalesce(image.asset->url, mediaPath)`;

export const homeQuery = defineQuery(`*[_id == "homePage"][0]{
  seo{ title, description },
  sections[]{
    _type,
    _key,
    _type == "heroSection" => {
      assurances,
      slides[]{
        label,
        titleLead,
        titleAccent,
        text,
        cta,
        href,
        "image": ${picture},
        "alt": coalesce(alt, image.alt, label),
        "focus": coalesce(focus, "center center")
      }
    },
    _type == "bannerSection" => {
      eyebrow, title, text, cta, href,
      "image": ${picture},
      "alt": coalesce(alt, image.alt, title)
    },
    _type == "campaignSection" => {
      "campaign": campaign->{
        title, eyebrow, summary, cta,
        "href": coalesce(href, "/campaigns/" + slug.current),
        "image": ${picture},
        "alt": coalesce(image.alt, title)
      }
    },
    _type == "productRailSection" => {
      title, subtitle, href, tag,
      feature{
        eyebrow, title, text, href, cta,
        "image": ${picture},
        "alt": coalesce(alt, image.alt, title)
      }
    },
    _type == "trustSection" => { items[]{ icon, title, text } },
    _type == "faqSection" => {
      eyebrow, title,
      "faqs": faqs[]->{ question, answer }
    },
    _type == "editorialSplit" => {
      eyebrow, title, paragraphs, cta, href,
      "image": ${picture},
      "alt": coalesce(alt, image.alt, title)
    }
  }
}`);

export const navigationQuery = defineQuery(`*[_id == "navigation"][0]{
  deliveryLabel, deliveryDetail, paymentLabel, paymentShort, secureLabel,
  phone, phoneHref, trackLabel, trackHref, helpLabel, helpHref,
  links[]{ label, href }
}`);

export const footerQuery = defineQuery(`*[_id == "footer"][0]{
  newsletterEyebrow, newsletterText, email, phone, address, legal,
  socials[]{ name, label, href },
  columns[]{ title, links[]{ label, href } }
}`);

export const siteQuery = defineQuery(`*[_id == "siteSettings"][0]{
  title, titleTemplate, description
}`);

export const faqsQuery = defineQuery(`*[_type == "faq"] | order(order asc, question asc) { question, answer, "group": group }`);

export const policyQuery = defineQuery(`*[_type == "policy" && slug.current == $slug][0]{
  title, eyebrow, "slug": slug.current,
  blocks[]{ heading, paragraphs, list, table{ headers, "rows": rows[].cells } },
  seo{ title, description }
}`);

export const landingQuery = defineQuery(`*[_type == "landingPage" && slug.current == $slug][0]{
  title, eyebrow, "slug": slug.current,
  sections[]{
    _type, _key,
    _type == "editorialSplit" => {
      eyebrow, title, paragraphs, cta, href,
      "image": ${picture},
      "alt": coalesce(alt, image.alt, title)
    },
    _type == "bannerSection" => {
      eyebrow, title, text, cta, href,
      "image": ${picture},
      "alt": coalesce(alt, image.alt, title)
    }
  },
  seo{ title, description }
}`);

export const postsQuery = defineQuery(`*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
  title, excerpt, author, publishedAt, "slug": slug.current,
  "image": ${picture},
  "alt": coalesce(image.alt, title)
}`);

export const postQuery = defineQuery(`*[_type == "post" && slug.current == $slug][0]{
  title, excerpt, author, publishedAt, "slug": slug.current, body,
  "image": ${picture},
  "alt": coalesce(image.alt, title),
  seo{ title, description }
}`);

export const campaignQuery = defineQuery(`*[_type == "campaign" && slug.current == $slug][0]{
  title, eyebrow, summary, cta, href, startsAt, endsAt, body, "slug": slug.current,
  "image": ${picture},
  "alt": coalesce(image.alt, title),
  seo{ title, description }
}`);

export const collectionQuery = defineQuery(`*[_type == "editorialCollection" && catalogSlug == $slug][0]{
  title, eyebrow, intro, catalogSlug, seo{ title, description }
}`);

export const productEditorialQuery = defineQuery(`*[_type == "productEditorial" && productSlug == $slug][0]{
  productSlug, headline, paragraphs, seoDescription
}`);
