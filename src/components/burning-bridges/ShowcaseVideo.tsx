'use client';

import { useEffect, useRef, useState } from 'react';

export default function ShowcaseVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const hovering = useRef(false);
  const [enhanced, setEnhanced] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => setEnhanced(true), []);

  return (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-xl bg-amber-100"
      onPointerEnter={(event) => {
        if (event.pointerType !== 'mouse') return;
        hovering.current = true;
        void video.current?.play().then(() => {
          if (!hovering.current) {
            video.current?.pause();
            setStarted(false);
          }
        }).catch(() => {});
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== 'mouse') return;
        hovering.current = false;
        video.current?.pause();
        setStarted(false);
      }}>
      <video ref={video} src={src} poster={poster} controls={!enhanced || started} muted playsInline loop preload="none"
        aria-label={label} onPlay={() => setStarted(true)} className="absolute inset-0 h-full w-full object-cover" />
      {!started && <>
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/70 to-transparent" />
        <p className="pointer-events-none absolute inset-x-0 bottom-0 p-4 text-sm font-semibold leading-5 text-white">{label}</p>
      </>}
      {enhanced && !started && <button type="button" aria-label={label}
        className="absolute inset-0 rounded-xl focus-visible:outline focus-visible:outline-4 focus-visible:outline-amber-500 focus-visible:outline-offset-2"
        onClick={() => { void video.current?.play().catch(() => setStarted(true)); }}>
        <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition group-hover:bg-black/50">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
        </span>
      </button>}
    </div>
  );
}
