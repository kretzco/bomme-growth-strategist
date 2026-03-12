import type { VercelRequest, VercelResponse } from "@vercel/node";

type PageType =
  | "lead_magnet"
  | "service"
  | "content"
  | "product"
  | "resource"
  | "academy"
  | "directory"
  | "hub"
  | "utility"
  | "other";

type SitePage = {
  url: string;
  slug: string;
  title_hint: string;
  page_type: PageType;
  topics: string[];
  is_existing_asset: boolean;
  is_money_page: boolean;
  is_protected_asset: boolean;
  is_noisy: boolean;
  business_area: "bomme-studio" | "bommesport" | "mixed" | "unknown";
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
  return (
    slug
      .split("/")
      .pop()
      ?.replace(/\+/g, " ")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase()) || slug
  );
}

function inferTopics(slug: string): string[] {
  const topics = new Set<string>();

  if (slug.includes("tech-pack")) topics.add("tech pack");
  if (slug.includes("manufacturer")) topics.add("clothing manufacturing");
  if (slug.includes("private-label")) topics.add("private label");
  if (slug.includes("activewear")) topics.add("activewear");
  if (slug.includes("streetwear")) topics.add("streetwear");
  if (slug.includes("hoodie")) topics.add("hoodies");
  if (slug.includes("blank")) topics.add("blanks");
  if (slug.includes("amazon")) topics.add("amazon");
  if (slug.includes("cost") || slug.includes("costing")) topics.add("costing");
  if (slug.includes("sample")) topics.add("sampling");
  if (slug.includes("pattern")) topics.add("patternmaking");
  if (slug.includes("fabric")) topics.add("fabric");
  if (slug.includes("guide") || slug.includes("how-to")) topics.add("education");
  if (slug.includes("seo")) topics.add("seo");
  if (slug.includes("merch")) topics.add("custom merch");
  if (slug.includes("directory")) topics.add("directory");
  if (slug.includes("academy")) topics.add("academy");

  return [...topics];
}

function classifyPage(url: string): SitePage {
  const slug = cleanSlug(url).toLowerCase();
  const topics = inferTopics(slug);

  let page_type: PageType = "other";
  let is_existing_asset = false;
  let is_money_page = false;
  let is_protected_asset = false;
  let is_noisy = false;
  let business_area: "bomme-studio" | "bommesport" | "mixed" | "unknown" = "bomme-studio";

  // Business area
  if (slug.includes("bommesport") || slug.includes("bomme-sport")) {
    business_area = "bommesport";
  } else if (slug.includes("seo")) {
    business_area = "mixed";
  }

  // Noisy/archive pages
  if (
    slug.includes("/category/") ||
    slug.includes("/tag/") ||
    slug.includes("/author/") ||
    slug === "new-home-1" ||
    slug.includes("s6xe3") ||
    slug.includes("dk7dn") ||
    slug.includes("hpg4z") ||
    slug.includes("p9kem")
  ) {
    is_noisy = true;
    page_type = "utility";
  }

  // Blog and educational content
  if (!is_noisy && (slug === "blog" || slug.startsWith("blog/"))) {
    page_type = "content";
  }

  // Academy
  if (!is_noisy && (slug === "academy" || slug.startsWith("academy/"))) {
    page_type = "academy";
  }

  // Directory
  if (!is_noisy && (slug === "directory" || slug.startsWith("directory/"))) {
    page_type = "directory";
  }

  // Lead magnets / protected assets
  if (
    !is_noisy &&
    (
      slug === "free-tech-pack-template" ||
      slug === "fashion-business-tools/p/free-tech-pack-template" ||
      slug.includes("template") ||
      slug.includes("calculator") ||
      slug.includes("checklist") ||
      slug.includes("spreadsheet") ||
      slug.includes("download")
    )
  ) {
    page_type = "lead_magnet";
    is_existing_asset = true;
  }

  // Resources / tools
  if (
    !is_noisy &&
    page_type === "other" &&
    (
      slug === "fashion-business-tools" ||
      slug.startsWith("fashion-business-tools/") ||
      slug.includes("resource") ||
      slug.includes("tools")
    )
  ) {
    page_type = "resource";
  }

  // Service pages
  if (
    !is_noisy &&
    (page_type === "other" || page_type === "resource") &&
    (
      slug.includes("manufacturer") ||
      slug.includes("private-label") ||
      slug.includes("cut-and-sew") ||
      slug.includes("production") ||
      slug.includes("sample-development") ||
      slug.includes("patternmakers-los-angeles") ||
      slug.includes("sample-makers-los-angeles") ||
      slug.includes("full-package-production") ||
      slug.includes("custom-merch") ||
      slug.includes("design-services")
    )
  ) {
    page_type = "service";
    is_money_page = true;
  }

  // Product-ish pages
  if (
    !is_noisy &&
    page_type === "other" &&
    (
      slug.includes("/p/") ||
      slug.startsWith("custom-clothing/") ||
      slug.includes("blank-hoodies") ||
      slug.includes("blank-wholesale-clothing")
    )
  ) {
    page_type = "product";
  }

  // Content hubs
  if (
    !is_noisy &&
    (
      slug === "apparel-manufacturing-guides" ||
      slug === "fabric-dictionary" ||
      slug === "manufacturing-process" ||
      slug === "how-to-start-clothing-company-expert-guides-business-tools"
    )
  ) {
    page_type = "hub";
  }

  // Protected assets: things the GPT should not re-suggest generically
  if (
    slug === "free-tech-pack-template" ||
    slug === "fashion-business-tools/p/free-tech-pack-template" ||
    slug === "fabric-shrinkage-calculator" ||
    slug === "academy/clothing-tech-pack-guide" ||
    slug === "academy/clothing-tech-pack-example" ||
    slug === "fashion-business-tools/p/professional-apparel-tech-pack-development"
  ) {
    is_protected_asset = true;
  }

  // Existing asset should also include tech-pack ecosystem pages
  if (
    slug.includes("tech-pack") ||
    slug === "fabric-shrinkage-calculator"
  ) {
    is_existing_asset = true;
  }

  return {
    url,
    slug,
    title_hint: titleHintFromSlug(slug),
    page_type,
    topics,
    is_existing_asset,
    is_money_page,
    is_protected_asset,
    is_noisy,
    business_area
  };
}

