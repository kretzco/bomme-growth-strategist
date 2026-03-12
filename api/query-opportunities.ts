import type { VercelRequest, VercelResponse } from "@vercel/node";

type Opportunity =
  | {
      type: "ctr_opportunity";
      url: string;
      query: string;
      impressions: number;
      clicks: number;
      ctr: number;
      avg_position: number;
    }
  | {
      type: "near_page_one";
      url: string;
      query: string;
      impressions: number;
      clicks: number;
      avg_position: number;
    }
  | {
      type: "cannibalization_risk";
      query: string;
      pages: string[];
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
    const opportunities: Opportunity[] = [
      {
        type: "ctr_opportunity",
        url: "https://www.bommestudio.com/",
        query: "clothing manufacturer",
        impressions: 5200,
        clicks: 210,
        ctr: 0.0404,
        avg_position: 9.8
      },
      {
        type: "near_page_one",
        url: "https://www.bommestudio.com/streetwear-clothing-manufacturers",
        query: "streetwear clothing manufacturers",
        impressions: 2200,
        clicks: 120,
        avg_position: 8.9
      },
      {
        type: "cannibalization_risk",
        query: "private label clothing manufacturer",
        pages: [
          "https://www.bommestudio.com/",
          "https://www.bommestudio.com/private-label-clothing"
        ]
      }
    ];

    return res.status(200).json({
      ok: true,
      source: "query_opportunity_analysis_mock",
      opportunities
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}
