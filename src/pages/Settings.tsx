import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Eye, EyeOff, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { showDrinks, setShowDrinks, theme, setTheme } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl metric-text">SETTINGS</h1>
            <p className="text-muted-foreground">Manage your preferences and privacy</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="metric-text flex items-center gap-2">
              {showDrinks ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              PRIVACY
            </CardTitle>
            <CardDescription>
              Control what information is visible in your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-drinks" className="text-base metric-text">
                  Show Drinks Data
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display alcohol consumption tracking in your dashboard
                </p>
              </div>
              <Switch
                id="show-drinks"
                checked={showDrinks}
                onCheckedChange={setShowDrinks}
              />
            </div>

            <Separator />

            <div className="text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Privacy Mode:</strong> When drinks data is hidden, the drinks card will not appear in your dashboard.
              </p>
              <p>
                Perfect for sharing your screen with trainers, nutritionists, or anyone else while keeping certain data private.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="metric-text flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              APPEARANCE
            </CardTitle>
            <CardDescription>
              Customize how the app looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base metric-text">
                  Dark Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Switch between light and dark theme
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
