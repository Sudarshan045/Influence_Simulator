import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function MarkovTransitionChart({ simulationData, peakYearEstimate, originYear }) {
  const STATES = ["Birth", "Growth", "Peak", "Decline", "Dormancy", "Revival"];
  const colors = [
    '#3b82f6', // Birth - Blue
    '#10b981', // Growth - Green
    '#f59e0b', // Peak - Amber
    '#ef4444', // Decline - Red
    '#64748b', // Dormancy - Slate
    '#8b5cf6', // Revival - Violet
  ];

  // Build year-based x-axis labels using peak estimate or a rolling window
  const steps = simulationData.length;
  const endYear = peakYearEstimate
    ? Math.max(peakYearEstimate + 2, new Date().getFullYear() + 3)
    : new Date().getFullYear() + steps;
  const startYear = endYear - steps + 1;

  const labels = simulationData.map((_, i) => {
    const year = startYear + i;
    return year.toString();
  });

  const datasets = STATES.map((state, idx) => ({
    label: state,
    data: simulationData.map(step => step[idx] * 100),
    borderColor: colors[idx],
    backgroundColor: `${colors[idx]}18`,
    fill: true,
    tension: 0.4,
    pointRadius: 2,
    borderWidth: 2,
  }));

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { size: 10, family: 'Inter' },
          usePointStyle: true,
          padding: 15,
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(15,23,42,0.95)',
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 12, family: 'Inter', weight: 'bold' },
        bodyFont: { size: 11, family: 'Inter' },
        callbacks: {
          title: (items) => `Year ${items[0]?.label}`,
          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 9 },
          maxTicksLimit: 8,
        },
        title: {
          display: true,
          text: 'Year',
          color: '#475569',
          font: { size: 10, family: 'Inter' },
        },
      },
      y: {
        min: 0,
        max: 100,
        stacked: false,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (v) => `${v}%`,
        },
        title: {
          display: true,
          text: 'State Probability',
          color: '#475569',
          font: { size: 10, family: 'Inter' },
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="h-full w-full">
      <Line data={data} options={options} />
    </div>
  );
}
