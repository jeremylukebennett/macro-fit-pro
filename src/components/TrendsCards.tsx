import { DailyNutrient, NutrientTargets } from '@/types/nutrition';
import { computeAverage, computeMedian, computeTrend, computeTrendForDeficit, computeDailyDeficit, filterEntriesWithDrinks, computeAllDrinkStats, DAILY_DRINK_TARGET, WEEKLY_DRINK_TARGET } from '@/utils/calculations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, Flame, Activity, Wheat, Candy, Beef, Apple, Droplet, Sparkles, Wine } from 'lucide-react';
import { RollingNumber } from '@/components/RollingNumber';
import { useSettings } from '@/contexts/SettingsContext';

interface TrendsCardsProps {
  entries: DailyNutrient[];
  targets: NutrientTargets;
  referenceDate?: Date;
}

export function TrendsCards({ entries, targets, referenceDate }: TrendsCardsProps) {
  const { showDrinks } = useSettings();

  if (entries.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>;
  }

  const nutrients = [
    { key: 'calories' as const, label: 'Calories', unit: '', target: targets.calories, icon: Flame },
    { key: 'deficit' as const, label: 'Deficit', unit: '', target: targets.deficit, icon: Activity },
    { key: 'carbs' as const, label: 'Carbs', unit: 'g', target: targets.carbs, icon: Wheat },
    { key: 'sugar' as const, label: 'Sugar', unit: 'g', target: targets.sugar, icon: Candy },
    { key: 'protein' as const, label: 'Protein', unit: 'g', target: targets.protein, icon: Beef },
    { key: 'fiber' as const, label: 'Fiber', unit: 'g', target: targets.fiber, icon: Apple },
    { key: 'fat' as const, label: 'Fat', unit: 'g', target: targets.fat, icon: Droplet },
    { key: 'sodium' as const, label: 'Sodium', unit: 'mg', target: targets.sodium, icon: Sparkles },
  ];

  const drinksEntries = filterEntriesWithDrinks(entries);
  const drinkStats = computeAllDrinkStats(entries, referenceDate);

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-success" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-destructive" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  // Format deficit: positive deficit means burned > consumed (show as deficit)
  // Negative deficit means consumed > burned (surplus - show as positive with +)
  // We invert the sign: surplus should display as positive
  const formatDeficitValue = (value: number): string => {
    const surplus = -value; // Invert: deficit becomes negative, surplus becomes positive
    if (surplus > 0) {
      return `+${surplus.toFixed(0)}`;
    }
    return surplus.toFixed(0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {nutrients.map(({ key, label, unit, target, icon: Icon }) => {
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
              <CardTitle className="text-base metric-text flex items-center gap-2">
                <Icon className="w-5 h-5 text-primary" />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm metric-text text-muted-foreground">Avg:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl metric-text tabular-nums">
                    {key === 'deficit' ? (
                      <RollingNumber value={-Math.round(avg)} decimals={0} showSign={true} />
                    ) : (
                      <>
                        <RollingNumber value={Math.round(avg)} decimals={0} />
                        <span className="text-base font-light">{unit}</span>
                      </>
                    )}
                  </span>
                  <TrendIcon trend={trend.avgTrend} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm metric-text text-muted-foreground">Median:</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl metric-text tabular-nums">
                    {key === 'deficit' ? (
                      <RollingNumber value={-Math.round(median)} decimals={0} showSign={true} />
                    ) : (
                      <>
                        <RollingNumber value={Math.round(median)} decimals={0} />
                        <span className="text-base font-light">{unit}</span>
                      </>
                    )}
                  </span>
                  <TrendIcon trend={trend.medTrend} />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm metric-text text-muted-foreground">Target:</span>
                <span className="text-lg metric-text text-primary tabular-nums">
                  {target}
                  <span className="text-sm font-light">{unit}</span>
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Special Drinks Card - Only show if privacy setting allows */}
      {showDrinks && (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base metric-text flex items-center gap-2">
            <Wine className="w-5 h-5 text-primary" />
            Drinks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {drinksEntries.length === 0 ? (
            <div className="text-sm metric-text text-muted-foreground text-center py-2">No data yet</div>
          ) : (
            <>
              <div>
                <div className="text-sm metric-text text-muted-foreground mb-2">When you drink</div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm metric-text text-muted-foreground">Avg:</span>
                    <span className={`text-2xl metric-text tabular-nums ${drinkStats.dailyAvg > DAILY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                      <RollingNumber value={Math.round(drinkStats.dailyAvg)} decimals={0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm metric-text text-muted-foreground">Median:</span>
                    <span className={`text-2xl metric-text tabular-nums ${drinkStats.dailyMedian > DAILY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                      <RollingNumber value={Math.round(drinkStats.dailyMedian)} decimals={0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm metric-text text-muted-foreground">Days (last 7):</span>
                    <span className="text-2xl metric-text tabular-nums">
                      <RollingNumber value={drinkStats.daysWithDrinksLast7} decimals={0} />
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-sm metric-text text-muted-foreground">Target:</span>
                    <span className="text-lg metric-text text-primary tabular-nums">≤ {DAILY_DRINK_TARGET} / session</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="text-sm metric-text text-muted-foreground mb-2">Weekly total</div>
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm metric-text text-muted-foreground">Last 7 days:</span>
                    <span className={`text-2xl metric-text tabular-nums ${drinkStats.currentWeekTotal > WEEKLY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                      <RollingNumber value={drinkStats.currentWeekTotal} decimals={0} />
                    </span>
                  </div>
                  {drinkStats.hasCompleteWeeks ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm metric-text text-muted-foreground">Avg week:</span>
                        <span className={`text-2xl metric-text tabular-nums ${drinkStats.weeklyAvgTotal > WEEKLY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                          <RollingNumber value={Math.round(drinkStats.weeklyAvgTotal)} decimals={0} />
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm metric-text text-muted-foreground">Median week:</span>
                        <span className={`text-2xl metric-text tabular-nums ${drinkStats.weeklyMedianTotal > WEEKLY_DRINK_TARGET ? 'text-destructive' : ''}`}>
                          <RollingNumber value={Math.round(drinkStats.weeklyMedianTotal)} decimals={0} />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-sm metric-text text-muted-foreground text-center py-1">
                      Need 14+ days for history
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-sm metric-text text-muted-foreground">Target:</span>
                    <span className="text-lg metric-text text-primary tabular-nums">≤ {WEEKLY_DRINK_TARGET} / week</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      )}
    </div>
  );
}
