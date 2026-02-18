export interface DailyNutrient {
  id: string;
  uid: string;
  cycleId?: string;
  date: string; // YYYY-MM-DD
  calories: number;
  caloriesBurned: number;
  carbs: number;
  sugar: number;
  protein: number;
  fiber: number;
  fat: number;
  sodium: number;
  drinks?: number; // Optional to distinguish old entries without drinks tracking
}

export interface NutrientTargets {
  calories: number;
  carbs: number;
  sugar: number;
  protein: number;
  fiber: number;
  fat: number;
  sodium: number;
  deficit: number;
  drinks: number;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  targets: NutrientTargets;
  activeCycleId?: string | null;
}

export type RangeFilter = 'prev' | 'all' | '3' | '7' | '30';

export interface TrendData {
  avgTrend: 'up' | 'down' | 'stable';
  medTrend: 'up' | 'down' | 'stable';
}

export interface LoggingCycle {
  id: string;
  uid: string;
  name: string;
  createdAt: string;
}
