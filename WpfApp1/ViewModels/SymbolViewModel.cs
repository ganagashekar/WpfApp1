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

using CommunityToolkit.Mvvm.ComponentModel;
using global::WpfApp1.controls.WpfApp1.Controls;
using System.Collections.Generic;
using System.Linq;
using WpfApp1.controls;
using WpfApp1.Models;

namespace WpfApp1.ViewModels
{


    
        public partial class SymbolViewModel : ObservableObject
        {
            public SymbolData Data { get; }
            public SkiaMiniChart Chart { get; }

            private readonly Queue<double> _recent = new();
            private readonly object _lock = new();

            public SymbolViewModel(string symbol)
            {
                Data = new SymbolData { Symbol = symbol };
                Chart = new SkiaMiniChart();
            }

            public void Initialize(double price)
            {
                Data.Open = Data.High = Data.Low = Data.Ltp = price;
                AddRecent(price);
                Chart.AddCandle(price, price, price, price);
            }

            public void Push(double ltp)
            {
                Data.Ltp = ltp;
                if (ltp > Data.High) Data.High = ltp;
                if (ltp < Data.Low) Data.Low = ltp;

                Chart.AddCandle(Data.Open, Data.High, Data.Low, Data.Ltp);
                AddRecent(ltp);
            }

            private void AddRecent(double v)
            {
                lock (_lock)
                {
                    _recent.Enqueue(v);
                    if (_recent.Count > 50)
                        _recent.Dequeue();
                }
            }

            public double[] GetRecent(int n)
            {
                lock (_lock)
                {
                    return _recent.Reverse().Take(n).Reverse().ToArray();
                }
            }
        }
    }



