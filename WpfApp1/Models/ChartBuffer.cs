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
