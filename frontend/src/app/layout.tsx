import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrowdShield AI — Intelligent Crowd Risk Intelligence & Planning Platform',
  description:
    'CrowdShield AI is an intelligent crowd risk analysis, venue planning, and emergency management platform.',
  keywords: 'crowd analytics, AI, venue planning, risk assessment, crowd management, safety, emergency planning',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  );
}
