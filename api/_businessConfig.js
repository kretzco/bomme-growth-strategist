export const BUSINESS_CONFIG = {
  goals: {
    prioritizeRunway: true,
    prioritizeImmediateCash: true,
    strategicValidationMatters: true
  },

  founders: {
    nickHoursPerWeek: 30,
    boHoursPerWeek: 7,
    devResources: 'ai-only',
    teamSize: 2,
    capitalConstraint: 'high'
  },

  channels: {
    seo_authority: {
      label: 'BOMME SEO Authority',
      avgRevenue: 2000,
      margin: 0.90,
      channelPriority: 0.60,
      cashflowModifier: 0.50,
      founderDependency: 'low'
    },

    studio_production: {
      label: 'BOMME Studio Production',
      avgRevenue: 35000,
      margin: 0.425,
      channelPriority: 1.0,
      cashflowModifier: 1.0,
      founderDependency: 'high',
      maxParallel: 3
    },

    studio_development: {
      label: 'BOMME Studio Development',
      avgRevenue: 10000,
      margin: 0.60,
      channelPriority: 0.95,
      cashflowModifier: 1.0,
      founderDependency: 'high',
      monthlyCapacity: 20
    },

    digital_assets: {
      label: 'BOMME Studio Digital Assets',
      avgRevenue: 99,
      margin: 0.90,
      channelPriority: 0.85,
      cashflowModifier: 1.0,
      founderDependency: 'low'
    },

    bommesport_dtc: {
      label: 'BOMMESPORT DTC',
      avgRevenue: 80,
      conversionRate: 0.0073,
      margin: 0.515,
      affiliateMargin: 0.40,
      channelPriority: 0.65,
      cashflowModifier: 0.35,
      founderDependency: 'medium'
    },

    bommesport_amazon: {
      label: 'BOMMESPORT Amazon',
      avgRevenue: 80,
      margin: 0.30,
      channelPriority: 0.60,
      cashflowModifier: 0.35,
      founderDependency: 'medium'
    },

    pattern_vault: {
      label: 'BOMME Pattern Vault',
      avgRevenue: 139,
      margin: 0.90,
      channelPriority: 0.55,
      cashflowModifier: 0.25,
      founderDependency: 'low',
      devHeavy: true
    },

    studiolab: {
      label: 'StudioLab',
      avgRevenue: 0,
      margin: 0.90,
      channelPriority: 0.30,
      cashflowModifier: 0.20,
      founderDependency: 'low',
      devHeavy: true
    }
  },

  intentWeights: {
    buyer: 1.0,
    commercial: 0.85,
    'commercial investigation': 0.75,
    research: 0.55,
    informational: 0.30,
    educational: 0.30,
    mixed: 0.50
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
  }
};
