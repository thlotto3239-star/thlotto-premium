import React from 'react';
import BottomNav from './BottomNav';

/**
 * PageWrapper — shared layout shell for all protected pages.
 *
 * Usage:
 *   <PageWrapper>
 *     <AppHeader />
 *     <main className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-4 flex-1">
 *       ...content...
 *     </main>
 *   </PageWrapper>
 *
 * Features:
 *  - Consistent bg-[#f8fafc] background across all pages
 *  - pb-24 lg:pb-12 spacing so content clears the mobile bottom nav
 *  - <BottomNav> injected automatically (hidden on lg+ via its own className)
 *  - antialiased text rendering
 */
const PageWrapper = ({ children, className = '' }) => {
  return (
    <div
      className={`min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col pb-24 lg:pb-8 antialiased selection:bg-brand-600 selection:text-white ${className}`}
    >
      {children}
      <BottomNav />
    </div>
  );
};

export default PageWrapper;
