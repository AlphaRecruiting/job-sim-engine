'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowRight, Building2, Lock, Mail, User } from 'lucide-react';
import { setToken, setUser } from '@/lib/auth';
import { Button, Card, Alert, Input } from '@/components/ui';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function CompanyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirect = rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
    ? rawRedirect
    : '/admin/jobs';

  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState(
    searchParams.get('error') === 'no_account'
      ? 'Nessun account trovato con questa email Google. Registrati prima con email e password.'
      : ''
  );
  const [loading, setLoading] = useState(false);

  function loginWithGoogle() {
    const params = new URLSearchParams({ type: 'company', redirect });
    window.location.href = `${API_URL}/api/auth/google?${params}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/login' : '/api/register';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, name, companyName };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Credenziali non valide'); return; }
      setToken(data.token);
      setUser(data.user);
      router.push(redirect);
    } catch {
      setError('Errore di rete — riprova.');
    } finally {
      setLoading(false);
    }
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
  }

  return (
    <div className="min-h-screen bg-ink-50 flex flex-col">
      {/* Minimal header */}
      <header className="px-8 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand rounded-md flex items-center justify-center">
            <span className="text-white text-sm font-bold font-display">M</span>
          </div>
          <span className="font-bold text-[20px] font-display text-ink-950 tracking-tight">Mansio</span>
        </Link>
        <Link href="/aziende" className="text-[14px] text-ink-500 hover:text-ink-700 transition-colors">
          Torna alla pagina aziende
        </Link>
      </header>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl bg-ink-950 flex items-center justify-center mx-auto mb-6">
            <Building2 size={26} className="text-white" />
          </div>

          <h1 className="text-[28px] text-center mb-1.5">
            {mode === 'login' ? 'Area aziende' : 'Crea il tuo account'}
          </h1>
          <p className="text-[15px] text-ink-500 text-center mb-8">
            {mode === 'login'
              ? 'Accedi alla tua dashboard di selezione.'
              : 'Inizia a selezionare i candidati con Mansio.'}
          </p>

          {/* Google button */}
          <button
            type="button"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-ink-200 rounded-xl py-2.5 px-4 text-[14px] font-medium text-ink-700 hover:bg-ink-50 transition-colors mb-4"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" fill="#FFC107"/>
              <path d="M6.306,14.691l6.571,4.819C14.655,15.108,19.001,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" fill="#FF3D00"/>
              <path d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" fill="#4CAF50"/>
              <path d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" fill="#1976D2"/>
            </svg>
            Continua con Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-ink-100" />
            <span className="text-[12px] text-ink-400">oppure</span>
            <div className="flex-1 h-px bg-ink-100" />
          </div>

          <Card padding="lg">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {mode === 'register' && (
                <>
                  <Input
                    label="Nome azienda"
                    type="text"
                    placeholder="Acme S.r.l."
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    prefix={<Building2 size={15} />}
                    required
                  />
                  <Input
                    label="Il tuo nome"
                    type="text"
                    placeholder="Mario Rossi"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    prefix={<User size={15} />}
                  />
                </>
              )}
              <Input
                label="Email aziendale"
                type="email"
                placeholder="tu@azienda.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                prefix={<Mail size={15} />}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                prefix={<Lock size={15} />}
                required
              />

              {error && <Alert tone="danger">{error}</Alert>}

              <Button
                type="submit"
                disabled={loading}
                block
                size="lg"
                iconRight={<ArrowRight size={16} />}
              >
                {loading
                  ? (mode === 'login' ? 'Accesso in corso…' : 'Creazione account…')
                  : (mode === 'login' ? 'Accedi' : 'Crea account')}
              </Button>
            </form>
          </Card>

          <p className="text-center text-[13px] text-ink-400 mt-5">
            {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-brand font-semibold hover:underline"
            >
              {mode === 'login' ? 'Registrati' : 'Accedi'}
            </button>
          </p>
          <p className="text-center text-[13px] text-ink-400 mt-2">
            Sei un candidato?{' '}
            <Link href="/candidate/login" className="text-brand font-semibold hover:underline">
              Accedi come candidato
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CompanyLoginPage() {
  return (
    <Suspense>
      <CompanyLoginForm />
    </Suspense>
  );
}
