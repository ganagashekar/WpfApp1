import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { MarketSnapshot } from '../model/market-snapshot.model';

@Injectable({ providedIn: 'root' })
export class LiveDataService {

  private socket?: WebSocket;
  private connected = false;

  // 🔹 Raw WS packet (optional, debug)
  private rawSubject = new BehaviorSubject<any>(null);
  raw$ = this.rawSubject.asObservable();

  // 🔹 Parsed snapshot (BAR charts)
  private snapshotSubject = new BehaviorSubject<MarketSnapshot | null>(null);
  snapshot$ = this.snapshotSubject.asObservable();

  // 🔹 Sector-wise data (PIE charts)
  private sectorSubject = new BehaviorSubject<{ x: string; y: number }[] | null>(null);
  sector$ = this.sectorSubject.asObservable();

  constructor(private zone: NgZone) {}

  // =============================
  // CONNECT
  // =============================
  connect(): void {
    if (this.connected) return;

    this.socket = new WebSocket('ws://localhost:8801');

    this.socket.onopen = () => {
      this.connected = true;
      console.log('✅ WS connected');
    };

    this.socket.onmessage = (e) => {
      this.zone.run(() => {
        try {
          const raw = JSON.parse(e.data);

          // 🔹 Always emit raw
          this.rawSubject.next(raw);

          // 🔹 Build BAR snapshot
          const snapshot = this.parseSnapshot(raw);
          if (snapshot) {
            this.snapshotSubject.next(snapshot);
          }

          // 🔹 Emit PIE sector data (already aggregated)
          if (Array.isArray(raw.sectors)) {
            this.sectorSubject.next(raw.sectors);
          }

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

  // =============================
  // DISCONNECT
  // =============================
  disconnect(): void {
    this.socket?.close();
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

  // =============================
  // SAFE SNAPSHOT PARSER
  // =============================
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
