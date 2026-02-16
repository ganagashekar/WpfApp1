import { Component } from '@angular/core';

import { CePeMinuteAggregateBarsComponent } from '../../cepe-minute-history-bars';
import { LiveStrikeDepthColumnComponent } from '../../live-strike-depth-column.component';

@Component({
  selector: 'app-optionmarket-dashboard',
  standalone: true,
  imports: [
    CePeMinuteAggregateBarsComponent,
    LiveStrikeDepthColumnComponent
  ],
  template: `
    <div class="option-dashboard">
      <div class="grid">
        <app-live-strike-depth-column></app-live-strike-depth-column>
         <app-cepe-minute-aggregate-bars></app-cepe-minute-aggregate-bars>
      </div>
    </div>
  `,
  styleUrls: ['./optionmarket-dashboard.component.css']
})
export class OptionmarketDashboardComponent {}
