import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/common/Footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Nano Banana - AI Image Editor',
  description: 'Generate and edit images with the power of AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}