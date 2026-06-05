import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function LifecycleChart({ states, values }) {
  const chartRef = useRef(null);

  const data = {
    labels: states,
    datasets: [
      {
        label: 'Progression',
        data: values,
        fill: true,
        tension: 0.45,
        pointRadius: 5,
        pointHoverRadius: 8,
        pointBackgroundColor: '#7c3aed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        borderColor: '#7c3aed',
        borderWidth: 2.5,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(124,58,237,0.4)');
          gradient.addColorStop(0.5, 'rgba(124,58,237,0.15)');
          gradient.addColorStop(1, 'rgba(124,58,237,0)');
          return gradient;
        },
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(124,58,237,0.4)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx) => `  Intensity: ${ctx.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11, family: 'Inter' } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 11, family: 'Inter' },
          callback: (v) => `${v}%`,
        },
        border: { display: false },
      },
    },
    interaction: { mode: 'index', intersect: false },
  };

  return <Line ref={chartRef} data={data} options={options} />;
}