import type { VercelRequest, VercelResponse } from "@vercel/node";
import { BUSINESS_CONFIG } from "./_businessConfig.js";
import {
  fetchSearchConsoleRows,
  getSearchConsoleProperty,
  type SupportedBusinessContext,
  type SearchConsoleRow
} from "../lib/googleSearchConsole.js";

type OpportunityType =
  | "ctr_opportunity"
  | "near_page_one"
  | "cannibalization_risk"
  | "high_value_underperformer";

type QueryOpportunity =
  | {
      type: "ctr_opportunity" | "near_page_one" | "high_value_underperformer";
      business_context: SupportedBusinessContext;
      url: string;
      query: string;
      impressions: number;
      clicks: number;
      ctr: number;
      avg_position: number;
      priority_score: number;
      reason: string;
      is_money_page: boolean;
      is_homepage: boolean;
      recommended_action: string;
    }
  | {
      type: "cannibalization_risk";
      business_context: SupportedBusinessContext;
      query: string;
      pages: string[];
      total_impressions: number;
      total_clicks: number;
      reason: string;
      recommended_action: string;
    };

function getBusinessContext(req: VercelRequest): SupportedBusinessContext {
  const raw =
    typeof req.query.business_context === "string"
      ? req.query.business_context
      : BUSINESS_CONFIG.searchConsole.defaultProperty;

  return raw === "bommesport" ? "bommesport" : "bomme-studio";
}

function includesAny(value: string, patterns: string[]): boolean {
  return patterns.some((pattern) => value.includes(pattern));
}

function isExcludedUrl(url: string): boolean {
  return includesAny(url, BUSINESS_CONFIG.seo.excludedUrlPatterns);
}

