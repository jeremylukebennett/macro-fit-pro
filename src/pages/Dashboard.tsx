import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useNutritionData } from '@/hooks/useNutritionData';
import { useCycles } from '@/hooks/useCycles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EntriesTable } from '@/components/EntriesTable';
import { DayModal } from '@/components/DayModal';
import { TargetsModal } from '@/components/TargetsModal';
import { TrendsCards } from '@/components/TrendsCards';
import { NutritionCharts } from '@/components/NutritionCharts';
import { DailyNutrient, RangeFilter, NutrientTargets } from '@/types/nutrition';
import { filterDocsByRange, exportToCSV } from '@/utils/calculations';
import { toast } from 'sonner';
import { Plus, Target, Download, LogOut, Moon, Sun, Apple, Settings, Trash2 } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userSettings, logout, updateUserSettings } = useAuth();
  const { dailyNutrients, loading, addNutrient, updateNutrient, deleteNutrient } = useNutritionData();
  const { cycles, loading: cyclesLoading, createCycle, deleteCycle } = useCycles();
  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [isTargetsModalOpen, setIsTargetsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyNutrient | null>(null);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>('7');
  const [cycleScope, setCycleScope] = useState<string>('all');
  const [scopeInitialized, setScopeInitialized] = useState(false);
  const [isCycleMenuOpen, setIsCycleMenuOpen] = useState(false);
  const [newCycleName, setNewCycleName] = useState('');
  const [isDeleteCycleDialogOpen, setIsDeleteCycleDialogOpen] = useState(false);

  const activeCycleId = userSettings?.activeCycleId ?? null;
  const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId);
  const hasLegacyEntries = dailyNutrients.some((entry) => !entry.cycleId);

  useEffect(() => {
    if (!userSettings || scopeInitialized) return;
    setCycleScope(activeCycleId ? 'active' : 'all');
    setScopeInitialized(true);
  }, [userSettings, scopeInitialized, activeCycleId]);

  const entriesInScope = useMemo(() => {
    if (cycleScope === 'all') return dailyNutrients;
    if (cycleScope === 'active') {
      if (!activeCycleId) return [];
      return dailyNutrients.filter((entry) => entry.cycleId === activeCycleId);
    }
    if (cycleScope === 'legacy') {
      return dailyNutrients.filter((entry) => !entry.cycleId);
    }
    if (cycleScope.startsWith('cycle:')) {
      const cycleId = cycleScope.replace('cycle:', '');
      return dailyNutrients.filter((entry) => entry.cycleId === cycleId);
    }
    return dailyNutrients;
  }, [dailyNutrients, cycleScope, activeCycleId]);

  const filteredEntries = filterDocsByRange(entriesInScope, rangeFilter);

  // For 'prev' filter, use the most recent remaining entry's date as reference for rolling calculations
  const referenceDate = rangeFilter === 'prev' && filteredEntries.length > 0 ? (() => {
    const sorted = [...filteredEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return new Date(sorted[0].date);
  })() : undefined;

  const selectedCycleId = cycleScope.startsWith('cycle:')
    ? cycleScope.replace('cycle:', '')
    : cycleScope === 'active'
      ? activeCycleId
      : null;

  const selectedCycle = selectedCycleId ? cycles.find((cycle) => cycle.id === selectedCycleId) : null;
  const selectedCycleEntryCount = selectedCycleId
    ? dailyNutrients.filter((entry) => entry.cycleId === selectedCycleId).length
    : 0;

  const scopeLabel = (() => {
    if (cycleScope === 'all') return 'Viewing all history';
    if (cycleScope === 'legacy') return 'Viewing legacy entries (no cycle)';
    if (cycleScope === 'active') {
      return activeCycle ? `Viewing current cycle: ${activeCycle.name}` : 'No active cycle selected';
    }
    if (selectedCycle) return `Viewing cycle: ${selectedCycle.name}`;
    return 'Viewing selected scope';
  })();

  useEffect(() => {
    if (!isCycleMenuOpen) return;
    if (newCycleName.trim()) return;
    setNewCycleName(`Cycle ${new Date().toISOString().slice(0, 10)}`);
  }, [isCycleMenuOpen, newCycleName]);

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
        const updatePayload = editingEntry.cycleId ? { ...data, cycleId: editingEntry.cycleId } : data;
        await updateNutrient(editingEntry.id, updatePayload);
        toast.success('Day updated successfully');
      } else {
        const createPayload = activeCycleId ? { ...data, cycleId: activeCycleId } : data;
        await addNutrient(createPayload);
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

  const handleSaveTargets = async (targets: NutrientTargets) => {
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

  const handleCreateCycle = async () => {
    const name = newCycleName.trim();
    if (!name) {
      toast.error('Enter a cycle name');
      return;
    }

    try {
      const newCycle = await createCycle(name);
      if (!newCycle) {
        toast.error('You must be logged in to create a cycle');
        return;
      }

      await updateUserSettings({ activeCycleId: newCycle.id });
      setCycleScope('active');
      setScopeInitialized(true);
      setIsCycleMenuOpen(false);
      setNewCycleName(`Cycle ${new Date().toISOString().slice(0, 10)}`);
      toast.success(`Started new cycle: ${name}`);
    } catch (error) {
      toast.error('Failed to create cycle');
    }
  };

  const handleSetActiveCycle = async () => {
    if (!selectedCycleId) return;

    try {
      await updateUserSettings({ activeCycleId: selectedCycleId });
      setCycleScope('active');
      setIsCycleMenuOpen(false);
      toast.success('Active cycle updated');
    } catch (error) {
      toast.error('Failed to update active cycle');
    }
  };

  const handleDeleteCycle = async () => {
    if (!selectedCycleId || !selectedCycle) return;

    try {
      const movedEntriesCount = await deleteCycle(selectedCycleId);

      if (selectedCycleId === activeCycleId) {
        await updateUserSettings({ activeCycleId: null });
      }

      setCycleScope('all');
      setScopeInitialized(true);
      setIsDeleteCycleDialogOpen(false);
      setIsCycleMenuOpen(false);

      toast.success(
        `Cycle deleted. ${movedEntriesCount} ${movedEntriesCount === 1 ? 'entry was' : 'entries were'} moved to Legacy Entries.`,
      );
    } catch (error) {
      toast.error('Failed to delete cycle');
    }
  };

  if (loading || cyclesLoading) {
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
      <header className="border-b-4 border-foreground bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary flex items-center justify-center border-2 border-foreground">
                <Apple className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-3xl metric-text leading-none">Nutrition Tracker</h1>
                <p className="text-xs uppercase tracking-wider text-muted-foreground mt-1">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/settings')}>
                <Settings className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {userSettings?.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="outline" onClick={logout} size="sm">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-12">
        <AlertDialog open={isDeleteCycleDialogOpen} onOpenChange={setIsDeleteCycleDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Cycle</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedCycle
                  ? `Delete "${selectedCycle.name}"? ${selectedCycleEntryCount} ${selectedCycleEntryCount === 1 ? 'entry will' : 'entries will'} be preserved and moved to Legacy Entries.`
                  : 'Delete selected cycle?'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCycle}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Cycle
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="sticky top-0 z-50 bg-background py-4 -mx-6 px-6 border-b-2 border-foreground/10">
          <Sheet open={isCycleMenuOpen} onOpenChange={setIsCycleMenuOpen}>
            <SheetContent side="right" className="w-full sm:max-w-md space-y-6">
              <SheetHeader>
                <SheetTitle className="metric-text">CYCLE MENU</SheetTitle>
                <SheetDescription>Switch views, start a new cycle, and manage old cycles.</SheetDescription>
              </SheetHeader>

              <div className="space-y-4">
                <div className="space-y-2 rounded-md border p-3">
                  <Label htmlFor="new-cycle-name">New Cycle Name</Label>
                  <Input
                    id="new-cycle-name"
                    value={newCycleName}
                    onChange={(e) => setNewCycleName(e.target.value)}
                    placeholder="Cycle 2026-02-18"
                  />
                  <Button onClick={handleCreateCycle} variant="outline" className="w-full">
                    START NEW CYCLE
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Current View</p>
                  <Select value={cycleScope} onValueChange={setCycleScope}>
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCycleId && (
                        <SelectItem value="active">Current Cycle: {activeCycle?.name ?? 'Unknown Cycle'}</SelectItem>
                      )}
                      <SelectItem value="all">All History</SelectItem>
                      {hasLegacyEntries && <SelectItem value="legacy">Legacy Entries (No Cycle)</SelectItem>}
                      {cycles.map((cycle) => (
                        <SelectItem key={cycle.id} value={`cycle:${cycle.id}`}>
                          {cycle.name}{cycle.id === activeCycleId ? ' (Current)' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">{scopeLabel}</p>
                </div>

                <div className="space-y-2 rounded-md border p-3">
                  <p className="text-sm font-medium">Selected Cycle Actions</p>
                  {selectedCycleId && selectedCycleId !== activeCycleId && (
                    <Button onClick={handleSetActiveCycle} variant="outline" className="w-full">
                      SET ACTIVE
                    </Button>
                  )}
                  {selectedCycle && (
                    <Button
                      onClick={() => setIsDeleteCycleDialogOpen(true)}
                      variant="outline"
                      className="w-full text-destructive border-destructive/50 hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      DELETE CYCLE
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button onClick={() => setIsCycleMenuOpen(true)} variant="outline" size="sm">
                  CYCLES
                </Button>
                <span className="text-xs text-muted-foreground">{scopeLabel}</span>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setIsTargetsModalOpen(true)} variant="outline" size="sm">
                  <Target className="w-4 h-4" />
                </Button>
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
                <Button onClick={handleAddDay} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  ADD DAY
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {(['prev', 'all', '3', '7', '30'] as RangeFilter[]).map((range) => (
                <Button
                  key={range}
                  variant={rangeFilter === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRangeFilter(range)}
                >
                  {range === 'prev' ? 'PREV' : range === 'all' ? 'ALL' : `${range}D`}
                </Button>
              ))}
              <span className="text-xs text-muted-foreground ml-2">
                {filteredEntries.length} entries
                {rangeFilter === 'prev' && ' (excluding latest)'}
              </span>
            </div>
          </div>
        </div>

        {userSettings && (
          <>
            <TrendsCards entries={filteredEntries} targets={userSettings.targets} referenceDate={referenceDate} />
            <NutritionCharts entries={filteredEntries} />
            <EntriesTable
              entries={filteredEntries}
              defaultCalories={userSettings.targets.calories}
              onEdit={handleEditDay}
              onDelete={handleDeleteDay}
              referenceDate={referenceDate}
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
