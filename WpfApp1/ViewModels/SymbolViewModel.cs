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
            public ObservableCollection<SymbolViewModel> Symbols { get; }
                = new ObservableCollection<SymbolViewModel>();

            private readonly Random rnd = new();

            public MainViewModel()
            {
                LoadOptions();
                InitializeDummyPrices();
                StartDummyRealtimeFeed();
            }

            private void LoadOptions()
            {
                string json = File.ReadAllText(@"D:\Hosts\JobStocksJson\optiondata0.json");
                var list = System.Text.Json.JsonSerializer.Deserialize<List<OptionItem>>(json);

                foreach (var item in list)
                {
                    Symbols.Add(new SymbolViewModel(item.CE_Symbol));
                    Symbols.Add(new SymbolViewModel(item.PE_Symbol));
                }
            }

            private void InitializeDummyPrices()
            {
                foreach (var s in Symbols)
                {
                    double o = rnd.Next(100, 200);
                    s.Data.Open = o;
                    s.Data.High = o;
                    s.Data.Low = o;
                    s.Data.Ltp = o;
                }
            }

            private void StartDummyRealtimeFeed()
            {
                Task.Run(() =>
                {
                    while (true)
                    {
                        foreach (var s in Symbols)
                        {
                            double change = (rnd.NextDouble() - 0.5) * 2;
                            s.Data.Ltp += change;

                            if (s.Data.Ltp > s.Data.High) s.Data.High = s.Data.Ltp;
                            if (s.Data.Ltp < s.Data.Low) s.Data.Low = s.Data.Ltp;
                        }

                        System.Windows.Application.Current.Dispatcher.Invoke(() =>
                        {
                            foreach (var s in Symbols)
                                s.PushToChart();
                        });

                        Thread.Sleep(100); // 10 updates/sec (realtime)
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


