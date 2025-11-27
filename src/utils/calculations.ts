import { DailyNutrient, NutrientTargets, TrendData, RangeFilter } from '@/types/nutrition';

export function computeDailyDeficit(doc: DailyNutrient, defaultCalories: number = 2000): number {
  const burned = doc.caloriesBurned || defaultCalories;
  const consumed = doc.calories || 0;
  return burned - consumed;
}

export function filterDocsByRange(docs: DailyNutrient[], range: RangeFilter): DailyNutrient[] {
  if (range === 'all') return docs;
  if (range === 'prev') {
    const today = new Date().toISOString().split('T')[0];
    return docs.filter(d => d.date < today);
  }
  
  const days = parseInt(range);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoff = cutoffDate.toISOString().split('T')[0];
  
  return docs.filter(d => d.date >= cutoff);
}

export function linearRegressionSlope(sortedDocs: DailyNutrient[], getter: (doc: DailyNutrient) => number): number {
  if (sortedDocs.length < 2) return 0;
  
  const firstDate = new Date(sortedDocs[sortedDocs.length - 1].date);
  const points = sortedDocs.map(doc => ({
    x: Math.floor((new Date(doc.date).getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)),
    y: getter(doc)
  }));
  
  const n = points.length;
  const sumX = points.reduce((sum, p) => sum + p.x, 0);
  const sumY = points.reduce((sum, p) => sum + p.y, 0);
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
  const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return isNaN(slope) ? 0 : slope;
}

function splitHalfMedians(values: number[]): { firstHalf: number; secondHalf: number } {
  if (values.length < 2) return { firstHalf: 0, secondHalf: 0 };
  
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const firstHalf = sorted.slice(0, mid);
  const secondHalf = sorted.slice(mid);
  
  const median = (arr: number[]) => {
    const mid = Math.floor(arr.length / 2);
    return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
  };
  
  return {
    firstHalf: median(firstHalf),
    secondHalf: median(secondHalf)
  };
}

function getTrendDirection(value: number, threshold: number = 0.1): 'up' | 'down' | 'stable' {
  if (Math.abs(value) < threshold) return 'stable';
  return value > 0 ? 'up' : 'down';
}

export function computeTrend(nutrient: keyof DailyNutrient, docs: DailyNutrient[]): TrendData {
  if (docs.length < 2) return { avgTrend: 'stable', medTrend: 'stable' };
  
  const getter = (doc: DailyNutrient) => (doc[nutrient] as number) || 0;
  const slope = linearRegressionSlope(docs, getter);
  
  const values = docs.map(getter);
  const { firstHalf, secondHalf } = splitHalfMedians(values);
  const medianDiff = secondHalf - firstHalf;
  
  return {
    avgTrend: getTrendDirection(slope),
    medTrend: getTrendDirection(medianDiff)
  };
}

export function computeTrendForDeficit(docs: DailyNutrient[], defaultCalories: number = 2000): TrendData {
  if (docs.length < 2) return { avgTrend: 'stable', medTrend: 'stable' };
  
  const getter = (doc: DailyNutrient) => computeDailyDeficit(doc, defaultCalories);
  const slope = linearRegressionSlope(docs, getter);
  
  const values = docs.map(getter);
  const { firstHalf, secondHalf } = splitHalfMedians(values);
  const medianDiff = secondHalf - firstHalf;
  
  return {
    avgTrend: getTrendDirection(slope, 1),
    medTrend: getTrendDirection(medianDiff, 1)
  };
}

export function computeAverage(docs: DailyNutrient[], getter: (doc: DailyNutrient) => number): number {
  if (docs.length === 0) return 0;
  const sum = docs.reduce((acc, doc) => acc + getter(doc), 0);
  return sum / docs.length;
}

