import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CePeTick, MarketSnapshot, StrikeDepth } from '../model/market-snapshot.model';

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


  private cepeMinutePointSubject =
  new BehaviorSubject<{ label: string; CE: number; PE: number } | null>(null);
cepeMinutePoint$ = this.cepeMinutePointSubject.asObservable();
  /* =======================
     STRIKE DEPTH STREAM
  ======================= */
  private strikeDepthSubject =
    new BehaviorSubject<StrikeDepth[] | null>(null);

  strikeDepth$ = this.strikeDepthSubject.asObservable();

  // =======================
// CE / PE LIVE TICKS
// =======================
private cepeLiveSubject =
  new BehaviorSubject<CePeTick | null>(null);

cepeLive$ = this.cepeLiveSubject.asObservable();


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


    //  this.socket.onmessage = (e) => {
    //   this.zone.run(() => {
    //     try {
    //       const raw = JSON.parse(e.data);

    //       // 🔹 STRIKE DEPTH PARSE
    //       const depth = this.parseStrikeDepth(raw);
    //       if (depth) {
    //         this.strikeDepthSubject.next(depth);
    //       }

    //     } catch {
    //       // ignore malformed packets
    //     }
    //   });
    // };
    // this.socket.onmessage = (e) => {
    //   this.zone.run(() => {
    //     try {
    //       const raw = JSON.parse(e.data);

    //       // 🔹 Always emit raw
    //       this.rawSubject.next(raw);

    //       // 🔹 Build BAR snapshot
    //       const snapshot = this.parseSnapshot(raw);
    //       if (snapshot) {
    //         this.snapshotSubject.next(snapshot);
    //       }

    //       // 🔹 Emit PIE sector data (already aggregated)
    //       if (Array.isArray(raw.sectors)) {
    //         this.sectorSubject.next(raw.sectors);
    //       }

    //     } catch {
    //       // ignore malformed packets
    //     }
    //   });
    // };

    this.socket.onmessage = (e) => {
  this.zone.run(() => {
    try {
      const msg = JSON.parse(e.data);

      // 🔍 debug: see the full WS packet
      // console.log('RAW WS MSG:', msg);

      switch (msg.Event) {

        case 'CEPELive':
          console.log('CEPELive Data:', msg.Data);   // 👈 should show full object
          this.cepeLiveSubject.next(msg.Data);
          break;

        case 'CEPEMinutePoint':
          this.cepeMinutePointSubject.next(msg.Data);
          break;

        case 'Depth':
          this.handleStrikeDepth(msg.Data);
          break;

        case 'Snapshot':
          this.handleSnapshot(msg.Data);
          break;

        case 'Sectors':
          this.sectorSubject.next(msg.Data);
          break;

        default:
          console.warn('Unknown WS event', msg.Event);
      }

    } catch (err) {
      console.error('WS parse error:', err);
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
    const topchangense=raw.topChangersNSE ?? raw.TopChangersNSE;
    const topchangebse=raw.topChangersBSE ?? raw.TopChangersBSE;

    // if (!Array.isArray(sudden) ||
    //     !Array.isArray(strong) ||
    //      !Array.isArray(topchangense) ||
    //       !Array.isArray(topchangebse) ||
    //     !Array.isArray(best)) {
    //   return null;
    // }

    return {
      timestamp: raw.timestamp ?? raw.Timestamp ?? '',
      suddenMovers: sudden,
      strongTrends: strong,
      bestFocus: best,
      topChangersBSE :topchangebse ?? null,
      topChangersNSE : topchangense ?? null
    };
  }

private handleStrikeDepth(data: any) {
  const depth = this.parseStrikeDepth(data);
  if (depth) {
    this.strikeDepthSubject.next(depth);
  }
}

private handleSnapshot(data: any) {
  this.rawSubject.next(data);

  const snapshot = this.parseSnapshot(data);
  if (snapshot) {
    this.snapshotSubject.next(snapshot);
  }
}

 
private parseStrikeDepth(raw: any): StrikeDepth[] | null {

  // ✅ Case 1: backend already sent array (your Node server does this)
  if (Array.isArray(raw)) {
    return raw
      .filter(d => d?.strike != null && d?.CE != null && d?.PE != null)
      .map(d => ({
        strike: String(d.strike),
        CE: Number(d.CE),
        PE: Number(d.PE)
      }));
  }

  // 🔁 Case 2: backend wraps it in an object
  const src =
    raw?.strikeDepth ??
    raw?.StrikeDepth ??
    raw?.optionDepth ??
    raw?.OptionDepth ??
    raw?.cepeDepth;

  if (!Array.isArray(src)) return null;

  return src
    .filter(d => d?.strike != null && d?.CE != null && d?.PE != null)
    .map(d => ({
      strike: String(d.strike),
      CE: Number(d.CE),
      PE: Number(d.PE)
    }));
}


  // private parseStrikeDepth(raw: any): StrikeDepth[] | null {

  //   // Accept flexible backend naming
  //   const src =
  //     raw.strikeDepth ??
  //     raw.StrikeDepth ??
  //     raw.optionDepth ??
  //     raw.OptionDepth ??
  //     raw.cepeDepth;

  //   if (!Array.isArray(src)) return null;

  //   // Expect +5 / -5 strikes already filtered by backend
  //   return src
  //     .filter(d => d.strike != null && d.CE != null && d.PE != null)
  //     .map(d => ({
  //       strike: String(d.strike),
  //       CE: Number(d.CE),
  //       PE: Number(d.PE)
  //     }));
  // }
}
