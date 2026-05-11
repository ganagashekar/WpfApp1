import { auditTime, Subscription } from 'rxjs';
import { OptionLiveService } from './services/option-live.service';
import { StrikeDepth } from './model/market-snapshot.model';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import {
  CategoryService,
  ChartComponent,
  ChartModule,
  StackingColumnSeriesService,
  TooltipService,

} from '@syncfusion/ej2-angular-charts';

export interface StrikeRow {

  strike: number;

  CE: number;
  PE: number;

  // SPEED
  CESpeed: number;
  PESpeed: number;

  // ACCELERATION
  CEAccel: number;
  PEAccel: number;

  // WEIGHTED
  CEWeighted: number;
  PEWeighted: number;

  // INTERNAL
  lastCE: number;
  lastPE: number;

  lastCESpeed: number;
  lastPESpeed: number;

  lastTs: number;

  // COLORS
  CEColor?: string;
  PEColor?: string;
}

@Component({
  selector: 'app-live-strike-depth-column',
  standalone: true,
  imports: [ CommonModule,ChartModule],
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
  [tooltip]="tooltip">

  <e-series-collection>

    <!-- CE -->
    <e-series
      type="StackingColumn"
      name="CE"
      xName="strike"
      yName="CE"
      pointColorMapping="CEColor"
      [animation]="{ enable: false }"
      [dataSource]="data">
    </e-series>

    <!-- PE -->
    <e-series
      type="StackingColumn"
      name="PE"
      xName="strike"
      yName="PE"
      pointColorMapping="PEColor"
      [animation]="{ enable: false }"
      [dataSource]="data">
    </e-series>

  </e-series-collection>

</ejs-chart>

<div style="padding:8px;font-size:14px">

  <b>Bull Pressure:</b>
  {{ bullPressure | number:'1.0-0' }}

  &nbsp;&nbsp;

  <b>Bear Pressure:</b>
  {{ bearPressure | number:'1.0-0' }}

  &nbsp;&nbsp;

  <b>Net:</b>
  {{ netPressure | number:'1.0-0' }}

</div>

  `
})
export class LiveStrikeDepthColumnComponent
  implements OnDestroy {

  @ViewChild('chart', { static: true })
  chart!: ChartComponent;

  private sub = new Subscription();

  public data: StrikeRow[] = [];

  private strikeMap =
    new Map<number, StrikeRow>();

  private currentMinuteKey = 0;

  // PRESSURE
  public bullPressure = 0;
  public bearPressure = 0;
  public netPressure = 0;

  // ATM FILTER
  private ATM_RANGE = 10;

  // AXIS
  public xAxis = {
    valueType: 'Category',
    labelRotation: -90,
    labelIntersectAction: 'None',
    majorGridLines: { width: 0 }
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
  ) {

    // RESET ON NEW MINUTE
    this.sub.add(

      this.optionLive.cepeLive$
        .subscribe(tick => {

          if (!tick?.ts)
            return;

          const minuteKey =
            Math.floor(Number(tick.ts) / 60000);

          if (!this.currentMinuteKey) {

            this.currentMinuteKey = minuteKey;
            return;
          }

          if (minuteKey !== this.currentMinuteKey) {

            this.currentMinuteKey = minuteKey;

            this.resetChart();
          }
        })
    );

    // LIVE DEPTH
    this.sub.add(

      this.optionLive.strikeDepth$

        // UI FPS
        .pipe(auditTime(200))

        .subscribe(depth => {

          if (!depth?.length)
            return;

          this.updateChart(depth);
        })
    );
  }

  // ==========================
  // RESET
  // ==========================

  private resetChart(): void {

    this.data.length = 0;

    this.strikeMap.clear();

    this.bullPressure = 0;
    this.bearPressure = 0;
    this.netPressure = 0;

    if (!this.chart ||
      this.chart.isDestroyed)
      return;

    this.zone.runOutsideAngular(() => {

      this.chart.series[0].dataSource =
        this.data;

      this.chart.series[1].dataSource =
        this.data;

      this.chart.dataBind();
    });
  }

  // ==========================
  // UPDATE
  // ==========================

  private updateChart(
    depth: StrikeDepth[]
  ): void {

    if (!this.chart?.series?.length ||
      this.chart.isDestroyed)
      return;

    const now = performance.now();

    let changed = false;
    let newStrikeAdded = false;

    let bull = 0;
    let bear = 0;

    // ==========================
    // ATM
    // ==========================

    const strikes =
      depth.map(x => Number(x.strike));

    const atm =
      strikes[Math.floor(strikes.length / 2)];

    const minStrike =
      atm - (this.ATM_RANGE * 100);

    const maxStrike =
      atm + (this.ATM_RANGE * 100);

    // ==========================
    // LOOP
    // ==========================

    for (const d of depth) {

      const strike =
        Number(d.strike);

      // ATM FILTER
      if (
        strike < minStrike ||
        strike > maxStrike
      ) {
        continue;
      }

      let row =
        this.strikeMap.get(strike);

      // ==========================
      // NEW STRIKE
      // ==========================

      if (!row) {

        row = {

          strike,

          CE: d.CE,
          PE: d.PE,

          CESpeed: 0,
          PESpeed: 0,

          CEAccel: 0,
          PEAccel: 0,

          CEWeighted: 0,
          PEWeighted: 0,

          lastCE: d.CE,
          lastPE: d.PE,

          lastCESpeed: 0,
          lastPESpeed: 0,

          lastTs: now,

          CEColor: '#808080',
          PEColor: '#808080'
        };

        this.strikeMap.set(
          strike,
          row
        );

        this.data.push(row);

        changed = true;
        newStrikeAdded = true;

        continue;
      }

      // ==========================
      // TIME
      // ==========================

      const dtSec =
        Math.max(
          (now - row.lastTs) / 1000,
          0.001
        );

      // ==========================
      // DELTA
      // ==========================

      const ceDelta =
        d.CE - row.lastCE;

      const peDelta =
        d.PE - row.lastPE;

      // ==========================
      // SPEED
      // ==========================

      const ceSpeed =
        ceDelta / dtSec;

      const peSpeed =
        peDelta / dtSec;

      // ==========================
      // ACCELERATION
      // ==========================

      const ceAccel =
        (ceSpeed - row.lastCESpeed)
        / dtSec;

      const peAccel =
        (peSpeed - row.lastPESpeed)
        / dtSec;

      // ==========================
      // WEIGHTED
      // ==========================

      const ceWeighted =
        ceSpeed * d.CE;

      const peWeighted =
        peSpeed * d.PE;

      // ==========================
      // UPDATE
      // ==========================

      row.CE = d.CE;
      row.PE = d.PE;

      row.CESpeed = ceSpeed;
      row.PESpeed = peSpeed;

      row.CEAccel = ceAccel;
      row.PEAccel = peAccel;

      row.CEWeighted = ceWeighted;
      row.PEWeighted = peWeighted;

      row.lastCE = d.CE;
      row.lastPE = d.PE;

      row.lastCESpeed = ceSpeed;
      row.lastPESpeed = peSpeed;

      row.lastTs = now;

      // ==========================
      // PRESSURE
      // ==========================

      bull += ceWeighted;
      bear += peWeighted;

      // ==========================
      // COLORS
      // ==========================

      row.CEColor =
        this.getColor(ceSpeed);

      row.PEColor =
        this.getColor(peSpeed);

      changed = true;
    }

    if (!changed)
      return;

    // ==========================
    // SORT ONLY NEW
    // ==========================

    if (newStrikeAdded) {

      this.data.sort(
        (a, b) => a.strike - b.strike
      );
    }

    // ==========================
    // PRESSURE
    // ==========================

    this.bullPressure = bull;
    this.bearPressure = bear;

    this.netPressure =
      bull - bear;

    // ==========================
    // CHART UPDATE
    // ==========================

    this.zone.runOutsideAngular(() => {

      this.chart.series[0].dataSource =
        this.data;

      this.chart.series[1].dataSource =
        this.data;

      // FAST UPDATE
      this.chart.dataBind();
    });
  }

  // ==========================
  // COLORS
  // ==========================

  private getColor(
    speed: number
  ): string {

    // HUGE POSITIVE
    if (speed > 500)
      return '#00ff00';

    // POSITIVE
    if (speed > 100)
      return '#66ff66';

    // HUGE NEGATIVEx
    if (speed < -500)
      return '#ff0000';

    // NEGATIVE
    if (speed < -100)
      return '#ff6666';

    // NEUTRAL
    return '#808080';
  }

  // ==========================
  // DESTROY
  // ==========================

  ngOnDestroy(): void {

    this.sub.unsubscribe();
  }
}