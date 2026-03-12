import type { VercelRequest, VercelResponse } from "@vercel/node";

type InventoryPage = {
  url: string;
  canonical_url: string | null;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  page_type:
    | "service"
    | "lead_magnet"
    | "content"
    | "academy"
    | "directory"
    | "resource"
    | "product"
    | "other";
  primary_intent:
    | "manufacturing_lead_generation"
    | "lead_capture"
    | "education"
    | "directory_authority"
    | "product"
    | "unknown";
  canonical_topic: string | null;
  business_area: "bomme-studio" | "bommesport" | "mixed" | "unknown";
  is_money_page: boolean;
  is_lead_magnet: boolean;
  is_protected_asset: boolean;
};

function extractTag(html: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  return match ? stripHtml(match[1]).trim() : null;
}

function extractMeta(html: string, name: string): string | null {
  const regex = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match ? decodeHtml(match[1].trim()) : null;
}

function extractCanonical(html: string): string | null {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i
  );
  return match ? match[1].trim() : null;
}

function extractH1(html: string): string | null {
  return extractTag(html, "h1");
}

function stripHtml(input: string): string {
  return decodeHtml(input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function cleanSlug(url: string): string {
  try {
    const { pathname } = new URL(url);
    return pathname.replace(/^\/|\/$/g, "") || "home";
  } catch {
    return "unknown";
  }
}

function inferBusinessArea(url: string, title: string | null, h1: string | null): InventoryPage["business_area"] {
  const text = `${url} ${title || ""} ${h1 || ""}`.toLowerCase();
  if (text.includes("bommesport") || text.includes("bomme sport")) return "bommesport";
  if (text.includes("seo")) return "mixed";
  return "bomme-studio";
}

function inferPageType(
  slug: string,
  title: string | null,
  h1: string | null
): InventoryPage["page_type"] {
  const text = `${slug} ${title || ""} ${h1 || ""}`.toLowerCase();

  if (slug === "academy" || slug.startsWith("academy/")) return "academy";
  if (slug === "directory" || slug.startsWith("directory/")) return "directory";
  if (slug === "blog" || slug.startsWith("blog/")) return "content";

  if (
    text.includes("template") ||
    text.includes("calculator") ||
    text.includes("checklist") ||
    text.includes("download")
  ) {
    return "lead_magnet";
  }

  if (
    slug === "fashion-business-tools" ||
    slug.startsWith("fashion-business-tools/")
  ) {
    return "resource";
  }

  if (
    slug.includes("/p/") ||
    slug.startsWith("custom-clothing/") ||
    slug.includes("blank-hoodies") ||
    slug.includes("blank-wholesale-clothing")
  ) {
    return "product";
  }

  if (
    text.includes("manufacturer") ||
    text.includes("private label") ||
    text.includes("full package production") ||
    text.includes("contract clothing") ||
    text.includes("sample development") ||
    text.includes("patternmakers")
  ) {
    return "service";
  }

  return "other";
}

function inferPrimaryIntent(
  pageType: InventoryPage["page_type"],
  slug: string,
  title: string | null,
  h1: string | null
): InventoryPage["primary_intent"] {
  const text = `${slug} ${title || ""} ${h1 || ""}`.toLowerCase();

  if (pageType === "lead_magnet") return "lead_capture";
  if (pageType === "academy" || pageType === "content") return "education";
  if (pageType === "directory") return "directory_authority";
  if (pageType === "product") return "product";

  if (
    pageType === "service" &&
    (
      text.includes("manufacturer") ||
      text.includes("private label") ||
      text.includes("production") ||
      text.includes("contract")
    )
  ) {
    return "manufacturing_lead_generation";
  }

  return "unknown";
}

function inferCanonicalTopic(
  slug: string,
  title: string | null,
  h1: string | null
): string | null {
  const text = `${slug} ${title || ""} ${h1 || ""}`.toLowerCase();

  const topicRules: Array<[RegExp, string]> = [
    [/clothing manufacturer/, "clothing manufacturer"],
    [/apparel manufacturer/, "apparel manufacturer"],
    [/private label/, "private label clothing manufacturer"],
    [/cut and sew/, "cut and sew manufacturer"],
    [/tech pack/, "tech pack"],
    [/hoodie/, "hoodie manufacturer"],
    [/sweatshirt/, "sweatshirt manufacturer"],
    [/t[\s-]?shirt/, "t shirt manufacturer"],
    [/activewear/, "activewear manufacturer"],
    [/streetwear/, "streetwear clothing manufacturer"],
    [/underwear/, "underwear manufacturer"],
    [/loungewear/, "loungewear manufacturer"],
    [/patternmaking|patternmakers/, "patternmaking"],
    [/sample development|sample makers|sampling/, "clothing sample development"],
    [/cost calculator|costing/, "apparel costing"],
    [/fabric shrinkage calculator/, "fabric shrinkage calculator"]
  ];

  for (const [pattern, topic] of topicRules) {
    if (pattern.test(text)) return topic;
  }

  return title || h1 || slug || null;
}

function inferProtectedAsset(
  slug: string,
  title: string | null,
  h1: string | null
): boolean {
  const text = `${slug} ${title || ""} ${h1 || ""}`.toLowerCase();

  return (
    text.includes("free tech pack template") ||
    text.includes("fabric shrinkage calculator") ||
    text.includes("clothing tech pack guide") ||
    text.includes("clothing tech pack example") ||
    text.includes("professional apparel tech pack development") ||
    slug === "home"
  );
}

function inferMoneyPage(
  pageType: InventoryPage["page_type"],
  slug: string,
  title: string | null,
  h1: string | null
): boolean {
  const text = `${slug} ${title || ""} ${h1 || ""}`.toLowerCase();

  return (
    slug === "home" ||
    (
      pageType === "service" &&
      (
        text.includes("manufacturer") ||
        text.includes("private label") ||
        text.includes("production") ||
        text.includes("contract clothing")
      )
    )
  );
}

async function buildPageRecord(url: string): Promise<InventoryPage> {
  const slug = cleanSlug(url);

  const response = await fetch(url, {
    headers: {
      "User-Agent": "BOMME-GPT-Inventory/1.0"
    }
  });

  const html = await response.text();

  const title = extractTag(html, "title");
  const meta_description = extractMeta(html, "description");
  const h1 = extractH1(html);
  const canonical_url = extractCanonical(html);

  const page_type = inferPageType(slug, title, h1);
  const primary_intent = inferPrimaryIntent(page_type, slug, title, h1);
  const canonical_topic = inferCanonicalTopic(slug, title, h1);
  const business_area = inferBusinessArea(url, title, h1);
  const is_lead_magnet = page_type === "lead_magnet";
  const is_protected_asset = inferProtectedAsset(slug, title, h1);
  const is_money_page = inferMoneyPage(page_type, slug, title, h1);

  return {
    url,
    canonical_url,
    title,
    meta_description,
    h1,
    page_type,
    primary_intent,
    canonical_topic,
    business_area,
    is_money_page,
    is_lead_magnet,
    is_protected_asset
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const sitemapUrl = "https://www.bommestudio.com/sitemap.xml";

    const sitemapResponse = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "BOMME-GPT-Inventory/1.0"
      }
    });

    if (!sitemapResponse.ok) {
      return res.status(502).json({
        ok: false,
        error: `Failed to fetch sitemap: ${sitemapResponse.status} ${sitemapResponse.statusText}`
      });
    }

    const xml = await sitemapResponse.text();

    const urls = [...new Set(
      [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1].trim())
    )].filter((url) => {
      return (
        url.startsWith("https://www.bommestudio.com/") &&
        !url.includes("?")
      );
    });

    // Limit default crawl size to keep endpoint fast and reliable
    const limit = Math.min(Number(req.query.limit || 40), 60);

    // Prioritize important URLs first
    const priorityUrls = urls.sort((a, b) => {
      const score = (u: string) => {
        const slug = cleanSlug(u).toLowerCase();
        let s = 0;
        if (slug === "home") s += 100;
        if (slug.includes("manufacturer")) s += 50;
        if (slug.includes("tech-pack")) s += 50;
        if (slug.includes("academy")) s += 30;
        if (slug.includes("directory")) s += 30;
        if (slug.includes("fashion-business-tools")) s += 30;
        if (slug.includes("calculator")) s += 30;
        if (slug.startsWith("blog/")) s -= 10;
        return s;
      };
      return score(b) - score(a);
    });

    const selectedUrls = priorityUrls.slice(0, limit);

    const pages = await Promise.all(selectedUrls.map(buildPageRecord));

    return res.status(200).json({
      ok: true,
      source: sitemapUrl,
      crawled_urls: selectedUrls.length,
      pages
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
}
