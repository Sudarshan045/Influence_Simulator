import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const STATE_COLORS = {
  Birth:    { bg: 'rgba(59,130,246,0.7)',  border: '#3b82f6' },
  Growth:   { bg: 'rgba(16,185,129,0.7)',  border: '#10b981' },
  Peak:     { bg: 'rgba(245,158,11,0.7)',  border: '#f59e0b' },
  Decline:  { bg: 'rgba(239,68,68,0.7)',   border: '#ef4444' },
  Dormancy: { bg: 'rgba(100,116,139,0.7)', border: '#64748b' },
  Revival:  { bg: 'rgba(139,92,246,0.7)',  border: '#8b5cf6' },
};

export default function YearwiseChart({ yearData, ideaName }) {
  if (!yearData || yearData.length === 0) return null;

  const labels = yearData.map((d) => d.year.toString());
  const scores = yearData.map((d) => d.score);
  const states = yearData.map((d) => d.state);

  const bgColors = states.map((s) => STATE_COLORS[s]?.bg || 'rgba(124,58,237,0.5)');
  const borderColors = states.map((s) => STATE_COLORS[s]?.border || '#7c3aed');

  const data = {
    labels,
    datasets: [
      {
        label: 'Influence Score',
        data: scores,
        backgroundColor: bgColors,
        borderColor: borderColors,
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        padding: 12,
        cornerRadius: 10,
        titleFont: { size: 12, family: 'Inter', weight: 'bold' },
        bodyFont: { size: 11, family: 'Inter' },
        callbacks: {
          title: (items) => `Year ${items[0]?.label}`,
          label: (ctx) => {
            const idx = ctx.dataIndex;
            return [
              ` Score: ${ctx.parsed.y}%`,
              ` Stage: ${states[idx]}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 10 } },
        title: {
          display: true, text: 'Year',
          color: '#475569', font: { size: 10, family: 'Inter' },
        },
      },
      y: {
        min: 0, max: 100,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (v) => `${v}%`,
        },
        title: {
          display: true, text: 'Cultural Influence Score',
          color: '#475569', font: { size: 10, family: 'Inter' },
        },
      },
    },
  };

  return (
    <div className="w-full h-full">
      <Bar data={data} options={options} />
    </div>
  );
}
