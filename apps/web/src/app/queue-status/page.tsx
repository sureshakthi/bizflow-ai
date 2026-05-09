'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function QueueStatusPage() {
  const [tokenNumber, setTokenNumber] = useState('');
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const checkStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenNumber) return;
    setError('');
    setLoading(true);
    try {
      const token = await api(`/tokens/by-number/${tokenNumber}`);
      if (!token) { setError('Token not found'); return; }
      const queueData = await api(`/queue/status/${token.id}`);
      setStatus(queueData);
    } catch (err: any) {
      setError(err.message || 'Token not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-1">🎫 Check Queue Status</h1>
        <p className="text-gray-500 text-center text-sm mb-6">Enter your token number to check your position</p>

        <form onSubmit={checkStatus} className="flex gap-2 mb-6">
          <input value={tokenNumber} onChange={e => setTokenNumber(e.target.value.toUpperCase())}
            placeholder="e.g. GYN-001" className="flex-1 border rounded-lg px-4 py-3 font-mono text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <button type="submit" disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? '...' : 'Check'}
          </button>
        </form>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">{error}</div>}

        {status && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center mb-4">
              <div className="text-4xl font-bold font-mono text-blue-600">{status.token.tokenNumber}</div>
              <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${
                status.token.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                status.token.status === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
                status.token.status === 'COMPLETED' ? 'bg-gray-100 text-gray-500' :
                'bg-red-100 text-red-700'
              }`}>
                {status.token.status === 'IN_PROGRESS' ? "It's your turn!" : status.token.status}
              </div>
            </div>

            {status.token.status === 'WAITING' && (
              <div className="space-y-3 text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Patients ahead of you</p>
                  <p className="text-3xl font-bold text-blue-700">{status.patientsAhead}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600">Estimated wait time</p>
                  <p className="text-3xl font-bold text-purple-700">~{status.estimatedWait} min</p>
                </div>
                {status.currentlyServing && (
                  <p className="text-sm text-gray-500">Now serving: <strong>{status.currentlyServing}</strong></p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
