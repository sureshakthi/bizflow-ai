'use client';

import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

interface DoctorQueue {
  doctor: string;
  specialization: string;
  nowServing: string | null;
  waiting: string[];
  completed: number;
}

export default function TvDisplayPage() {
  const [display, setDisplay] = useState<DoctorQueue[]>([]);
  const [time, setTime] = useState(new Date());
  const [announcement, setAnnouncement] = useState('Welcome to Sai Ram Fertility & Maternity Centre!');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    // Fetch initial data
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/queue/tv-display`)
      .then(r => r.json())
      .then(data => setDisplay(data.display || []))
      .catch(() => {});

    // Connect to WebSocket for live updates
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001');
    socket.on('queue-update', (data: any) => {
      setDisplay(data.display || []);
    });

    return () => {
      clearInterval(timer);
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-950 text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">🏥 Sai Ram Fertility & Maternity Centre</h1>
          <p className="text-blue-300 text-sm">15/6 Vidyodaya, T-Nagar, Chennai</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono font-bold">{time.toLocaleTimeString('en-IN')}</div>
          <div className="text-blue-300">{time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Queue Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {display.map((doc, idx) => (
          <div key={idx} className="bg-white/10 backdrop-blur rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-1">{doc.doctor}</h2>
            <p className="text-blue-300 text-sm mb-4">{doc.specialization}</p>

            {/* Now Serving */}
            <div className="bg-green-500/20 border border-green-400 rounded-xl p-4 mb-4 text-center">
              <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Now Serving</p>
              <p className="text-4xl font-bold text-green-400">{doc.nowServing || '---'}</p>
            </div>

            {/* Waiting List */}
            <div>
              <p className="text-blue-300 text-xs uppercase tracking-wide mb-2">Waiting ({doc.waiting.length})</p>
              <div className="flex flex-wrap gap-2">
                {doc.waiting.slice(0, 8).map((token, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${i === 0 ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400' : 'bg-white/10 text-blue-200'}`}>
                    {token}
                  </span>
                ))}
                {doc.waiting.length > 8 && (
                  <span className="px-3 py-1 rounded-full text-sm bg-white/5 text-blue-300">+{doc.waiting.length - 8} more</span>
                )}
              </div>
            </div>

            <div className="mt-4 text-right text-blue-400 text-sm">✅ {doc.completed} completed today</div>
          </div>
        ))}
      </div>

      {/* Announcement Ticker */}
      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-xl px-6 py-3 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="text-yellow-300 font-medium">📢 {announcement}</span>
        </div>
      </div>
    </div>
  );
}
