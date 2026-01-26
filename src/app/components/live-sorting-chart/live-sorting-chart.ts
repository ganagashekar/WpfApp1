import {
  Component,
  NgZone,
  ChangeDetectionStrategy,
  ViewChild,
  OnDestroy,
  OnInit
} from '@angular/core';

import {
  ChartModule,
  ChartComponent,
  ILoadedEventArgs,
  IAxisRangeCalculatedEventArgs,
  IPointRenderEventArgs,
  CategoryService,
  ColumnSeriesService,
  TooltipService,
  DataLabelService
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { LiveDataService } from '../../services/live-data.service';
import { MarketSnapshot } from '../../model/market-snapshot.model';


interface DataPoint {
  x: string;
  y: number;
}

@Component({
  selector: 'app-live-sorting-chart',
  standalone: true,
  imports: [ChartModule],
  providers: [
    CategoryService,
    ColumnSeriesService,
    TooltipService,
    DataLabelService
  ],
  templateUrl: './live-sorting-chart.html',
  styleUrl: './live-sorting-chart.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiveSortingChartComponent
  implements OnInit, OnDestroy {

  @ViewChild('chart', { static: true })
  public chart!: ChartComponent |any ;

  public data: DataPoint[] = [];
  public title = 'Top Sudden Movers';

  private sub?: Subscription;

  public primaryXAxis = {
    valueType: 'Category',
    interval: 1,
    labelRotation: -90,
    majorGridLines: { width: 0 }
  };

  public primaryYAxis = {
    title: 'Score',
    interval: 20,
    majorGridLines: { width: 0 }
  };

  public legendSettings = { visible: false };
  public tooltip = { enable: true };

  public marker = {
    dataLabel: {
      visible: true,
      position: 'Top',
      font: {
        fontWeight: '600',
        size: '12px'
      }
    }
  };

  constructor(
    private liveData: LiveDataService,
    private zone: NgZone
  ) {}

  // =========================
  // INIT
  // =========================
  ngOnInit(): void {
    this.liveData.connect();

    // this.sub = this.liveData.snapshot$
    //   .subscribe(snapshot => {
    //     if (!snapshot || document.hidden) return;

    //     this.updateChart(snapshot);
    //   });
  }

  // =========================
  // UPDATE CHART (FAST PATH)
  // =========================
  private updateChart(snapshot: MarketSnapshot): void {
    if (!this.chart?.series?.length || this.chart.isDestroyed) return;

    // Example: Sudden Movers → chart
    const points: DataPoint[] =
      snapshot.suddenMovers.map(x => ({
        x: x.symbol,
        y: x.breakoutScore
      }));

    // 🚀 Fastest Syncfusion update
    this.zone.runOutsideAngular(() => {
      this.chart.series[0].setData(points, false);
      this.chart.refresh();
    });
  }

  // =========================
  // BAR COLOR
  // =========================
  public pointRender(args: IPointRenderEventArgs): void {
    const COLORS = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
      '#00BCD4', '#8BC34A', '#FFC107', '#3F51B5', '#E91E63'
    ];
    args.fill = COLORS[args.point.index % COLORS.length];
  }

  public axisRangeCalculated(
    args: IAxisRangeCalculatedEventArgs
  ): void {
    if (args.axis.name === 'primaryYAxis') {
      args.interval = args.maximum > 120 ? 30 : 20;
    }
  }

  // =========================
  // CLEANUP
  // =========================
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.liveData.close();
  }
}
