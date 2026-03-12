import type { VercelRequest, VercelResponse } from "@vercel/node";
import { BUSINESS_CONFIG } from "./_businessConfig.js";

type QueryPerformance = {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  intent: "buyer" | "commercial" | "educational" | "mixed";
};

type PagePerformance = {
  url: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
  priority_score: number;
  is_money_page: boolean;
  is_homepage: boolean;
  top_queries: QueryPerformance[];
};

type Opportunity = {
  type: "high_value_underperformer" | "near_page_one" | "ctr_opportunity";
  url: string;
  score: number;
  reason: string;
  clicks: number;
  impressions: number;
  ctr: number;
  avg_position: number;
};

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function includesAny(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => url.includes(pattern));
}

function getPagePriority(url: string): number {
  const normalized = normalizeUrl(url);
  const priorities = BUSINESS_CONFIG.seo.pagePriorities;
  for (const [key, value] of Object.entries(priorities)) {
    if (normalizeUrl(key) === normalized) return value;
  }
  return 20;
}

function isHomepage(url: string): boolean {
  return normalizeUrl(url) === normalizeUrl(BUSINESS_CONFIG.seo.homepage);
}

function isMoneyPage(url: string): boolean {
  const normalized = normalizeUrl(url);

  if (BUSINESS_CONFIG.seo.pageGroups.moneyPages.some((u) => normalizeUrl(u) === normalized)) {
    return true;
  }

  return BUSINESS_CONFIG.seo.moneyPageIndicators.some((indicator) =>
    normalized.includes(indicator)
  );
}

function isExcluded(url: string): boolean {
  return includesAny(url, BUSINESS_CONFIG.seo.excludedUrlPatterns);
}

function isDeprioritized(url: string): boolean {
  return includesAny(url, BUSINESS_CONFIG.seo.deprioritizedUrlPatterns);
}

function inferIntent(query: string): QueryPerformance["intent"] {
  const lower = query.toLowerCase();
  const rules = BUSINESS_CONFIG.seo.queryIntentRules;

  if (rules.buyer.some((term) => lower.includes(term))) return "buyer";
  if (rules.commercial.some((term) => lower.includes(term))) return "commercial";
  if (rules.educational.some((term) => lower.includes(term))) return "educational";

  return "mixed";
}

function scorePosition(avg_position: number): number {
  const { nearPageOneMin, nearPageOneMax } = BUSINESS_CONFIG.seo.scoring;
  if (avg_position >= nearPageOneMin && avg_position <= nearPageOneMax) {
    return Math.max(0, 100 - avg_position * 4);
  }
  if (avg_position < nearPageOneMin) return 50;
  return 15;
}

function scoreImpressions(impressions: number): number {
  return Math.min(100, impressions / 100);
}

function scoreCtrGap(ctr: number, impressions: number): number {
  const { weakCtrThreshold, strongImpressionThreshold } = BUSINESS_CONFIG.seo.scoring;
  if (impressions >= strongImpressionThreshold && ctr < weakCtrThreshold) return 100;
  if (ctr < 0.05) return 60;
  return 20;
}

function computePriorityScore(page: Omit<PagePerformance, "priority_score">): number {
  const scoring = BUSINESS_CONFIG.seo.scoring;
  const pagePriority = getPagePriority(page.url);
  const impressionScore = scoreImpressions(page.impressions);
  const positionScore = scorePosition(page.avg_position);
  const ctrGapScore = scoreCtrGap(page.ctr, page.impressions);

  let score =
    pagePriority * scoring.pagePriorityWeight +
    impressionScore * scoring.impressionsWeight +
    positionScore * scoring.positionWeight +
    ctrGapScore * scoring.ctrGapWeight;

  if (page.is_money_page) score += scoring.moneyPageBonus;
  if (page.is_homepage) score += scoring.homepageBonus;
  if (isDeprioritized(page.url)) score -= scoring.lowValuePagePenalty;

  return Math.round(score * 100) / 100;
}

