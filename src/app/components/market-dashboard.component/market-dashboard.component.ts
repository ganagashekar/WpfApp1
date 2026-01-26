import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';

import { LiveDataService } from '../../services/live-data.service';
import { LiveBarChartComponent } from '../../live-bar-chart.component';
import { MarketSnapshot } from '../../model/market-snapshot.model';
import { LivePieChartComponent } from '../../live-pie-chart.component';



@Component({
  selector: 'app-market-dashboard',
  standalone: true,
  templateUrl: './market-dashboard.component.html',
  imports: [
    CommonModule,
    LiveBarChartComponent,
    LivePieChartComponent
  ]
})
export class MarketDashboardComponent
  implements OnInit, OnDestroy {

  // ---------------- COLORS ----------------
  COLORS_100: string[] = [
    '#e6194b','#3cb44b','#ffe119','#4363d8','#f58231',
    '#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe',
    '#008080','#e6beff','#9a6324','#fffac8','#800000',
    '#aaffc3','#808000','#ffd8b1','#000075','#808080',
    '#ff4500','#32cd32','#ffd700','#1e90ff','#ff8c00',
    '#8a2be2','#20b2aa','#ff1493','#7fff00','#ffb6c1',
    '#2f4f4f','#dda0dd','#a0522d','#fafad2','#b22222',
    '#98fb98','#9acd32','#ffdead','#00008b','#a9a9a9',
    '#dc143c','#00fa9a','#f0e68c','#4169e1','#ff6347',
    '#6a5acd','#40e0d0','#c71585','#adff2f','#ffe4e1',
    '#008b8b','#d8bfd8','#cd853f','#ffffe0','#8b0000',
    '#7fffd4','#556b2f','#ffdab9','#191970','#c0c0c0',
    '#ff0000','#00ff00','#ffff00','#0000ff','#ff7f00',
    '#9400d3','#00ffff','#ff00ff','#7cfc00','#ffc0cb',
    '#006400','#dda0dd','#8b4513','#f5f5dc','#800020'
  ];

  // ---------------- CHART DATA ----------------
  suddenMovers: any[] = [];
  strongTrends: any[] = [];
  bestFocus: any[] = [];

  connected = false;
  private sub?: Subscription;

  constructor(private liveData: LiveDataService) {}

  // ---------------- INIT ----------------
  ngOnInit(): void {
    this.sub = this.liveData.raw$
      .subscribe(raw => {
        if (!raw) return;

        const snapshot = this.parseSnapshot(raw);
        if (!snapshot) return;

        this.suddenMovers = snapshot.suddenMovers.map(x => ({
          x: x.symbol,
          y: x.breakoutScore
        }));

        this.strongTrends = snapshot.strongTrends.map(x => ({
          x: x.symbol,
          y: x.focusScore
        }));

        this.bestFocus = snapshot.bestFocus.map(x => ({
          x: x.symbol,
          y: (x.breakoutScore * 0.6 + x.focusScore * 0.4)
        }));
      });
  }

  // ---------------- BUTTON ACTIONS ----------------
  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.liveData.connect();
  }

  disconnect(): void {
    this.connected = false;
    this.liveData.disconnect();

    this.suddenMovers = [];
    this.strongTrends = [];
    this.bestFocus = [];
  }

  // ---------------- CLEANUP ----------------
  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.liveData.disconnect();
  }

  // ---------------- SAFE PARSER ----------------
  private parseSnapshot(raw: any): MarketSnapshot | null {
    const sudden = raw.suddenMovers ?? raw.SuddenMovers;
    const strong = raw.strongTrends ?? raw.StrongTrends;
    const best   = raw.bestFocus   ?? raw.BestFocus;

    if (!Array.isArray(sudden) ||
        !Array.isArray(strong) ||
        !Array.isArray(best)) {
      return null;
    }

    return {
      timestamp: raw.timestamp ?? raw.Timestamp ?? '',
      suddenMovers: sudden,
      strongTrends: strong,
      bestFocus: best
    };
  }
}
