'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LandingSearch() {
  const router = useRouter();
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to sign-up with the URL as a query param
    const encodedUrl = encodeURIComponent(url);
    router.push(url ? `/sign-up?url=${encodedUrl}` : '/sign-up');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-10xl mx-auto mt-8">
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste a LeetCode problem URL..."
          className="flex-1 px-4 py-3 bg-white border-[#9e9e9e] border-3 rounded-lg text-[#1A1A1A] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#1A1A1A] transition-colors"
          style={{ fontFamily: 'var(--font-jost)' }}
        />
        <button
          type="submit"
          className="px-6 py-3 bg-[#000000] text-white font-medium hover:bg-[#333] transition-colors rounded-sm whitespace-nowrap"
          style={{ fontFamily: 'var(--font-jost)' }}
        >
          Start Tracking
        </button>
      </div>
    </form>
  );
}
