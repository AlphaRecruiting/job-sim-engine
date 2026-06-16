import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Job Sim Engine</h1>
      <p className="text-gray-600 text-lg text-center max-w-md">
        A modular job simulation platform for realistic candidate assessment.
      </p>
      <div className="flex gap-4">
        <Link href="/admin/jobs" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition">
          Admin Dashboard
        </Link>
        <Link href="/apply/demo" className="border border-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition">
          Candidate Demo
        </Link>
      </div>
    </div>
  );
}
