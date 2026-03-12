import type { VercelRequest, VercelResponse } from "@vercel/node";

type ArchitecturePage = {
  url: string;
  internal_links_in: number;
  internal_links_out: number;
  crawl_depth: number;
  is_orphan: boolean;
  is_indexable: boolean;
  status_code: number;
  canonical_url: string;
  parent_section: string;
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const pages: ArchitecturePage[] = [
      {
        url: "https://www.bommestudio.com/",
        internal_links_in: 0,
        internal_links_out: 28,
        crawl_depth: 0,
        is_orphan: false,
        is_indexable: true,
        status_code: 200,
        canonical_url: "https://www.bommestudio.com/",
        parent_section: "homepage"
      },
      {
        url: "https://www.bommestudio.com/streetwear-clothing-manufacturers",
        internal_links_in: 6,
        internal_links_out: 11,
        crawl_depth: 2,
        is_orphan: false,
        is_indexable: true,
        status_code: 200,
        canonical_url: "https://www.bommestudio.com/streetwear-clothing-manufacturers",
        parent_section: "manufacturing"
      },
      {
        url: "https://www.bommestudio.com/activewear-manufacturers",
        internal_links_in: 8,
        internal_links_out: 14,
        crawl_depth: 2,
        is_orphan: false,
        is_indexable: true,
        status_code: 200,
        canonical_url: "https://www.bommestudio.com/activewear-manufacturers",
        parent_section: "manufacturing"
      },
      {
        url: "https://www.bommestudio.com/academy/clothing-tech-pack-guide",
        internal_links_in: 3,
        internal_links_out: 7,
        crawl_depth: 3,
        is_orphan: false,
        is_indexable: true,
        status_code: 200,
        canonical_url: "https://www.bommestudio.com/academy/clothing-tech-pack-guide",
        parent_section: "academy"
      }
    ];

    return res.status(200).json({
      ok: true,
      source: "site_architecture_mock",
      pages
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}
