'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Token {
  id: string;
  tokenNumber: string;
  status: string;
  priority: number;
  patient: { name: string; phone: string };
  doctor: { name: string };
  preConsultForm: any;
}

export default function AdminPage() {
  const [tab, setTab] = useState<'queue' | 'appointments' | 'patients' | 'forms' | 'messages'>('queue');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (tab === 'queue') {
        const data = await api('/tokens');
        setTokens(data);
      } else if (tab === 'patients') {
        const data = await api('/patients');
        setPatients(data.data || []);
      } else if (tab === 'appointments') {
        const today = new Date().toISOString().split('T')[0];
        const data = await api(`/appointments?date=${today}`);
        setAppointments(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const callNext = async (tokenId: string) => {
    await api(`/queue/${tokenId}/next`, { method: 'PATCH' });
    loadData();
  };

  const completePatient = async (tokenId: string) => {
    await api(`/queue/${tokenId}/complete`, { method: 'PATCH' });
    loadData();
  };

  const tabs = [
    { key: 'queue', label: '🎫 Queue', icon: '🎫' },
    { key: 'appointments', label: '📅 Appointments', icon: '📅' },
    { key: 'patients', label: '👥 Patients', icon: '👥' },
    { key: 'forms', label: '📝 Forms', icon: '📝' },
    { key: 'messages', label: '💬 Messages', icon: '💬' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-gray-600 text-xl">🏠</Link>
          <div>
            <h1 className="text-xl font-bold">👩‍💼 Admin Dashboard</h1>
            <p className="text-gray-500 text-sm">Sai Ram Fertility & Maternity Centre</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b px-6 flex gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-6 max-w-7xl mx-auto">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : tab === 'queue' ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Today&apos;s Queue</h2>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Token</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Pre-Consult</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tokens.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold">{t.tokenNumber}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.patient?.name}</div>
                        <div className="text-xs text-gray-400">{t.patient?.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{t.doctor?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          t.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-700' :
                          t.status === 'COMPLETED' ? 'bg-gray-100 text-gray-500' :
                          t.status === 'WAITING' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>{t.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        {t.preConsultForm ? (
                          <span className="text-green-600 text-xs">✅ Done</span>
                        ) : (
                          <span className="text-orange-500 text-xs">⏳ Pending</span>
                        )}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        {t.status === 'WAITING' && (
                          <button onClick={() => callNext(t.id)} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">Call</button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <button onClick={() => completePatient(t.id)} className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">Complete</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tokens.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No tokens for today</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'patients' ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">All Patients</h2>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Gender</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Language</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Registered</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {patients.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-sm">{p.phone}</td>
                      <td className="px-4 py-3 text-sm">{p.gender}</td>
                      <td className="px-4 py-3 text-sm">{p.language}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'appointments' ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Today&apos;s Appointments</h2>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Doctor</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {appointments.map((a: any) => (
                    <tr key={a.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono">{a.timeSlot}</td>
                      <td className="px-4 py-3 font-medium">{a.patient?.name}</td>
                      <td className="px-4 py-3 text-sm">{a.doctor?.name}</td>
                      <td className="px-4 py-3 text-sm">{a.type}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          a.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                          a.status === 'UNCONFIRMED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-500'
                        }`}>{a.status}</span>
                      </td>
                    </tr>
                  ))}
                  {appointments.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No appointments for today</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">Coming soon...</div>
        )}
      </div>
    </div>
  );
}
