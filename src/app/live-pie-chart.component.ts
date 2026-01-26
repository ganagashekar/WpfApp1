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
  AccumulationChartModule,
  PieSeriesService,
  AccumulationLegendService,
  AccumulationTooltipService,
  IAccLoadedEventArgs
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { throttleTime } from 'rxjs/operators';
import { LiveDataService } from './services/live-data.service';

interface PiePoint {
  x: string;
  y: number;
}

@Component({
  selector: 'app-live-pie-chart',
  standalone: true,
  imports: [AccumulationChartModule],
  providers: [
    PieSeriesService,
    AccumulationLegendService,
    AccumulationTooltipService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ejs-accumulationchart
      #pie
      [title]="title"
      [legendSettings]="{ visible: true }"
      [tooltip]="{ enable: true }"
      (load)="onLoad($event)"
    >
      <e-accumulation-series-collection>
        <e-accumulation-series
          [type]="type"
          xName="x"
          yName="y"
          [dataLabel]="dataLabel">
        </e-accumulation-series>
      </e-accumulation-series-collection>
    </ejs-accumulationchart>
  `
})
export class LivePieChartComponent implements OnDestroy {

  @ViewChild('pie', { static: true })
  pie!: AccumulationChartComponent | any;

  // ======================
  // INPUTS
  // ======================
  @Input() title = 'Sector Distribution';
  @Input() type: 'Pie' | 'Doughnut' = 'Pie';
  @Input() topN = 8;

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
  // LOAD — SAME AS SAMPLE
  // ======================
  onLoad(args: IAccLoadedEventArgs): void {
    if (this.loaded) return;
    this.loaded = true;

    this.sub = this.liveData.raw$
      .pipe(throttleTime(1000)) // Pie chart = low FPS
      .subscribe((sectorData: PiePoint[]) => {
        if (!sectorData || document.hidden) return;
        this.updatePie(sectorData);
      });
  }

  // ======================
  // UPDATE — SAME AS SAMPLE
  // ======================
  private updatePie(data: PiePoint[]): void {
    if (!this.pie?.series?.length || this.pie.isDestroyed) return;

    const sliced = this.topN
      ? [...data].sort((a, b) => b.y - a.y).slice(0, this.topN)
      : data;

    this.zone.runOutsideAngular(() => {
      (this.pie.series[0]).setData(sliced, 500);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
