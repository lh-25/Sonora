import type { Metadata } from 'next';
import '@salt-ds/theme/index.css';
import Providers from '@/components/Providers';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Sonora',
  description: 'Discover, share, and connect through music.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
