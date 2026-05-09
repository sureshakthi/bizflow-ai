'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function PreconsultPage() {
  const [tokenNumber, setTokenNumber] = useState('');
  const [step, setStep] = useState<'token' | 'form' | 'done'>('token');
  const [tokenData, setTokenData] = useState<any>(null);
  const [form, setForm] = useState({
    visitType: '', maritalStatus: '', spouseName: '',
    lmpDate: '', pregnancyHistory: '', allergies: '', currentMedications: '',
  });
  const [error, setError] = useState('');

  const lookupToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const token = await api(`/tokens/by-number/${tokenNumber}`);
      setTokenData(token);
      setStep('form');
    } catch {
      setError('Token not found');
    }
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api(`/preconsult/${tokenData.id}`, {
        method: 'POST',
        body: JSON.stringify({ ...form, questionsAnswered: 7 }),
      });
      setStep('done');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Form Submitted!</h2>
          <p className="text-gray-500">Thank you, {tokenData?.patient?.name}. The doctor will review your information.</p>
        </div>
      </div>
    );
  }

  if (step === 'token') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={lookupToken} className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-1">📝 Pre-Consult Form</h1>
          <p className="text-gray-500 text-sm mb-6">Enter your token number to fill the form</p>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}
          <input value={tokenNumber} onChange={e => setTokenNumber(e.target.value.toUpperCase())}
            placeholder="e.g. GYN-001" className="w-full border rounded-lg px-4 py-3 font-mono text-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700">Continue</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submitForm} className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-xl font-bold mb-1">📝 Pre-Consult Form</h1>
        <p className="text-gray-500 text-sm mb-6">Patient: {tokenData?.patient?.name} | Token: {tokenData?.tokenNumber}</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">1. Visit Type *</label>
            <select required value={form.visitType} onChange={e => setForm(f => ({ ...f, visitType: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Select</option>
              <option value="FIRST_VISIT">First Visit</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="TEST_SCAN_ONLY">Test/Scan Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">2. Marital Status *</label>
            <select required value={form.maritalStatus} onChange={e => setForm(f => ({ ...f, maritalStatus: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="">Select</option>
              <option value="SINGLE">Single</option>
              <option value="MARRIED">Married</option>
            </select>
          </div>

          {form.maritalStatus === 'MARRIED' && (
            <div>
              <label className="block text-sm font-medium mb-1">3. Spouse Name</label>
              <input value={form.spouseName} onChange={e => setForm(f => ({ ...f, spouseName: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">4. Last Menstrual Period (LMP)</label>
            <input type="date" value={form.lmpDate} onChange={e => setForm(f => ({ ...f, lmpDate: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">5. Pregnancy History</label>
            <textarea value={form.pregnancyHistory} onChange={e => setForm(f => ({ ...f, pregnancyHistory: e.target.value }))}
              placeholder="e.g. G2P1L1" rows={2}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">6. Known Allergies</label>
            <input value={form.allergies} onChange={e => setForm(f => ({ ...f, allergies: e.target.value }))}
              placeholder="e.g. Penicillin, or None"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">7. Current Medications</label>
            <input value={form.currentMedications} onChange={e => setForm(f => ({ ...f, currentMedications: e.target.value }))}
              placeholder="e.g. Folic acid 5mg daily"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <button type="submit" className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition">
          Submit Pre-Consult Form
        </button>
      </form>
    </div>
  );
}
