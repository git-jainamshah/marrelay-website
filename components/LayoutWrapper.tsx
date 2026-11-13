'use client';

import { usePathname } from 'next/navigation';
import Header from './v3/Header';
import Footer from './v3/Footer';
import RevealInit from './RevealInit';
import PromoBanner from './PromoBanner';
import TrafficInit from './TrafficInit';
import AutoTrack from '@/analytics/AutoTrack';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/site-vc') || pathname?.startsWith('/admin');

  // Admin + version-control dashboard render on their own, untouched.
  if (isAdminRoute) {
    return <>{children}</>;
  }

  // `.v3` scopes the redesigned public-site styles (app/v3.css).
  return (
    <div className="v3">
      <Header />
      <main>
        {children}
      </main>
      <Footer />
      <RevealInit />
      <PromoBanner />
      <TrafficInit />
      <AutoTrack />
    </div>
  );
}
