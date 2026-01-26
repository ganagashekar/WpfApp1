export interface SymbolRowVM {
  symbol: string;
  breakoutScore: number;
  focusScore: number;
  change:number;
  ltp:number
}

export interface MarketSnapshot {
  timestamp: string;
  suddenMovers: SymbolRowVM[];
  strongTrends: SymbolRowVM[];
  bestFocus: SymbolRowVM[];
}
