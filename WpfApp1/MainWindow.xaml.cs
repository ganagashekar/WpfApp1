using CommunityToolkit.Mvvm.ComponentModel;
using System.Collections.ObjectModel;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;
using WpfApp1.Models;
using WpfApp1.ViewModels;





namespace WpfApp1
{
    public partial class MainWindow : Window
    {
        private DispatcherTimer renderTimer;

        public MainViewModel ViewModel => DataContext as MainViewModel;

        public MainWindow()
        {
            InitializeComponent();

            renderTimer = new DispatcherTimer();
            renderTimer.Interval = TimeSpan.FromMilliseconds(50);  // 20 fps
            renderTimer.Tick += RenderTimer_Tick;
            renderTimer.Start();
        }

        private void RenderTimer_Tick(object sender, EventArgs e)
        {
            if (ViewModel == null) return;

            foreach (var strike in ViewModel.Strikes)
            {
                strike.CE.Chart.RenderIfNeeded();
                strike.PE.Chart.RenderIfNeeded();
            }
        }
    }
}

