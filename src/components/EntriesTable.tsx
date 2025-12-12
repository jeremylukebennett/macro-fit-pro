import { useState } from 'react';
import { DailyNutrient } from '@/types/nutrition';
import { computeDailyDeficit, computeAllDrinkStats } from '@/utils/calculations';
import { formatDisplayDate } from '@/utils/dateFormat';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface EntriesTableProps {
  entries: DailyNutrient[];
  defaultCalories: number;
  onEdit: (entry: DailyNutrient) => void;
  onDelete: (id: string) => void;
  referenceDate?: Date;
}

type SortColumn = keyof DailyNutrient | 'deficit' | null;
type SortDirection = 'asc' | 'desc';

export function EntriesTable({ entries, defaultCalories, onEdit, onDelete, referenceDate }: EntriesTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [clickCount, setClickCount] = useState<Record<string, number>>({});

  const handleColumnClick = (column: SortColumn) => {
    const key = column || 'date';
    const count = (clickCount[key] || 0) + 1;
    
    if (count === 3) {
      // Reset to date desc
      setSortColumn('date');
      setSortDirection('desc');
      setClickCount({ ...clickCount, [key]: 0 });
    } else {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
      } else {
        setSortColumn(column);
        setSortDirection('desc');
      }
      setClickCount({ ...clickCount, [key]: count });
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let aVal: number | string | undefined;
    let bVal: number | string | undefined;
    
    if (sortColumn === 'deficit') {
      aVal = computeDailyDeficit(a, defaultCalories);
      bVal = computeDailyDeficit(b, defaultCalories);
    } else if (sortColumn) {
      aVal = a[sortColumn];
      bVal = b[sortColumn];
    } else {
      return 0;
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const formatDeficit = (value: number) => {
    if (value >= 0) return value.toFixed(0);
    return `+${Math.abs(value).toFixed(0)}`;
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const drinkStats = computeAllDrinkStats(entries, referenceDate);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer" onClick={() => handleColumnClick('date')}>
                <div className="flex items-center gap-1">Date <SortIcon column="date" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('calories')}>
                <div className="flex items-center justify-end gap-1">Calories <SortIcon column="calories" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('deficit')}>
                <div className="flex items-center justify-end gap-1">Deficit <SortIcon column="deficit" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('carbs')}>
                <div className="flex items-center justify-end gap-1">Carbs <SortIcon column="carbs" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('sugar')}>
                <div className="flex items-center justify-end gap-1">Sugar <SortIcon column="sugar" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('protein')}>
                <div className="flex items-center justify-end gap-1">Protein <SortIcon column="protein" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('fiber')}>
                <div className="flex items-center justify-end gap-1">Fiber <SortIcon column="fiber" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('fat')}>
                <div className="flex items-center justify-end gap-1">Fat <SortIcon column="fat" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('sodium')}>
                <div className="flex items-center justify-end gap-1">Sodium <SortIcon column="sodium" /></div>
              </TableHead>
              <TableHead className="cursor-pointer text-right" onClick={() => handleColumnClick('drinks')}>
                <div className="flex items-center justify-end gap-1">Drinks <SortIcon column="drinks" /></div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{formatDisplayDate(entry.date)}</TableCell>
                <TableCell className="text-right">{entry.calories}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatDeficit(computeDailyDeficit(entry, defaultCalories))}
                </TableCell>
                <TableCell className="text-right">{entry.carbs}g</TableCell>
                <TableCell className="text-right">{entry.sugar}g</TableCell>
                <TableCell className="text-right">{entry.protein}g</TableCell>
                <TableCell className="text-right">{entry.fiber}g</TableCell>
                <TableCell className="text-right">{entry.fat}g</TableCell>
                <TableCell className="text-right">{entry.sodium}mg</TableCell>
                <TableCell className="text-right">{entry.drinks !== undefined ? entry.drinks : '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(entry)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            
            {/* Drinks Summary Row */}
            {entries.some(e => e.drinks !== undefined) && (
              <TableRow className="bg-muted/50 font-medium">
                <TableCell colSpan={9} className="text-right text-sm text-muted-foreground">
                  Drinks Summary:
                </TableCell>
                <TableCell className="text-right">
                  <div className="space-y-1 text-xs">
                    <div>Daily: {drinkStats.dailyAvg.toFixed(1)} avg / {drinkStats.dailyMedian.toFixed(1)} med</div>
                    <div>Last 7 days: {drinkStats.currentWeekTotal}</div>
                    {drinkStats.hasCompleteWeeks && (
                      <div>Historical: {drinkStats.weeklyAvgTotal.toFixed(1)} avg / {drinkStats.weeklyMedianTotal.toFixed(1)} med</div>
                    )}
                  </div>
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
