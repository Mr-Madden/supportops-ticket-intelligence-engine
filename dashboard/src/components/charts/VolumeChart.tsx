import React, { useEffect, useRef } from "react";
import type { VolumePoint } from "../../types";

export const VolumeChart: React.FC<{ data: VolumePoint[]; height?: number }> = ({
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
        type: "bar",
        data: {
          labels,
          datasets: [
            { label: "Tickets",      data: data.map((d) => d.total),       backgroundColor: "#3F7FFF", borderRadius: 3, borderSkipped: false },
            { label: "Escalations",  data: data.map((d) => d.escalations), backgroundColor: "#D85A30", borderRadius: 3, borderSkipped: false },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10, family: "DM Sans, sans-serif" }, color: "#9CA3AF", maxTicksLimit: 7, autoSkip: true } },
            y: { grid: { color: "rgba(0,0,0,0.04)" }, ticks: { font: { size: 10, family: "DM Sans, sans-serif" }, color: "#9CA3AF" } },
          },
        },
      });
    };

    render();
    return () => { if (chartRef.current) (chartRef.current as { destroy: () => void }).destroy(); };
  }, [data]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas ref={canvasRef} role="img" aria-label="Daily ticket volume bar chart">Volume data.</canvas>
    </div>
  );
};
