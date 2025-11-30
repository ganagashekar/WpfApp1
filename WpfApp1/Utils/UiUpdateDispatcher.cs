using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace WpfApp1.Utils
{


    namespace WpfApp1.Utils
    {
        public static class UiUpdateDispatcher
        {
            private static readonly ConcurrentQueue<Action> _queue = new();
            private static bool _isRunning = false;

            public static void Enqueue(Action action)
            {
                _queue.Enqueue(action);
                StartRunning();
            }

            private static void StartRunning()
            {
                if (_isRunning) return;
                _isRunning = true;

                Application.Current.Dispatcher.BeginInvoke(new Action(ProcessQueue),
                    DispatcherPriority.Background);
            }

            private static void ProcessQueue()
            {
                while (_queue.TryDequeue(out var action))
                    action?.Invoke();

                _isRunning = false;
            }
        }
    }

}
