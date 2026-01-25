// import { Injectable, NgZone } from '@angular/core';

// @Injectable({ providedIn: 'root' })
// export class LiveDataService {

//   private socket!: WebSocket;

//   constructor(private zone: NgZone) {}

//   connect(onData: (data: any[]) => void): void {
//     this.socket = new WebSocket('ws://localhost:8080');

//     this.socket.onmessage = (event) => {
//       const data = JSON.parse(event.data);

//       // Run outside Angular → low CPU
//       this.zone.runOutsideAngular(() => onData(data));
//     };
//   }

//   close(): void {
//     this.socket?.close();
//   }
// }


import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MarketSnapshot } from '../live-chart.component';


@Injectable({ providedIn: 'root' })
export class LiveDataService {

  private socket?: WebSocket;

  private snapshotSubject =
    new BehaviorSubject<MarketSnapshot | null>(null);

  // Expose as observable
  snapshot$ = this.snapshotSubject.asObservable();

  constructor(private zone: NgZone) {}

  // -----------------------------
  // Connect once
  // -----------------------------
  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    this.socket = new WebSocket('ws://localhost:8080');

    this.socket.onmessage = (event) => {
      // IMPORTANT: must run inside Angular
      this.zone.run(() => {
        const data = JSON.parse(event.data) as MarketSnapshot;
        this.snapshotSubject.next(data);
      });
    };

    this.socket.onopen = () =>
      console.log('✅ WS connected');

    this.socket.onclose = () =>
      console.log('❌ WS closed');

    this.socket.onerror = (e) =>
      console.error('WS error', e);
  }

  // -----------------------------
  // Close cleanly
  // -----------------------------
  close(): void {
    this.socket?.close();
    this.socket = undefined;
  }
}
