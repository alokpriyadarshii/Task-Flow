import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '../providers';
import { AppToaster } from '../components/ui/toaster';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'TaskFlow',
  description: 'Full-stack project starter',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-50 antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="from-indigo-500/22 via-fuchsia-500/12 to-cyan-500/18 absolute left-1/2 top-[-18%] h-[620px] w-[980px] -translate-x-1/2 rounded-full bg-gradient-to-r blur-3xl" />
          <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px]" />
        </div>
        <Providers>
          {children}
          <AppToaster />
        </Providers>
      </body>
    </html>
  );
}
