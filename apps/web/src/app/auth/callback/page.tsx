'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { setToken, setUser } from '@/lib/auth';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const type = params.get('type');
    const redirect = params.get('redirect') ?? '/';
    const safeRedirect = redirect.startsWith('/') && !redirect.startsWith('//') ? redirect : '/';

    if (!token) {
      router.replace(type === 'candidate' ? '/candidate/login' : '/company/login');
      return;
    }

    if (type === 'candidate') {
      const profileRaw = params.get('profile');
      localStorage.setItem('candidateToken', token);
      if (profileRaw) {
        try { localStorage.setItem('candidateProfile', profileRaw); } catch {}
      }
      router.replace(safeRedirect);
    } else {
      const userRaw = params.get('user');
      setToken(token);
      if (userRaw) {
        try { setUser(JSON.parse(userRaw)); } catch {}
      }
      router.replace(safeRedirect);
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-sm">Accesso in corso…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackHandler />
    </Suspense>
  );
}
