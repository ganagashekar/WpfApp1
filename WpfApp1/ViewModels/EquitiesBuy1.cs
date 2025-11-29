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
}