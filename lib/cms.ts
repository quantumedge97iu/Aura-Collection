// Editorial content is loaded from the Sanity folder beside this shop.
import { draftMode } from "next/headers";

import {
  loadCampaign,
  loadEditorialCollection,
  loadFaqs,
  loadFooter,
  loadHome,
  loadLanding,
  loadNavigation,
  loadPolicy,
  loadPost,
  loadPosts,
  loadProductEditorial,
  loadSite,
  type CmsCampaign,
  type CmsCollection,
  type CmsConfig,
  type CmsFaq,
  type CmsFooter,
  type CmsHome,
  type CmsLanding,
  type CmsNavigation,
  type CmsPolicy,
  type CmsPost,
  type CmsPostCard,
  type CmsProductEditorial,
  type CmsSite,
} from "@/lib/sanity/index";

async function config(): Promise<CmsConfig> {
  const preview = (await draftMode()).isEnabled;
  return {
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || "production",
    token: process.env.SANITY_API_READ_TOKEN,
    preview,
  };
}

async function read<T>(load: (config: CmsConfig) => Promise<T | null>) {
  try {
    return await load(await config());
  } catch {
    return null;
  }
}

export function editorialHome() {
  return read<CmsHome>(loadHome);
}

export function editorialNavigation() {
  return read<CmsNavigation>(loadNavigation);
}

export function editorialFooter() {
  return read<CmsFooter>(loadFooter);
}

export function editorialSite() {
  return read<CmsSite>(loadSite);
}

export function editorialFaqs() {
  return read<CmsFaq[]>(loadFaqs);
}

export function editorialPolicy(slug: string) {
  return read<CmsPolicy>((config) => loadPolicy(config, slug));
}

export function editorialLanding(slug: string) {
  return read<CmsLanding>((config) => loadLanding(config, slug));
}

export function editorialPosts() {
  return read<CmsPostCard[]>(loadPosts);
}

export function editorialPost(slug: string) {
  return read<CmsPost>((config) => loadPost(config, slug));
}

export function editorialCampaign(slug: string) {
  return read<CmsCampaign>((config) => loadCampaign(config, slug));
}

export function editorialCollection(slug: string) {
  return read<CmsCollection>((config) => loadEditorialCollection(config, slug));
}

export function editorialProduct(slug: string) {
  return read<CmsProductEditorial>((config) => loadProductEditorial(config, slug));
}

export type { CmsHome, CmsSection } from "@/lib/sanity/index";
