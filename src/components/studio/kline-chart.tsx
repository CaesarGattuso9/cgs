"use client";

import { useEffect, useRef } from "react";
import { AreaSeries, ColorType, createChart, type IChartApi } from "lightweight-charts";

type KLinePoint = {
  time: string;
  value: number;
};

type KLineChartProps = {
  data: KLinePoint[];
};

export function KLineChart({ data }: KLineChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    chartRef.current?.remove();

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "#0c0c14" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
    });

    const series = chart.addSeries(AreaSeries, {
      topColor: "rgba(0,229,255,0.4)",
      bottomColor: "rgba(0,229,255,0.02)",
      lineColor: "#00e5ff",
      lineWidth: 2,
    });

    series.setData(data);
    chartRef.current = chart;

    return () => {
      chart.remove();
    };
  }, [data]);

  return <div className="h-[280px] w-full" ref={containerRef} />;
}
