'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard (middleware will handle auth check)
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004B87] mx-auto mb-4"></div>
        <p className="text-[#B5AFA2]">Omdirigerar...</p>
      </div>
    </div>
  );
}
