export const BUSINESS_CONFIG = {
  goals: {
    prioritizeRunway: true,
    prioritizeImmediateCash: true,
    strategicValidationMatters: true
  },

  founders: {
    nickHoursPerWeek: 30,
    boHoursPerWeek: 7,
    devResources: "ai-only",
    teamSize: 2,
    capitalConstraint: "high"
  },

  searchConsole: {
    properties: {
      "bomme-studio": {
        domain: "bommestudio.com",
        siteUrl: "sc-domain:bommestudio.com",
        homepage: "https://www.bommestudio.com/"
      },
      bommesport: {
        domain: "bommesport.com",
        siteUrl: "sc-domain:bommesport.com",
        homepage: "https://bommesport.com/"
      }
    },
    defaultProperty: "bomme-studio"
  },

  channels: {
    seo_authority: {
      label: "BOMME SEO Authority",
      avgRevenue: 2000,
      margin: 0.9,
      channelPriority: 0.6,
      cashflowModifier: 0.5,
      founderDependency: "low"
    },

    studio_production: {
      label: "BOMME Studio Production",
      avgRevenue: 35000,
      margin: 0.425,
      channelPriority: 1.0,
      cashflowModifier: 1.0,
      founderDependency: "high",
      maxParallel: 3
    },

    studio_development: {
      label: "BOMME Studio Development",
      avgRevenue: 10000,
      margin: 0.6,
      channelPriority: 0.95,
      cashflowModifier: 1.0,
      founderDependency: "high",
      monthlyCapacity: 20
    },

    digital_assets: {
      label: "BOMME Studio Digital Assets",
      avgRevenue: 99,
      margin: 0.9,
      channelPriority: 0.85,
      cashflowModifier: 1.0,
      founderDependency: "low"
    },

    bommesport_dtc: {
      label: "BOMMESPORT DTC",
      avgRevenue: 80,
      conversionRate: 0.0073,
      margin: 0.515,
      affiliateMargin: 0.4,
      channelPriority: 0.65,
      cashflowModifier: 0.35,
      founderDependency: "medium"
    },

    bommesport_amazon: {
      label: "BOMMESPORT Amazon",
      avgRevenue: 80,
      margin: 0.3,
      channelPriority: 0.6,
      cashflowModifier: 0.35,
      founderDependency: "medium"
    },

    pattern_vault: {
      label: "BOMME Pattern Vault",
      avgRevenue: 139,
      margin: 0.9,
      channelPriority: 0.55,
      cashflowModifier: 0.25,
      founderDependency: "low",
      devHeavy: true
    },

    studiolab: {
      label: "StudioLab",
      avgRevenue: 0,
      margin: 0.9,
      channelPriority: 0.3,
      cashflowModifier: 0.2,
      founderDependency: "low",
      devHeavy: true
    }
  },

  intentWeights: {
    buyer: 1.0,
    commercial: 0.85,
    "commercial investigation": 0.75,
    research: 0.55,
    informational: 0.3,
    educational: 0.3,
    mixed: 0.5
  },

  timeHorizonWeights: {
    short: 2.0,
    medium: 1.2,
    long: 0.8,
    compounding: 1.1
  },

  difficultyWeights: {
    simple_seo_page: 1,
    content_cluster: 2,
    landing_page: 2,
    comparison_page: 2,
    digital_asset_pdf: 2,
    calculator_tool: 4,
    database_directory: 5,
    saas_platform: 7,
    marketplace_system: 8
  },

  seo: {
    homepage: "https://www.bommestudio.com/",

    protectedPrimaryTopics: {
      "https://www.bommestudio.com/": "clothing manufacturer",
      "https://bommesport.com/": "heavyweight hoodie"
    },

    pagePriorities: {
      "bomme-studio": {
        "https://www.bommestudio.com/": 100,
        "https://www.bommestudio.com/private-label-clothing": 98,
        "https://www.bommestudio.com/full-package-production": 96,
        "https://www.bommestudio.com/contract-clothing-manufacturer-for-select-clients": 95,
        "https://www.bommestudio.com/los-angeles-clothing-production": 90,
        "https://www.bommestudio.com/activewear-manufacturers": 88,
        "https://www.bommestudio.com/t-shirt-manufacturers": 87,
        "https://www.bommestudio.com/loungewear-manufacturers": 84,
        "https://www.bommestudio.com/underwear-manufacturer": 82,
        "https://www.bommestudio.com/streetwear-clothing-manufacturers": 70,
        "https://www.bommestudio.com/clothing-sample-development": 78,
        "https://www.bommestudio.com/patternmakers-los-angeles": 72,
        "https://www.bommestudio.com/sample-makers-los-angeles": 72,
        "https://www.bommestudio.com/free-tech-pack-template": 76,
        "https://www.bommestudio.com/fabric-shrinkage-calculator": 68,
        "https://www.bommestudio.com/academy/clothing-tech-pack-guide": 50,
        "https://www.bommestudio.com/how-to-start-a-clothing-line": 52,
        "https://www.bommestudio.com/how-to-start-clothing-company-expert-guides-business-tools": 54
      },

      bommesport: {
        "https://bommesport.com/": 100,
        "https://bommesport.com/products/heavyweight-hoodie": 98,
        "https://bommesport.com/products/heavyweight-crewneck": 94,
        "https://bommesport.com/products/heavyweight-jogger": 92,
        "https://bommesport.com/collections/all": 75,
        "https://bommesport.com/pages/size-guide": 45
      }
    },

    pageGroups: {
      moneyPages: [
        "https://www.bommestudio.com/",
        "https://www.bommestudio.com/private-label-clothing",
        "https://www.bommestudio.com/full-package-production",
        "https://www.bommestudio.com/contract-clothing-manufacturer-for-select-clients",
        "https://www.bommestudio.com/los-angeles-clothing-production",
        "https://www.bommestudio.com/activewear-manufacturers",
        "https://www.bommestudio.com/t-shirt-manufacturers",
        "https://www.bommestudio.com/loungewear-manufacturers",
        "https://www.bommestudio.com/underwear-manufacturer"
      ],

      developmentPages: [
        "https://www.bommestudio.com/clothing-sample-development",
        "https://www.bommestudio.com/patternmakers-los-angeles",
        "https://www.bommestudio.com/sample-makers-los-angeles"
      ],

      leadMagnets: [
        "https://www.bommestudio.com/free-tech-pack-template",
        "https://www.bommestudio.com/fabric-shrinkage-calculator"
      ]
    },

excludedUrlPatterns: [
  "/blog/category/",
  "/blog/tag/",
  "/fabric-dictionary/category/",
  "/fabric-dictionary/tag/",
  "/tag/",
  "/category/",
  "/author/",
  "/custom-clothing/p/",
  "new-home-1",
  "/cdn/shop/",
  "?variant=",
  "&country=",
  "&currency=",
  "utm_",
  "/pages/return-exchange-policy",
  "/pages/sitemap",
  "http://"
],
    
    deprioritizedUrlPatterns: [
      "/blog/",
      "/press",
      "/fashion-lgbt-scholarship",
      "/bomme-aw19",
      "/vogue",
      "/lafw"
    ],

    moneyPageIndicators: [
      "manufacturer",
      "private-label",
      "production",
      "contract-clothing",
      "full-package",
      "sample-development",
      "patternmakers",
      "products/heavyweight-hoodie",
      "products/heavyweight-crewneck",
      "products/heavyweight-jogger"
    ],

    priorityQueries: [
      "clothing manufacturer",
      "apparel manufacturer",
      "private label clothing manufacturer",
      "cut and sew manufacturer",
      "clothing manufacturer usa",
      "clothing manufacturer for startups",
      "low moq clothing manufacturer",
      "activewear manufacturer",
      "t shirt manufacturer",
      "loungewear manufacturer",
      "underwear manufacturer",
      "heavyweight hoodie",
      "oversized hoodie",
      "blank hoodie",
      "french terry hoodie"
    ],

    queryIntentRules: {
      buyer: [
        "manufacturer",
        "private label",
        "factory",
        "production company",
        "contract clothing",
        "apparel manufacturer",
        "heavyweight hoodie",
        "oversized hoodie",
        "blank hoodie"
      ],
      commercial: [
        "cost",
        "pricing",
        "quote",
        "sample development",
        "patternmaker",
        "los angeles",
        "best",
        "premium"
      ],
      educational: [
        "how to",
        "guide",
        "template",
        "example",
        "checklist"
      ]
    },

    scoring: {
      pagePriorityWeight: 0.45,
      impressionsWeight: 0.2,
      positionWeight: 0.2,
      ctrGapWeight: 0.15,
      moneyPageBonus: 20,
      homepageBonus: 15,
      protectedTopicPenalty: 30,
      lowValuePagePenalty: 40,
      nearPageOneMin: 5,
      nearPageOneMax: 20,
      strongImpressionThreshold: 1000,
      weakCtrThreshold: 0.03
    }
  }
};
