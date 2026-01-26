import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';



@Injectable({ providedIn: 'root' })
export class LiveDataService {

  private socket?: WebSocket;
  private connected = false;

  private rawSubject = new BehaviorSubject<any>(null);
  raw$ = this.rawSubject.asObservable();

  constructor(private zone: NgZone) {}

  // -----------------------------
  // CONNECT (called by button)
  // -----------------------------
  connect(): void {
    if (this.connected) return;

    this.socket = new WebSocket('ws://localhost:8801');

    this.socket.onopen = () => {
      this.connected = true;
      console.log('✅ WS connected');
    };

   this.socket.onmessage = (e) => {
      // no parsing, no assumptions
      this.zone.run(() => {
        try {
          this.rawSubject.next(JSON.parse(e.data));
        } catch {
          // ignore malformed packets
        }
      });
    };

    this.socket.onclose = () => {
      this.connected = false;
      console.log('❌ WS disconnected');
    };

    this.socket.onerror = (err) => {
      console.error('WS error', err);
    };
  }

  // -----------------------------
  // DISCONNECT (called by button)
  // -----------------------------
  disconnect(): void {
    if (!this.socket) return;

    this.socket.close();
    this.socket = undefined;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

    close(): void {
    this.socket?.close();
    this.socket = undefined;
  }
}
