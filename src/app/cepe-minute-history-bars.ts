import {
  Component,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy
} from '@angular/core';

import {
  ChartComponent,
  ChartModule,
  CategoryService,
  ColumnSeriesService,
  TooltipService,
  ILoadedEventArgs
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { LiveDataService } from './services/live-data.service';

interface MinuteRow {
  label: string;   // "13:11"
  CE: number;      // aggregated
  PE: number;      // aggregated
}

@Component({
  selector: 'app-cepe-minute-aggregate-bars',
  standalone: true,
  imports: [ChartModule],
  providers: [
    CategoryService,
    ColumnSeriesService,
    TooltipService
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ejs-chart
      #chart
      [title]="title"
      [primaryXAxis]="xAxis"
      [primaryYAxis]="yAxis"
      [tooltip]="tooltip"
      (load)="onLoad($event)"
    >
      <e-series-collection>

        <e-series
          type="Column"
          name="CE"
          xName="label"
          yName="CE"
          [dataSource]="data"
          [animation]="{ enable: false }">
        </e-series>

        <e-series
          type="Column"
          name="PE"
          xName="label"
          yName="PE"
          [dataSource]="data"
          [animation]="{ enable: false }">
        </e-series>

      </e-series-collection>
    </ejs-chart>
  `
})
export class CePeMinuteAggregateBarsComponent implements OnDestroy {

  @ViewChild('chart', { static: true })
  chart!: ChartComponent;

  title = 'CE vs PE (UI-aggregated per minute)';

  private sub?: Subscription;

  data: MinuteRow[] = [];

  private currentMinute = '';
  private ceSum = 0;
  private peSum = 0;

  public xAxis = {
    valueType: 'Category',
    labelRotation: -90,
    majorGridLines: { width: 0 }
  };

  public yAxis = {
    majorGridLines: { width: 0 }
  };

  public tooltip = {
    enable: true,
    shared: true
  };

  constructor(private liveData: LiveDataService) {}

 onLoad(_: ILoadedEventArgs): void {
  this.sub = this.liveData.cepeLive$
    .subscribe(tick => {
      if (!tick || this.chart.isDestroyed) return;

      const minuteLabel = new Date(tick.ts)
        .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // First render
      if (this.data.length === 0) {
        this.currentMinute = minuteLabel;
        this.data = [{ label: minuteLabel, CE: 0, PE: 0 }];

        this.chart.series[0].dataSource = this.data;
        this.chart.series[1].dataSource = this.data;
        this.chart.dataBind();
        return;
      }

      // New minute → add new bar
      if (minuteLabel !== this.currentMinute) {
        this.currentMinute = minuteLabel;
        this.data.push({ label: minuteLabel, CE: 0, PE: 0 });

        if (this.data.length > 30) this.data.shift();
      }

      // Update last bar (live accumulation)
      const last = this.data[this.data.length - 1];
      last.CE += Number(tick.CE || 0);
      last.PE += Number(tick.PE || 0);

      // 🔥 EXACT same repaint pattern as working strike chart
      this.chart.series[0].dataSource = this.data;
      this.chart.series[1].dataSource = this.data;
      this.chart.dataBind();
    });
}



  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
