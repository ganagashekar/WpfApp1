import { Component, signal } from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('live-dashboard');

  // 🔥 Sidebar collapsed state
  protected readonly collapsed = signal(false);

  toggleSidebar() {
    this.collapsed.update(v => !v);
  }
}
