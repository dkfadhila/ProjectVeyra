import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Project Veyra — AI-Native MMORPG',
  description: 'An MMORPG where NPCs remember your story, powered by 0G infrastructure.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-veyra-dark text-white">
        {children}
      </body>
    </html>
  );
}
