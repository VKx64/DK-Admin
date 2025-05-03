"use client";

import { usePathname } from 'next/navigation';
import SideNavigation from '@/components/v1/SideNavigation';

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const showSideNav = pathname !== '/authentication';

  return (
    <>
      {showSideNav && <SideNavigation />}
      {children}
    </>
  );
}
