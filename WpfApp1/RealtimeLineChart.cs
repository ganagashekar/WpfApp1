using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Media;

namespace WpfApp1
{
    public class AdvancedRealtimeChart : FrameworkElement
    {
        private readonly object _sync = new();
        private readonly List<double> _samples = new();

        private double _min = double.MaxValue;
        private double _max = double.MinValue;

        // --------------------- Dependency Properties ---------------------

        public static readonly DependencyProperty StrokeProperty =
            DependencyProperty.Register(nameof(Stroke), typeof(Brush),
                typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(Brushes.Lime,
                    FrameworkPropertyMetadataOptions.AffectsRender));

        public Brush Stroke
        {
            get => (Brush)GetValue(StrokeProperty);
            set => SetValue(StrokeProperty, value);
        }

        public static readonly DependencyProperty FillProperty =
            DependencyProperty.Register(nameof(Fill), typeof(Brush),
                typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(
                    new SolidColorBrush(Color.FromArgb(60, 0, 255, 0)),
                    FrameworkPropertyMetadataOptions.AffectsRender));

        public Brush Fill
        {
            get => (Brush)GetValue(FillProperty);
            set => SetValue(FillProperty, value);
        }

        public static readonly DependencyProperty SmoothProperty =
            DependencyProperty.Register(nameof(Smooth), typeof(bool),
                typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(false,
                    FrameworkPropertyMetadataOptions.AffectsRender));

        public bool Smooth
        {
            get => (bool)GetValue(SmoothProperty);
            set => SetValue(SmoothProperty, value);
        }


        // ------------------ PUBLIC API ------------------

        public void Add(double value)
        {
            lock (_sync)
            {
                _samples.Add(value);    // infinite history

                if (value < _min) _min = value;
                if (value > _max) _max = value;
            }

            InvalidateVisual();
        }

        // OHLC + auto COLOR
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


        // ------------------ RENDER ------------------

        protected override void OnRender(DrawingContext dc)
        {
            base.OnRender(dc);

            if (_samples.Count < 2)
                return;

            double w = ActualWidth;
            double h = ActualHeight;

            if (w <= 0 || h <= 0)
                return;

            // background
            dc.DrawRectangle(Brushes.Black, null, new Rect(0, 0, w, h));

            List<double> data;
            double min, max;

            lock (_sync)
            {
                data = new List<double>(_samples);
                min = _min;
                max = _max;
            }

            if (min == max)
            {
                min -= 1;
                max += 1;
            }

            int count = data.Count;
            double range = max - min;


            // ------- AREA FILL -------
            StreamGeometry fillGeo = new StreamGeometry();
            using (var ctx = fillGeo.Open())
            {
                ctx.BeginFigure(ToPoint(0, data[0], w, h, min, range), true, true);

                for (int i = 1; i < count; i++)
                    ctx.LineTo(ToPoint(i, data[i], w, h, min, range), true, false);

                ctx.LineTo(new Point(w, h), false, false);
                ctx.LineTo(new Point(0, h), false, false);
            }
            fillGeo.Freeze();
            dc.DrawGeometry(Fill, null, fillGeo);

            // ------- LINE -------
            StreamGeometry lineGeo = new StreamGeometry();
            using (var ctx = lineGeo.Open())
            {
                ctx.BeginFigure(ToPoint(0, data[0], w, h, min, range), false, false);

                for (int i = 1; i < count; i++)
                    ctx.LineTo(ToPoint(i, data[i], w, h, min, range), true, false);
            }
            lineGeo.Freeze();

            dc.DrawGeometry(null, new Pen(Stroke, 1.3), lineGeo);
        }

        private Point ToPoint(int index, double value, double w, double h, double min, double range)
        {
            double x = (double)index / (_samples.Count - 1) * w;

            double yn = (value - min) / range;
            double y = h - yn * h;

            return new Point(x, y);
        }

        protected override Size MeasureOverride(Size constraint) => new Size(100, 40);
        protected override Size ArrangeOverride(Size finalSize) => finalSize;
    }
}
