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

        private readonly Random rnd = new();

        public MainViewModel()
        {
            LoadOptions();
            InitDummyPrices();
            StartDummyFeed();
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

        private void InitDummyPrices()
        {
            foreach (var s in CEOnly)
            {
                double o = rnd.Next(100, 200);
                s.Data.Open = o; s.Data.High = o; s.Data.Low = o; s.Data.Ltp = o;
            }

            foreach (var s in PEOnly)
            {
                double o = rnd.Next(100, 200);
                s.Data.Open = o; s.Data.High = o; s.Data.Low = o; s.Data.Ltp = o;
            }
        }

        private void StartDummyFeed()
        {
            Task.Run(() =>
            {
                while (true)
                {
                    foreach (var s in CEOnly)
                    {
                        double ch = (rnd.NextDouble() - 0.5) * 2;
                        s.Data.Ltp += ch;
                        if (s.Data.Ltp > s.Data.High) s.Data.High = s.Data.Ltp;
                        if (s.Data.Ltp < s.Data.Low) s.Data.Low = s.Data.Ltp;
                    }

                    foreach (var s in PEOnly)
                    {
                        double ch = (rnd.NextDouble() - 0.5) * 2;
                        s.Data.Ltp += ch;
                        if (s.Data.Ltp > s.Data.High) s.Data.High = s.Data.Ltp;
                        if (s.Data.Ltp < s.Data.Low) s.Data.Low = s.Data.Ltp;
                    }

                    System.Windows.Application.Current.Dispatcher.Invoke(() =>
                    {
                        foreach (var s in CEOnly) s.PushToChart();
                        foreach (var s in PEOnly) s.PushToChart();
                    });

                    Thread.Sleep(100);
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
        public AdvancedRealtimeChart Chart { get; }

        public SymbolViewModel(string symbol)
        {
            Data = new SymbolData { Symbol = symbol };

            Chart = new AdvancedRealtimeChart
            {
                Width = 200,
                Height = 50,
                Margin = new System.Windows.Thickness(6),
                Smooth = false
            };
        }

        public void PushToChart()
        {
            Chart.AddCandle(Data.Open, Data.High, Data.Low, Data.Ltp);
        }
    }
}