function sortPages(pages: SitePage[]): SitePage[] {
  return [...pages].sort((a, b) => a.slug.localeCompare(b.slug));
}

function groupPages(pages: SitePage[]) {
  const filtered = pages.filter((p) => !p.is_noisy);

  return {
    existing_lead_magnets: sortPages(filtered.filter((p) => p.page_type === "lead_magnet")),
    existing_service_pages: sortPages(filtered.filter((p) => p.page_type === "service")),
    existing_content_pages: sortPages(
      filtered.filter((p) => p.page_type === "content" || p.page_type === "academy")
    ),
    existing_resource_pages: sortPages(filtered.filter((p) => p.page_type === "resource")),
    existing_product_pages: sortPages(filtered.filter((p) => p.page_type === "product")),
    existing_content_hubs: sortPages(filtered.filter((p) => p.page_type === "hub")),
    existing_directory_pages: sortPages(filtered.filter((p) => p.page_type === "directory")),
    existing_academy_pages: sortPages(filtered.filter((p) => p.page_type === "academy")),
    existing_money_pages: sortPages(filtered.filter((p) => p.is_money_page)),
    existing_tech_pack_assets: sortPages(
      filtered.filter((p) => p.topics.includes("tech pack") || p.slug.includes("tech-pack"))
    ),
    existing_calculators: sortPages(
      filtered.filter((p) => p.slug.includes("calculator"))
    ),
    protected_assets: sortPages(filtered.filter((p) => p.is_protected_asset)),
    noisy_pages: sortPages(pages.filter((p) => p.is_noisy))
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sitemapUrl = "https://www.bommestudio.com/sitemap.xml";

    const response = await fetch(sitemapUrl, {
      headers: {
        Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8"
      }
    });

    if (!response.ok) {
      return res.status(502).json({
        ok: false,
        error: `Failed to fetch sitemap: ${response.status} ${response.statusText}`
      });
    }

    const xml = await response.text();

    const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim());

    const urls = [...new Set(matches)].filter((url) => {
      return (
        url.startsWith("https://www.bommestudio.com/") &&
        !url.includes("?")
      );
    });

    const pages = urls.map(classifyPage);
    const grouped = groupPages(pages);

    return res.status(200).json({
      ok: true,
      source: sitemapUrl,
      total_urls: pages.length,
      summary: {
        lead_magnets: grouped.existing_lead_magnets.length,
        service_pages: grouped.existing_service_pages.length,
        content_pages: grouped.existing_content_pages.length,
        resource_pages: grouped.existing_resource_pages.length,
        product_pages: grouped.existing_product_pages.length,
        hub_pages: grouped.existing_content_hubs.length,
        academy_pages: grouped.existing_academy_pages.length,
        directory_pages: grouped.existing_directory_pages.length,
        money_pages: grouped.existing_money_pages.length,
        protected_assets: grouped.protected_assets.length,
        noisy_pages: grouped.noisy_pages.length
      },
      existing_tech_pack_assets: grouped.existing_tech_pack_assets,
      existing_calculators: grouped.existing_calculators,
      existing_lead_magnets: grouped.existing_lead_magnets,
      existing_service_pages: grouped.existing_service_pages,
      existing_content_hubs: grouped.existing_content_hubs,
      existing_directory_pages: grouped.existing_directory_pages,
      existing_academy_pages: grouped.existing_academy_pages,
      existing_money_pages: grouped.existing_money_pages,
      protected_assets: grouped.protected_assets,
      noisy_pages: grouped.noisy_pages,
      pages: sortPages(pages)
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
