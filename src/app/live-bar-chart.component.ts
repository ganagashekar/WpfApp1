import {
  Component,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy,
  NgZone,
  Input
} from '@angular/core';

import {
  ChartComponent,
  ChartModule,
  CategoryService,
  ColumnSeriesService,
  TooltipService,
  DataLabelService,
  sort,
  ILoadedEventArgs
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { LiveDataService } from './services/live-data.service';
import { MarketSnapshot } from './model/market-snapshot.model';

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
      [tooltip]="{ enable: true }"
      (load)="onLoad($event)"
      (pointRender)="pointRender($event)"
    >
      <e-series-collection>
        <e-series
          type="Column"
          xName="x"
          yName="y"
          [animation]="{ enable: true }">
        </e-series>
      </e-series-collection>
    </ejs-chart>
  `
})
export class LiveBarChartComponent implements OnDestroy {

  // ======================
  // CHART INSTANCE
  // ======================
  @ViewChild('chart', { static: true })
  chart!: ChartComponent | any;

  // ======================
  // INPUTS
  // ======================
  @Input() title = '';
  @Input() colorPalette: string[] = [];
  @Input() mode!: 'sudden' | 'strong' | 'best';

  // ======================
  // INTERNAL STATE
  // ======================
  private sub?: Subscription;
  private chartLoaded = false;

  // ======================
  // AXES
  // ======================
  public xAxis = {
    valueType: 'Category',
    labelRotation: -90,
    interval: 1,
    majorGridLines: { width: 0 }
  };

  public yAxis = {
    majorGridLines: { width: 0 }
  };

  constructor(
    private liveData: LiveDataService,
    private zone: NgZone
  ) {}

  // ======================
  // LOAD (SYNCFUSION-SAFE)
  // ======================
  onLoad(args: ILoadedEventArgs): void {
    if (this.chartLoaded) return;
    this.chartLoaded = true;

    this.sub = this.liveData.raw$.subscribe(raw => {
      if (!raw || document.hidden) return;

      const snapshot = this.parseSnapshot(raw);
      if (!snapshot) return;

      this.updateChart(snapshot);
    });
  }

  // ======================
  // UPDATE CHART
  // ======================
  private updateChart(snapshot: MarketSnapshot): void {
    if (!this.chart?.series?.length || this.chart.isDestroyed) return;
    if (!this.mode) return;

    let data: { x: string; y: number }[];

    switch (this.mode) {
      case 'sudden':
        data = snapshot.suddenMovers.map(x => ({
          x: x.symbol,
          y: x.breakoutScore
        }));
        break;

      case 'strong':
        data = snapshot.strongTrends.map(x => ({
          x: x.symbol,
          y: x.focusScore
        }));
        break;

      case 'best':
        data = snapshot.bestFocus.map(x => ({
          x: x.symbol,
          y: x.breakoutScore * 0.6 + x.focusScore * 0.4
        }));
        break;

      default:
        return;
    }

    // 🔥 SORT BEFORE SETDATA (LIKE OFFICIAL SAMPLE)
    const sorted = sort(data, ['y'], true);

    this.zone.runOutsideAngular(() => {
      // ❌ NO refresh()
      this.chart.series[0].setData(sorted, 500);
    });
  }

  // ======================
  // BAR COLORING
  // ======================
  pointRender(args: any): void {
    if (!this.colorPalette.length) return;
    args.fill =
      this.colorPalette[args.point.index % this.colorPalette.length];
  }

  // ======================
  // CLEANUP
  // ======================
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  // ======================
  // SAFE PARSER
  // ======================
  private parseSnapshot(raw: any): MarketSnapshot | null {
    const sudden = raw.suddenMovers ?? raw.SuddenMovers;
    const strong = raw.strongTrends ?? raw.StrongTrends;
    const best   = raw.bestFocus   ?? raw.BestFocus;

    if (!Array.isArray(sudden) ||
        !Array.isArray(strong) ||
        !Array.isArray(best)) {
      return null;
    }

    return {
      timestamp: raw.timestamp ?? '',
      suddenMovers: sudden,
      strongTrends: strong,
      bestFocus: best
    };
  }
}
