'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Medicine {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  frequency: string;
  duration: number;
  notes?: string;
}

interface Prescription {
  id: string;
  createdAt: string;
  notes?: string;
  doctor: { name: string; specialization: string };
  medicines: Medicine[];
}

export default function PrescriptionsPage() {
  const [patientId, setPatientId] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const search = async () => {
    if (!patientId && !patientPhone) return;
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      let pid = patientId;
      if (!pid && patientPhone) {
        const patient = await api(`/patients/phone/${patientPhone}`);
        pid = patient.id;
      }
      const data = await api(`/prescriptions/patient/${pid}`);
      setPrescriptions(data);
    } catch {
      setError('No prescriptions found or patient not found.');
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a202c' }}>💊 Prescriptions</h1>
          <p style={{ margin: '4px 0 0', color: '#718096', fontSize: 14 }}>View patient prescriptions and medicines</p>
        </div>

        {/* Search */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>Patient Phone</label>
              <input
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                placeholder="e.g. 9876543210"
                value={patientPhone}
                onChange={e => setPatientPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#4a5568', marginBottom: 6 }}>Patient ID</label>
              <input
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                placeholder="Paste patient ID"
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
              />
            </div>
            <button
              onClick={search}
              style={{ padding: '10px 24px', background: '#4299e1', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#718096' }}>Loading...</div>}
        {error && <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: 16, color: '#c53030', marginBottom: 16 }}>{error}</div>}

        {searched && !loading && prescriptions.length === 0 && !error && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#718096', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            No prescriptions found.
          </div>
        )}

        {prescriptions.map(rx => (
          <div key={rx.id} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            {/* Prescription header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a202c' }}>Dr. {rx.doctor?.name}</div>
                <div style={{ fontSize: 13, color: '#718096' }}>{rx.doctor?.specialization}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, color: '#718096' }}>{fmt(rx.createdAt)}</div>
                <div style={{ fontSize: 11, color: '#a0aec0', marginTop: 2 }}>#{rx.id.slice(-8).toUpperCase()}</div>
              </div>
            </div>

            {rx.notes && (
              <div style={{ background: '#f7fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#4a5568' }}>
                📝 {rx.notes}
              </div>
            )}

            {/* Medicines table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#f7fafc' }}>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Medicine</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Dosage</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Timing</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Frequency</th>
                    <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {rx.medicines.map((med, i) => (
                    <tr key={med.id} style={{ background: i % 2 === 0 ? '#fff' : '#f7fafc' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2d3748', borderBottom: '1px solid #edf2f7' }}>{med.name}</td>
                      <td style={{ padding: '10px 12px', color: '#4a5568', borderBottom: '1px solid #edf2f7' }}>{med.dosage}</td>
                      <td style={{ padding: '10px 12px', color: '#4a5568', borderBottom: '1px solid #edf2f7' }}>{med.timing}</td>
                      <td style={{ padding: '10px 12px', color: '#4a5568', borderBottom: '1px solid #edf2f7' }}>{med.frequency}</td>
                      <td style={{ padding: '10px 12px', color: '#4a5568', borderBottom: '1px solid #edf2f7' }}>{med.duration} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
