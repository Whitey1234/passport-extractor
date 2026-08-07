"use client";

import { useCallback, useEffect, useRef } from "react";

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useStampSound() {
  const ctxRef = useRef(null);

  useEffect(() => {
    return () => {
      ctxRef.current?.close?.();
    };
  }, []);

  const play = useCallback(() => {
    // Sound is off for anyone who has reduced motion enabled, and is only ever
    // triggered from an explicit user action (never on page load).
    if (prefersReducedMotion()) return;
    if (typeof window === "undefined") return;

    const AudioCtor =
      window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return;

    if (!ctxRef.current) {
      ctxRef.current = new AudioCtor();
    }
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.06);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.05, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }, []);

  return { play };
}