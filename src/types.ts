export interface LeasingContract {
  startDate: string;      // ISO date string
  endDate: string;        // ISO date string
  startMileage: number;   // km at contract start
  allowedKm: number;      // total km allowed by contract
  excessCostPerKm: number; // cost per excess km in EUR
}

export interface MileageEntry {
  id: string;
  date: string;           // ISO date string
  mileage: number;        // absolute odometer reading in km
}

export interface PerformanceStats {
  contractDays: number;
  daysSinceStart: number;
  daysRemaining: number;
  targetKmDriven: number;
  actualKmDriven: number;
  delta: number;           // negative = under target (good), positive = over (bad)
  projectedKmAtEnd: number;
  projectedExcessKm: number;
  projectedExcessCost: number;
  progressPercent: number;
}
