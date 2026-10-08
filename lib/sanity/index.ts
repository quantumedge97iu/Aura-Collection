// The shop copies this folder into lib/sanity with `npm run link:cms`.
import { cmsQuery, type CacheHint, type CmsConfig } from "./client";
import {
  campaignQuery,
  collectionQuery,
  faqsQuery,
  footerQuery,
  homeQuery,
  landingQuery,
  navigationQuery,
  policyQuery,
  postQuery,
  postsQuery,
  productEditorialQuery,
  siteQuery,
} from "./queries";
import type { CmsCampaign, CmsCollection, CmsFaq, CmsFooter, CmsHome, CmsLanding, CmsNavigation, CmsPolicy, CmsPost, CmsPostCard, CmsProductEditorial, CmsSite } from "./types";

export type { CacheHint, CmsConfig } from "./client";
export { API_VERSION, cmsConfigured, cmsQuery } from "./client";
export type * from "./types";

const editorialCache: CacheHint = { revalidate: 60, tags: ["editorial"] };

function cacheFor(config: CmsConfig) {
  return config.preview ? undefined : editorialCache;
}

export function loadHome(config: CmsConfig) {
  return cmsQuery<CmsHome>(homeQuery, config, undefined, cacheFor(config));
}

export function loadNavigation(config: CmsConfig) {
  return cmsQuery<CmsNavigation>(navigationQuery, config, undefined, cacheFor(config));
}

export function loadFooter(config: CmsConfig) {
  return cmsQuery<CmsFooter>(footerQuery, config, undefined, cacheFor(config));
}

export function loadSite(config: CmsConfig) {
  return cmsQuery<CmsSite>(siteQuery, config, undefined, cacheFor(config));
}

export function loadFaqs(config: CmsConfig) {
  return cmsQuery<CmsFaq[]>(faqsQuery, config, undefined, cacheFor(config));
}

export function loadPolicy(config: CmsConfig, slug: string) {
  return cmsQuery<CmsPolicy>(policyQuery, config, { slug }, cacheFor(config));
}

export function loadLanding(config: CmsConfig, slug: string) {
  return cmsQuery<CmsLanding>(landingQuery, config, { slug }, cacheFor(config));
}

export function loadPosts(config: CmsConfig) {
  return cmsQuery<CmsPostCard[]>(postsQuery, config, undefined, cacheFor(config));
}

export function loadPost(config: CmsConfig, slug: string) {
  return cmsQuery<CmsPost>(postQuery, config, { slug }, cacheFor(config));
}

export function loadCampaign(config: CmsConfig, slug: string) {
  return cmsQuery<CmsCampaign>(campaignQuery, config, { slug }, cacheFor(config));
}

export function loadEditorialCollection(config: CmsConfig, slug: string) {
  return cmsQuery<CmsCollection>(collectionQuery, config, { slug }, cacheFor(config));
}

export function loadProductEditorial(config: CmsConfig, slug: string) {
  return cmsQuery<CmsProductEditorial>(productEditorialQuery, config, { slug }, cacheFor(config));
}
