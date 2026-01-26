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

  @ViewChild('chart', { static: true })
  chart!: ChartComponent | any;

  @Input() title = '';
  @Input() colorPalette: string[] = [];
  @Input() mode!: 'sudden' | 'strong' | 'best';

  private sub?: Subscription;
  private chartLoaded = false;

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
  // LOAD (SYNCFUSION SAFE)
  // ======================
  onLoad(_: ILoadedEventArgs): void {
    if (this.chartLoaded) return;
    this.chartLoaded = true;

    this.sub = this.liveData.snapshot$
      .subscribe(snapshot => {
        if (!snapshot || document.hidden) return;
        this.updateChart(snapshot);
      });
  }

  // ======================
  // UPDATE CHART
  // ======================
  private updateChart(snapshot: MarketSnapshot): void {
    if (!this.chart?.series?.length || this.chart.isDestroyed) return;

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

    const sorted = sort(data, ['y'], true);

    this.zone.runOutsideAngular(() => {
      this.chart.series[0].setData(sorted, 500);
    });
  }

  pointRender(args: any): void {
    if (!this.colorPalette.length) return;
    args.fill =
      this.colorPalette[args.point.index % this.colorPalette.length];
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
