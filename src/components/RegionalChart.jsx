import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RegionalChart({ data }) {
  // data is { "North America": [...], "Europe": [...] }
  const labels = Object.keys(data);
  const avgScores = labels.map(region => {
    const ideas = data[region] || [];
    if (ideas.length === 0) return 0;
    const sum = ideas.reduce((acc, curr) => acc + curr.score, 0);
    return Math.round(sum / ideas.length);
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Average Momentum Score',
        data: avgScores,
        backgroundColor: 'rgba(6,182,212,0.8)',
        borderColor: '#06b6d4',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1000,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(15,23,42,0.95)',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(6,182,212,0.4)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 10,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#64748b', font: { size: 10, family: 'Inter' } },
        border: { display: false },
      },
      y: {
        min: 0,
        max: 100,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: '#64748b',
          font: { size: 10, family: 'Inter' },
        },
        border: { display: false },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
