'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface LabTestValue {
  id: string;
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  isAbnormal: boolean;
}

interface LabReport {
  id: string;
  testName: string;
  status: string;
  orderedAt: string;
  readyAt?: string;
  doctor: { name: string; specialization: string };
  testValues: LabTestValue[];
}

export default function LabReportsPage() {
  const [patientId, setPatientId] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reports, setReports] = useState<LabReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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
      const data = await api(`/lab-reports/patient/${pid}`);
      setReports(data);
    } catch {
      setError('No lab reports found or patient not found.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const statusColor = (status: string) =>
    status === 'READY' ? { bg: '#f0fff4', text: '#276749', border: '#9ae6b4' } : { bg: '#fffaf0', text: '#7b341e', border: '#fbd38d' };

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', padding: '24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a202c' }}>🧪 Lab Reports</h1>
          <p style={{ margin: '4px 0 0', color: '#718096', fontSize: 14 }}>View patient lab test results</p>
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
              style={{ padding: '10px 24px', background: '#48bb78', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
            >
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#718096' }}>Loading...</div>}
        {error && <div style={{ background: '#fff5f5', border: '1px solid #feb2b2', borderRadius: 8, padding: 16, color: '#c53030', marginBottom: 16 }}>{error}</div>}

        {searched && !loading && reports.length === 0 && !error && (
          <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#718096', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            No lab reports found.
          </div>
        )}

        {reports.map(report => {
          const sc = statusColor(report.status);
          const isOpen = expanded === report.id;
          return (
            <div key={report.id} style={{ background: '#fff', borderRadius: 12, marginBottom: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              {/* Report header */}
              <div
                style={{ padding: '16px 24px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setExpanded(isOpen ? null : report.id)}
              >
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a202c' }}>{report.testName}</div>
                  <div style={{ fontSize: 13, color: '#718096', marginTop: 2 }}>
                    Ordered by Dr. {report.doctor?.name} · {fmt(report.orderedAt)}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 20, padding: '3px 12px', fontSize: 13, fontWeight: 600 }}>
                    {report.status === 'READY' ? '✅ Ready' : '⏳ Ordered'}
                  </span>
                  <span style={{ fontSize: 18, color: '#a0aec0' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Test values */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #edf2f7', padding: '0 0 16px' }}>
                  {report.readyAt && (
                    <div style={{ padding: '10px 24px', fontSize: 13, color: '#718096' }}>
                      Results ready: {fmt(report.readyAt)}
                    </div>
                  )}
                  {report.testValues && report.testValues.length > 0 ? (
                    <div style={{ overflowX: 'auto', padding: '0 24px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: '#f7fafc' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Parameter</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Value</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Unit</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Normal Range</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', color: '#4a5568', fontWeight: 600, borderBottom: '1px solid #e2e8f0' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.testValues.map((tv, i) => (
                            <tr key={tv.id} style={{ background: tv.isAbnormal ? '#fff5f5' : i % 2 === 0 ? '#fff' : '#f7fafc' }}>
                              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#2d3748', borderBottom: '1px solid #edf2f7' }}>{tv.parameter}</td>
                              <td style={{ padding: '10px 12px', color: tv.isAbnormal ? '#c53030' : '#2d3748', fontWeight: tv.isAbnormal ? 700 : 400, borderBottom: '1px solid #edf2f7' }}>{tv.value}</td>
                              <td style={{ padding: '10px 12px', color: '#4a5568', borderBottom: '1px solid #edf2f7' }}>{tv.unit}</td>
                              <td style={{ padding: '10px 12px', color: '#718096', borderBottom: '1px solid #edf2f7' }}>{tv.normalRange}</td>
                              <td style={{ padding: '10px 12px', borderBottom: '1px solid #edf2f7' }}>
                                {tv.isAbnormal ? (
                                  <span style={{ color: '#c53030', fontWeight: 600 }}>⚠️ Abnormal</span>
                                ) : (
                                  <span style={{ color: '#276749' }}>✅ Normal</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '20px 24px', color: '#a0aec0', fontSize: 14 }}>
                      No test values recorded yet.
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
