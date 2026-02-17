import { auditTime, Subscription } from "rxjs";
import { OptionLiveService } from "./services/option-live.service";
import { StrikeDepth, StrikeRow } from "./model/market-snapshot.model";
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ViewChild,
  NgZone
} from "@angular/core";
import {
  CategoryService,
  ChartComponent,
  ChartModule,
  StackingColumnSeriesService,
  TooltipService
} from "@syncfusion/ej2-angular-charts";

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
      [primaryXAxis]="xAxis"
      [primaryYAxis]="yAxis"
      [tooltip]="tooltip"
      (load)="onLoad($event)"
    >
      <e-series-collection>
        <e-series
          type="StackingColumn"
          name="CE"
          xName="strike"
          yName="CE"
          [animation]="{ enable: false }"
          [dataSource]="data">
        </e-series>

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

  private sub?: Subscription;
  public data: StrikeRow[] = [];

  private currentMinuteKey = '';

  public xAxis = {
    valueType: 'Category',
    labelRotation: -90,
    majorGridLines: { width: 0 },
    labelIntersectAction: 'None'
  };

  public yAxis = {
    majorGridLines: { width: 0 }
  };

  public tooltip = {
    enable: true,
    shared: true
  };

  constructor(
    private optionLive: OptionLiveService,
    private zone: NgZone
  ) {}

  onLoad(_: any): void {
    if (this.sub) return;

    // 1️⃣ Reset depth on CE/PE minute rollover (server time)
    this.sub = this.optionLive.cepeLive$
      .subscribe(tick => {
        if (!tick?.ts) return;

        const dt = new Date(Number(tick.ts));
        const minuteKey = `${dt.getUTCHours()}:${dt.getUTCMinutes()}`;

        if (!this.currentMinuteKey) {
          this.currentMinuteKey = minuteKey;
          return;
        }

        if (minuteKey !== this.currentMinuteKey) {
          this.currentMinuteKey = minuteKey;
          this.resetDepthChart();
        }
      });

    // 2️⃣ Depth updates (1 FPS UI)
    this.sub.add(
      this.optionLive.strikeDepth$
        .pipe(auditTime(1000))
        .subscribe(depth => {
          if (!depth || this.chart.isDestroyed) return;
          this.updateChart(depth);
        })
    );
  }

  private resetDepthChart() {
    this.data = [];

    if (!this.chart || this.chart.isDestroyed) return;

    this.zone.runOutsideAngular(() => {
      this.chart.series[0].dataSource = this.data;
      this.chart.series[1].dataSource = this.data;
      this.chart.refresh();   // fast clear
    });
  }

  private updateChart(depth: StrikeDepth[]): void {
    if (!this.chart?.series?.length || this.chart.isDestroyed) return;

    // First load
    if (this.data.length === 0) {
      this.data = depth.map(d => ({
        strike: d.strike,
        CE: d.CE,
        PE: d.PE
      }));

      this.data.sort((a, b) => Number(a.strike) - Number(b.strike));

      this.zone.runOutsideAngular(() => {
        this.chart.series[0].dataSource = this.data;
        this.chart.series[1].dataSource = this.data;
        this.chart.refresh();
      });
      return;
    }

    const map = new Map(this.data.map(x => [x.strike, x]));
    let changed = false;

    // ➕ Add or update strikes
    for (const d of depth) {
      let row = map.get(d.strike);

      if (!row) {
        row = { strike: d.strike, CE: d.CE, PE: d.PE };
        this.data.push(row);
        map.set(d.strike, row);
        changed = true;
      } else {
        if (row.CE !== d.CE) { row.CE = d.CE; changed = true; }
        if (row.PE !== d.PE) { row.PE = d.PE; changed = true; }
      }
    }

    if (!changed) return;

    // Keep strikes ordered
    this.data.sort((a, b) => Number(a.strike) - Number(b.strike));

    this.zone.runOutsideAngular(() => {
      this.chart.refresh();   // lightweight redraw
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
