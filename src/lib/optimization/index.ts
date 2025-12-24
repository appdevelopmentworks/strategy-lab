/**
 * Optimization Module
 */

export {
  runGridSearch,
  getDefaultParameterRanges,
  estimateCombinations,
  type GridSearchConfig,
  type GridSearchResult,
  type ParameterRange,
} from './grid-search'

export {
  runMonteCarloSimulation,
  runBootstrapSimulation,
  type MonteCarloConfig,
  type MonteCarloResult,
} from './monte-carlo'

export {
  runWalkForward,
  evaluateOverfitRisk,
  getWalkForwardRecommendation,
  type WalkForwardConfig,
  type WalkForwardResult,
  type WalkForwardWindow,
} from './walk-forward'

export {
  runPortfolioOptimization,
  calculateReturns,
  getMethodDescription,
  type PortfolioConfig,
  type PortfolioResult,
  type PortfolioAsset,
  type PortfolioOptMethod,
} from './portfolio'
