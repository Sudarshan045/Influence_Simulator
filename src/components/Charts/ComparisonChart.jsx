import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PALETTE = [
  ['rgba(124,58,237,0.9)', 'rgba(124,58,237,0.5)'],
  ['rgba(6,182,212,0.9)', 'rgba(6,182,212,0.5)'],
  ['rgba(16,185,129,0.9)', 'rgba(16,185,129,0.5)'],
  ['rgba(245,158,11,0.9)', 'rgba(245,158,11,0.5)'],
];

export default function ComparisonChart({ ideas }) {
  const data = {
    labels: ['Revival %', 'Trend Score ×10', 'Peak Value'],
    datasets: ideas.map((idea, i) => ({
      label: idea.name,
      data: [
        idea.revivalProbability,
        idea.trendScore * 10,
        Math.max(...idea.progressionValues),
      ],
      backgroundColor: PALETTE[i % PALETTE.length][1],
      borderColor: PALETTE[i % PALETTE.length][0],
      borderWidth: 2,
      borderRadius: 6,
      borderSkipped: false,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 900, easing: 'easeInOutQuart' },
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { size: 12, family: 'Inter' },
          usePointStyle: true,
          pointStyleWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(124,58,237,0.4)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 12, family: 'Inter' } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { color: '#64748b', font: { size: 11, family: 'Inter' } },
        border: { display: false },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
