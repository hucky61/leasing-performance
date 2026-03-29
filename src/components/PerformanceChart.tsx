import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { LeasingContract, MileageEntry } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface Props {
  contract: LeasingContract;
  entries: MileageEntry[];
}

function buildChartData(contract: LeasingContract, entries: MileageEntry[]) {
  if (!contract.startDate || !contract.endDate) return null;

  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);

  // Build soll-line: from start to end, monthly points
  const sollLabels: string[] = [];
  const sollData: number[] = [];
  const d = new Date(start);
  while (d <= end) {
    const day = Math.round((d.getTime() - start.getTime()) / 86400000);
    const km = (contract.allowedKm * day) / totalDays;
    sollLabels.push(d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }));
    sollData.push(Math.round(km));
    d.setMonth(d.getMonth() + 1);
  }
  // Ensure end is included
  const endDay = totalDays;
  if (sollData[sollData.length - 1] !== contract.allowedKm) {
    sollLabels.push(end.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }));
    sollData.push(contract.allowedKm);
  }

  // Build ist-line: from actual entries
  const istLabels: string[] = [];
  const istData: number[] = [];
  // Add start point
  istLabels.push(start.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }));
  istData.push(0);

  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  for (const e of sorted) {
    const entryDate = new Date(e.date);
    istLabels.push(entryDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' }));
    istData.push(e.mileage - contract.startMileage);
  }

  // Unified labels: merge both for x-axis
  const allDates = new Set<string>();
  const labelToKm: Record<string, { soll?: number; ist?: number }> = {};

  for (let i = 0; i < sollLabels.length; i++) {
    const lbl = `SOLL_${i}`;
    allDates.add(lbl);
    labelToKm[lbl] = { soll: sollData[i] };
  }
  for (let i = 0; i < istLabels.length; i++) {
    const lbl = `IST_${i}`;
    allDates.add(lbl);
    labelToKm[lbl] = { ist: istData[i] };
  }

  // Simpler approach: separate data sets with own labels
  return {
    sollLabels,
    sollData,
    istLabels,
    istData,
  };
}

export default function PerformanceChart({ contract, entries }: Props) {
  if (!contract.startDate || !contract.endDate) {
    return (
      <div className="card chart-placeholder">
        <h2 className="card-title">Performance-Verlauf</h2>
        <p className="empty-hint">Bitte zuerst den Leasingvertrag unter „Einstellungen" einrichten.</p>
      </div>
    );
  }

  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);

  // Monthly soll points
  const labels: string[] = [];
  const sollData: number[] = [];
  const d = new Date(start);
  while (d <= end) {
    const day = Math.round((d.getTime() - start.getTime()) / 86400000);
    labels.push(d.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }));
    sollData.push(Math.round((contract.allowedKm * day) / totalDays));
    d.setMonth(d.getMonth() + 1);
  }
  if (labels[labels.length - 1] !== end.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })) {
    labels.push(end.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' }));
    sollData.push(contract.allowedKm);
  }

  // Ist data: map entries to the label grid
  const istData: (number | null)[] = labels.map((lbl, i) => {
    // find the day index for this label
    const dCur = new Date(start);
    dCur.setMonth(dCur.getMonth() + i);
    const dayIdx = Math.round((dCur.getTime() - start.getTime()) / 86400000);
    // Find the last entry on or before this date
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    let best: MileageEntry | null = null;
    for (const e of sorted) {
      const eDay = Math.round((new Date(e.date).getTime() - start.getTime()) / 86400000);
      if (eDay <= dayIdx) best = e;
    }
    if (!best) return null;
    // Only show up to today
    const nowDay = Math.round((Date.now() - start.getTime()) / 86400000);
    if (dayIdx > nowDay) return null;
    return best.mileage - contract.startMileage;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Soll (km)',
        data: sollData,
        borderColor: 'rgba(99, 179, 237, 0.8)',
        backgroundColor: 'rgba(99, 179, 237, 0.1)',
        fill: false,
        tension: 0.1,
        borderDash: [6, 4],
        pointRadius: 2,
      },
      {
        label: 'Ist (km)',
        data: istData,
        borderColor: 'rgba(72, 213, 151, 0.9)',
        backgroundColor: 'rgba(72, 213, 151, 0.15)',
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 7,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        labels: { color: '#cbd5e1', font: { family: 'Inter', size: 13 } },
      },
      tooltip: {
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            ctx.parsed.y !== null ? `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('de-DE')} km` : '',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      y: {
        ticks: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          callback: (v: number | string) => `${Number(v).toLocaleString('de-DE')} km`,
        },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
      },
    },
  };

  return (
    <div className="card">
      <h2 className="card-title">Performance-Verlauf</h2>
      <p className="card-subtitle">Soll-Linie (gestrichelt) vs. tatsächlich gefahrene Kilometer</p>
      <div className="chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
