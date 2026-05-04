import React, { useEffect, useRef } from "react";
import type { SentimentTrendPoint } from "../../types";

export const SentimentChart: React.FC<{ data: SentimentTrendPoint[]; height?: number }> = ({
  data, height = 200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<unknown>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const render = async () => {
      // @ts-expect-error Chart.js via CDN global
      let Chart = window.Chart;
      if (!Chart) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
        // @ts-expect-error Chart.js via CDN global
        Chart = window.Chart;
      }

      if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy();

      const labels = data.map((d) =>
        new Date(d.date).toLocaleDateString("en", { month: "short", day: "numeric" })
      );

      chartRef.current = new Chart(canvasRef.current!, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: "Avg sentiment",
            data: data.map((d) => d.avg_sentiment ?? 0),
            borderColor: "#3F7FFF",
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: data.length > 30 ? 0 : 3,
            pointBackgroundColor: "#3F7FFF",
            tension: 0.4,
          }],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10, family: "DM Sans, sans-serif" }, color: "#9CA3AF", maxTicksLimit: 7, autoSkip: true } },
            y: { min: 1, max: 5, grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10, family: "DM Sans, sans-serif" }, color: "#9CA3AF", stepSize: 1 } },
          },
        },
      });
    };

    render();
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy(); };
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas ref={canvasRef} role="img" aria-label="Sentiment trend line chart">Sentiment trend data.</canvas>
    </div>
  );
};
