import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DailyNutrient } from '@/types/nutrition';

interface DayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<DailyNutrient, 'id' | 'uid'>) => void;
  initialData?: DailyNutrient | null;
}

export function DayModal({ isOpen, onClose, onSave, initialData }: DayModalProps) {
  const [formData, setFormData] = useState({
    date: '',
    calories: '',
    caloriesBurned: '',
    carbs: '',
    sugar: '',
    protein: '',
    fiber: '',
    fat: '',
    sodium: '',
    drinks: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date,
        calories: initialData.calories.toString(),
        caloriesBurned: initialData.caloriesBurned.toString(),
        carbs: initialData.carbs.toString(),
        sugar: initialData.sugar.toString(),
        protein: initialData.protein.toString(),
        fiber: initialData.fiber.toString(),
        fat: initialData.fat.toString(),
        sodium: initialData.sodium.toString(),
        drinks: initialData.drinks !== undefined ? initialData.drinks.toString() : '0',
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        calories: '',
        caloriesBurned: '2000',
        carbs: '',
        sugar: '',
        protein: '',
        fiber: '',
        fat: '',
        sodium: '',
        drinks: '0',
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      date: formData.date,
      calories: parseFloat(formData.calories) || 0,
      caloriesBurned: parseFloat(formData.caloriesBurned) || 2000,
      carbs: parseFloat(formData.carbs) || 0,
      sugar: parseFloat(formData.sugar) || 0,
      protein: parseFloat(formData.protein) || 0,
      fiber: parseFloat(formData.fiber) || 0,
      fat: parseFloat(formData.fat) || 0,
      sodium: parseFloat(formData.sodium) || 0,
      drinks: parseFloat(formData.drinks) || 0,
    });
    onClose();
  };

  const carbCals = (parseFloat(formData.carbs) || 0) * 4;
  const proteinCals = (parseFloat(formData.protein) || 0) * 4;
  const fatCals = (parseFloat(formData.fat) || 0) * 9;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Day' : 'Add Day'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="caloriesBurned">Calories Burned (default: 2000)</Label>
              <Input
                id="caloriesBurned"
                type="number"
                step="0.1"
                value={formData.caloriesBurned}
                onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="calories">Calories Consumed</Label>
              <Input
                id="calories"
                type="number"
                step="0.1"
                value={formData.calories}
                onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="carbs">Carbs (g) - {carbCals.toFixed(0)} kcal</Label>
              <Input
                id="carbs"
                type="number"
                step="0.1"
                value={formData.carbs}
                onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sugar">Sugar (g)</Label>
              <Input
                id="sugar"
                type="number"
                step="0.1"
                value={formData.sugar}
                onChange={(e) => setFormData({ ...formData, sugar: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="protein">Protein (g) - {proteinCals.toFixed(0)} kcal</Label>
              <Input
                id="protein"
                type="number"
                step="0.1"
                value={formData.protein}
                onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                step="0.1"
                value={formData.fiber}
                onChange={(e) => setFormData({ ...formData, fiber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fat">Fat (g) - {fatCals.toFixed(0)} kcal</Label>
              <Input
                id="fat"
                type="number"
                step="0.1"
                value={formData.fat}
                onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sodium">Sodium (mg)</Label>
              <Input
                id="sodium"
                type="number"
                step="0.1"
                value={formData.sodium}
                onChange={(e) => setFormData({ ...formData, sodium: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="drinks">Standard Drinks</Label>
              <Input
                id="drinks"
                type="number"
                step="0.5"
                min="0"
                value={formData.drinks}
                onChange={(e) => setFormData({ ...formData, drinks: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
