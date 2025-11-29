using CommunityToolkit.Mvvm.ComponentModel;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using WpfApp1.Models;




namespace WpfApp1.ViewModels
{



    public partial class MainViewModel : ObservableObject
    {
        public ObservableCollection<SymbolViewModel> CEOnly { get; } = new();
        public ObservableCollection<SymbolViewModel> PEOnly { get; } = new();

        private readonly OptionTickEventArgs _engine;
        private ZeroMqOptionFeed _zmq;

        private void OnTick(object sender, OptionTickEventArgs e)
        {
            var vm =
                CEOnly.FirstOrDefault(s => s.Data.Symbol == e.Symbol) ??
                PEOnly.FirstOrDefault(s => s.Data.Symbol == e.Symbol);

            if (vm == null)
                return;

            vm.Data.Open = e.Open;
            vm.Data.High = e.High;
            vm.Data.Low = e.Low;
            vm.Data.Ltp = e.Ltp;

            System.Windows.Application.Current.Dispatcher.Invoke(() =>
            {
                vm.PushToChart();
            });
        }

        public MainViewModel()
        {
            LoadOptions();

            // 👇 CONNECT ZMQ HERE
            _zmq = new ZeroMqOptionFeed("tcp://127.0.0.1:7777");
            _zmq.TickReceived += OnTick;

            // Start live feed
            _zmq.Start();


            StartDummyTicks();

            // engine
            _engine = new OptionTickEventArgs();
            _engine.OptionTickReceived += OnOptionTickReceived;
        }

        private void LoadOptions()
        {
            var json = File.ReadAllText(@"D:\Hosts\JobStocksJson\optiondata0.json");
            var list = System.Text.Json.JsonSerializer.Deserialize<List<OptionItem>>(json);

            foreach (var item in list)
            {
                CEOnly.Add(new SymbolViewModel(item.CE_Symbol));
                PEOnly.Add(new SymbolViewModel(item.PE_Symbol));
            }
        }

        private void OnOptionTickReceived(object sender, OptionTickEventArgs e)
        {
            var vm =
                CEOnly.FirstOrDefault(x => x.Data.Symbol == e.Symbol)
                ?? PEOnly.FirstOrDefault(x => x.Data.Symbol == e.Symbol);

            if (vm == null)
                return;

            vm.Data.Open = e.Open;
            vm.Data.High = e.High;
            vm.Data.Low = e.Low;
            vm.Data.Ltp = e.Ltp;

            System.Windows.Application.Current.Dispatcher.Invoke(() => vm.PushToChart());
        }

        private void StartDummyTicks()
        {
            Task.Run(async () =>
            {
                var rnd = new Random();

                // give initial values
                foreach (var vm in CEOnly.Concat(PEOnly))
                {
                    vm.Data.Open = vm.Data.Ltp = rnd.Next(100, 500);
                    vm.Data.High = vm.Data.Open;
                    vm.Data.Low = vm.Data.Open;
                }

                while (true)
                {
                    foreach (var vm in CEOnly.Concat(PEOnly))
                    {
                        // random walk
                        double ch = (rnd.NextDouble() - 0.5) * 4;
                        vm.Data.Ltp += ch;

                        if (vm.Data.Ltp > vm.Data.High) vm.Data.High = vm.Data.Ltp;
                        if (vm.Data.Ltp < vm.Data.Low) vm.Data.Low = vm.Data.Ltp;

                        // Call the SAME handler used by real ZMQ
                        System.Windows.Application.Current.Dispatcher.Invoke(() =>
                        {
                            vm.PushToChart();
                        });
                    }

                    await Task.Delay(50); // update 20 times per second
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
        //public AdvancedRealtimeChart Chart { get; }
        public SkiaMiniChart Chart { get; }

        public SymbolViewModel(string symbol)
        {
            Data = new SymbolData { Symbol = symbol };

            Chart = new SkiaMiniChart
            {
                Width = 250,
                Height = 60
            };


            //Chart = new AdvancedRealtimeChart
            //{
            //    Width = 250,
            //    Height = 60
            //};
        }

        public void PushToChart() => Chart.AddCandle(Data.Open, Data.High, Data.Low, Data.Ltp);


        //public void PushToChart()
        //{
        //    Chart.AddCandle(Data.Open, Data.High, Data.Low, Data.Ltp);
        //}
    }
}

