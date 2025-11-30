using CommunityToolkit.Mvvm.ComponentModel;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using WpfApp1.Models;




namespace WpfApp1.ViewModels
{



    public partial class MainViewModel : ObservableObject
    {
        public ObservableCollection<OptionStrikeViewModel> Strikes { get; } = new();
        public ObservableCollection<SymbolViewModel> CEOnly { get; } = new();
        public ObservableCollection<SymbolViewModel> PEOnly { get; } = new();

        private readonly ZeroMqOptionFeed _zmq;
        private readonly bool _useDummy;

        public MainViewModel()
        {
            bool useDummy = true;
            string zmqAddress = "tcp://127.0.0.1:7777";
            _useDummy = useDummy;
            LoadStrikes();

            // convenience lists for legacy bindings
            foreach (var s in Strikes) { CEOnly.Add(s.CE); PEOnly.Add(s.PE); }

            if (!_useDummy)
            {
                _zmq = new ZeroMqOptionFeed(zmqAddress);
                _zmq.TickReceived += OnTick;
                _zmq.Start();
            }
            else
            {
                StartDummyTicks();
            }
        }

        private void LoadStrikes()
        {
            if (!File.Exists(@"D:\Hosts\JobStocksJson\optiondata0.json")) return;
            var json = File.ReadAllText(@"D:\Hosts\JobStocksJson\optiondata0.json");
            var list = System.Text.Json.JsonSerializer.Deserialize<List<OptionItem>>(json);

            foreach (var it in list.Where(x=>x.stock_name.Contains("CNX")))
            {
                var s = new OptionStrikeViewModel(it.CE_Symbol, it.PE_Symbol, it.Strike);
                Strikes.Add(s);
            }
        }

        private void OnTick(object sender, OptionTickEventArgs e)
        {
            var strikeVm = Strikes.FirstOrDefault(s => s.CE.Data.Symbol == e.Symbol || s.PE.Data.Symbol == e.Symbol);
            if (strikeVm == null) return;

            var target = strikeVm.CE.Data.Symbol == e.Symbol ? strikeVm.CE : strikeVm.PE;

            target.Data.Open = e.Open;
            target.Data.High = e.High;
            target.Data.Low = e.Low;
            target.Data.Ltp = e.Ltp;

            var disp = System.Windows.Application.Current?.Dispatcher;
            if (disp != null)
            {
                disp.Invoke(() =>
                {
                    target.PushToChart();
                    strikeVm.RecalculateCombinedVolatility();
                });
            }
        }

        private void StartDummyTicks()
        {
            Task.Run(async () =>
            {
                var rnd = new Random();
                // initial values
                foreach (var s in Strikes)
                {
                    double basePrice = rnd.Next(100, 500);
                    s.CE.Initialize(basePrice);
                    s.PE.Initialize(basePrice);
                }

                while (true)
                {
                    foreach (var s in Strikes)
                    {
                        double ch1 = (rnd.NextDouble() - 0.5) * 2;
                        s.CE.Data.Ltp += ch1;
                        if (s.CE.Data.Ltp > s.CE.Data.High) s.CE.Data.High = s.CE.Data.Ltp;
                        if (s.CE.Data.Ltp < s.CE.Data.Low) s.CE.Data.Low = s.CE.Data.Ltp;

                        double ch2 = (rnd.NextDouble() - 0.5) * 2;
                        s.PE.Data.Ltp += ch2;
                        if (s.PE.Data.Ltp > s.PE.Data.High) s.PE.Data.High = s.PE.Data.Ltp;
                        if (s.PE.Data.Ltp < s.PE.Data.Low) s.PE.Data.Low = s.PE.Data.Ltp;

                        Application.Current.Dispatcher.Invoke(() =>
                        {
                            s.CE.PushToChart();
                            s.PE.PushToChart();
                            s.RecalculateCombinedVolatility();
                        });
                    }

                    await Task.Delay(80);
                }
            });
        }
    }
}












namespace WpfApp1.ViewModels
{

    public partial class SymbolViewModel : ObservableObject
    {
        public SymbolData Data { get; }
        public SkiaMiniChart Chart { get; }

        private readonly Queue<double> _recent = new();
        private readonly object _recentLock = new();
        private readonly int _maxHistory = 50;

        public SymbolViewModel(string symbol, int history = 50)
        {
            Data = new SymbolData { Symbol = symbol };
            Chart = new SkiaMiniChart { Width = 250, Height = 80 };
            _maxHistory = history;
        }

        public void PushToChart()
        {
            Chart.AddCandle(Data.Open, Data.High, Data.Low, Data.Ltp);
            AddRecent(Data.Ltp);
        }

        private void AddRecent(double ltp)
        {
            lock (_recentLock)
            {
                _recent.Enqueue(ltp);
                while (_recent.Count > _maxHistory) _recent.Dequeue();
            }
        }

        public double[] GetRecentLtp(int take)
        {
            lock (_recentLock)
            {
                return _recent.Reverse().Take(take).Reverse().ToArray();
            }
        }

        // convenience for dummy init
        public void Initialize(double price)
        {
            Data.Open = Data.High = Data.Low = Data.Ltp = price;
            AddRecent(price);
        }
    

        //public void PushToChart() => Chart.AddCandle(Data.Open, Data.High, Data.Low, Data.Ltp);


        //public void PushToChart()
        //{
        //    Chart.AddCandle(Data.Open, Data.High, Data.Low, Data.Ltp);
        //}
    }
}

