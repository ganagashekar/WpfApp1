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
  StackingColumnSeriesService,
  TooltipService,
  ILoadedEventArgs
} from '@syncfusion/ej2-angular-charts';

import { Subscription } from 'rxjs';
import { LiveDataService } from './services/live-data.service';
import { auditTime } from 'rxjs/operators';
import { MarketSnapshot,StrikeDepth } from './model/market-snapshot.model';
interface StrikeRow {
  strike: string;
  CE: number;
  PE: number;
}

@Component({
  selector: 'app-live-strike-depth-column',
  standalone: true,
  imports: [ChartModule],
  providers: [
    CategoryService,
    StackingColumnSeriesService,
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

        <!-- CE bottom -->
        <e-series
          type="StackingColumn"
          name="CE"
          xName="strike"          
          yName="CE"
           [animation]="{ enable: false }"
          [dataSource]="data">
        </e-series>

        <!-- PE top -->
        <e-series
          type="StackingColumn"
          name="PE"
          xName="strike"
          yName="PE"
           [animation]="{ enable: false }"
          [dataSource]="data">
        </e-series>

      </e-series-collection>
    </ejs-chart>
  `
})
export class LiveStrikeDepthColumnComponent implements OnDestroy {

  @ViewChild('chart', { static: true })
  chart!: ChartComponent;

  title = 'Live CE / PE Strike Depth';

  private sub?: Subscription;
  public data: StrikeRow[] = [];

  /* =======================
     AXES
  ======================= */
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

  /* =======================
     LOAD
  ======================= */
  // onLoad(_: ILoadedEventArgs): void {
  //   this.sub = this.liveData.strikeDepth$
  //     .subscribe(depth => {
  //       if (!depth || this.chart.isDestroyed) return;
  //       this.updateChart(depth);
  //     });
  // }

  onLoad(_: ILoadedEventArgs): void {
  this.sub = this.liveData.strikeDepth$
    .pipe(auditTime(1000))   // ⏱️ update UI once per second
    .subscribe(depth => {
      if (!depth || this.chart.isDestroyed) return;
      this.updateChart(depth);
    });
}

  /* =======================
     LIVE UPDATE
  ======================= */
 private updateChart(depth: StrikeDepth[]): void {

  // First render
  if (this.data.length === 0) {
    this.data = depth.map(d => ({
      strike: d.strike,
      CE: d.CE,
      PE: d.PE
    }));

    this.chart.series[0].dataSource = this.data;
    this.chart.series[1].dataSource = this.data;
    this.chart.dataBind();
    return;
  }

  const map = new Map(this.data.map(x => [x.strike, x]));
  let changed = false;

  for (const d of depth) {
    const row = map.get(d.strike);
    if (!row) continue;

    if (row.CE !== d.CE) {
      row.CE = d.CE;
      changed = true;
    }

    if (row.PE !== d.PE) {
      row.PE = d.PE;
      changed = true;
    }
  }

  if (changed) {
    // 🔥 Force Syncfusion to pick up changes
    this.chart.series[0].dataSource = this.data;
    this.chart.series[1].dataSource = this.data;
    this.chart.dataBind();
  }
}




  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
