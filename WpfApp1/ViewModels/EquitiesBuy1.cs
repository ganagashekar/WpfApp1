using NetMQ;
using NetMQ.Sockets;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WpfApp1.ViewModels
{

    public class OptionTickEventArgs : EventArgs
    {
        public string Symbol { get; init; }
        public double Open { get; init; }
        public double High { get; init; }
        public double Low { get; init; }
        public double Ltp { get; init; }
    }

    public class ZeroMqOptionFeed
    {
        private readonly string _address;
        private CancellationTokenSource _cts;

        public event EventHandler<OptionTickEventArgs> TickReceived;

        public ZeroMqOptionFeed(string address) { _address = address; }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => ListenLoop(_cts.Token));
        }

        public void Stop() { _cts?.Cancel(); }

        private void ListenLoop(CancellationToken token)
        {
            using var sub = new SubscriberSocket();
            sub.Options.ReceiveHighWatermark = 10000;
            sub.Connect(_address);
            sub.Subscribe("");

            while (!token.IsCancellationRequested)
            {
                try
                {
                    string msg = sub.ReceiveFrameString(); // blocking
                                                           // Expect message JSON containing either CE or PE or both
                                                           // map to your incoming format; here's a flexible example:
                    var obj = System.Text.Json.JsonSerializer.Deserialize<dynamic>(msg);

                    // Example mapping: user feed should include symbol and ltp/open/high/low
                    // Try CE first
                    if (obj.CE_Symbol != null)
                    {
                        TickReceived?.Invoke(this, new OptionTickEventArgs
                        {
                            Symbol = (string)obj.CE_Symbol,
                            Open = (double?)obj.CE_Open ?? 0,
                            High = (double?)obj.CE_High ?? 0,
                            Low = (double?)obj.CE_Low ?? 0,
                            Ltp = (double?)obj.CE_Ltp ?? 0
                        });
                    }

                    if (obj.PE_Symbol != null)
                    {
                        TickReceived?.Invoke(this, new OptionTickEventArgs
                        {
                            Symbol = (string)obj.PE_Symbol,
                            Open = (double?)obj.PE_Open ?? 0,
                            High = (double?)obj.PE_High ?? 0,
                            Low = (double?)obj.PE_Low ?? 0,
                            Ltp = (double?)obj.PE_Ltp ?? 0
                        });
                    }
                }
                catch
                {
                    // swallow and continue; consider logging
                    Thread.Sleep(5);
                }
            }
        }
    }



    public class OptionTickModel
    {
        public string CE_Symbol { get; set; }
        public double CE_Open { get; set; }
        public double CE_High { get; set; }
        public double CE_Low { get; set; }
        public double CE_Ltp { get; set; }

        public string PE_Symbol { get; set; }
        public double PE_Open { get; set; }
        public double PE_High { get; set; }
        public double PE_Low { get; set; }
        public double PE_Ltp { get; set; }
    }
  
}