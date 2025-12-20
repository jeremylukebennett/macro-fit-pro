import { DailyNutrient, NutrientTargets, TrendData, RangeFilter } from '@/types/nutrition';

export function computeDailyDeficit(doc: DailyNutrient, defaultCalories: number = 2000): number {
  const burned = doc.caloriesBurned || defaultCalories;
  const consumed = doc.calories || 0;
  return burned - consumed;
}

export function filterDocsByRange(docs: DailyNutrient[], range: RangeFilter): DailyNutrient[] {
  if (range === 'all') return docs;
  if (range === 'prev') {
    // Exclude the most recent entry (by date)
    if (docs.length <= 1) return [];
    const sorted = [...docs].sort((a, b) => b.date.localeCompare(a.date));
    const mostRecentDate = sorted[0].date;
    return docs.filter(d => d.date !== mostRecentDate);
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
export const WEEKLY_DRINK_TARGET = 15;

export interface DrinkStats {
  dailyAvg: number;
  dailyMedian: number;
  daysWithDrinks: number;
  daysWithDrinksLast7: number;
  currentWeekTotal: number;
  weeklyAvgTotal: number;
  weeklyMedianTotal: number;
  dailyExceedsTarget: boolean;
  weeklyExceedsTarget: boolean;
  hasCompleteWeeks: boolean;
}

// Helper to format a Date to YYYY-MM-DD in local timezone
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to parse a YYYY-MM-DD string as local midnight (avoids timezone issues)
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function computeAllDrinkStats(docs: DailyNutrient[], referenceDate?: Date): DrinkStats {
  const drinksEntries = filterEntriesWithDrinks(docs);

  if (drinksEntries.length === 0) {
    return {
      dailyAvg: 0,
      dailyMedian: 0,
      daysWithDrinks: 0,
      daysWithDrinksLast7: 0,
      currentWeekTotal: 0,
      weeklyAvgTotal: 0,
      weeklyMedianTotal: 0,
      dailyExceedsTarget: false,
      weeklyExceedsTarget: false,
      hasCompleteWeeks: false,
    };
  }

  // Daily stats - ONLY for days where drinks > 0
  const daysWithActualDrinks = drinksEntries.filter(d => (d.drinks ?? 0) > 0);
  const daysWithDrinks = daysWithActualDrinks.length;

  const dailyAvg = daysWithDrinks > 0
    ? computeAverage(daysWithActualDrinks, d => d.drinks ?? 0)
    : 0;
  const dailyMedian = daysWithDrinks > 0
    ? computeMedian(daysWithActualDrinks, d => d.drinks ?? 0)
    : 0;

  // Rolling 7-day window stats
  const today = referenceDate ? new Date(referenceDate) : new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatLocalDate(today);

  // Calculate days with drinks in last 7 days using string comparison (timezone-safe)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = formatLocalDate(sevenDaysAgo);

  const daysWithDrinksLast7 = daysWithActualDrinks.filter(d => {
    // Use string comparison - YYYY-MM-DD format sorts correctly
    return d.date > sevenDaysAgoStr && d.date <= todayStr;
  }).length;

  // Calculate which 7-day window each entry belongs to
  // Window 0 = last 7 days (0-6 days ago)
  // Window 1 = 7-13 days ago
  // Window 2 = 14-20 days ago, etc.
  const getWindowIndex = (dateStr: string): number => {
    // Parse as local date to avoid timezone issues
    const entryDate = parseLocalDate(dateStr);
    const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
    return Math.floor(daysDiff / 7);
  };

  // Group entries into rolling 7-day windows
  const windowTotals = new Map<number, number>();
  const windowDays = new Map<number, Set<string>>();
  
  drinksEntries.forEach(entry => {
    const windowIndex = getWindowIndex(entry.date);
    const currentTotal = windowTotals.get(windowIndex) || 0;
    windowTotals.set(windowIndex, currentTotal + (entry.drinks ?? 0));
    
    if (!windowDays.has(windowIndex)) {
      windowDays.set(windowIndex, new Set());
    }
    windowDays.get(windowIndex)!.add(entry.date);
  });

  // Window 0 = Current week (last 7 days, potentially incomplete)
  const currentWeekTotal = windowTotals.get(0) || 0;
  const currentWeekDays = windowDays.get(0)?.size || 0;

  // Windows 1+ = Complete historical weeks (for avg/median)
  const historicalWeekTotals = Array.from(windowTotals.entries())
    .filter(([index]) => index > 0)
    .map(([, total]) => total);

  const hasCompleteWeeks = historicalWeekTotals.length > 0;
  
  const weeklyAvgTotal = hasCompleteWeeks
    ? historicalWeekTotals.reduce((sum, val) => sum + val, 0) / historicalWeekTotals.length
    : 0;
  
  const sortedWeeklyTotals = [...historicalWeekTotals].sort((a, b) => a - b);
  const weeklyMedianTotal = hasCompleteWeeks
    ? (sortedWeeklyTotals.length % 2
      ? sortedWeeklyTotals[Math.floor(sortedWeeklyTotals.length / 2)]
      : (sortedWeeklyTotals[sortedWeeklyTotals.length / 2 - 1] + sortedWeeklyTotals[sortedWeeklyTotals.length / 2]) / 2)
    : 0;

  return {
    dailyAvg,
    dailyMedian,
    daysWithDrinks,
    daysWithDrinksLast7,
    currentWeekTotal,
    weeklyAvgTotal,
    weeklyMedianTotal,
    dailyExceedsTarget: dailyAvg > DAILY_DRINK_TARGET || dailyMedian > DAILY_DRINK_TARGET,
    weeklyExceedsTarget: currentWeekTotal > WEEKLY_DRINK_TARGET,
    hasCompleteWeeks,
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
