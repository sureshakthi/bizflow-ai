'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', phone: '', dob: '', gender: 'FEMALE', language: 'TAMIL',
    bloodGroup: '', address: '', emergencyContact: '', email: '', referredBy: '',
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/patients', {
        method: 'POST',
        body: JSON.stringify({ ...form, registrationSource: 'WEB_FORM' }),
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-4">Welcome, {result.name}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-left text-sm">
            <p><strong>Patient ID:</strong> {result.id}</p>
            <p><strong>Phone:</strong> {result.phone}</p>
          </div>
          <p className="mt-4 text-sm text-gray-400">You can now book appointments via WhatsApp!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-1">🏥 Patient Registration</h1>
        <p className="text-gray-500 text-sm mb-6">Sai Ram Fertility & Maternity Centre</p>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name *</label>
            <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <input required pattern="[6-9]\d{9}" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="9876543210" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date of Birth *</label>
              <input required type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Gender *</label>
              <select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <select value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option value="TAMIL">தமிழ் (Tamil)</option>
                <option value="ENGLISH">English</option>
                <option value="HINDI">Hindi</option>
                <option value="TELUGU">Telugu</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Blood Group</label>
              <input value={form.bloodGroup} onChange={e => setForm(f => ({ ...f, bloodGroup: e.target.value }))}
                placeholder="e.g. B+" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Emergency Contact</label>
            <input value={form.emergencyContact} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Referred By</label>
            <input value={form.referredBy} onChange={e => setForm(f => ({ ...f, referredBy: e.target.value }))}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition">
          {loading ? 'Registering...' : 'Register Patient'}
        </button>
      </form>
    </div>
  );
}
