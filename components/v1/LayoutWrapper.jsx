"use client";

import { usePathname } from 'next/navigation';
import SideNavigation from '@/components/v1/SideNavigation';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const showSideNav = pathname !== '/authentication';

  return (
    <div className="flex w-full h-full">
      {showSideNav && <SideNavigation />}
      <main className={`flex-1 ${showSideNav ? 'ml-[16.666667%]' : ''} overflow-auto h-screen`}>
        {children}
      </main>
    </div>
  );
}
