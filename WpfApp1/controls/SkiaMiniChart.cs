using SkiaSharp;
using SkiaSharp.Views.Desktop;
using SkiaSharp.Views.WPF;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Threading;

namespace WpfApp1.controls
{

    namespace WpfApp1.Controls
    {
        public class SkiaMiniChart : SKElement
        {
            private readonly List<double> _rawSamples = new();   // full history
            private readonly List<double> _samples = new();      // decimated for drawing


            private readonly object _sync = new();
           
            private double _min = double.MaxValue;
            private double _max = double.MinValue;

            public bool UseSpline { get; set; } = true;       // performance toggle
            public int MaxSamples { get; set; } = 60;         // limit size = huge CPU drop

            private float _glowAlpha = 0f;
            private readonly DispatcherTimer _glowTimer;

            private DateTime _lastRender = DateTime.MinValue;
            private readonly TimeSpan _minFrameTime = TimeSpan.FromMilliseconds(33); // 30fps

            public double OpenPrice { get; private set; }
            public bool HasOpen => _samples.Count > 0;

            public bool NeedsRedraw { get; private set; } = false;

            public void QueueRedraw()
            {
                NeedsRedraw = true;
            }

            public void RenderIfNeeded()
            {
                if (!NeedsRedraw)
                    return;

                NeedsRedraw = false;
                base.InvalidateVisual();   // actual Skia redraw (only when needed)
            }


            public SkiaMiniChart()
            {
                _glowTimer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(25) };
                _glowTimer.Tick += (s, e) =>
                {
                    _glowAlpha -= 0.07f;
                    if (_glowAlpha <= 0)
                    {
                        _glowAlpha = 0;
                        _glowTimer.Stop();
                    }
                    base.InvalidateVisual();
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
                    if (_rawSamples.Count > 0)
                    {
                        double prev = _rawSamples[^1];
                        if (Math.Abs(v - prev) > Math.Abs(prev * 0.002))
                            glowTrigger = true;
                    }

                    // add to raw history
                    _rawSamples.Add(v);

                    // rebuild decimated sample list when threshold crossed
                    if (_rawSamples.Count > 500)
                    {
                        _samples.Clear();

                        int step = Math.Max(1, _rawSamples.Count / 60);
                        for (int i = 0; i < _rawSamples.Count; i += step)
                            _samples.Add(_rawSamples[i]);
                    }
                    else
                    {
                        // before threshold, use raw samples directly
                        _samples.Add(v);
                    }

                    // recompute min/max for drawing
                    _min = double.MaxValue;
                    _max = double.MinValue;

                    foreach (var s in _samples)
                    {
                        if (s < _min) _min = s;
                        if (s > _max) _max = s;
                    }
                }

                if (glowTrigger)
                {
                    _glowAlpha = 1f;
                    _glowTimer.Start();
                }

                InvalidateVisual();
            }


            public new void InvalidateVisual()
            {
                if (DateTime.Now - _lastRender < _minFrameTime)
                    return;

                _lastRender = DateTime.Now;
                base.InvalidateVisual();
            }

            private SKPath CreateSpline(List<double> data, float w, float h, double min, double max)
            {
                var path = new SKPath();
                int n = data.Count;
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

                    SKPoint c1 = new(p1.X + (p2.X - p0.X) / 6f, p1.Y + (p2.Y - p0.Y) / 6f);
                    SKPoint c2 = new(p2.X - (p3.X - p1.X) / 6f, p2.Y - (p3.Y - p1.Y) / 6f);
                    path.CubicTo(c1, c2, p2);
                }

                return path;
            }

            protected override void OnPaintSurface(SKPaintSurfaceEventArgs e)
            {
                var c = e.Surface.Canvas;
                var info = e.Info;
                c.Clear(SKColors.Black);

                List<double> data;
                double min, max;

                lock (_sync)
                {
                    if (_samples.Count < 2) return;
                    data = new List<double>(_samples);
                    min = _min;
                    max = _max;
                }

                if (min == max) { min -= 1; max += 1; }
                float w = info.Width;
                float h = info.Height;

                double last = data[^1];
                bool bearish = last < OpenPrice;
                SKColor lineColor = bearish ? SKColors.Red : SKColors.LimeGreen;

                SKPath path = UseSpline
                    ? CreateSpline(data, w, h, min, max)
                    : CreateLinearPath(data, w, h, min, max);

                var grads = new[] { lineColor.WithAlpha(90), lineColor.WithAlpha(10) };
                using (var fillPaint = new SKPaint
                {
                    Shader = SKShader.CreateLinearGradient(new SKPoint(0, 0), new SKPoint(0, h), grads, null, SKShaderTileMode.Clamp),
                    IsAntialias = true
                })
                {
                    using var fill = new SKPath(path);
                    fill.LineTo(w, h);
                    fill.LineTo(0, h);
                    fill.Close();
                    c.DrawPath(fill, fillPaint);
                }

                using (var p = new SKPaint { Color = lineColor, StrokeWidth = 2, IsAntialias = true, Style = SKPaintStyle.Stroke })
                    c.DrawPath(path, p);

                float oy = h - (float)((OpenPrice - min) / (max - min) * h);
                using (var dash = new SKPaint
                {
                    Color = new SKColor(160, 160, 160),
                    StrokeWidth = 1,
                    IsAntialias = true,
                    PathEffect = SKPathEffect.CreateDash(new[] { 6f, 6f }, 0)
                })
                    c.DrawLine(0, oy, w, oy, dash);

                if (_glowAlpha > 0)
                {
                    using (var glow = new SKPaint
                    {
                        Color = lineColor.WithAlpha((byte)(160 * _glowAlpha)),
                        IsAntialias = true,
                        StrokeWidth = 5,
                        Style = SKPaintStyle.Stroke,
                        MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 6)
                    })
                        c.DrawPath(path, glow);
                }
            }

            private SKPath CreateLinearPath(List<double> data, float w, float h, double min, double max)
            {
                float range = (float)(max - min);
                SKPath p = new SKPath();
                p.MoveTo(0, h - (float)((data[0] - min) / range * h));
                for (int i = 1; i < data.Count; i++)
                {
                    float x = (float)i / (data.Count - 1) * w;
                    float y = h - (float)((data[i] - min) / range * h);
                    p.LineTo(x, y);
                }
                return p;
            }
        }
    }

}