function isDeprioritizedUrl(url: string): boolean {
  return includesAny(url, BUSINESS_CONFIG.seo.deprioritizedUrlPatterns);
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

function getPagePriority(
  businessContext: SupportedBusinessContext,
  url: string
): number {
  const normalized = normalizeUrl(url);
  const map = BUSINESS_CONFIG.seo.pagePriorities[businessContext] || {};

  for (const [key, value] of Object.entries(map)) {
    if (normalizeUrl(key) === normalized) return value;
  }

  return 20;
}

function isHomepage(
  businessContext: SupportedBusinessContext,
  url: string
): boolean {
  const homepage =
    BUSINESS_CONFIG.searchConsole.properties[businessContext].homepage;
  return normalizeUrl(url) === normalizeUrl(homepage);
}

function isMoneyPage(
  businessContext: SupportedBusinessContext,
  url: string
): boolean {
  const normalized = normalizeUrl(url);
  const group = BUSINESS_CONFIG.seo.pageGroups?.moneyPages || [];

  if (group.some((u: string) => normalizeUrl(u) === normalized)) {
    return businessContext === "bomme-studio";
  }

  const indicators = BUSINESS_CONFIG.seo.moneyPageIndicators || [];
  return indicators.some((indicator: string) => normalized.includes(indicator));
}

function scorePosition(position: number): number {
  const { nearPageOneMin, nearPageOneMax } = BUSINESS_CONFIG.seo.scoring;

  if (position >= nearPageOneMin && position <= nearPageOneMax) {
    return Math.max(0, 100 - position * 4);
  }

  if (position < nearPageOneMin) return 50;
  return 15;
}

function scoreImpressions(impressions: number): number {
  return Math.min(100, impressions / 100);
}

function scoreCtrGap(ctr: number, impressions: number): number {
  const { weakCtrThreshold, strongImpressionThreshold } =
    BUSINESS_CONFIG.seo.scoring;

  if (impressions >= strongImpressionThreshold && ctr < weakCtrThreshold) {
    return 100;
  }

  if (ctr < 0.05) return 60;
  return 20;
}

function computePriorityScore(
  businessContext: SupportedBusinessContext,
  row: SearchConsoleRow
): number {
  const scoring = BUSINESS_CONFIG.seo.scoring;
  const pagePriority = getPagePriority(businessContext, row.page);
  const impressionScore = scoreImpressions(row.impressions);
  const positionScore = scorePosition(row.position);
  const ctrGapScore = scoreCtrGap(row.ctr, row.impressions);

  let score =
    pagePriority * scoring.pagePriorityWeight +
    impressionScore * scoring.impressionsWeight +
    positionScore * scoring.positionWeight +
    ctrGapScore * scoring.ctrGapWeight;

  if (isMoneyPage(businessContext, row.page)) score += scoring.moneyPageBonus;
  if (isHomepage(businessContext, row.page)) score += scoring.homepageBonus;
  if (isDeprioritizedUrl(row.page)) score -= scoring.lowValuePagePenalty;

  return Math.round(score * 100) / 100;
}

function buildRecommendedAction(type: OpportunityType, url: string, query: string): string {
  switch (type) {
    case "ctr_opportunity":
      return `Improve title tag, meta description, and SERP alignment for ${url} targeting "${query}".`;
    case "near_page_one":
      return `Strengthen on-page optimization and internal linking to push ${url} higher for "${query}".`;
    case "high_value_underperformer":
      return `Prioritize ${url} for SEO upgrades because it is a high-value page with meaningful demand for "${query}".`;
    case "cannibalization_risk":
      return `Review page targeting and internal linking to consolidate intent for "${query}".`;
    default:
      return `Review ${url} for SEO improvement.`;
  }
}

function buildStandardOpportunities(
  businessContext: SupportedBusinessContext,
  rows: SearchConsoleRow[]
): QueryOpportunity[] {
  const opportunities: QueryOpportunity[] = [];

  for (const row of rows) {
    if (isExcludedUrl(row.page)) continue;

    const priorityScore = computePriorityScore(businessContext, row);
    const moneyPage = isMoneyPage(businessContext, row.page);
    const homepage = isHomepage(businessContext, row.page);

    if (row.impressions >= 1000 && row.ctr < 0.03) {
      opportunities.push({
        type: "ctr_opportunity",
        business_context: businessContext,
        url: row.page,
        query: row.query,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        avg_position: row.position,
        priority_score: priorityScore,
        reason:
          "This query has strong impression volume but weak CTR, suggesting a title, snippet, or intent mismatch.",
        is_money_page: moneyPage,
        is_homepage: homepage,
        recommended_action: buildRecommendedAction(
          "ctr_opportunity",
          row.page,
          row.query
        )
      });
    }

    if (
      row.position >= BUSINESS_CONFIG.seo.scoring.nearPageOneMin &&
      row.position <= BUSINESS_CONFIG.seo.scoring.nearPageOneMax
    ) {
      opportunities.push({
        type: "near_page_one",
        business_context: businessContext,
        url: row.page,
        query: row.query,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        avg_position: row.position,
        priority_score: priorityScore,
        reason:
          "This query is within striking distance of page one and is a strong optimization candidate.",
        is_money_page: moneyPage,
        is_homepage: homepage,
        recommended_action: buildRecommendedAction(
          "near_page_one",
          row.page,
          row.query
        )
      });
    }

    if (moneyPage && row.impressions >= 500 && row.position > 5) {
      opportunities.push({
        type: "high_value_underperformer",
        business_context: businessContext,
        url: row.page,
        query: row.query,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        avg_position: row.position,
        priority_score: priorityScore,
        reason:
          "This is a business-important page that already has demand but is underperforming in rankings.",
        is_money_page: true,
        is_homepage: homepage,
        recommended_action: buildRecommendedAction(
          "high_value_underperformer",
          row.page,
          row.query
        )
      });
    }
  }

  return opportunities;
}

function buildCannibalizationRisks(
  businessContext: SupportedBusinessContext,
  rows: SearchConsoleRow[]
): QueryOpportunity[] {
  const byQuery = new Map<
    string,
    {
      pages: Set<string>;
      impressions: number;
      clicks: number;
    }
  >();

  for (const row of rows) {
    if (isExcludedUrl(row.page)) continue;

    const key = row.query.trim().toLowerCase();
    const existing = byQuery.get(key) || {
      pages: new Set<string>(),
      impressions: 0,
      clicks: 0
    };

    existing.pages.add(row.page);
    existing.impressions += row.impressions;
    existing.clicks += row.clicks;

    byQuery.set(key, existing);
  }

  const risks: QueryOpportunity[] = [];

  for (const [query, data] of byQuery.entries()) {
    if (data.pages.size < 2) continue;
    if (data.impressions < 200) continue;

    risks.push({
      type: "cannibalization_risk",
      business_context: businessContext,
      query,
      pages: [...data.pages].sort(),
      total_impressions: data.impressions,
      total_clicks: data.clicks,
      reason:
        "Multiple pages are receiving impressions for the same query, which may indicate overlapping intent or cannibalization.",
      recommended_action: buildRecommendedAction(
        "cannibalization_risk",
        [...data.pages][0] || "",
        query
      )
    });
  }

  return risks;
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

    const startDate =
      typeof req.query.start_date === "string"
        ? req.query.start_date
        : "2026-01-01";
    const endDate =
      typeof req.query.end_date === "string"
        ? req.query.end_date
        : "2026-03-12";

    const maxRows =
      typeof req.query.row_limit === "string"
        ? Math.min(Math.max(Number(req.query.row_limit), 50), 2000)
        : 500;

    const { rows } = await fetchSearchConsoleRows(
      businessContext,
      startDate,
      endDate,
      maxRows
    );

    const standardOpportunities = buildStandardOpportunities(
      businessContext,
      rows
    );
    const cannibalizationRisks = buildCannibalizationRisks(
      businessContext,
      rows
    );

    const opportunities = [
      ...standardOpportunities.sort((a, b) => {
        if ("priority_score" in a && "priority_score" in b) {
          return b.priority_score - a.priority_score;
        }
        return 0;
      }),
      ...cannibalizationRisks
    ].slice(0, 50);

    return res.status(200).json({
      ok: true,
      source: "google_search_console",
      property_key: property.propertyKey,
      property_domain: property.domain,
      site_url: property.siteUrl,
      date_range: {
        start_date: startDate,
        end_date: endDate
      },
      total_rows_analyzed: rows.length,
      opportunities
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Internal server error"
    });
  }
}
