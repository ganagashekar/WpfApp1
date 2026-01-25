import { Routes } from '@angular/router';
import { LiveChartComponent } from './live-chart.component';
import { LiveSortingChartComponent } from './components/live-sorting-chart/live-sorting-chart';


export const routes: Routes = [
  { path: '', redirectTo: 'live', pathMatch: 'full' },
  { path: 'live', component: LiveChartComponent },
  { path: 'live-sorting', component: LiveSortingChartComponent }
];