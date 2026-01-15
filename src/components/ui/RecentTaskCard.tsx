'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface RecentTaskCardProps {
  timestamp: Date;
  prompt: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number; // 0-100
  imageUrl?: string;
  onViewAll?: () => void;
}

export default function RecentTaskCard({
  timestamp,
  prompt,
  status,
  progress = 0,
  imageUrl,
  onViewAll,
}: RecentTaskCardProps) {
  const [displayProgress, setDisplayProgress] = useState(progress);

  // Simulate progress animation when generating
  useEffect(() => {
    if (status === 'generating' && progress === 0) {
      // Mock progress animation
      const interval = setInterval(() => {
        setDisplayProgress((prev) => {
          if (prev >= 95) {
            return prev; // Stop at 95% until actual completion
          }
          // Slow down as we approach 95%
          const increment = Math.max(1, Math.floor((95 - prev) / 10));
          return Math.min(95, prev + increment);
        });
      }, 3000);

      return () => clearInterval(interval);
    } else if (status === 'completed') {
      setDisplayProgress(100);
    } else {
      setDisplayProgress(progress);
    }
  }, [status, progress]);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="rounded-[28px] border border-[#FFE7A1] bg-white shadow-[0_25px_70px_rgba(247,201,72,0.2)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#FFE7A1]/50 bg-gradient-to-r from-[#FFF9E6] to-white">
        <h3 className="text-xl font-semibold text-slate-900">Recent Tasks</h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="flex items-center gap-1.5 text-sm font-medium text-[#C69312] hover:text-[#8C6A00] transition"
          >
            View All
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Task Item */}
      <div className="p-6">
        <div className="rounded-2xl border border-[#FFE7A1]/70 bg-[#FFFBF0] overflow-hidden">
          {/* Progress bar at top */}
          {status === 'generating' && (
            <div className="h-1 bg-[#FFE7A1]/30">
              <div
                className="h-full bg-gradient-to-r from-[#FFD84D] to-[#F0A202] transition-all duration-1000 ease-out"
                style={{ width: `${displayProgress}%` }}
              />
            </div>
          )}

          <div className="p-5">
            {/* Date and Status */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">{formatDate(timestamp)}</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  status === 'generating'
                    ? 'bg-[#FFF3B2] text-[#8C6A00]'
                    : status === 'completed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    status === 'generating'
                      ? 'bg-[#C69312] animate-pulse'
                      : status === 'completed'
                      ? 'bg-green-500'
                      : 'bg-red-500'
                  }`}
                />
                {status === 'generating' ? 'Generating...' : status === 'completed' ? 'Completed' : 'Failed'}
              </span>
            </div>

            {/* Prompt */}
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FFF3B2] border border-[#FFE7A1] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 text-[#C69312]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">&quot;{prompt}&quot;</p>
            </div>

            {/* Image Preview */}
            <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-[#FFE7A1] bg-[#FFF9E6]">
              {status === 'completed' && imageUrl ? (
                <Image
                  src={imageUrl}
                  alt="Generated result"
                  fill
                  sizes="192px"
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <>
                  {/* Placeholder with loading spinner */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {/* Spinner */}
                    <div className="w-10 h-10 rounded-full border-3 border-[#FFE7A1]/30 border-t-[#C69312] animate-spin" />
                  </div>

                  {/* Progress badge */}
                  {status === 'generating' && (
                    <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C69312] text-white text-xs font-semibold shadow-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {displayProgress}%
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