function buildOpportunities(pages: PagePerformance[]): Opportunity[] {
  const opportunities: Opportunity[] = [];

  for (const page of pages) {
    if (page.is_money_page && page.impressions >= 1000 && page.avg_position > 5) {
      opportunities.push({
        type: "high_value_underperformer",
        url: page.url,
        score: page.priority_score,
        reason: "High-priority money page with meaningful impressions but underperforming rank.",
        clicks: page.clicks,
        impressions: page.impressions,
        ctr: page.ctr,
        avg_position: page.avg_position
      });
    }

    if (page.avg_position >= 5 && page.avg_position <= 20) {
      opportunities.push({
        type: "near_page_one",
        url: page.url,
        score: page.priority_score,
        reason: "Page is within striking distance of page one and worth optimization.",
        clicks: page.clicks,
        impressions: page.impressions,
        ctr: page.ctr,
        avg_position: page.avg_position
      });
    }

    if (page.impressions >= 1000 && page.ctr < 0.03) {
      opportunities.push({
        type: "ctr_opportunity",
        url: page.url,
        score: page.priority_score,
        reason: "Strong impression volume but weak CTR suggests title/meta or intent mismatch.",
        clicks: page.clicks,
        impressions: page.impressions,
        ctr: page.ctr,
        avg_position: page.avg_position
      });
    }
  }

  return opportunities.sort((a, b) => b.score - a.score).slice(0, 15);
}

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
    const start_date =
      typeof req.query.start_date === "string" ? req.query.start_date : "2026-01-01";
    const end_date =
      typeof req.query.end_date === "string" ? req.query.end_date : "2026-03-12";

    // Replace this mock block with real Search Console data later
    const rawPages = [
      {
        url: "https://www.bommestudio.com/",
        clicks: 820,
        impressions: 18400,
        ctr: 0.0446,
        avg_position: 11.2,
        top_queries: [
          {
            query: "clothing manufacturer",
            clicks: 210,
            impressions: 5200,
            ctr: 0.0404,
            avg_position: 9.8
          },
          {
            query: "apparel manufacturer",
            clicks: 95,
            impressions: 1900,
            ctr: 0.05,
            avg_position: 12.1
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/private-label-clothing",
        clicks: 310,
        impressions: 6400,
        ctr: 0.0484,
        avg_position: 10.6,
        top_queries: [
          {
            query: "private label clothing manufacturer",
            clicks: 155,
            impressions: 3100,
            ctr: 0.05,
            avg_position: 9.4
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/full-package-production",
        clicks: 180,
        impressions: 2800,
        ctr: 0.0643,
        avg_position: 13.8,
        top_queries: [
          {
            query: "full package production clothing",
            clicks: 48,
            impressions: 720,
            ctr: 0.0667,
            avg_position: 12.5
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/contract-clothing-manufacturer-for-select-clients",
        clicks: 120,
        impressions: 2100,
        ctr: 0.0571,
        avg_position: 14.1,
        top_queries: [
          {
            query: "contract clothing manufacturer",
            clicks: 36,
            impressions: 610,
            ctr: 0.059,
            avg_position: 13.4
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/activewear-manufacturers",
        clicks: 270,
        impressions: 6100,
        ctr: 0.0443,
        avg_position: 10.4,
        top_queries: [
          {
            query: "activewear manufacturers",
            clicks: 120,
            impressions: 2200,
            ctr: 0.0545,
            avg_position: 8.9
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/t-shirt-manufacturers",
        clicks: 205,
        impressions: 4900,
        ctr: 0.0418,
        avg_position: 12.0,
        top_queries: [
          {
            query: "t shirt manufacturers",
            clicks: 88,
            impressions: 1700,
            ctr: 0.0518,
            avg_position: 10.8
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/streetwear-clothing-manufacturers",
        clicks: 270,
        impressions: 6100,
        ctr: 0.0443,
        avg_position: 10.4,
        top_queries: [
          {
            query: "streetwear clothing manufacturers",
            clicks: 120,
            impressions: 2200,
            ctr: 0.0545,
            avg_position: 8.9
          }
        ]
      },
      {
        url: "https://www.bommestudio.com/blog/streetwear-clothing-brands",
        clicks: 420,
        impressions: 16200,
        ctr: 0.0259,
        avg_position: 14.7,
        top_queries: [
          {
            query: "streetwear clothing brands",
            clicks: 180,
            impressions: 6300,
            ctr: 0.0286,
            avg_position: 13.2
          }
        ]
      }
    ];

    const pages: PagePerformance[] = rawPages
      .filter((page) => !isExcluded(page.url))
      .map((page) => {
        const top_queries: QueryPerformance[] = page.top_queries.map((q) => ({
          ...q,
          intent: inferIntent(q.query)
        }));

        const partialPage = {
          url: page.url,
          clicks: page.clicks,
          impressions: page.impressions,
          ctr: page.ctr,
          avg_position: page.avg_position,
          is_money_page: isMoneyPage(page.url),
          is_homepage: isHomepage(page.url),
          top_queries
        };

        return {
          ...partialPage,
          priority_score: computePriorityScore(partialPage)
        };
      })
      .sort((a, b) => b.priority_score - a.priority_score);

    const money_page_opportunities = pages
      .filter((page) => page.is_money_page)
      .slice(0, 10);

    const opportunities = buildOpportunities(pages);

    const deprioritized_pages = rawPages
      .filter((page) => isDeprioritized(page.url))
      .map((page) => ({
        url: page.url,
        reason: "Deprioritized due to lower commercial value relative to BOMME Studio money pages."
      }));

    return res.status(200).json({
      ok: true,
      source: "google_search_console_mock_weighted",
      date_range: {
        start_date,
        end_date
      },
      money_page_opportunities,
      opportunities,
      deprioritized_pages,
      pages
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}
