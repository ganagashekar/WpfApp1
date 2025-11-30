using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Data;
using System.Windows.Media;


namespace WpfApp1.Converters
    {
        public class VolatilityToHeightConverter : IValueConverter
        {
            public double MaxVol { get; set; } = 8.0;
            public double MaxHeight { get; set; } = 60.0;

            public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
            {
                if (value is not double v) return 0.0;
                double ratio = Math.Min(1.0, Math.Abs(v) / MaxVol);
                return ratio * MaxHeight;
            }

            public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => null;
        }
}



namespace WpfApp1.Converters
{
    public class VolatilityToBrushConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is not double v) return Brushes.Gray;
            if (v < 1.5) return Brushes.Green;
            if (v < 3.5) return Brushes.Orange;
            return Brushes.Red;
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture) => null;
    }
}



