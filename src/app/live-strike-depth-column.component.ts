import { auditTime, Subscription } from "rxjs";
import { OptionLiveService } from "./services/option-live.service";
import { StrikeDepth, StrikeRow } from "./model/market-snapshot.model";
import { ChangeDetectionStrategy, Component, OnDestroy, ViewChild } from "@angular/core";
import { CategoryService, ChartComponent, ChartModule, StackingColumnSeriesService, TooltipService } from "@syncfusion/ej2-angular-charts";

@Component({
  selector: 'app-live-strike-depth-column',
  standalone: true,
  imports: [ChartModule],
  providers: [
    CategoryService,
    StackingColumnSeriesService,
    TooltipService
  ],
  // [title]="title"
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

  // title = 'Live CE / PE Strike Depth';

  private sub?: Subscription;
  public data: StrikeRow[] = [];
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

  constructor(private optionLive: OptionLiveService) {}

  onLoad(_: any): void {
    if (this.sub) return;          // ✅ avoid double subscription
    // this.optionLive.connect();    // ✅ ensure WS connected once

    this.sub = this.optionLive.strikeDepth$
      .pipe(auditTime(1000))      // ⏱️ update UI once per second
      .subscribe(depth => {
        if (!depth || this.chart.isDestroyed) return;
        this.updateChart(depth);
      });
  }

  private updateChart(depth: StrikeDepth[]): void {

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

      if (row.CE !== d.CE) { row.CE = d.CE; changed = true; }
      if (row.PE !== d.PE) { row.PE = d.PE; changed = true; }
    }

    if (changed) {
      this.chart.series[0].dataSource = this.data;
      this.chart.series[1].dataSource = this.data;
      this.chart.dataBind();
    }
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