export function computeMedian(docs: DailyNutrient[], getter: (doc: DailyNutrient) => number): number {
  if (docs.length === 0) return 0;
  const values = docs.map(getter).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

export function filterEntriesWithDrinks(docs: DailyNutrient[]): DailyNutrient[] {
  return docs.filter(d => d.drinks !== undefined);
}

// Drink tracking constants
export const DAILY_DRINK_TARGET = 4;
export const WEEKLY_DRINK_TARGET = 14;

// Get ISO week number for a date
function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export interface DrinkStats {
  dailyAvg: number;
  dailyMedian: number;
  weeklyAvgTotal: number;
  weeklyMedianTotal: number;
  dailyExceedsTarget: boolean;
  weeklyExceedsTarget: boolean;
}

export function computeAllDrinkStats(docs: DailyNutrient[]): DrinkStats {
  const drinksEntries = filterEntriesWithDrinks(docs);
  
  if (drinksEntries.length === 0) {
    return {
      dailyAvg: 0,
      dailyMedian: 0,
      weeklyAvgTotal: 0,
      weeklyMedianTotal: 0,
      dailyExceedsTarget: false,
      weeklyExceedsTarget: false,
    };
  }

  // Daily stats
  const dailyAvg = computeAverage(drinksEntries, d => d.drinks ?? 0);
  const dailyMedian = computeMedian(drinksEntries, d => d.drinks ?? 0);

  // Weekly stats - group by ISO week
  const weeklyTotals = new Map<string, number>();
  drinksEntries.forEach(entry => {
    const week = getISOWeek(new Date(entry.date));
    const currentTotal = weeklyTotals.get(week) || 0;
    weeklyTotals.set(week, currentTotal + (entry.drinks ?? 0));
    console.log(`Date: ${entry.date}, Week: ${week}, Drinks: ${entry.drinks}, Week Total: ${currentTotal + (entry.drinks ?? 0)}`);
  });
  
  console.log('Weekly Totals Map:', Array.from(weeklyTotals.entries()));

  const weeklyTotalsArray = Array.from(weeklyTotals.values());
  const weeklyAvgTotal = weeklyTotalsArray.length > 0
    ? weeklyTotalsArray.reduce((sum, val) => sum + val, 0) / weeklyTotalsArray.length
    : 0;
  
  const sortedWeeklyTotals = weeklyTotalsArray.sort((a, b) => a - b);
  const weeklyMedianTotal = weeklyTotalsArray.length > 0
    ? (weeklyTotalsArray.length % 2
      ? sortedWeeklyTotals[Math.floor(weeklyTotalsArray.length / 2)]
      : (sortedWeeklyTotals[weeklyTotalsArray.length / 2 - 1] + sortedWeeklyTotals[weeklyTotalsArray.length / 2]) / 2)
    : 0;

  return {
    dailyAvg,
    dailyMedian,
    weeklyAvgTotal,
    weeklyMedianTotal,
    dailyExceedsTarget: dailyAvg > DAILY_DRINK_TARGET || dailyMedian > DAILY_DRINK_TARGET,
    weeklyExceedsTarget: weeklyAvgTotal > WEEKLY_DRINK_TARGET || weeklyMedianTotal > WEEKLY_DRINK_TARGET,
  };
}

export function exportToCSV(docs: DailyNutrient[], targets: NutrientTargets): string {
  const nutrients = ['calories', 'caloriesBurned', 'carbs', 'sugar', 'protein', 'fiber', 'fat', 'sodium', 'deficit', 'drinks'] as const;
  
  const averages = nutrients.map(n => {
    if (n === 'deficit') {
      return computeAverage(docs, d => computeDailyDeficit(d, targets.calories));
    }
    if (n === 'drinks') {
      const drinksEntries = filterEntriesWithDrinks(docs);
      return drinksEntries.length > 0 ? computeAverage(drinksEntries, d => d.drinks ?? 0) : 0;
    }
    return computeAverage(docs, d => (d[n] as number) || 0);
  });
  
  const medians = nutrients.map(n => {
    if (n === 'deficit') {
      return computeMedian(docs, d => computeDailyDeficit(d, targets.calories));
    }
    if (n === 'drinks') {
      const drinksEntries = filterEntriesWithDrinks(docs);
      return drinksEntries.length > 0 ? computeMedian(drinksEntries, d => d.drinks ?? 0) : 0;
    }
    return computeMedian(docs, d => (d[n] as number) || 0);
  });
  
  const formatDeficit = (value: number) => {
    if (value >= 0) return value.toFixed(1);
    return `+${Math.abs(value).toFixed(1)}`;
  };
  
  let csv = 'Statistic,' + nutrients.join(',') + '\n';
  csv += 'Averages,' + averages.map((v, i) => nutrients[i] === 'deficit' ? formatDeficit(v) : v.toFixed(1)).join(',') + '\n';
  csv += 'Medians,' + medians.map((v, i) => nutrients[i] === 'deficit' ? formatDeficit(v) : v.toFixed(1)).join(',') + '\n';
  csv += '\nDate,' + nutrients.join(',') + '\n';
  
  docs.forEach(doc => {
    const deficit = computeDailyDeficit(doc, targets.calories);
    const drinks = doc.drinks !== undefined ? doc.drinks : '';
    csv += `${doc.date},${doc.calories},${doc.caloriesBurned},${doc.carbs},${doc.sugar},${doc.protein},${doc.fiber},${doc.fat},${doc.sodium},${formatDeficit(deficit)},${drinks}\n`;
  });
  
  return csv;
}
