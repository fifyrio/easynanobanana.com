'use client';

import { useEffect, useRef } from 'react';

type Props = {
  src: string;
  className?: string;
  style?: React.CSSProperties;
};

const FADE_MS = 500;
const FADE_OUT_LEAD = 0.55; // seconds before the end to begin fading out

/**
 * Looping background video with a JS-driven opacity crossfade at each loop
 * boundary (no CSS transitions). Fades resume from the current opacity so
 * rapid toggles stay smooth. Looping is implemented manually via `ended` so
 * the fade-out/fade-in seam is controllable.
 */
export default function FadingVideo({ src, className, style }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let rafId = 0;
    let fadingOut = false;

    const fadeTo = (target: number, duration: number) => {
      cancelAnimationFrame(rafId);
      const start = parseFloat(video.style.opacity || '0');
      const startTime = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        video.style.opacity = String(start + (target - start) * t);
        if (t < 1) rafId = requestAnimationFrame(step);
      };
      rafId = requestAnimationFrame(step);
    };

    const onLoadedData = () => {
      video.style.opacity = '0';
      video.play().catch(() => {});
      fadeTo(1, FADE_MS);
    };

    const onTimeUpdate = () => {
      if (fadingOut) return;
      const remaining = video.duration - video.currentTime;
      if (remaining <= FADE_OUT_LEAD && remaining > 0) {
        fadingOut = true;
        fadeTo(0, FADE_MS);
      }
    };

    const onEnded = () => {
      video.style.opacity = '0';
      setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        fadingOut = false;
        fadeTo(1, FADE_MS);
      }, 100);
    };

    video.addEventListener('loadeddata', onLoadedData);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    if (video.readyState >= 2) onLoadedData();

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('loadeddata', onLoadedData);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className={className}
      style={{ opacity: 0, ...style }}
      autoPlay
      muted
      playsInline
      preload="auto"
    />
  );
}
