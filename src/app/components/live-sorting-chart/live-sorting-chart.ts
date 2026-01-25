import {
  Component,
  NgZone,
  ChangeDetectionStrategy,
  ViewChild,
  OnDestroy
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
export class LiveSortingChartComponent implements OnDestroy {

  @ViewChild('chart', { static: true })
  public chart: ChartComponent | any ;

  // =========================
  // DATA (PRE-SORTED ONCE)
  // =========================
  private datasets: DataPoint[][] = [
    [
      { x: 'India', y: 97.21 }, { x: 'France', y: 95.21 },
      { x: 'Indonesia', y: 62.74 }, { x: 'Iceland', y: 61.71 },
      { x: 'United States', y: 57.97 }, { x: 'Greece', y: 57.51 },
      { x: 'Iran', y: 55.31 }, { x: 'Canada', y: 48.76 },
      { x: 'Finland', y: 48.50 }, { x: 'Brazil', y: 45.13 }
    ],
    [
      { x: 'India', y: 102.54 }, { x: 'France', y: 90.76 },
      { x: 'Indonesia', y: 64.61 }, { x: 'Iceland', y: 70.95 },
      { x: 'United States', y: 61.52 }, { x: 'Greece', y: 49.03 },
      { x: 'Iran', y: 33.05 }, { x: 'Canada', y: 59.83 },
      { x: 'Finland', y: 43.13 }, { x: 'Brazil', y: 55.56 }
    ],
    [
      { x: 'India', y: 111.84 }, { x: 'France', y: 95.53 },
      { x: 'Indonesia', y: 55.15 }, { x: 'Iceland', y: 85.79 },
      { x: 'United States', y: 59.53 }, { x: 'Greece', y: 58.93 },
      { x: 'Iran', y: 46.53 }, { x: 'Canada', y: 59.52 },
      { x: 'Finland', y: 45.67 }, { x: 'Brazil', y: 67.84 }
    ]
  ].map(set => set.sort((a, b) => b.y - a.y)); // ✅ sort once

  public data: DataPoint[] = this.datasets[0];

  private index = 0;
  private intervalId: number | null = null;

  // =========================
  // CHART CONFIG
  // =========================
  public title = 'Nitrogen Fertilizer Usage';

  public primaryXAxis = {
    valueType: 'Category',
    labelRotation: -90,
    interval: 1,
    majorGridLines: { width: 0 }
  };

  public primaryYAxis = {
    title: 'Nitrogen Fertilizer Use (KG/Ha)',
    interval: 20,
    majorGridLines: { width: 0 }
  };

  public legendSettings = { visible: false };
  public tooltip = { enable: true };

  public marker = {
    dataLabel: {
      visible: true,
      position: 'Top'
    }
  };

  constructor(private zone: NgZone) {}

  // =========================
  // LIVE UPDATE (LOW CPU)
  // =========================
  public load(_: ILoadedEventArgs): void {
    this.clearInterval();

    this.zone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {

        if (document.hidden) return; // optional CPU saver

        const next = this.datasets[this.index % this.datasets.length];

        if (this.chart?.series?.length) {
          this.chart.series[0].setData(next); // ✅ no animation
        }

        this.index++;
      }, 2000);
    });
  }

  // =========================
  // COLOR PER COLUMN (OPTION-1)
  // =========================
  public pointRender(args: IPointRenderEventArgs): void {
    const COLORS = [
      '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336',
      '#00BCD4', '#8BC34A', '#FFC107', '#3F51B5', '#E91E63'
    ];

    args.fill = COLORS[args.point.index % COLORS.length];
  }

  public axisRangeCalculated(args: IAxisRangeCalculatedEventArgs): void {
    if (args.axis.name === 'primaryYAxis') {
      args.interval = args.maximum > 120 ? 30 : 20;
      args.maximum = Math.min(args.maximum, 150);
    }
  }

  ngOnDestroy(): void {
    this.clearInterval();
  }

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
