import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Apple } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
        toast.success('Account created successfully!');
      } else {
        await signIn(email, password);
        toast.success('Signed in successfully!');
      }
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 border-4 border-foreground">
        {/* Left side - Branding */}
        <div className="bg-primary p-12 lg:p-16 flex flex-col justify-between min-h-[400px]">
          <div>
            <Apple className="w-16 h-16 text-primary-foreground mb-8" />
            <h1 className="text-5xl lg:text-6xl font-display text-primary-foreground leading-none mb-4">
              NUTRITION<br />TRACKER
            </h1>
            <p className="text-primary-foreground/90 font-body text-lg">
              PRECISION TRACKING FOR MODERN ATHLETES
            </p>
          </div>
          <div className="text-primary-foreground/60 text-sm font-body">
            © 2025 · DATA-DRIVEN WELLNESS
          </div>
        </div>

        {/* Right side - Form */}
        <Card className="border-0 rounded-none shadow-none">
        <CardHeader className="space-y-6 p-12">
          <CardTitle className="text-4xl font-display">
            {isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </CardTitle>
          <CardDescription className="text-base font-body">
            {isSignUp 
              ? 'Begin your data-driven journey' 
              : 'Access your performance metrics'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-sm font-bold uppercase tracking-wide">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="YOUR@EMAIL.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-2 border-foreground/20 focus:border-primary font-body"
                required
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-sm font-bold uppercase tracking-wide">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-2 border-foreground/20 focus:border-primary font-body"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full mt-8" disabled={loading} size="lg">
              {loading ? 'PROCESSING...' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
            </Button>
          </form>
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-body hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1"
            >
              {isSignUp ? 'ALREADY HAVE AN ACCOUNT?' : 'CREATE NEW ACCOUNT'}
            </button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
