import {
  Component,
  ViewChild,
  ChangeDetectionStrategy,
  OnDestroy,
  NgZone
} from '@angular/core';

import {
  ChartComponent,
  ChartModule,
  CategoryService,
  ColumnSeriesService,
  TooltipService
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
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

  private sub?: Subscription;

  data: MinuteRow[] = [];
  intervalMin = 1;
  private currentBucketStart = 0;

  private lastUiUpdate = 0;
  private readonly UI_UPDATE_MS = 1000; // 1 FPS

  public xAxis = { valueType: 'Category', labelRotation: -90, majorGridLines: { width: 0 } };
  public yAxis = { majorGridLines: { width: 0 } };
  public tooltip = { enable: true, shared: true };

  constructor(
    private optionLive: OptionLiveService,
    private zone: NgZone
  ) {}

  onIntervalChange(ev: Event) {
    const select = ev.target as HTMLSelectElement | null;
    if (!select) return;

    this.intervalMin = Number(select.value);
    this.data = [];
    this.currentBucketStart = 0;

    if (this.chart) {
      this.zone.runOutsideAngular(() => {
        this.chart.series[0].dataSource = this.data;
        this.chart.series[1].dataSource = this.data;
        this.chart.refresh();   // ✅ fast reset
      });
    }
  }

  onLoad(_: any): void {
    if (this.sub) return;

    this.optionLive.connect();

    this.sub = this.optionLive.cepeLive$
      .subscribe(tick => {
        if (!tick || this.chart.isDestroyed) return;

        const ts = Number(tick.ts);
        const bucketSizeMs = this.intervalMin * 60_000;
        const bucketStart = Math.floor(ts / bucketSizeMs) * bucketSizeMs;

        if (this.data.length === 0) {
          this.currentBucketStart = bucketStart;
          const label = new Date(bucketStart)
            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          this.data = [{ label, CE: 0, PE: 0 }];
          this.throttledRedraw();
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

        this.throttledRedraw();   // 🔥 1 FPS redraw
      });
  }

  private throttledRedraw() {
    const now = performance.now();
    if (now - this.lastUiUpdate < this.UI_UPDATE_MS) return;
    this.lastUiUpdate = now;

    this.zone.runOutsideAngular(() => {
      this.chart.series[0].dataSource = this.data;
      this.chart.series[1].dataSource = this.data;
      this.chart.refresh();     // ✅ fast realtime redraw
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
