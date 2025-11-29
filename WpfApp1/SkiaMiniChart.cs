using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace WpfApp1
{
    using SkiaSharp;
    using SkiaSharp.Views.Desktop;
    using SkiaSharp.Views.WPF;
    using System;
    using System.Collections.Generic;
    using System.Windows;
    using System.Windows.Controls;
    using System.Windows.Media;
    using System.Xml.Linq;

  
        public class SkiaMiniChart : SKElement
        {
            private readonly object _sync = new();
            private readonly List<double> _samples = new();
            private double _min = double.MaxValue;
            private double _max = double.MinValue;

            public double OpenPrice { get; private set; }
            public bool HasOpen => _samples.Count > 0;

            public void AddCandle(double open, double high, double low, double ltp)
            {
                if (!HasOpen)
                    OpenPrice = open;

                Add(ltp);
            }

            public void Add(double value)
            {
                lock (_sync)
                {
                    _samples.Add(value);

                    if (value < _min) _min = value;
                    if (value > _max) _max = value;
                }

                InvalidateVisual(); // Skia redraw
            }

            protected override void OnPaintSurface(SKPaintSurfaceEventArgs e)
            {
                var canvas = e.Surface.Canvas;
                var info = e.Info;

                canvas.Clear(SKColors.Black);

                List<double> data;
                double min, max;

                lock (_sync)
                {
                    if (_samples.Count < 2)
                        return;

                    data = new List<double>(_samples);
                    min = _min;
                    max = _max;
                }

                if (min == max)
                {
                    min -= 1;
                    max += 1;
                }

                float w = info.Width;
                float h = info.Height;

                // Trend color
                bool bearish = data[^1] < OpenPrice;
                SKColor strokeColor = bearish ? SKColors.Red : SKColors.LimeGreen;
                SKColor fillColor = bearish
                    ? new SKColor(255, 0, 0, 50)
                    : new SKColor(0, 255, 0, 50);

                float range = (float)(max - min);

                // === 1) DRAW AREA FILL ===
                using (var paintFill = new SKPaint
                {
                    Color = fillColor,
                    Style = SKPaintStyle.Fill,
                    IsAntialias = true
                })
                using (var path = new SKPath())
                {
                    path.MoveTo(0, Y(data[0]));

                    for (int i = 1; i < data.Count; i++)
                    {
                        path.LineTo(X(i), Y(data[i]));
                    }

                    path.LineTo(w, h);
                    path.LineTo(0, h);
                    path.Close();

                    canvas.DrawPath(path, paintFill);
                }

                // === 2) DRAW PRICE LINE ===
                using (var paintLine = new SKPaint
                {
                    Color = strokeColor,
                    StrokeWidth = 2,
                    IsAntialias = true,
                    Style = SKPaintStyle.Stroke
                })
                using (var path = new SKPath())
                {
                    path.MoveTo(0, Y(data[0]));

                    for (int i = 1; i < data.Count; i++)
                        path.LineTo(X(i), Y(data[i]));

                    canvas.DrawPath(path, paintLine);
                }

                // === 3) OPEN PRICE DASHED LINE ===
                using (var paintDash = new SKPaint
                {
                    Color = new SKColor(180, 180, 180),
                    IsAntialias = true,
                    Style = SKPaintStyle.Stroke,
                    StrokeWidth = 1,
                    PathEffect = SKPathEffect.CreateDash(new float[] { 6, 6 }, 0)
                })
                {
                    float oy = Y(OpenPrice);
                    canvas.DrawLine(0, oy, w, oy, paintDash);
                }

                // helper functions
                float X(int idx) => (float)idx / (data.Count - 1) * w;
                float Y(double val) => h - (float)((val - min) / range * h);
            }
        }
    

}
