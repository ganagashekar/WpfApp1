using NetMQ;
using NetMQ.Sockets;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace WpfApp1
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
        private readonly string _addr;
        private CancellationTokenSource cts;

        public event EventHandler<OptionTickEventArgs> Tick;

        public ZeroMqOptionFeed(string addr) => _addr = addr;

        public void Start()
        {
            cts = new CancellationTokenSource();
            Task.Run(() => Loop(cts.Token));
        }

        public void Stop() => cts?.Cancel();

        private void Loop(CancellationToken t)
        {
            using var sub = new SubscriberSocket();
            sub.Connect(_addr);
            sub.Subscribe("");

            while (!t.IsCancellationRequested)
            {
                try
                {
                    var msg = sub.ReceiveFrameString();
                    dynamic obj = System.Text.Json.JsonSerializer.Deserialize<dynamic>(msg);

                    if (obj.Symbol != null)
                    {
                        Tick?.Invoke(this, new OptionTickEventArgs
                        {
                            Symbol = (string)obj.Symbol,
                            Open = (double?)obj.Open ?? 0,
                            High = (double?)obj.High ?? 0,
                            Low = (double?)obj.Low ?? 0,
                            Ltp = (double?)obj.Ltp ?? 0
                        });
                    }
                }
                catch { Thread.Sleep(1); }
            }
        }
    }
}

