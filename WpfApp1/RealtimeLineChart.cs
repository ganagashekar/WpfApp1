using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Media;

namespace WpfApp1
{
    using System;
    using System.Collections.Generic;
    using System.Windows;
    using System.Windows.Media;


    public class AdvancedRealtimeChart : FrameworkElement
    {
        private readonly object _sync = new();
        private readonly List<double> _samples = new();
        private double _min = double.MaxValue;
        private double _max = double.MinValue;

        public void AddCandle(double open, double high, double low, double ltp)
        {
            Add(ltp);

            if (ltp < open)
            {
                Stroke = Brushes.Red;
                Fill = new SolidColorBrush(Color.FromArgb(50, 255, 0, 0));
            }
            else
            {
                Stroke = Brushes.Lime;
                Fill = new SolidColorBrush(Color.FromArgb(50, 0, 255, 0));
            }
        }

        public void Add(double v)
        {
            lock (_sync)
            {
                _samples.Add(v);
                if (v < _min) _min = v;
                if (v > _max) _max = v;
            }

            InvalidateVisual();
        }

        public Brush Stroke { get; set; } = Brushes.Lime;
        public Brush Fill { get; set; } = new SolidColorBrush(Color.FromArgb(50, 0, 255, 0));

        protected override Size MeasureOverride(Size constraint) => new Size(250, 60);
        protected override Size ArrangeOverride(Size finalSize) => finalSize;

        protected override void OnRender(DrawingContext dc)
        {
            base.OnRender(dc);

            if (_samples.Count < 2)
                return;

            double w = ActualWidth;
            double h = ActualHeight;

            // Background
            dc.DrawRectangle(Brushes.Black, null, new Rect(0, 0, w, h));

            // Snapshot of data
            List<double> data;
            double min, max;
            double openPrice;

            lock (_sync)
            {
                data = new List<double>(_samples);
                min = _min;
                max = _max;
                openPrice = _samples.Count > 0 ? _samples.First() : 0;  // FIRST LTP = OPEN
            }

            if (min == max) { min -= 1; max += 1; }
            double range = max - min;

            // === DRAW DASHED OPEN PRICE LINE ===
            double openY = h - ((openPrice - min) / range) * h;

            var openPen = new Pen(Brushes.DarkGray, 0.7)
            {
                DashStyle = DashStyles.Dash
            };

            dc.DrawLine(openPen, new Point(0, openY), new Point(w, openY));



            // === AREA FILL ===
            var fillGeo = new StreamGeometry();
            using (var ctx = fillGeo.Open())
            {
                ctx.BeginFigure(PointAt(0, data[0]), true, true);

                for (int i = 1; i < data.Count; i++)
                    ctx.LineTo(PointAt(i, data[i]), true, false);

                ctx.LineTo(new Point(w, h), true, false);
                ctx.LineTo(new Point(0, h), true, false);
            }
            fillGeo.Freeze();
            dc.DrawGeometry(Fill, null, fillGeo);



            // === LINE ===
            var lineGeo = new StreamGeometry();
            using (var ctx = lineGeo.Open())
            {
                ctx.BeginFigure(PointAt(0, data[0]), false, false);

                for (int i = 1; i < data.Count; i++)
                    ctx.LineTo(PointAt(i, data[i]), true, false);
            }
            lineGeo.Freeze();
            dc.DrawGeometry(null, new Pen(Stroke, 1.3), lineGeo);



            // helper
            Point PointAt(int idx, double val)
            {
                double x = (double)idx / (data.Count - 1) * w;
                double y = h - ((val - min) / range) * h;
                return new Point(x, y);
            }
        }


    }


}
