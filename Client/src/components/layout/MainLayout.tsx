
import type { ReactNode } from 'react';
import Navbar from './Navbar';

type MainLayoutProps = {
  children: ReactNode;
};

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="bg-card border-t border-border py-8 text-center">
        <p className="text-sm text-muted-foreground">Midnight Musings &copy; {new Date().getFullYear()}</p>
        <p className="text-xs text-muted-foreground/70 mt-1">Crafted with care in the twilight hours.</p>
      </footer>
    </div>
  );
}
