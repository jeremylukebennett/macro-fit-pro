import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNutritionData } from '@/hooks/useNutritionData';
import { Button } from '@/components/ui/button';
import { EntriesTable } from '@/components/EntriesTable';
import { DayModal } from '@/components/DayModal';
import { TargetsModal } from '@/components/TargetsModal';
import { TrendsCards } from '@/components/TrendsCards';
import { NutritionCharts } from '@/components/NutritionCharts';
import { DailyNutrient, RangeFilter } from '@/types/nutrition';
import { filterDocsByRange, exportToCSV } from '@/utils/calculations';
import { toast } from 'sonner';
import { Plus, Target, Download, LogOut, Moon, Sun, Apple } from 'lucide-react';

export default function Dashboard() {
  const { user, userSettings, logout, updateUserSettings } = useAuth();
  const { dailyNutrients, loading, addNutrient, updateNutrient, deleteNutrient } = useNutritionData();
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyNutrient | null>(null);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('all');

  const filteredEntries = filterDocsByRange(dailyNutrients, rangeFilter);

  const handleAddDay = () => {
    setEditingEntry(null);
    setIsDayModalOpen(true);
  };

  const handleEditDay = (entry: DailyNutrient) => {
    setEditingEntry(entry);
    setIsDayModalOpen(true);
  };

  const handleSaveDay = async (data: Omit<DailyNutrient, 'id' | 'uid'>) => {
    try {
      if (editingEntry) {
        await updateNutrient(editingEntry.id, data);
        toast.success('Day updated successfully');
      } else {
        await addNutrient(data);
        toast.success('Day added successfully');
      }
    } catch (error) {
      toast.error('Failed to save day');
    }
  };

  const handleDeleteDay = async (id: string) => {
    try {
      await deleteNutrient(id);
      toast.success('Day deleted successfully');
    } catch (error) {
      toast.error('Failed to delete day');
    }
  };

  const handleSaveTargets = async (targets: any) => {
    try {
      await updateUserSettings({ targets });
      toast.success('Targets updated successfully');
    } catch (error) {
      toast.error('Failed to update targets');
    }
  };

  const handleExportCSV = () => {
    if (!userSettings) return;
    const csv = exportToCSV(filteredEntries, userSettings.targets);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutrition-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported successfully');
  };

  const toggleTheme = () => {
    const newTheme = userSettings?.theme === 'dark' ? 'light' : 'dark';
    updateUserSettings({ theme: newTheme });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="text-lg">Loading nutrition data...</div>
        <div className="text-sm text-muted-foreground max-w-md text-center">
          If this takes more than a few seconds, you may need to create a Firestore index. Check the browser console for a link.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Apple className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Nutrition Tracker</h1>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {userSettings?.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {(['prev', 'all', '3', '7', '30'] as RangeFilter[]).map((range) => (
              <Button
                key={range}
                variant={rangeFilter === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRangeFilter(range)}
              >
                {range === 'prev' ? 'Previous' : range === 'all' ? 'All' : `${range} days`}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setIsTargetsModalOpen(true)} variant="outline">
              <Target className="w-4 h-4 mr-2" />
              Targets
            </Button>
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleAddDay}>
              <Plus className="w-4 h-4 mr-2" />
              Add Day
            </Button>
          </div>
        </div>

        {userSettings && (
          <>
            <TrendsCards entries={filteredEntries} targets={userSettings.targets} />
            <NutritionCharts entries={filteredEntries} />
            <EntriesTable
              entries={filteredEntries}
              defaultCalories={userSettings.targets.calories}
              onEdit={handleEditDay}
              onDelete={handleDeleteDay}
            />
          </>
        )}

        {userSettings && (
          <>
            <DayModal
              isOpen={isDayModalOpen}
              onClose={() => setIsDayModalOpen(false)}
              onSave={handleSaveDay}
              initialData={editingEntry}
            />
            <TargetsModal
              isOpen={isTargetsModalOpen}
              onClose={() => setIsTargetsModalOpen(false)}
              onSave={handleSaveTargets}
              initialTargets={userSettings.targets}
            />
          </>
        )}
      </main>
    </div>
  );
}
