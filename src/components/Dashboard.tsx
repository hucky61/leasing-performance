import type { LeasingContract, MileageEntry, PerformanceStats } from '../types';

interface Props {
  contract: LeasingContract;
  entries: MileageEntry[];
  stats: PerformanceStats | null;
}

function KpiCard({
  label,
  value,
  unit,
  status,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  status?: 'good' | 'bad' | 'neutral';
  sub?: string;
}) {
  return (
    <div className={`kpi-card kpi-${status ?? 'neutral'}`}>
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {value}
        {unit && <span className="kpi-unit"> {unit}</span>}
      </span>
      {sub && <span className="kpi-sub">{sub}</span>}
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
}

function fmtEur(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function Dashboard({ contract, entries, stats }: Props) {
  const contractOk = contract.startDate && contract.endDate;
  const noEntries = entries.length === 0;

  if (!contractOk) {
    return (
      <div className="dashboard">
        <div className="welcome-banner">
          <div className="welcome-icon">🚗</div>
          <h1>Willkommen bei Leasing Performance</h1>
          <p>Richte zunächst deinen Leasingvertrag unter <strong>Einstellungen</strong> ein.</p>
        </div>
      </div>
    );
  }

  if (noEntries) {
    return (
      <div className="dashboard">
        <div className="welcome-banner">
          <div className="welcome-icon">📍</div>
          <h1>Fast fertig!</h1>
          <p>Trage deinen ersten Kilometerstand unter <strong>Kilometer</strong> ein.</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const deltaStatus: 'good' | 'bad' = stats.delta <= 0 ? 'good' : 'bad';
  const projStatus: 'good' | 'bad' = stats.projectedExcessKm <= 0 ? 'good' : 'bad';

  const start = new Date(contract.startDate);
  const end = new Date(contract.endDate);
  const startStr = start.toLocaleDateString('de-DE');
  const endStr = end.toLocaleDateString('de-DE');

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Performance-Übersicht</h1>
          <p className="dashboard-sub">{startStr} – {endStr} · {fmt(contract.allowedKm)} km erlaubt</p>
        </div>
        <div className="progress-ring-wrapper">
          <svg className="progress-ring" viewBox="0 0 80 80">
            <circle className="ring-bg" cx="40" cy="40" r="34" />
            <circle
              className="ring-fill"
              cx="40"
              cy="40"
              r="34"
              strokeDasharray={`${(stats.progressPercent / 100) * 213.6} 213.6`}
            />
          </svg>
          <span className="ring-label">{Math.round(stats.progressPercent)}%</span>
          <span className="ring-sub">Laufzeit</span>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard
          label="Gefahren (Ist)"
          value={fmt(stats.actualKmDriven)}
          unit="km"
          status="neutral"
          sub={`Ø ${fmt(stats.daysSinceStart > 0 ? stats.actualKmDriven / stats.daysSinceStart : 0)} km/Tag`}
        />
        <KpiCard
          label="Soll heute"
          value={fmt(stats.targetKmDriven)}
          unit="km"
          status="neutral"
          sub={`nach ${stats.daysSinceStart} Tagen`}
        />
        <KpiCard
          label={stats.delta <= 0 ? '▼ Unter Soll' : '▲ Über Soll'}
          value={`${stats.delta <= 0 ? '' : '+'}${fmt(stats.delta)}`}
          unit="km"
          status={deltaStatus}
          sub={stats.delta <= 0 ? 'Alles im grünen Bereich 🎉' : 'Zu viele Kilometer gefahren ⚠️'}
        />
        <KpiCard
          label="Hochrechnung Vertragsende"
          value={fmt(stats.projectedKmAtEnd)}
          unit="km"
          status={projStatus}
          sub={
            stats.projectedExcessKm > 0
              ? `+${fmt(stats.projectedExcessKm)} km Mehrkilometer ≈ ${fmtEur(stats.projectedExcessCost)}`
              : `${fmt(contract.allowedKm - stats.projectedKmAtEnd)} km Reserve`
          }
        />
      </div>

      <div className="progress-bar-section">
        <div className="progress-labels">
          <span>Laufzeit: {stats.daysSinceStart} / {stats.contractDays} Tage</span>
          <span>{stats.daysRemaining} Tage verbleibend</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${stats.progressPercent}%` }} />
        </div>
      </div>
    </div>
  );
}
