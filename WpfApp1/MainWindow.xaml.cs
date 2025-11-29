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
            LoadAllCharts();
            StartRealtimeAllChartUpdater();
        }

        private void LoadAllCharts()
        {
            for (int i = 0; i < 150; i++)
            {
                var c = new AdvancedRealtimeChart
                {
                    Width = 200,
                    Height = 50,
                    Margin = new Thickness(5),
                    Background = Brushes.Black,
                    Stroke = Brushes.Lime,
                    Fill = new SolidColorBrush(Color.FromArgb(60, 0, 255, 0)),
                    Smooth = false,
                    UseGradientFill = false,
                    ShowGrid = false
                };

                charts[i] = c;
                ChartsPanel.Children.Add(c);
            }
        }

        private void StartRealtimeAllChartUpdater()
        {
            Task.Run(() =>
            {
                Random r = new Random();
                double[] prices = new double[150];

                // initial values
                for (int i = 0; i < 150; i++)
                    prices[i] = r.Next(80, 120);

                while (true)
                {
                    // update all 150 prices
                    for (int i = 0; i < 150; i++)
                    {
                        prices[i] += (r.NextDouble() - 0.5) * 2; // random walk
                    }

                    // push to UI in one batch
                    Dispatcher.Invoke(() =>
                    {
                        for (int i = 0; i < 150; i++)
                        {
                            charts[i].Add(prices[i]);
                        }
                    });

                    Thread.Sleep(100); // global update speed
                }
            });
        }
    }
}
