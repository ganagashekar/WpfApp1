using CommunityToolkit.Mvvm.ComponentModel;
using System;
using System.Globalization;
using System.Linq;
using System.Windows.Data;
using System.Windows.Media;

namespace WpfApp1.ViewModels
{
    public partial class OptionStrikeViewModel : ObservableObject
    {
        public SymbolViewModel CE { get; }
        public SymbolViewModel PE { get; }
        public int Strike { get; }

        [ObservableProperty] private double combinedVolatility;

        private readonly int _volWindow;

        public OptionStrikeViewModel(string ceSymbol, string peSymbol, int strike = 0, int volWindow = 20)
        {
            CE = new SymbolViewModel(ceSymbol);
            PE = new SymbolViewModel(peSymbol);
            Strike = strike;
            _volWindow = volWindow;
        }

        public void RecalculateCombinedVolatility()
        {
            var ceRecent = CE.GetRecentLtp(_volWindow);
            var peRecent = PE.GetRecentLtp(_volWindow);
            var combined = ceRecent.Concat(peRecent).ToArray();

            if (combined.Length < 2) { CombinedVolatility = 0; return; }

            double avg = combined.Average();
            double sumSq = combined.Select(v => (v - avg) * (v - avg)).Sum();
            double variance = sumSq / (combined.Length - 1);
            CombinedVolatility = Math.Sqrt(variance);
        }
    }
}


namespace WpfApp1.Converters
{
    public class VolatilityToHeightConverter : IValueConverter
    {
        public double MaxVol { get; set; } = 8.0;
        public double MaxHeight { get; set; } = 60.0;

        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (!(value is double v)) return 0.0;
            double ratio = Math.Min(1.0, Math.Abs(v) / MaxVol);
            return ratio * MaxHeight;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => throw new NotImplementedException();
    }
}




namespace WpfApp1.Converters
{
    public class VolatilityToBrushConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (!(value is double v)) return Brushes.Gray;
            if (v < 1.5) return Brushes.Green;
            if (v < 3.5) return Brushes.Orange;
            return Brushes.Red;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => throw new NotImplementedException();
    }
}

