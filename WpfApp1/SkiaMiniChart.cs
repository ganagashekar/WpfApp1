using SkiaSharp;
using SkiaSharp.Views.Desktop;
using SkiaSharp.Views.WPF;
using System;
using System.Collections.Generic;
using System.Windows.Threading;

namespace WpfApp1
{
    public class SkiaMiniChart : SKElement
    {
        private readonly object _sync = new();
        private readonly List<double> _samples = new();
        private double _min = double.MaxValue;
        private double _max = double.MinValue;

        private float _glowAlpha = 0f;
        private readonly DispatcherTimer _glowTimer;

        public double OpenPrice { get; private set; }
        public bool HasOpen => _samples.Count > 0;

        public SkiaMiniChart()
        {
            _glowTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(25) };
            _glowTimer.Tick += (s, e) =>
            {
                _glowAlpha -= 0.07f;
                if (_glowAlpha <= 0) { _glowAlpha = 0; _glowTimer.Stop(); }
                InvalidateVisual();
            };
        }

        public void AddCandle(double open, double high, double low, double ltp)
        {
            if (!HasOpen) OpenPrice = open;
            Add(ltp);
        }

        public void Add(double v)
        {
            bool glowTrigger = false;
            lock (_sync)
            {
                if (_samples.Count > 0)
                {
                    double prev = _samples[^1];
                    if (Math.Abs(v - prev) > Math.Abs(prev * 0.002)) glowTrigger = true; // 0.2% threshold
                }

                _samples.Add(v);
                if (v < _min) _min = v;
                if (v > _max) _max = v;
            }

            if (glowTrigger)
            {
                _glowAlpha = 1f;
                _glowTimer.Start();
            }

            InvalidateVisual();
        }

        private SKPath CreateSplinePath(List<double> data, float w, float h, double min, double max)
        {
            var path = new SKPath();
            int n = data.Count;
            if (n < 2) return path;
            float range = (float)(max - min);
            SKPoint[] pts = new SKPoint[n];
            for (int i = 0; i < n; i++)
            {
                float x = (float)i / (n - 1) * w;
                float y = h - (float)((data[i] - min) / range * h);
                pts[i] = new SKPoint(x, y);
            }

            path.MoveTo(pts[0]);
            for (int i = 0; i < n - 1; i++)
            {
                SKPoint p0 = (i == 0) ? pts[i] : pts[i - 1];
                SKPoint p1 = pts[i];
                SKPoint p2 = pts[i + 1];
                SKPoint p3 = (i + 2 < n) ? pts[i + 2] : p2;

                SKPoint c1 = new SKPoint(p1.X + (p2.X - p0.X) / 6f, p1.Y + (p2.Y - p0.Y) / 6f);
                SKPoint c2 = new SKPoint(p2.X - (p3.X - p1.X) / 6f, p2.Y - (p3.Y - p1.Y) / 6f);

                path.CubicTo(c1, c2, p2);
            }

            return path;
        }

        protected override void OnPaintSurface(SKPaintSurfaceEventArgs e)
        {
            var canvas = e.Surface.Canvas;
            var info = e.Info;
            float w = info.Width;
            float h = info.Height;

            canvas.Clear(SKColors.Black);

            List<double> data;
            double min, max;

            lock (_sync)
            {
                if (_samples.Count < 2) return;
                data = new List<double>(_samples);
                min = _min; max = _max;
            }

            if (min == max) { min -= 1; max += 1; }
            float range = (float)(max - min);
            double last = data[^1];
            bool bearish = last < OpenPrice;
            SKColor trendColor = bearish ? SKColors.Red : SKColors.LimeGreen;

            SKPath spline = CreateSplinePath(data, w, h, min, max);

            // gradient fill
            var gradientColors = new[] { trendColor.WithAlpha(90), trendColor.WithAlpha(10) };
            using (var paintFill = new SKPaint
            {
                Shader = SKShader.CreateLinearGradient(new SKPoint(0, 0), new SKPoint(0, h), gradientColors, null, SKShaderTileMode.Clamp),
                IsAntialias = true,
                Style = SKPaintStyle.Fill
            })
            using (var fillPath = new SKPath(spline))
            {
                fillPath.LineTo(w, h);
                fillPath.LineTo(0, h);
                fillPath.Close();
                canvas.DrawPath(fillPath, paintFill);
            }

            // price line
            using (var paintLine = new SKPaint { Color = trendColor, StrokeWidth = 2, IsAntialias = true, Style = SKPaintStyle.Stroke })
            {
                canvas.DrawPath(spline, paintLine);
            }

            // open dashed line
            float openY = h - (float)((OpenPrice - min) / range * h);
            using (var paintDash = new SKPaint { Color = new SKColor(160, 160, 160), StrokeWidth = 1, IsAntialias = true, Style = SKPaintStyle.Stroke, PathEffect = SKPathEffect.CreateDash(new float[] { 6, 6 }, 0) })
                canvas.DrawLine(0, openY, w, openY, paintDash);

            // glow
            if (_glowAlpha > 0)
            {
                using (var glowPaint = new SKPaint { Color = trendColor.WithAlpha((byte)(150 * _glowAlpha)), IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 5, MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 6) })
                    canvas.DrawPath(spline, glowPaint);
            }
        }
    }
}
