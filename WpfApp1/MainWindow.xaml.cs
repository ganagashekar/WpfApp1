using CommunityToolkit.Mvvm.ComponentModel;
using System.Collections.ObjectModel;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using WpfApp1.Models;
using WpfApp1.ViewModels;





namespace WpfApp1
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }

        //private void ChartLoaded(object sender, RoutedEventArgs e)
        //{
        //    var ui = sender as AdvancedRealtimeChart;
        //    var vm = ui.DataContext as SymbolViewModel;

        //    ui.CopyFrom(vm.Chart); // sync settings
        //    vm.Chart.AttachTo(ui); // optional: mirror target
        //}

    }
}

