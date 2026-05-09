'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Token {
  id: string;
  tokenNumber: string;
  status: string;
  patient: { name: string; phone: string };
  preConsultForm: any;
  purpose: string;
}

export default function DoctorPage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [selected, setSelected] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const data = await api('/tokens');
      setTokens(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const callNext = async (id: string) => {
    await api(`/queue/${id}/next`, { method: 'PATCH' });
    loadQueue();
  };

  const complete = async (id: string) => {
    await api(`/queue/${id}/complete`, { method: 'PATCH' });
    setSelected(null);
    loadQueue();
  };

  const current = tokens.find(t => t.status === 'IN_PROGRESS');
  const waiting = tokens.filter(t => t.status === 'WAITING');
  const completed = tokens.filter(t => t.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left: Queue */}
      <div className="w-80 bg-white border-r p-4 overflow-y-auto">
        <h1 className="text-lg font-bold mb-4">👨‍⚕️ Doctor&apos;s View</h1>

        {/* Currently Serving */}
        {current && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 uppercase mb-2">Now Serving</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 cursor-pointer" onClick={() => setSelected(current)}>
              <div className="font-mono font-bold text-green-700 text-lg">{current.tokenNumber}</div>
              <div className="text-sm">{current.patient?.name}</div>
            </div>
          </div>
        )}

        {/* Waiting */}
        <p className="text-xs text-gray-500 uppercase mb-2">Waiting ({waiting.length})</p>
        <div className="space-y-2 mb-4">
          {waiting.map(t => (
            <div key={t.id} className="bg-gray-50 border rounded-lg p-3 cursor-pointer hover:bg-blue-50 transition flex justify-between items-center"
              onClick={() => setSelected(t)}>
              <div>
                <div className="font-mono font-bold text-sm">{t.tokenNumber}</div>
                <div className="text-xs text-gray-500">{t.patient?.name}</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); callNext(t.id); }}
                className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Call</button>
            </div>
          ))}
        </div>

        {/* Completed */}
        <p className="text-xs text-gray-500 uppercase mb-2">Completed ({completed.length})</p>
        <div className="space-y-1">
          {completed.slice(0, 5).map(t => (
            <div key={t.id} className="text-xs text-gray-400 flex justify-between px-2">
              <span>{t.tokenNumber}</span>
              <span>{t.patient?.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right: Patient Detail */}
      <div className="flex-1 p-6">
        {selected ? (
          <div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selected.patient?.name}</h2>
                <p className="text-gray-500">{selected.tokenNumber} | {selected.purpose} | {selected.patient?.phone}</p>
              </div>
              {selected.status === 'IN_PROGRESS' && (
                <button onClick={() => complete(selected.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  ✅ Complete Consultation
                </button>
              )}
            </div>

            {/* Pre-consult data */}
            {selected.preConsultForm ? (
              <div className="bg-white rounded-xl shadow p-6 mb-4">
                <h3 className="font-semibold mb-3">📝 Pre-Consult Form</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500">Visit Type:</span> {selected.preConsultForm.visitType}</div>
                  <div><span className="text-gray-500">Marital Status:</span> {selected.preConsultForm.maritalStatus}</div>
                  <div><span className="text-gray-500">LMP Date:</span> {selected.preConsultForm.lmpDate ? new Date(selected.preConsultForm.lmpDate).toLocaleDateString() : '-'}</div>
                  <div><span className="text-gray-500">Allergies:</span> {selected.preConsultForm.allergies || 'None'}</div>
                  <div className="col-span-2"><span className="text-gray-500">Current Medications:</span> {selected.preConsultForm.currentMedications || 'None'}</div>
                  <div className="col-span-2"><span className="text-gray-500">Pregnancy History:</span> {selected.preConsultForm.pregnancyHistory || '-'}</div>
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 text-sm text-yellow-700">
                ⏳ Pre-consult form not yet filled
              </div>
            )}

            {/* Placeholder for prescription, notes, etc. */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold mb-3">📋 Consultation Notes</h3>
              <textarea className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Type your notes here..." />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Select a patient from the queue to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
