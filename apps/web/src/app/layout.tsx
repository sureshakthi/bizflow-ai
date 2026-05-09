import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BizFlow AI - Sai Ram Clinic',
  description: 'Clinic Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
