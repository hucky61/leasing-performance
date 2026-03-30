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

  // Helper: local ISO date string (no timezone issues)
  const toLocalISO = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };
  const todayISO = toLocalISO(new Date());

  // ── Soll-Linie: monatliche Punkte ──────────────────────────────────────────
  // Wir bauen eine gemeinsame Label-Achse aus:
  //   • monatlichen Soll-Punkten
  //   • den konkreten Eintragsdaten (damit IST-Punkte exakt platziert werden)

  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Monatliche Soll-Punkte als Map: ISO-Datum → km
  const sollPointMap = new Map<string, number>();
  const d = new Date(start);
  while (d <= end) {
    const day = Math.round((d.getTime() - start.getTime()) / 86400000);
    sollPointMap.set(toLocalISO(d), Math.round((contract.allowedKm * day) / totalDays));
    d.setMonth(d.getMonth() + 1);
  }
  // Endpunkt sicherstellen
  const endISO = toLocalISO(end);
  if (!sollPointMap.has(endISO)) {
    sollPointMap.set(endISO, contract.allowedKm);
  }

  // IST-Einträge als Map: ISO-Datum → gefahrene km (relativ zu Start-Km)
  const istPointMap = new Map<string, number>();
  // Startpunkt immer bei 0
  istPointMap.set(toLocalISO(start), 0);
  for (const e of sortedEntries) {
    if (e.date <= todayISO) {
      istPointMap.set(e.date, e.mileage - contract.startMileage);
    }
  }

  // Alle einzigartigen Daten zusammenführen und sortieren
  const allDates = Array.from(new Set([...sollPointMap.keys(), ...istPointMap.keys()])).sort();

  // Labels für X-Achse (lesbares Format)
  const labels = allDates.map((iso) =>
    new Date(iso + 'T12:00:00').toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })
  );

  // Soll-Dataset: für jedes Datum interpolieren
  const sollData: (number | null)[] = allDates.map((iso) => {
    if (sollPointMap.has(iso)) return sollPointMap.get(iso)!;
    // Interpolieren zwischen zwei bekannten Punkten
    const dayOffset = Math.round((new Date(iso + 'T12:00:00').getTime() - start.getTime()) / 86400000);
    if (dayOffset < 0 || dayOffset > totalDays) return null;
    return Math.round((contract.allowedKm * dayOffset) / totalDays);
  });

  // IST-Dataset: nur an Tagen, an denen Einträge existieren (+ Startpunkt)
  const istData: (number | null)[] = allDates.map((iso) => {
    return istPointMap.has(iso) ? istPointMap.get(iso)! : null;
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
        pointRadius: 5,
        pointHoverRadius: 8,
        spanGaps: true,
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
