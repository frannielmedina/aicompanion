import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Companion — VTuber',
  description: 'AI-powered VTuber companion with LLM and TTS integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-dark-900 text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
