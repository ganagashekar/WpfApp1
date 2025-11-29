using CommunityToolkit.Mvvm.ComponentModel;
using System.Collections.Generic;
using System.ComponentModel;
using System.Runtime.CompilerServices;

namespace WpfApp1
{
    public class ChartBuffer : INotifyPropertyChanged
    {
        private readonly List<double> _values = new();
        public IEnumerable<double> Values => _values;

        public void Add(double v)
        {
            _values.Add(v);
            if (_values.Count > 40) _values.RemoveAt(0);
            OnPropertyChanged(nameof(Values));
        }

        public event PropertyChangedEventHandler? PropertyChanged;
        protected void OnPropertyChanged([CallerMemberName] string? n = null)
            => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(n));
    }
}
namespace WpfApp1.Models
{
    public class OptionItem
    {
        public string CE_Symbol { get; set; }
        public string PE_Symbol { get; set; }
        public string stock_name { get; set; }
        public string stock_name_exp { get; set; }
        public string expiry { get; set; }
        public int Strike { get; set; }
    }

    public partial class SymbolData : ObservableObject
    {
        [ObservableProperty] private string symbol;
        [ObservableProperty] private double open;
        [ObservableProperty] private double high;
        [ObservableProperty] private double low;
        [ObservableProperty] private double ltp;

       
    }
}
