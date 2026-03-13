import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";
import { BUSINESS_CONFIG } from "./_businessConfig.js";

type SupportedBusinessContext = "bomme-studio" | "bommesport";

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

type SearchConsoleRow = {
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
};

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function includesAny(url: string, patterns: string[]): boolean {
  return patterns.some((pattern) => url.includes(pattern));
}

function getBusinessContext(req: VercelRequest): SupportedBusinessContext {
  const raw =
    typeof req.query.business_context === "string"
      ? req.query.business_context
      : BUSINESS_CONFIG.searchConsole.defaultProperty;

  return raw === "bommesport" ? "bommesport" : "bomme-studio";
}

function getSearchConsoleProperty(businessContext: SupportedBusinessContext) {
  const property = BUSINESS_CONFIG.searchConsole.properties[businessContext];

  if (!property) {
    throw new Error(`Unknown Search Console property: ${businessContext}`);
  }

  return property;
}

function getPagePriority(
  businessContext: SupportedBusinessContext,
  url: string
): number {
  const normalized = normalizeUrl(url);
  const priorities = BUSINESS_CONFIG.seo.pagePriorities[businessContext] || {};

  for (const [key, value] of Object.entries(priorities)) {
    if (normalizeUrl(key) === normalized) return value;
  }

  return 20;
}

function isHomepage(
  businessContext: SupportedBusinessContext,
  url: string
): boolean {
  const homepage = BUSINESS_CONFIG.searchConsole.properties[businessContext].homepage;
  return normalizeUrl(url) === normalizeUrl(homepage);
}

function isMoneyPage(
  businessContext: SupportedBusinessContext,
  url: string
): boolean {
  const normalized = normalizeUrl(url);

  if (
    businessContext === "bomme-studio" &&
    BUSINESS_CONFIG.seo.pageGroups.moneyPages.some(
      (u: string) => normalizeUrl(u) === normalized
    )
  ) {
    return true;
  }

  return BUSINESS_CONFIG.seo.moneyPageIndicators.some((indicator: string) =>
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

  if (rules.buyer.some((term: string) => lower.includes(term))) return "buyer";
  if (rules.commercial.some((term: string) => lower.includes(term))) return "commercial";
  if (rules.educational.some((term: string) => lower.includes(term))) return "educational";

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

function computePriorityScore(
  businessContext: SupportedBusinessContext,
  page: Omit<PagePerformance, "priority_score">
): number {
  const scoring = BUSINESS_CONFIG.seo.scoring;
  const pagePriority = getPagePriority(businessContext, page.url);
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

function assertEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function fetchSearchConsoleRows(
  businessContext: SupportedBusinessContext,
  startDate: string,
  endDate: string,
  rowLimit = 500
): Promise<SearchConsoleRow[]> {
  const property = getSearchConsoleProperty(businessContext);

  const clientEmail = assertEnv("GSC_CLIENT_EMAIL", process.env.GSC_CLIENT_EMAIL);
  const privateKey = assertEnv("GSC_PRIVATE_KEY", process.env.GSC_PRIVATE_KEY);

  const auth = new google.auth.JWT(
    clientEmail,
    undefined,
    privateKey.replace(/\\n/g, "\n"),
    ["https://www.googleapis.com/auth/webmasters.readonly"]
  );

  const webmasters = google.webmasters({
    version: "v3",
    auth
  });

  const response = await webmasters.searchanalytics.query({
    siteUrl: property.siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ["page", "query"],
      rowLimit
    }
  });

  const rawRows = response.data.rows || [];

  return rawRows
    .map((row) => {
      const keys = row.keys || [];
      const page = typeof keys[0] === "string" ? keys[0] : "";
      const query = typeof keys[1] === "string" ? keys[1] : "";

      if (!page || !query) return null;

      return {
        page,
        query,
        clicks: Number(row.clicks || 0),
        impressions: Number(row.impressions || 0),
        ctr: Number(row.ctr || 0),
        position: Number(row.position || 0)
      };
    })
    .filter((row): row is SearchConsoleRow => row !== null);
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
    const businessContext = getBusinessContext(req);
    const property = getSearchConsoleProperty(businessContext);

    const start_date =
      typeof req.query.start_date === "string" ? req.query.start_date : "2026-01-01";
    const end_date =
      typeof req.query.end_date === "string" ? req.query.end_date : "2026-03-12";

    const rows = await fetchSearchConsoleRows(
      businessContext,
      start_date,
      end_date,
      500
    );

    const pageMap = new Map<
      string,
      {
        url: string;
        clicks: number;
        impressions: number;
        ctrNumeratorClicks: number;
        ctrNumeratorImpressions: number;
        avgPositionWeightedSum: number;
        top_queries: QueryPerformance[];
      }
    >();

    for (const row of rows) {
      if (isExcluded(row.page)) continue;

      const existing = pageMap.get(row.page) || {
        url: row.page,
        clicks: 0,
        impressions: 0,
        ctrNumeratorClicks: 0,
        ctrNumeratorImpressions: 0,
        avgPositionWeightedSum: 0,
        top_queries: []
      };

      existing.clicks += row.clicks;
      existing.impressions += row.impressions;
      existing.ctrNumeratorClicks += row.clicks;
      existing.ctrNumeratorImpressions += row.impressions;
      existing.avgPositionWeightedSum += row.position * row.impressions;

      existing.top_queries.push({
        query: row.query,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        avg_position: row.position,
        intent: inferIntent(row.query)
      });

      pageMap.set(row.page, existing);
    }

    const pages: PagePerformance[] = [...pageMap.values()]
      .map((page) => {
        const ctr =
          page.ctrNumeratorImpressions > 0
            ? page.ctrNumeratorClicks / page.ctrNumeratorImpressions
            : 0;

        const avg_position =
          page.impressions > 0
            ? page.avgPositionWeightedSum / page.impressions
            : 0;

        const top_queries = page.top_queries
          .sort((a, b) => b.impressions - a.impressions)
          .slice(0, 10);

        const partialPage = {
          url: page.url,
          clicks: page.clicks,
          impressions: page.impressions,
          ctr,
          avg_position,
          is_money_page: isMoneyPage(businessContext, page.url),
          is_homepage: isHomepage(businessContext, page.url),
          top_queries
        };

        return {
          ...partialPage,
          priority_score: computePriorityScore(businessContext, partialPage)
        };
      })
      .sort((a, b) => b.priority_score - a.priority_score);

    const money_page_opportunities = pages
      .filter((page) => page.is_money_page)
      .slice(0, 10);

    const opportunities = buildOpportunities(pages);

    const deprioritized_pages = pages
      .filter((page) => isDeprioritized(page.url))
      .map((page) => ({
        url: page.url,
        reason: "Deprioritized due to lower commercial value relative to priority money pages."
      }));

    return res.status(200).json({
      ok: true,
      source: "google_search_console",
      property_key: businessContext,
      property_domain: property.domain,
      site_url: property.siteUrl,
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
