import { useState } from 'react';
import type { LeasingContract } from '../types';

interface Props {
  contract: LeasingContract;
  onSave: (c: LeasingContract) => void;
}

export default function ContractSettings({ contract, onSave }: Props) {
  const [form, setForm] = useState<LeasingContract>(contract);
  const [saved, setSaved] = useState(false);

  function handleChange(field: keyof LeasingContract, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="card">
      <h2 className="card-title">Leasingvertrag</h2>
      <p className="card-subtitle">Trage hier die Eckdaten deines Leasingvertrags ein.</p>
      <form onSubmit={handleSubmit} className="settings-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="startDate">Vertragsbeginn</label>
            <input
              id="startDate"
              type="date"
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="endDate">Vertragsende</label>
            <input
              id="endDate"
              type="date"
              value={form.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="startMileage">Kilometerstand bei Vertragsbeginn (km)</label>
            <input
              id="startMileage"
              type="number"
              min={0}
              value={form.startMileage}
              onChange={(e) => handleChange('startMileage', Number(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="allowedKm">Erlaubte Gesamtkilometer (km)</label>
            <input
              id="allowedKm"
              type="number"
              min={1}
              value={form.allowedKm}
              onChange={(e) => handleChange('allowedKm', Number(e.target.value))}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="excessCostPerKm">Mehrkilometerkosten (€/km)</label>
            <input
              id="excessCostPerKm"
              type="number"
              min={0}
              step={0.01}
              value={form.excessCostPerKm}
              onChange={(e) => handleChange('excessCostPerKm', Number(e.target.value))}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          {saved ? '✓ Gespeichert' : 'Speichern'}
        </button>
      </form>
    </div>
  );
}
