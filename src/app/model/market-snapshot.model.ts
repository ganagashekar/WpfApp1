export interface SymbolRowVM {
  Symbol: string;
  BreakoutScore: number;
  FocusScore: number;
  Change:number;
  LTP:number;
  StockName: string;
  NS:string;
}

export interface MarketSnapshot {
  timestamp: string;
  suddenMovers: SymbolRowVM[];
  strongTrends: SymbolRowVM[];
  bestFocus: SymbolRowVM[];
  topChangersNSE: SymbolRowVM[];
  topChangersBSE: SymbolRowVM[];
}

export interface StrikeDepth {
  strike: string;   // e.g. "ATM-100", "45200"
  CE: number;       // Call count / OI / volume
  PE: number;       // Put count / OI / volume
}

export interface CePeTick {
  ts: number;

  // old combined format (still supported)
  CE?: number;
  PE?: number;

  // new separate format
  side?: 'CE' | 'PE';
  value?: number;
}


export interface StrikeRow {
  strike: string;
  CE: number;
  PE: number;
}