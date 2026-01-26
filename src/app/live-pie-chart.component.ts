import {
  Component,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy,
  Input,
  NgZone
} from '@angular/core';

import {
  AccumulationChartComponent,
  AccumulationChartAllModule,
  IAccLoadedEventArgs
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { throttleTime, filter } from 'rxjs/operators';
import { LiveDataService } from './services/live-data.service';

interface PiePoint {
  x: string;
  y: number | string;
}

interface ChartPoint {
  x: string;
  y: number;
}

@Component({
  selector: 'app-live-pie-chart',
  standalone: true,
  imports: [AccumulationChartAllModule],   // ✅ ONLY THIS
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="width:100%; height:350px;">
      <ejs-accumulationchart
        #pie
        [title]="title"
        height="100%"
        width="100%"
        [legendSettings]="{ visible: true }"
        [tooltip]="{ enable: true }"
        (load)="onLoad($event)"
      >
        <e-accumulation-series-collection>
          <e-accumulation-series
            type="Pie"                       
            [dataSource]="chartData"
            xName="x"
            yName="y"
            [dataLabel]="dataLabel">
          </e-accumulation-series>
        </e-accumulation-series-collection>
      </ejs-accumulationchart>
    </div>
  `
})
export class LivePieChartComponent implements OnDestroy {

  // ======================
  // CHART INSTANCE
  // ======================
  @ViewChild('pie', { static: true })
  pie!: AccumulationChartComponent | any;

  // ======================
  // INPUTS
  // ======================
  @Input() title = 'Sector Distribution';
  @Input() topN = 8;

  // ======================
  // CHART DATA
  // ======================
  public chartData: ChartPoint[] = [
    { x: 'Loading', y: 1 }
  ];

  public dataLabel = {
    visible: true,
    position: 'Outside',
    font: { fontWeight: '600' }
  };

  private sub?: Subscription;
  private loaded = false;

  constructor(
    private liveData: LiveDataService,
    private zone: NgZone
  ) {}

  // ======================
  // LOAD
  // ======================
  onLoad(_: IAccLoadedEventArgs): void {
    if (this.loaded) return;
    this.loaded = true;

    this.sub = this.liveData.sector$
      .pipe(
        throttleTime(1000),
        filter(Array.isArray)
      )
      .subscribe(data => {
        if (document.hidden) return;
        this.updatePie(data as PiePoint[]);
      });
  }

  // ======================
  // NORMALIZE DATA
  // ======================
  private normalize(data: PiePoint[]): ChartPoint[] {
    const out: ChartPoint[] = [];

    for (const d of data) {
      const value = Number(d.y);
      if (Number.isFinite(value) && value > 0) {
        out.push({ x: d.x, y: value });
      }
    }

    return out;
  }

  // ======================
  // UPDATE PIE
  // ======================
  private updatePie(data: PiePoint[]): void {
    if (!this.pie?.series?.length || this.pie.isDestroyed) return;

    let cleaned = this.normalize(data);

    // Syncfusion pie cannot render total = 0
    if (cleaned.length === 0) {
      cleaned = [{ x: 'No Data', y: 1 }];
    }

    const sliced = this.topN
      ? [...cleaned].sort((a, b) => b.y - a.y).slice(0, this.topN)
      : cleaned;

    this.zone.runOutsideAngular(() => {
      this.chartData = sliced;
      this.pie.series[0].setData(sliced, 400);
    });
  }

  // ======================
  // CLEANUP
  // ======================
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
