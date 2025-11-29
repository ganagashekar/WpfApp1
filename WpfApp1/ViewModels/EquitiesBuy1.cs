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


        public event EventHandler<OptionTickEventArgs> OptionTickReceived;

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
    public class ZeroMqOptionFeed
    {
        private readonly string _address;
        private CancellationTokenSource _cts;

        public event EventHandler<OptionTickEventArgs> TickReceived;

        public ZeroMqOptionFeed(string address)
        {
            _address = address;
        }

        public void Start()
        {
            _cts = new CancellationTokenSource();
            Task.Run(() => ListenLoop(_cts.Token));
        }

        public void Stop()
        {
            _cts?.Cancel();
        }

        private void ListenLoop(CancellationToken token)
        {
            using var sub = new SubscriberSocket();

            // Connect to publisher
            sub.Connect(_address);

            // Subscribe to ALL topics
            sub.Subscribe("");

            while (!token.IsCancellationRequested)
            {
                try
                {
                    string msg = sub.ReceiveFrameString();

                    // Parse your tick JSON here
                    // For now using a simple model:
                    var tick = System.Text.Json.JsonSerializer.Deserialize<OptionTickModel>(msg);

                    if (tick == null) continue;

                    // CE
                    if (!string.IsNullOrEmpty(tick.CE_Symbol))
                    {
                        TickReceived?.Invoke(this, new OptionTickEventArgs
                        {
                            Symbol = tick.CE_Symbol,
                            Open = tick.CE_Open,
                            High = tick.CE_High,
                            Low = tick.CE_Low,
                            Ltp = tick.CE_Ltp
                        });
                    }

                    // PE
                    if (!string.IsNullOrEmpty(tick.PE_Symbol))
                    {
                        TickReceived?.Invoke(this, new OptionTickEventArgs
                        {
                            Symbol = tick.PE_Symbol,
                            Open = tick.PE_Open,
                            High = tick.PE_High,
                            Low = tick.PE_Low,
                            Ltp = tick.PE_Ltp
                        });
                    }
                }
                catch
                {
                    // swallow and continue
                }
            }
        }
    }
}