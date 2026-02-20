import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logoBelaflor from '@/assets/logo-belaflor.svg';
import { toast } from 'sonner';

export default function Login() {
  const { user, loading, signIn, signUp } = useAuth();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (user) return <Navigate to="/" />;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) setError('Email ou senha incorretos');
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setIsLoading(true);
    setError('');
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(error.message);
    } else {
      toast.success('Conta criada! Entrando...');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-0">
        <CardHeader className="text-center pb-2">
          <img src={logoBelaflor} alt="Bela Flor" className="mx-auto w-20 h-20 mb-4" />
          <p className="text-muted-foreground mt-1 text-lg">Sistema Comercial</p>
        </CardHeader>
        <CardContent>
          <div className="flex mb-6 bg-muted rounded-lg p-1">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                tab === 'login' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setTab('signup'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                tab === 'signup' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Criar Conta
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" type="text" value={fullName} onChange={e => setFullName(e.target.value)} required placeholder="Seu nome" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="seu@email.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-password">Senha</Label>
                <Input id="signup-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Criando conta...' : 'Criar Conta'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
