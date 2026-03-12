import type { VercelRequest, VercelResponse } from "@vercel/node";

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

    const suggestions = [
      {
        source_page: "/streetwear-clothing-manufacturers",
        target_page: "/t-shirt-manufacturers",
        anchor_text: "t-shirt manufacturer",
        reason: "Shared garment manufacturing category"
      },
      {
        source_page: "/activewear-manufacturers",
        target_page: "/streetwear-clothing-manufacturers",
        anchor_text: "streetwear manufacturer",
        reason: "Related apparel manufacturing segment"
      }
    ];

    return res.status(200).json({
      ok: true,
      source: "internal_link_analysis",
      suggestions
    });

  } catch (error) {

    return res.status(500).json({
      ok: false,
      error: "Internal server error"
    });

  }

}
