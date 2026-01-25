import { Component, ChangeDetectionStrategy, NgZone } from '@angular/core';
import {
  ChartModule,
  LineSeriesService,
  CategoryService,
  TooltipService
} from '@syncfusion/ej2-angular-charts';

@Component({
  selector: 'app-live-chart',
  standalone: true,
  imports: [ChartModule],
  template: `
    <ejs-chart
      [primaryXAxis]="xAxis"
      [primaryYAxis]="yAxis"
      [tooltip]="tooltip"
      height="400px"
    >
      <e-series-collection>
        <e-series
          type="Line"
          [dataSource]="data"
          xName="x"
          yName="y"
          name="Price"
        ></e-series>
      </e-series-collection>
    </ejs-chart>
  `,
  providers: [
    LineSeriesService,
    CategoryService,
    TooltipService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiveChartComponent {

  data: { x: string; y: number }[] = [];

  xAxis = { valueType: 'Category' };
  yAxis = { title: 'Value' };
  tooltip = { enable: true };

  constructor(private zone: NgZone) {
    this.startMockFeed(); // temporary, replace with WS
  }

  // 🔥 Simulates live feed (very cheap)
  startMockFeed() {
    setInterval(() => {
      const point = {
        x: new Date().toLocaleTimeString(),
        y: Math.round(Math.random() * 100)
      };

      // 🔑 Enter Angular ONLY when data updates
      this.zone.run(() => {
        this.data.push(point);
        if (this.data.length > 20) this.data.shift();
      });

    }, 500);
  }
}


export interface SymbolRowVM {
  symbol: string;
  ltp: number;
  breakoutScore: number;
  focusScore: number;
  momentum: number;
  changePct: number;
  volume: number;
}

export interface MarketSnapshot {
  timestamp: string;

  suddenMovers: SymbolRowVM[];
  strongTrends: SymbolRowVM[];
  bestFocus: SymbolRowVM[];
  earlyBursts: SymbolRowVM[];
}
