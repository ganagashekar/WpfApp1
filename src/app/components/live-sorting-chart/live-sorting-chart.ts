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
  public chart: ChartComponent |any ;

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
  ].map(set => set.sort((a, b) => b.y - a.y)); // ✅ sort ONCE

  public data: DataPoint[] = this.datasets[0];

  private index = 0;
  private intervalId: number | null = null;

  // =========================
  // CHART CONFIG (STATIC)
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

  public marker = {
    dataLabel: {
      visible: true,
      position: 'Top',
      font: { color: '#ffffff' },
      angle: -90
    }
  };

  public tooltip = { enable: true };

  constructor(private zone: NgZone) {}

  // =========================
  // LOW-CPU LIVE UPDATE
  // =========================
  public load(_: ILoadedEventArgs): void {
    this.clearInterval();

    // ✅ Run OUTSIDE Angular (biggest CPU saver)
    this.zone.runOutsideAngular(() => {
      this.intervalId = window.setInterval(() => {
        const next = this.datasets[this.index % this.datasets.length];

        if (this.chart?.series?.length) {
          // ✅ No new array, no re-sort
          this.chart.series[0].setData(next, 800);
        }

        this.index++;
      }, 2000);
    });
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
