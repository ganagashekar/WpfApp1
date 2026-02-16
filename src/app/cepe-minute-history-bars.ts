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

  <div style="display:flex; gap:8px; align-items:center; margin-bottom:8px;">
  <label>Interval:</label>
 <select (change)="onIntervalChange($any($event.target).value)">
  <option value="1">1 min</option>
  <option value="3">3 min</option>
  <option value="5">5 min</option>
</select>

</div>
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

//  onLoad(_: ILoadedEventArgs): void {
//   this.sub = this.liveData.cepeLive$
//     .subscribe(tick => {
//       if (!tick || this.chart.isDestroyed) return;

//       const ts = Number(tick.ts);
//       const bucketSizeMs = this.intervalMin * 60_000;

//       // floor timestamp to bucket start
//       const bucketStart = Math.floor(ts / bucketSizeMs) * bucketSizeMs;

//       // First render
//       if (this.data.length === 0) {
//         this.currentBucketStart = bucketStart;

//         const label = new Date(bucketStart)
//           .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//         this.data = [{ label, CE: 0, PE: 0 }];

//         this.chart.series[0].dataSource = this.data;
//         this.chart.series[1].dataSource = this.data;
//         this.chart.dataBind();
//         return;
//       }

//       // New bucket → add new bar
//       if (bucketStart !== this.currentBucketStart) {
//         this.currentBucketStart = bucketStart;

//         const label = new Date(bucketStart)
//           .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

//         this.data.push({ label, CE: 0, PE: 0 });

//         if (this.data.length > 30) this.data.shift();
//       }

//       // Update last bar (live accumulation)
//       const last = this.data[this.data.length - 1];
//       last.CE += Number(tick.CE || 0);
//       last.PE += Number(tick.PE || 0);

//       // 🔥 same repaint pattern as your working strike chart
//       this.chart.series[0].dataSource = this.data;
//       this.chart.series[1].dataSource = this.data;
//       this.chart.dataBind();
//     });
// }

onLoad(_: ILoadedEventArgs): void {
  this.sub = this.liveData.cepeLive$
    .subscribe(tick => {
      if (!tick || this.chart.isDestroyed) return;
       console.log('📊 UI got CEPE tick:', tick);  // 🔍 temporary debug
      const ts = Number(tick.ts);              // ✅ server time (ms)
      const bucketSizeMs = this.intervalMin * 60_000;

      // Floor server timestamp to bucket start
      const bucketStart = Math.floor(ts / bucketSizeMs) * bucketSizeMs;

      // First render
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

      // New bucket → add new bar
      if (bucketStart !== this.currentBucketStart) {
        this.currentBucketStart = bucketStart;

        const label = new Date(bucketStart)
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        this.data.push({ label, CE: 0, PE: 0 });

        if (this.data.length > 30) this.data.shift();
      }

      // Accumulate into last bucket
      const last = this.data[this.data.length - 1];

      // // Case 1: combined payload { CE, PE }
      // if (tick.CE !== undefined || tick.PE !== undefined) {
      //   last.CE += Number(tick.CE || 0);
      //   last.PE += Number(tick.PE || 0);
      // }

      if (tick.side === 'CE') {
          last.CE += 1;   // ✅ count CE ticks
        }
        else if (tick.side === 'PE') {
          last.PE += 1;   // ✅ count PE ticks
        }
      // Case 2: separate payload { side, value }
      // else if (tick.side === 'CE') {
      //   last.CE += Number(tick.value || 0);
      // }
      // else if (tick.side === 'PE') {
      //   last.PE += Number(tick.value || 0);
      // }

      // 🔥 repaint (same pattern as your working chart)
      this.chart.series[0].dataSource = this.data;
      this.chart.series[1].dataSource = this.data;
      this.chart.dataBind();
    });
}


intervalMin = 1;   // default 1 minute
private currentBucketStart = 0;

onIntervalChange(v: string) {
  this.intervalMin = Number(v);

  // 🔁 Reset aggregation when interval changes
  this.data = [];
  this.currentBucketStart = 0;
  this.ceSum = 0;
  this.peSum = 0;

  if (this.chart) {
    this.chart.series[0].dataSource = this.data;
    this.chart.series[1].dataSource = this.data;
    this.chart.dataBind();
  }
}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
