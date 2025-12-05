import { DailyNutrient, NutrientTargets } from '@/types/nutrition';
import { computeAverage, computeMedian, computeTrend, computeTrendForDeficit, computeDailyDeficit, filterEntriesWithDrinks, computeAllDrinkStats, DAILY_DRINK_TARGET, WEEKLY_DRINK_TARGET } from '@/utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendsCardsProps {
  entries: DailyNutrient[];
  targets: NutrientTargets;
  referenceDate?: Date;
}

export function TrendsCards({ entries, targets, referenceDate }: TrendsCardsProps) {
  if (entries.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>;
  }

  const nutrients = [
    { key: 'calories' as const, label: 'Calories', unit: '', target: targets.calories },
    { key: 'deficit' as const, label: 'Deficit', unit: '', target: targets.deficit },
    { key: 'carbs' as const, label: 'Carbs', unit: 'g', target: targets.carbs },
    { key: 'sugar' as const, label: 'Sugar', unit: 'g', target: targets.sugar },
    { key: 'protein' as const, label: 'Protein', unit: 'g', target: targets.protein },
    { key: 'fiber' as const, label: 'Fiber', unit: 'g', target: targets.fiber },
    { key: 'fat' as const, label: 'Fat', unit: 'g', target: targets.fat },
    { key: 'sodium' as const, label: 'Sodium', unit: 'mg', target: targets.sodium },
  ];

  const drinksEntries = filterEntriesWithDrinks(entries);
  const drinkStats = computeAllDrinkStats(entries, referenceDate);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {nutrients.map(({ key, label, unit, target }) => {
        let avg, median, trend;
        
        if (key === 'deficit') {
          avg = computeAverage(entries, d => computeDailyDeficit(d, targets.calories));
          median = computeMedian(entries, d => computeDailyDeficit(d, targets.calories));
          trend = computeTrendForDeficit(entries, targets.calories);
        } else {
          avg = computeAverage(entries, d => (d[key] as number) || 0);
          median = computeMedian(entries, d => (d[key] as number) || 0);
          trend = computeTrend(key, entries);
        }

        return (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{avg.toFixed(1)}{unit}</span>
                  <TrendIcon trend={trend.avgTrend} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Median:</span>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{median.toFixed(1)}{unit}</span>
                  <TrendIcon trend={trend.medTrend} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">Target:</span>
                <span className="text-sm font-medium text-primary">{target}{unit}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
      
      {/* Special Drinks Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Drinks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {drinksEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-2">No data yet</div>
          ) : (
            <>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Per Day (last 30 days)</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Avg:</span>
                    <span className={`font-semibold ${drinkStats.dailyAvg > DAILY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                      {drinkStats.dailyAvg.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Median:</span>
                    <span className={`font-semibold ${drinkStats.dailyMedian > DAILY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                      {drinkStats.dailyMedian.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Target:</span>
                    <span className="text-sm font-medium text-primary">≤ {DAILY_DRINK_TARGET} / day</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-muted-foreground mb-2">Per Week (rolling 7 days)</div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Last 7 days:</span>
                    <span className={`font-semibold ${drinkStats.currentWeekTotal > WEEKLY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                      {drinkStats.currentWeekTotal}
                    </span>
                  </div>
                  {drinkStats.hasCompleteWeeks ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Historical avg:</span>
                        <span className="font-semibold">
                          {drinkStats.weeklyAvgTotal.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Historical median:</span>
                        <span className="font-semibold">
                          {drinkStats.weeklyMedianTotal.toFixed(1)}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      Need 14+ days for historical data
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">Target:</span>
                    <span className="text-sm font-medium text-primary">≤ {WEEKLY_DRINK_TARGET} / week</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
