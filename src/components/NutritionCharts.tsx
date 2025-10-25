import { useEffect, useRef } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Pie } from 'react-chartjs-2';
import { DailyNutrient } from '@/types/nutrition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface NutritionChartsProps {
  entries: DailyNutrient[];
}

export function NutritionCharts({ entries }: NutritionChartsProps) {
  if (entries.length === 0) {
    return <div className="text-center text-muted-foreground py-8">No data available</div>;
  }

  const avgProtein = entries.reduce((sum, e) => sum + (e.protein || 0), 0) / entries.length;
  const avgCarbs = entries.reduce((sum, e) => sum + (e.carbs || 0), 0) / entries.length;
  const avgFat = entries.reduce((sum, e) => sum + (e.fat || 0), 0) / entries.length;

  const avgProteinCals = avgProtein * 4;
  const avgCarbsCals = avgCarbs * 4;
  const avgFatCals = avgFat * 9;
  const totalCals = avgProteinCals + avgCarbsCals + avgFatCals;

  const avgData = {
    labels: ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data: [
        ((avgProteinCals / totalCals) * 100).toFixed(1),
        ((avgCarbsCals / totalCals) * 100).toFixed(1),
        ((avgFatCals / totalCals) * 100).toFixed(1),
      ],
      backgroundColor: [
        'hsl(174, 62%, 47%)',
        'hsl(199, 89%, 48%)',
        'hsl(38, 92%, 50%)',
      ],
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      datalabels: {
        color: '#fff',
        font: {
          weight: 'bold' as const,
          size: 14,
        },
        formatter: (value: number) => `${value}%`,
      },
    },
  };

  const getDailyData = (entry: DailyNutrient) => {
    const proteinCals = (entry.protein || 0) * 4;
    const carbsCals = (entry.carbs || 0) * 4;
    const fatCals = (entry.fat || 0) * 9;
    const total = proteinCals + carbsCals + fatCals;

    return {
      labels: ['Protein', 'Carbs', 'Fat'],
      datasets: [{
        data: [
          ((proteinCals / total) * 100).toFixed(1),
          ((carbsCals / total) * 100).toFixed(1),
          ((fatCals / total) * 100).toFixed(1),
        ],
        backgroundColor: [
          'hsl(174, 62%, 47%)',
          'hsl(199, 89%, 48%)',
          'hsl(38, 92%, 50%)',
        ],
      }],
    };
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Average Macro Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          <div className="w-full max-w-sm">
            <Pie data={avgData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">{entry.date}</CardTitle>
            </CardHeader>
            <CardContent>
              <Pie data={getDailyData(entry)} options={chartOptions} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
