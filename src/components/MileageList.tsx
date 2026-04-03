import { useState } from 'react';
import type { MileageEntry } from '../types';

interface Props {
  entries: MileageEntry[];
  onAdd: (date: string, mileage: number) => void;
  onUpdate: (id: string, date: string, mileage: number) => void;
  onDelete: (id: string) => void;
}

export default function MileageList({ entries, onAdd, onUpdate, onDelete }: Props) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [mileage, setMileage] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editMileage, setEditMileage] = useState('');

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!mileage) return;
    onAdd(date, Number(mileage));
    setMileage('');
  }

  function startEdit(entry: MileageEntry) {
    setEditId(entry.id);
    setEditDate(entry.date);
    setEditMileage(String(entry.mileage));
  }

  function saveEdit(id: string) {
    onUpdate(id, editDate, Number(editMileage));
    setEditId(null);
  }

  function cancelEdit() {
    setEditId(null);
  }

  // Sort descending (newest first) for display
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
  // Sort ascending to compute deltas (prev → next)
  const sortedAsc = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  // Build a map: entry id → delta since previous entry
  const deltaMap = new Map<string, number | null>();
  sortedAsc.forEach((entry, idx) => {
    if (idx === 0) {
      deltaMap.set(entry.id, null); // first entry has no predecessor
    } else {
      deltaMap.set(entry.id, entry.mileage - sortedAsc[idx - 1].mileage);
    }
  });

  // Fix: use T12:00:00 to avoid timezone off-by-one; guard against invalid dates
  function formatDate(iso: string) {
    if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso ?? '–';
    const d = new Date(iso + 'T12:00:00');
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString('de-DE');
  }

  return (
    <div className="card">
      <h2 className="card-title">Kilometer eintragen</h2>
      <form onSubmit={handleAdd} className="mileage-form">
        <div className="mileage-inputs">
          <div className="form-group">
            <label htmlFor="entryDate">Datum</label>
            <input
              id="entryDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="entryMileage">Kilometerstand (km)</label>
            <input
              id="entryMileage"
              type="number"
              min={0}
              placeholder="z.B. 23450"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">+ Eintrag hinzufügen</button>
      </form>

      {sorted.length === 0 ? (
        <p className="empty-hint">Noch keine Einträge vorhanden.</p>
      ) : (
        <div className="table-wrapper">
          <table className="mileage-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Kilometerstand</th>
                <th>Differenz</th>
                <th>Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((entry) =>
                editId === entry.id ? (
                  <tr key={entry.id} className="edit-row">
                    <td>
                      <input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="inline-input"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={editMileage}
                        onChange={(e) => setEditMileage(e.target.value)}
                        className="inline-input"
                      />
                    </td>
                    <td>–</td>
                    <td className="action-cell">
                      <button className="btn btn-sm btn-success" onClick={() => saveEdit(entry.id)}>✓</button>
                      <button className="btn btn-sm btn-ghost" onClick={cancelEdit}>✗</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.date)}</td>
                    <td>{entry.mileage.toLocaleString('de-DE')} km</td>
                    <td>
                      {(() => {
                        const delta = deltaMap.get(entry.id);
                        if (delta === null || delta === undefined) {
                          return <span className="delta-first">Ersteintrag</span>;
                        }
                        return (
                          <span className={`delta-badge ${delta >= 0 ? 'delta-pos' : 'delta-neg'}`}>
                            {delta >= 0 ? '+' : ''}{delta.toLocaleString('de-DE')} km
                          </span>
                        );
                      })()}
                    </td>
                    <td className="action-cell">
                      <button className="btn btn-sm btn-ghost" onClick={() => startEdit(entry)}>✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => onDelete(entry.id)}>🗑️</button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
