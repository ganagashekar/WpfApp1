import {
  Component,
  Input,
  ChangeDetectionStrategy,
  ViewChild,
  NgZone
} from '@angular/core';

import {
  ChartComponent,
  CategoryService,
  ColumnSeriesService,
  TooltipService,
  DataLabelService
} from '@syncfusion/ej2-angular-charts';

interface DataPoint {
  x: string;
  y: number;
}

@Component({
  selector: 'app-live-bar-chart',
  standalone: true,
  imports: [],
  providers: [
    CategoryService,
    ColumnSeriesService,
    TooltipService,
    DataLabelService
  ],
  template: `
  <ejs-chart
    #chart
    [title]="title"
    [primaryXAxis]="xAxis"
    [primaryYAxis]="yAxis"
    [legendSettings]="{ visible: false }"
    [tooltip]="{ enable: true }"
    (pointRender)="pointRender($event)"
  >
    <e-series-collection>
      <e-series
        type="Column"
        [dataSource]="data"
        xName="x"
        yName="y"
        [animation]="{ enable: false }">
      </e-series>
    </e-series-collection>
  </ejs-chart>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LiveBarChartComponent {

  @ViewChild('chart', { static: true })
  private chart!: ChartComponent | any;

  @Input() title = '';
  @Input() colorPalette: string[] = [];
  @Input() yAxisTitle = 'Score';

  private _data: DataPoint[] = [];
  public data: DataPoint[] = [];

  public xAxis = {
    valueType: 'Category',
    labelRotation: -90,
    majorGridLines: { width: 0 }
  };

  public yAxis = {
    title: this.yAxisTitle,
    majorGridLines: { width: 0 }
  };

  constructor(private zone: NgZone) {}

  @Input()
  set points(value: DataPoint[]) {
    this._data = value || [];
    this.update();
  }

  private update() {
    if (!this.chart?.series?.length) return;

    this.zone.runOutsideAngular(() => {
      this.chart.series[0].setData(this._data, false);
      this.chart.refresh();
    });
  }

  pointRender(args: any) {
    if (!this.colorPalette.length) return;
    args.fill =
      this.colorPalette[args.point.index % this.colorPalette.length];
  }
}
