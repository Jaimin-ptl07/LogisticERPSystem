import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import ReduxProvider from '@/providers/ReduxProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Logistics ERP System',
  description: 'Complete logistics management solution for modern businesses',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ReduxProvider>
          {children}
        </ReduxProvider>
      </body>
    </html>
  );
}