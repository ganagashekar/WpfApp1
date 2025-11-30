using CommunityToolkit.Mvvm.ComponentModel;
using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using WpfApp1.Models;
using WpfApp1.Utils;
using WpfApp1.Utils.WpfApp1.Utils;

namespace WpfApp1.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        public ObservableCollection<OptionStrikeViewModel> Strikes { get; } = new();

        private readonly ZeroMqOptionFeed feed;
        private readonly bool dummy = true;

        public MainViewModel()
        {
            LoadStrikes();

            if (!dummy)
            {
                feed = new ZeroMqOptionFeed("tcp://127.0.0.1:7777");
                feed.Tick += HandleTick;
                feed.Start();
            }
            else
            {
                StartDummy();
            }
        }

        private void LoadStrikes()
        {
            var json = File.ReadAllText(@"D:\Hosts\JobStocksJson\optiondata0.json");
            var list = System.Text.Json.JsonSerializer.Deserialize<OptionItem[]>(json).Where(x=>x.stock_name.Contains("CNX"));

            foreach (var o in list)
                Strikes.Add(new OptionStrikeViewModel(o.CE_Symbol, o.PE_Symbol, o.Strike));
        }

        private void HandleTick(object s, OptionTickEventArgs e)
        {
            var strike = Strikes.FirstOrDefault(x =>
                x.CE.Data.Symbol == e.Symbol ||
                x.PE.Data.Symbol == e.Symbol);

            if (strike == null) return;

            var side = strike.CE.Data.Symbol == e.Symbol ? strike.CE : strike.PE;

            UiUpdateDispatcher.Enqueue(() =>
            {
                side.Push(e.Ltp);
                strike.RecalcVol();
            });
        }

        private void StartDummy()
        {
            Task.Run(async () =>
            {
                var rnd = new Random();

                // init random
                foreach (var s in Strikes)
                {
                    double price = rnd.Next(100, 500);
                    Application.Current.Dispatcher.Invoke(() =>
                    {
                        s.CE.Initialize(price);
                        s.PE.Initialize(price);
                    });
                }

                while (true)
                {
                    foreach (var s in Strikes)
                    {
                        double ce = s.CE.Data.Ltp + (rnd.NextDouble() - 0.5) * 2;
                        double pe = s.PE.Data.Ltp + (rnd.NextDouble() - 0.5) * 2;

                        UiUpdateDispatcher.Enqueue(() =>
                        {
                            s.CE.Push(ce);
                            s.PE.Push(pe);
                            s.RecalcVol();
                        });
                    }
                    await Task.Delay(50);
                }
            });
        }
    }
}
