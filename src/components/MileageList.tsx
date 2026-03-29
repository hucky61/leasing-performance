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

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

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
                    <td className="action-cell">
                      <button className="btn btn-sm btn-success" onClick={() => saveEdit(entry.id)}>✓</button>
                      <button className="btn btn-sm btn-ghost" onClick={cancelEdit}>✗</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={entry.id}>
                    <td>{new Date(entry.date).toLocaleDateString('de-DE')}</td>
                    <td>{entry.mileage.toLocaleString('de-DE')} km</td>
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
