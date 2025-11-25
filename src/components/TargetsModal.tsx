import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NutrientTargets } from '@/types/nutrition';

interface TargetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (targets: NutrientTargets) => void;
  initialTargets: NutrientTargets;
}

export function TargetsModal({ isOpen, onClose, onSave, initialTargets }: TargetsModalProps) {
  const [targets, setTargets] = useState<NutrientTargets>(initialTargets);

  useEffect(() => {
    setTargets(initialTargets);
  }, [initialTargets, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(targets);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Targets</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target-calories">Calories</Label>
              <Input
                id="target-calories"
                type="number"
                value={targets.calories}
                onChange={(e) => setTargets({ ...targets, calories: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-deficit">Deficit</Label>
              <Input
                id="target-deficit"
                type="number"
                value={targets.deficit}
                onChange={(e) => setTargets({ ...targets, deficit: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-carbs">Carbs (g)</Label>
              <Input
                id="target-carbs"
                type="number"
                value={targets.carbs}
                onChange={(e) => setTargets({ ...targets, carbs: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-sugar">Sugar (g)</Label>
              <Input
                id="target-sugar"
                type="number"
                value={targets.sugar}
                onChange={(e) => setTargets({ ...targets, sugar: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-protein">Protein (g)</Label>
              <Input
                id="target-protein"
                type="number"
                value={targets.protein}
                onChange={(e) => setTargets({ ...targets, protein: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-fiber">Fiber (g)</Label>
              <Input
                id="target-fiber"
                type="number"
                value={targets.fiber}
                onChange={(e) => setTargets({ ...targets, fiber: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-fat">Fat (g)</Label>
              <Input
                id="target-fat"
                type="number"
                value={targets.fat}
                onChange={(e) => setTargets({ ...targets, fat: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-sodium">Sodium (mg)</Label>
              <Input
                id="target-sodium"
                type="number"
                value={targets.sodium}
                onChange={(e) => setTargets({ ...targets, sodium: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="target-drinks">Max Daily Drinks</Label>
              <Input
                id="target-drinks"
                type="number"
                step="0.5"
                min="0"
                value={targets.drinks}
                onChange={(e) => setTargets({ ...targets, drinks: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Targets</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
