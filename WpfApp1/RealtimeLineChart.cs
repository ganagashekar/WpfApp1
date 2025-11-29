using System;
using System.Collections.Generic;
using System.Linq;
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

        // --------------------------------------------------------------------
        //  DEPENDENCY PROPERTIES
        // --------------------------------------------------------------------

        public static readonly DependencyProperty StrokeProperty =
            DependencyProperty.Register(nameof(Stroke), typeof(Brush), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(Brushes.Lime, FrameworkPropertyMetadataOptions.AffectsRender));

        public Brush Stroke
        {
            get => (Brush)GetValue(StrokeProperty);
            set => SetValue(StrokeProperty, value);
        }

        public static readonly DependencyProperty FillProperty =
            DependencyProperty.Register(nameof(Fill), typeof(Brush), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(new SolidColorBrush(Color.FromArgb(70, 0, 255, 0)),
                    FrameworkPropertyMetadataOptions.AffectsRender));

        public Brush Fill
        {
            get => (Brush)GetValue(FillProperty);
            set => SetValue(FillProperty, value);
        }

        public static readonly DependencyProperty UseGradientFillProperty =
            DependencyProperty.Register(nameof(UseGradientFill), typeof(bool), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.AffectsRender));

        public bool UseGradientFill
        {
            get => (bool)GetValue(UseGradientFillProperty);
            set => SetValue(UseGradientFillProperty, value);
        }

        public static readonly DependencyProperty StrokeThicknessProperty =
            DependencyProperty.Register(nameof(StrokeThickness), typeof(double), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(1.2, FrameworkPropertyMetadataOptions.AffectsRender));

        public double StrokeThickness
        {
            get => (double)GetValue(StrokeThicknessProperty);
            set => SetValue(StrokeThicknessProperty, value);
        }

        public static readonly DependencyProperty MaxSamplesProperty =
            DependencyProperty.Register(nameof(MaxSamples), typeof(int), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(40, FrameworkPropertyMetadataOptions.AffectsRender));

        public int MaxSamples
        {
            get => (int)GetValue(MaxSamplesProperty);
            set => SetValue(MaxSamplesProperty, value);
        }

        public static readonly DependencyProperty SmoothProperty =
            DependencyProperty.Register(nameof(Smooth), typeof(bool), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(true, FrameworkPropertyMetadataOptions.AffectsRender));

        public bool Smooth
        {
            get => (bool)GetValue(SmoothProperty);
            set => SetValue(SmoothProperty, value);
        }

        public static readonly DependencyProperty ShowGridProperty =
            DependencyProperty.Register(nameof(ShowGrid), typeof(bool), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.AffectsRender));

        public bool ShowGrid
        {
            get => (bool)GetValue(ShowGridProperty);
            set => SetValue(ShowGridProperty, value);
        }

        public static readonly DependencyProperty Background2Property =
            DependencyProperty.Register(nameof(Background), typeof(Brush), typeof(AdvancedRealtimeChart),
                new FrameworkPropertyMetadata(Brushes.Transparent, FrameworkPropertyMetadataOptions.AffectsRender));

        public Brush Background
        {
            get => (Brush)GetValue(Background2Property);
            set => SetValue(Background2Property, value);
        }

        // --------------------------------------------------------------------
        //  PUBLIC API: ADD DATA
        // --------------------------------------------------------------------

        //public void Add(double value)
        //{
        //    lock (_sync)
        //    {
        //        _samples.Add(value);
        //        if (_samples.Count > MaxSamples)
        //            _samples.RemoveAt(0);

        //        if (value < _min) _min = value;
        //        if (value > _max) _max = value;
        //    }

        //    InvalidateVisual();
        //}

        public void Add(double value)
        {
            lock (_sync)
            {
                _samples.Add(value);

                if (value < _min) _min = value;
                if (value > _max) _max = value;
            }

            InvalidateVisual();   // redraw full history
        }


        // --------------------------------------------------------------------
        //  RENDER
        // --------------------------------------------------------------------

        protected override void OnRender(DrawingContext dc)
        {
            base.OnRender(dc);

            double w = ActualWidth;
            double h = ActualHeight;
            if (w <= 0 || h <= 0) return;

            // --- background
            dc.DrawRectangle(Background, null, new Rect(0, 0, w, h));

            // --- grid
            if (ShowGrid)
                DrawGrid(dc, w, h);

            // copy samples
            List<double> samples;
            double min, max;

            lock (_sync)
            {
                if (_samples.Count < 2) return;

                samples = _samples.ToList();
                min = _min;
                max = _max;
            }

            if (min == max)
            {
                min -= 1;
                max += 1;
            }

            double range = max - min;

            // ---------------- DRAW FILLED AREA --------------------
            if (Fill != null)
            {
                Brush fillBrush = Fill;

                if (UseGradientFill)
                {
                    fillBrush = new LinearGradientBrush(
                        Color.FromArgb(120, 0, 255, 0),
                        Color.FromArgb(20, 0, 255, 0),
                        new Point(0, 0),
                        new Point(0, 1));
                }

                StreamGeometry fillGeo = new();
                using (var ctx = fillGeo.Open())
                {
                    ctx.BeginFigure(PointFor(0, samples[0]), true, true);

                    for (int i = 1; i < samples.Count; i++)
                        ctx.LineTo(PointFor(i, samples[i]), true, false);

                    ctx.LineTo(new Point(w, h), false, false);
                    ctx.LineTo(new Point(0, h), false, false);
                }
                fillGeo.Freeze();
                dc.DrawGeometry(fillBrush, null, fillGeo);
            }

            // ---------------- DRAW LINE ----------------------------
            StreamGeometry lineGeo = Smooth
                ? BuildSmoothedCurve(samples, w, h, min, max)
                : BuildPolyLine(samples, w, h, min, max);

            lineGeo.Freeze();
            dc.DrawGeometry(null, new Pen(Stroke, StrokeThickness), lineGeo);
        }

        // --------------------------------------------------------------------
        //  HELPERS
        // --------------------------------------------------------------------

        private StreamGeometry BuildPolyLine(List<double> samples, double w, double h, double min, double max)
        {
            StreamGeometry geo = new();
            using (var g = geo.Open())
            {
                g.BeginFigure(PointFor(0, samples[0]), false, false);

                for (int i = 1; i < samples.Count; i++)
                    g.LineTo(PointFor(i, samples[i]), true, false);
            }
            return geo;
        }

        private StreamGeometry BuildSmoothedCurve(List<double> samples, double w, double h, double min, double max)
        {
            StreamGeometry geo = new();
            using (var g = geo.Open())
            {
                g.BeginFigure(PointFor(0, samples[0]), false, false);

                for (int i = 1; i < samples.Count - 2; i++)
                {
                    Point p0 = PointFor(i - 1, samples[i - 1]);
                    Point p1 = PointFor(i, samples[i]);
                    Point p2 = PointFor(i + 1, samples[i + 1]);

                    Point c1 = new(p1.X + (p2.X - p0.X) / 6, p1.Y + (p2.Y - p0.Y) / 6);
                    Point c2 = new(p2.X - (samples.Count > i + 2 ? (PointFor(i + 2, samples[i + 2]).X - p1.X) / 6 : 0),
                                  p2.Y - (samples.Count > i + 2 ? (PointFor(i + 2, samples[i + 2]).Y - p1.Y) / 6 : 0));

                    g.BezierTo(c1, c2, p2, true, false);
                }
            }
            return geo;
        }

        private void DrawGrid(DrawingContext dc, double w, double h)
        {
            Pen p = new(Brushes.Gray, 0.5) { DashStyle = DashStyles.Dash };
            for (int i = 1; i < 4; i++)
            {
                double y = h * i / 4;
                dc.DrawLine(p, new Point(0, y), new Point(w, y));
            }
        }

        private Point PointFor(int index, double value)
        {
            double w = ActualWidth;
            double h = ActualHeight;

            int count = _samples.Count;
            double x = (double)index / (count - 1) * (w - 1);

            double min = _min;
            double max = _max;
            double range = max - min;

            double yNorm = (value - min) / range;
            double y = h - (yNorm * (h - 1));

            return new Point(x, y);
        }

        protected override Size MeasureOverride(Size constraint) =>
            new Size(100, 40);

        protected override Size ArrangeOverride(Size size) => size;
    }
}
