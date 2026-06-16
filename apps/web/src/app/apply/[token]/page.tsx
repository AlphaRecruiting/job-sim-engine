'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type AppData = { type: string; application?: { jobPosting?: { title?: string; description?: string; department?: string }; candidate?: { name?: string; email?: string }; id?: string } };

export default function ApplyPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<AppData>(`/api/candidate/application/${token}`).then(setData).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [token]);

  async function start() {
    setStarting(true);
    try {
      const session = await api.post<{ sessionToken: string; currentStepId?: string }>(`/api/candidate/application/${token}/start`);
      router.push(`/simulation/${session.sessionToken}`);
    } catch (e: any) { setError(e.message); } finally { setStarting(false); }
  }

  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  if (!data?.application) return <Error message="Application not found." />;

  const { jobPosting, candidate } = data.application;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-lg w-full p-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{jobPosting?.title}</h1>
          {jobPosting?.department && <p className="text-gray-500 mt-1">{jobPosting.department}</p>}
        </div>
        {candidate?.name && <p className="text-gray-600">Welcome, <strong>{candidate.name}</strong></p>}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h2 className="font-semibold text-blue-800 mb-2">About This Simulation</h2>
          <p className="text-sm text-blue-700">You will complete a realistic work simulation for this role. Each step tests skills directly relevant to the job. Take your time and answer honestly.</p>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button onClick={start} disabled={starting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition">
          {starting ? 'Starting...' : 'Begin Simulation'}
        </button>
      </div>
    </div>
  );
}

function Loading() { return <div className="min-h-screen flex items-center justify-center text-gray-500">Loading...</div>; }
function Error({ message }: { message: string }) { return <div className="min-h-screen flex items-center justify-center text-red-600">{message}</div>; }
