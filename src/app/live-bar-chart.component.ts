import {
  Component,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy,
  Input,
  NgZone
} from '@angular/core';

import {
  ChartComponent,
  ChartModule,
  CategoryService,
  ColumnSeriesService,
  TooltipService,
  DataLabelService,
  ILoadedEventArgs,
  ITooltipRenderEventArgs
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { LiveDataService } from './services/live-data.service';
import { MarketSnapshot } from './model/market-snapshot.model';

/* =======================
   INTERFACES
======================= */
interface TooltipItem {
  symbol: string;
  ltp: number;
  score: number;
}

interface ChartRow {
  x: string;              // Change label (ex: "1.25%")
  y: number;              // Numeric change
  items: TooltipItem[];   // Multiple symbols
  color: string;
  symbol:string
}

@Component({
  selector: 'app-live-bar-chart',
  standalone: true,
  imports: [ChartModule],
  providers: [
    CategoryService,
    ColumnSeriesService,
    TooltipService,
    DataLabelService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ejs-chart
      #chart
      [title]="title"
      [primaryXAxis]="xAxis"
      [primaryYAxis]="yAxis"
      [legendSettings]="{ visible: false }"
      [tooltip]="tooltip"
      (load)="onLoad($event)"
      (tooltipRender)="onTooltipRender($event)"
    >
      <e-series-collection>
        <e-series
          type="Column"
          xName="x"
          yName="y"
         [marker]="marker"
          pointColorMapping="color"
          [animation]="{ enable: false }">
        </e-series>
      </e-series-collection>
    </ejs-chart>
  `
})
export class LiveBarChartComponent implements OnDestroy {

  @ViewChild('chart', { static: true })
  chart!: ChartComponent;

  @Input() title = '';
  @Input() colorPalette: string[] = [];
  @Input() mode!: 'sudden' | 'strong' | 'best'| 'topchangeNSE' | 'topchangeBSE';

  private sub?: Subscription;
  private chartLoaded = false;

  /* =======================
     AXES
  ======================= */
  public xAxis = {
    valueType: 'Category',
    labelRotation: -90,
    majorGridLines: { width: 0 }
  };

  public yAxis = {
    majorGridLines: { width: 0 }
  };

  /* =======================
     TOOLTIP
  ======================= */
  public tooltip = {
    enable: true,
    shared: false,
    enableHtmlSanitizer: false
  };

  
  constructor(
    private liveData: LiveDataService,
    private zone: NgZone
  ) {}

  /* =======================
     LOAD (ONCE)
  ======================= */
  onLoad(_: ILoadedEventArgs): void {
    if (this.chartLoaded) return;
    this.chartLoaded = true;

    this.sub = this.liveData.snapshot$
      .subscribe(snapshot => {
        if (!snapshot || document.hidden) return;
        this.updateChart(snapshot);
      });
  }

public marker: Object = {
  dataLabel: {
    visible: true,
     name: 'symbol',       
    position: 'Top',
    font: { color: '#ffffff' },
    size: '12px',
    enableRotation: true,
    angle: -90
  }
};


  /* =======================
     TOOLTIP (MULTIPLE ITEMS)
  ======================= */
  onTooltipRender(args: ITooltipRenderEventArgs): void {
    const data = args.series?.dataSource as ChartRow[];
    if (!data) return;

    const row = data[args.point.index];
    if (!row || !row.items?.length) return;

    let html = `<b>Change: ${row.x}</b><br/><br/>`;

    row.items.forEach((i: TooltipItem) => {
      html += `
        ${i.symbol}<br/>
        LTP : <b>₹${i.ltp.toFixed(2)}</b><br/>
        Score : ${i.score.toFixed(2)}
      `;
    });

    args.text = html;
  }

  /* =======================
     UPDATE CHART
  ======================= */
  private updateChart(snapshot: MarketSnapshot): void {
    if (!this.chart?.series?.length || this.chart.isDestroyed) return;

    let data: ChartRow[] = [];

    switch (this.mode) {
      case 'topchangeNSE':
        data = this.buildAggregatedData(snapshot.topChangersNSE);
        break;

      case 'topchangeBSE':
        data = this.buildAggregatedData(snapshot.topChangersBSE);
        break;
      //  case 'sudden':
      //   data = this.buildAggregatedData(snapshot.suddenMovers);
      //   data = snapshot.suddenMovers.map(x => ({
      //     x: x.symbol,
      //     y: x.breakoutScore
      //   }));
      //   break;

      // case 'strong':
      //   data = snapshot.strongTrends.map(x => ({
      //     x: x.symbol,
      //     y: x.focusScore
      //   }));
      //   break;

      // case 'best':
      //   data = snapshot.bestFocus.map(x => ({
      //     x: x.symbol,
      //     y: x.breakoutScore * 0.6 + x.focusScore * 0.4
      //   }));
      //   break;

      default:
        return;
    }

    this.zone.runOutsideAngular(() => {
      this.chart.series[0].dataSource = data;
      this.chart.refresh();
    });
  }

  /* =======================
     AGGREGATION LOGIC
  ======================= */
  private buildAggregatedData(rows: any[]): ChartRow[] {
    const map = new Map<number, TooltipItem[]>();

    rows.forEach(r => {
      if (!map.has(r.Change)) {
        map.set(r.Change, []);
      }
      map.get(r.Change)!.push({
        symbol: r.NS,
        ltp: r.LTP,
        score: r.Change
      });
    });

    const result: ChartRow[] = [];
    let i = 0;

    map.forEach((items, change) => {
      result.push({
        x: `${change}%`,
        y: change,
         symbol: items[0]?.symbol ?? '', 
        items,
        color: this.pickColor(i++)
      });
    });

    // Sort once (descending)
    return result.sort((a, b) => b.y - a.y);
  }

  /* =======================
     COLOR PICKER
  ======================= */
  private pickColor(index: number): string {
    if (!this.colorPalette.length) return '#4caf50';
    return this.colorPalette[index % this.colorPalette.length];
  }

  /* =======================
     DESTROY
  ======================= */
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
