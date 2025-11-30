using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WpfApp1.ViewModels
{
    using CommunityToolkit.Mvvm.ComponentModel;
    using System;
    using System.Linq;


        public partial class OptionStrikeViewModel : ObservableObject
        {
            public SymbolViewModel CE { get; }
            public SymbolViewModel PE { get; }
            public int Strike { get; }

            [ObservableProperty]
            private double combinedVolatility;

            private readonly int _window = 20;

            public OptionStrikeViewModel(string ce, string pe, int strike)
            {
                CE = new SymbolViewModel(ce);
                PE = new SymbolViewModel(pe);
                Strike = strike;
            }

            public void RecalcVol()
            {
                var ce = CE.GetRecent(_window);
                var pe = PE.GetRecent(_window);

                var all = ce.Concat(pe).ToArray();
                if (all.Length < 2) { CombinedVolatility = 0; return; }

                double avg = all.Average();
                double sumSq = all.Select(v => (v - avg) * (v - avg)).Sum();
                CombinedVolatility = Math.Sqrt(sumSq / (all.Length - 1));
            }
        }
    }


