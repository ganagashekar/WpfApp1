import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CePeTick, StrikeDepth } from '../model/market-snapshot.model';

@Injectable({ providedIn: 'root' })
export class OptionLiveService {

  private socket?: WebSocket;
  private connected = false;

  // =======================
  // CE / PE LIVE TICKS
  // =======================
  private cepeLiveSubject =
    new BehaviorSubject<CePeTick | null>(null);
  cepeLive$ = this.cepeLiveSubject.asObservable();

  // =======================
  // CE / PE MINUTE POINT (optional from backend)
  // =======================
  private cepeMinutePointSubject =
    new BehaviorSubject<{ label: string; CE: number; PE: number } | null>(null);
  cepeMinutePoint$ = this.cepeMinutePointSubject.asObservable();

  // =======================
  // STRIKE DEPTH (OPTIONS)
  // =======================
  private strikeDepthSubject =
    new BehaviorSubject<StrikeDepth[] | null>(null);
  strikeDepth$ = this.strikeDepthSubject.asObservable();

  constructor(private zone: NgZone) {}

  // =======================
  // CONNECT
  // =======================
  connect(): void {
    if (this.connected) return;

    this.socket = new WebSocket('ws://localhost:8802');

    this.socket.onopen = () => {
      this.connected = true;
      console.log('✅ Option WS connected');
    };

    this.socket.onmessage = (e) => {
      this.zone.run(() => {
        try {
          const msg = JSON.parse(e.data);

          switch (msg.Event) {

            case 'CEPELive':
              // expected: { ts, side, value, strike, spot, score? }
              this.cepeLiveSubject.next(msg.Data as CePeTick);
              break;

            case 'CEPEMinutePoint':
              // expected: { label, CE, PE }
              this.cepeMinutePointSubject.next(msg.Data);
              break;

            case 'Depth':
            case 'StrikeDepth':
              this.handleStrikeDepth(msg.Data);
              break;

            default:
              // ignore other events
              break;
          }

        } catch (err) {
          console.error('Option WS parse error:', err);
        }
      });
    };

    this.socket.onclose = () => {
      this.connected = false;
      console.log('❌ Option WS disconnected');
    };

    this.socket.onerror = (err) => {
      console.error('Option WS error', err);
    };
  }

  // =======================
  // DISCONNECT
  // =======================
  disconnect(): void {
    this.socket?.close();
    this.socket = undefined;
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // =======================
  // STRIKE DEPTH PARSER
  // =======================
  private handleStrikeDepth(data: any) {
    const depth = this.parseStrikeDepth(data);
    if (depth) {
      this.strikeDepthSubject.next(depth);
    }
  }

  private parseStrikeDepth(raw: any): StrikeDepth[] | null {

    // ✅ Case 1: backend already sends array
    if (Array.isArray(raw)) {
      return raw
        .filter(d => d?.strike != null && d?.CE != null && d?.PE != null)
        .map(d => ({
          strike: String(d.strike),
          CE: Number(d.CE),
          PE: Number(d.PE)
        }));
    }

    // 🔁 Case 2: backend wraps it
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
}
