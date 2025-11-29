using System;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Media;

namespace WpfApp1
{
    public partial class MainWindow : Window
    {
        private readonly AdvancedRealtimeChart[] charts = new AdvancedRealtimeChart[150];

        public MainWindow()
        {
            InitializeComponent();
            CreateCharts();
            StartFeed();
        }

        private void CreateCharts()
        {
            for (int i = 0; i < 150; i++)
            {
                var c = new AdvancedRealtimeChart
                {
                    Width = 200,
                    Height = 50,
                    Margin = new Thickness(6),
                    //#Background = Brushes.Black,
                    Stroke = Brushes.Lime,
                    Fill = new SolidColorBrush(Color.FromArgb(50, 0, 255, 0)),
                    Smooth = false
                };

                charts[i] = c;
                ChartsPanel.Children.Add(c);
            }
        }

        private void StartFeed()
        {
            Task.Run(() =>
            {
                Random r = new Random();

                double[] open = new double[150];
                double[] high = new double[150];
                double[] low = new double[150];
                double[] ltp = new double[150];

                // initialize OHLC
                for (int i = 0; i < 150; i++)
                {
                    open[i] = r.Next(100, 200);
                    high[i] = low[i] = ltp[i] = open[i];
                }

                while (true)
                {
                    for (int i = 0; i < 150; i++)
                    {
                        double change = (r.NextDouble() - 0.5) * 2;
                        ltp[i] += change;

                        if (ltp[i] > high[i]) high[i] = ltp[i];
                        if (ltp[i] < low[i]) low[i] = ltp[i];
                    }

                    Dispatcher.Invoke(() =>
                    {
                        for (int i = 0; i < 150; i++)
                            charts[i].AddCandle(open[i], high[i], low[i], ltp[i]);
                    });

                    Thread.Sleep(100);
                }
            });
        }
    }
}
