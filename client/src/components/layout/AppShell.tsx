import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
};

export default AppShell;
