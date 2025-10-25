export interface DailyNutrient {
  id: string;
  uid: string;
  date: string; // YYYY-MM-DD
  calories: number;
  caloriesBurned: number;
  carbs: number;
  sugar: number;
  protein: number;
  fiber: number;
  fat: number;
  sodium: number;
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
}

export interface UserSettings {
  theme: 'light' | 'dark';
  targets: NutrientTargets;
}

export type RangeFilter = 'prev' | 'all' | '3' | '7' | '30';

export interface TrendData {
  avgTrend: 'up' | 'down' | 'stable';
  medTrend: 'up' | 'down' | 'stable';
}
