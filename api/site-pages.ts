import type { VercelRequest, VercelResponse } from "@vercel/node";

type PageType =
  | "lead_magnet"
  | "service"
  | "content"
  | "product"
  | "resource"
  | "other";

type SitePage = {
  url: string;
  slug: string;
  title_hint: string;
  page_type: PageType;
  topics: string[];
  is_existing_asset: boolean;
};

function cleanSlug(url: string): string {
  try {
    const { pathname } = new URL(url);
    return pathname.replace(/^\/|\/$/g, "") || "home";
  } catch {
    return "unknown";
  }
}

function titleHintFromSlug(slug: string): string {
  if (slug === "home") return "Homepage";
  return slug
    .split("/")
    .pop()
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || slug;
}

function classifyPage(url: string): SitePage {
  const slug = cleanSlug(url).toLowerCase();

  const topics: string[] = [];

  if (slug.includes("tech-pack")) topics.push("tech pack");
  if (slug.includes("clothing-manufacturer") || slug.includes("manufacturer")) {
    topics.push("clothing manufacturing");
  }
  if (slug.includes("private-label")) topics.push("private label");
  if (slug.includes("activewear")) topics.push("activewear");
  if (slug.includes("streetwear")) topics.push("streetwear");
  if (slug.includes("hoodie")) topics.push("hoodies");
  if (slug.includes("blank")) topics.push("blanks");
  if (slug.includes("amazon")) topics.push("amazon");
  if (slug.includes("cost") || slug.includes("costing")) topics.push("costing");
  if (slug.includes("guide") || slug.includes("how-to")) topics.push("education");

  let page_type: PageType = "other";
  let is_existing_asset = false;

  if (slug.startsWith("blog/") || slug === "blog") {
    page_type = "content";
  } else if (
    slug.includes("free-tech-pack-template") ||
    slug.includes("template") ||
    slug.includes("checklist") ||
    slug.includes("calculator") ||
    slug.includes("spreadsheet") ||
    slug.includes("download")
  ) {
    page_type = "lead_magnet";
    is_existing_asset = true;
  } else if (
    slug.includes("services") ||
    slug.includes("manufacturer") ||
    slug.includes("private-label") ||
    slug.includes("cut-and-sew")
  ) {
    page_type = "service";
  } else if (
    slug.includes("academy") ||
    slug.includes("how-to") ||
    slug.includes("resources") ||
    slug.includes("guide")
  ) {
    page_type = "content";
  } else if (
    slug.includes("/products/") ||
    slug.includes("/product/") ||
    slug.includes("bommesport")
  ) {
    page_type = "product";
  } else if (
    slug.includes("tools") ||
    slug.includes("resource")
  ) {
    page_type = "resource";
  }

  return {
    url,
    slug,
    title_hint: titleHintFromSlug(slug),
    page_type,
    topics,
    is_existing_asset,
  };
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const sitemapUrl = "https://www.bommestudio.com/sitemap.xml";

    const response = await fetch(sitemapUrl);
    const xml = await response.text();

    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    const urls = [...new Set(matches)].filter((url) =>
      url.startsWith("https://www.bommestudio.com/")
    );

    const pages = urls.map(classifyPage);

    res.status(200).json({
      ok: true,
      source: sitemapUrl,
      total_urls: pages.length,
      pages
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Failed to parse sitemap"
    });
  }
}
