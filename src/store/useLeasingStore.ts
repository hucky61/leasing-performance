import { useState, useEffect, useCallback } from 'react';
import type { LeasingContract, MileageEntry, PerformanceStats } from '../types';
import { v4 as uuidv4 } from '../utils/uuid';

const CONTRACT_KEY = 'lp_contract';
const ENTRIES_KEY = 'lp_entries';

const defaultContract: LeasingContract = {
  startDate: '',
  endDate: '',
  startMileage: 0,
  allowedKm: 30000,
  excessCostPerKm: 0.1,
};

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useLeasingStore() {
  const [contract, setContractState] = useState<LeasingContract>(() =>
    loadFromStorage<LeasingContract>(CONTRACT_KEY, defaultContract)
  );
  const [entries, setEntriesState] = useState<MileageEntry[]>(() =>
    loadFromStorage<MileageEntry[]>(ENTRIES_KEY, [])
  );

  useEffect(() => {
    localStorage.setItem(CONTRACT_KEY, JSON.stringify(contract));
  }, [contract]);

  useEffect(() => {
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
  }, [entries]);

  const saveContract = useCallback((c: LeasingContract) => {
    setContractState(c);
  }, []);

  const addEntry = useCallback((date: string, mileage: number) => {
    const entry: MileageEntry = { id: uuidv4(), date, mileage };
    setEntriesState((prev) => [...prev, entry].sort((a, b) => a.date.localeCompare(b.date)));
  }, []);

  const updateEntry = useCallback((id: string, date: string, mileage: number) => {
    setEntriesState((prev) =>
      [...prev.map((e) => (e.id === id ? { id, date, mileage } : e))].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    );
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntriesState((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const computeStats = useCallback((): PerformanceStats | null => {
    if (!contract.startDate || !contract.endDate || entries.length === 0) return null;

    const start = new Date(contract.startDate).getTime();
    const end = new Date(contract.endDate).getTime();
    const today = Date.now();

    const contractDays = Math.round((end - start) / 86400000);
    const daysSinceStart = Math.max(0, Math.round((today - start) / 86400000));
    const daysRemaining = Math.max(0, contractDays - daysSinceStart);

    const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const latestEntry = sortedEntries[sortedEntries.length - 1];
    const actualKmDriven = latestEntry.mileage - contract.startMileage;

    const progressPercent = Math.min(100, (daysSinceStart / contractDays) * 100);
    const targetKmDriven = (contract.allowedKm * daysSinceStart) / contractDays;
    const delta = actualKmDriven - targetKmDriven;

    // Linear projection: if we keep at current daily rate, where do we end up?
    const dailyRate = daysSinceStart > 0 ? actualKmDriven / daysSinceStart : 0;
    const projectedKmAtEnd = actualKmDriven + dailyRate * daysRemaining;
    const projectedExcessKm = Math.max(0, projectedKmAtEnd - contract.allowedKm);
    const projectedExcessCost = projectedExcessKm * contract.excessCostPerKm;

    return {
      contractDays,
      daysSinceStart,
      daysRemaining,
      targetKmDriven,
      actualKmDriven,
      delta,
      projectedKmAtEnd,
      projectedExcessKm,
      projectedExcessCost,
      progressPercent,
    };
  }, [contract, entries]);

  return { contract, entries, saveContract, addEntry, updateEntry, deleteEntry, computeStats };
}
