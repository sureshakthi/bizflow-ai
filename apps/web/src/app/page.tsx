import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">🏥 Sai Ram Fertility & Maternity Centre</h1>
      <p className="text-gray-500 mb-8">BizFlow AI - Clinic Management System</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl w-full">
        <Link href="/register" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition border">
          <h2 className="text-xl font-semibold mb-2">📋 Patient Registration</h2>
          <p className="text-gray-500 text-sm">Web form for new patient registration</p>
        </Link>

        <Link href="/admin" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition border">
          <h2 className="text-xl font-semibold mb-2">👩‍💼 Admin Dashboard</h2>
          <p className="text-gray-500 text-sm">Queue, appointments, patients, forms</p>
        </Link>

        <Link href="/doctor" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition border">
          <h2 className="text-xl font-semibold mb-2">👨‍⚕️ Doctor View</h2>
          <p className="text-gray-500 text-sm">Patient queue and consultation</p>
        </Link>

        <Link href="/tv" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition border">
          <h2 className="text-xl font-semibold mb-2">📺 TV Display</h2>
          <p className="text-gray-500 text-sm">Queue status for waiting area</p>
        </Link>

        <Link href="/preconsult" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition border">
          <h2 className="text-xl font-semibold mb-2">📝 Pre-Consult Form</h2>
          <p className="text-gray-500 text-sm">Patient fills before consultation</p>
        </Link>

        <Link href="/queue-status" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition border">
          <h2 className="text-xl font-semibold mb-2">🎫 Queue Status</h2>
          <p className="text-gray-500 text-sm">Check your token position</p>
        </Link>

        <Link href="/ocr" className="block p-6 bg-white rounded-xl shadow hover:shadow-md transition border border-purple-200 bg-purple-50">
          <h2 className="text-xl font-semibold mb-2">📄 Paper Form OCR</h2>
          <p className="text-gray-500 text-sm">Scan physical forms, prescriptions, lab reports</p>
        </Link>
      </div>

      <p className="mt-8 text-xs text-gray-400">15/6 Vidyodaya, T-Nagar, Chennai</p>
    </div>
  );
}
