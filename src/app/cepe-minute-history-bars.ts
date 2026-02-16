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
  TooltipService
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { OptionLiveService } from './services/option-live.service';

interface MinuteRow {
  label: string;
  CE: number;
  PE: number;
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
    <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
      <label>Interval:</label>
     <select (change)="onIntervalChange($event)">
  <option value="1">1 min</option>
  <option value="3">3 min</option>
  <option value="5">5 min</option>
</select>

    </div>

    <ejs-chart
      #chart
      [primaryXAxis]="xAxis"
      [primaryYAxis]="yAxis"
      [tooltip]="tooltip"
      (load)="onLoad($event)">
      <e-series-collection>
        <e-series type="Column" name="CE" xName="label" yName="CE"
          [dataSource]="data" [animation]="{ enable: false }">
        </e-series>

        <e-series type="Column" name="PE" xName="label" yName="PE"
          [dataSource]="data" [animation]="{ enable: false }">
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
  intervalMin = 1;
  private currentBucketStart = 0;

  public xAxis = { valueType: 'Category', labelRotation: -90, majorGridLines: { width: 0 } };
  public yAxis = { majorGridLines: { width: 0 } };
  public tooltip = { enable: true, shared: true };

  constructor(private optionLive: OptionLiveService) {}

  onIntervalChange(ev: Event) {
  const select = ev.target as HTMLSelectElement | null;
  if (!select) return;

  this.intervalMin = Number(select.value);

  // reset aggregation
  this.data = [];
  this.currentBucketStart = 0;

  if (this.chart) {
    this.chart.series[0].dataSource = this.data;
    this.chart.series[1].dataSource = this.data;
    this.chart.dataBind();
  }
}

  onLoad(_: any): void {
  if (this.sub) return;

  this.optionLive.connect();

  this.sub = this.optionLive.cepeLive$
    .subscribe(tick => {
      if (!tick || this.chart.isDestroyed) return;

      console.log('📥 CEPE tick:', tick);  // TEMP

      const ts = Number(tick.ts);
      const bucketSizeMs = this.intervalMin * 60_000;
      const bucketStart = Math.floor(ts / bucketSizeMs) * bucketSizeMs;

      if (this.data.length === 0) {
        this.currentBucketStart = bucketStart;

        const label = new Date(bucketStart)
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.data = [{ label, CE: 0, PE: 0 }];

        this.chart.series[0].dataSource = this.data;
        this.chart.series[1].dataSource = this.data;
        this.chart.dataBind();
        return;
      }

      if (bucketStart !== this.currentBucketStart) {
        this.currentBucketStart = bucketStart;

        const label = new Date(bucketStart)
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.data.push({ label, CE: 0, PE: 0 });
        if (this.data.length > 30) this.data.shift();
      }

      const last = this.data[this.data.length - 1];
      if (tick.side === 'CE') last.CE += 1;
      else if (tick.side === 'PE') last.PE += 1;

      this.chart.series[0].dataSource = this.data;
      this.chart.series[1].dataSource = this.data;
      this.chart.dataBind();
    });
}


  // onIntervalChange(v: string) {
  //   this.intervalMin = Number(v);
  //   this.data = [];
  //   this.currentBucketStart = 0;

  //   if (this.chart) {
  //     this.chart.series[0].dataSource = this.data;
  //     this.chart.series[1].dataSource = this.data;
  //     this.chart.dataBind();
  //   }
  // }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
