import Link from 'next/link';

export default function CompletedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md w-full p-10 text-center space-y-5">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">Simulation Complete!</h1>
        <p className="text-gray-600">Thank you for completing the simulation. Your responses have been submitted and are being reviewed.</p>
        <p className="text-sm text-gray-400">You will hear back from the hiring team soon.</p>
      </div>
    </div>
  );
}
