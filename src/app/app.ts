import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive
} from '@angular/router';
import { LiveDataService } from './services/live-data.service';
import { OptionLiveService } from './services/option-live.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,        // 🔥 THIS IS THE FIX
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('live-dashboard');
  protected readonly collapsed = signal(false);
 constructor(
    liveData: LiveDataService,
    optionLive: OptionLiveService
  ) {
    liveData.connect();
    optionLive.connect();
  }
  toggleSidebar() {
    this.collapsed.update(v => !v);
  }
}
