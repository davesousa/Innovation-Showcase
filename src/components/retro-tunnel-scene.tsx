"use client";

import { type ReactNode, useEffect, useRef } from "react";

type RetroTunnelSceneProps = {
  children?: ReactNode;
  className?: string;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function RetroTunnelScene({
  children,
  className = "",
}: RetroTunnelSceneProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let W = 1;
    let H = 1;

    // Raw mouse position in normalised space (-1 … +1)
    let rawMX = 0;
    let rawMY = 0;

    // Highly inertial smooth vanishing-point offset (normalised -1 … +1)
    let smoothVX = 0;
    let smoothVY = 0;

    let time = 0;

    // ── resize ────────────────────────────────────────────────────────────────
    const resize = () => {
      const r = wrapper.getBoundingClientRect();
      // Render at full resolution for clean, anti-aliased lines
      W = r.width;
      H = r.height;
      
      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.scale(dpr, dpr);
      
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
    };

    // ── mouse ─────────────────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const r = wrapper.getBoundingClientRect();
      rawMX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      rawMY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onMouseLeave = () => {
      rawMX = 0;
      rawMY = 0;
    };

    // ── draw ──────────────────────────────────────────────────────────────────
    const RINGS = 12; // Increased for a deeper feel
    const MARGIN = 20; // Margin for the outermost ring

    const draw = () => {
      time += 0.016;

      // Subtle idle drift
      const idleX = Math.sin(time * 0.3) * 0.015;
      const idleY = Math.cos(time * 0.25) * 0.012;

      // Target vanishing point offset
      const tVX = -rawMX * 0.06 + idleX;
      const tVY = -rawMY * 0.05 + idleY;

      // Smooth interpolation for fluid motion
      smoothVX = lerp(smoothVX, tVX, 0.03);
      smoothVY = lerp(smoothVY, tVY, 0.03);

      // Expose CSS vars for the floating frames in page.tsx
      wrapper.style.setProperty("--tunnel-parallax-a-x", `${smoothVX * -12}px`);
      wrapper.style.setProperty("--tunnel-parallax-a-y", `${smoothVY * -10}px`);
      wrapper.style.setProperty("--tunnel-parallax-b-x", `${smoothVX * 15}px`);
      wrapper.style.setProperty("--tunnel-parallax-b-y", `${smoothVY * 12}px`);
      wrapper.style.setProperty("--tunnel-parallax-c-x", `${smoothVX * -20}px`);
      wrapper.style.setProperty("--tunnel-parallax-c-y", `${smoothVY * 15}px`);

      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(48, 48, 48, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // ── geometry ────────────────────────────────────────────────────────────

      // Outermost ring can be expanded independently of the scene wrapper.
      // This lets breakpoints widen the tunnel without also resizing the image stack.
      const computedStyle = getComputedStyle(wrapper);
      const tunnelScaleX = Number.parseFloat(computedStyle.getPropertyValue("--tunnel-scale-x")) || 1;
      const tunnelScaleY = Number.parseFloat(computedStyle.getPropertyValue("--tunnel-scale-y")) || 1;
      const tunnelW = (W - MARGIN * 2) * tunnelScaleX;
      const tunnelH = (H - MARGIN * 2) * tunnelScaleY;
      const fL = W * 0.5 - tunnelW * 0.5;
      const fT = H * 0.5 - tunnelH * 0.5;
      const fR = W * 0.5 + tunnelW * 0.5;
      const fB = H * 0.5 + tunnelH * 0.5;

      // Vanishing point moves subtly
      const vpX = W * 0.5 + smoothVX * W * 0.1;
      const vpY = H * 0.5 + smoothVY * H * 0.08;

      type Corners = { tlx: number; tly: number; trx: number; try: number; brx: number; bry: number; blx: number; bly: number };
      const rings: Corners[] = [];

      for (let i = 0; i < RINGS; i++) {
        const t = i / (RINGS - 1);
        
        if (t === 0) {
          rings.push({ tlx: fL, tly: fT, trx: fR, try: fT, brx: fR, bry: fB, blx: fL, bly: fB });
        } else {
          const d = Math.pow(t, 1.6); // Depth curve
          const scale = 1 - t * 0.9; // Inner rings are smaller
          
          const rW = (fR - fL) * scale;
          const rH = (fB - fT) * scale;
          
          const cx = lerp(W * 0.5, vpX, d);
          const cy = lerp(H * 0.5, vpY, d);

          rings.push({
            tlx: cx - rW * 0.5, tly: cy - rH * 0.5,
            trx: cx + rW * 0.5, try: cy - rH * 0.5,
            brx: cx + rW * 0.5, bry: cy + rH * 0.5,
            blx: cx - rW * 0.5, bly: cy + rH * 0.5,
          });
        }
      }

      // ── render ──────────────────────────────────────────────────────────────
      
      // Draw corner connectors first (so they are behind rings)
      ctx.beginPath();
      for (let i = 0; i < rings.length - 1; i++) {
        const a = rings[i];
        const b = rings[i + 1];
        
        ctx.moveTo(a.tlx, a.tly); ctx.lineTo(b.tlx, b.tly);
        ctx.moveTo(a.trx, a.try); ctx.lineTo(b.trx, b.try);
        ctx.moveTo(a.brx, a.bry); ctx.lineTo(b.brx, b.bry);
        ctx.moveTo(a.blx, a.bly); ctx.lineTo(b.blx, b.bly);
      }
      ctx.stroke();

      // Draw rings
      for (const r of rings) {
        ctx.beginPath();
        ctx.moveTo(r.tlx, r.tly);
        ctx.lineTo(r.trx, r.try);
        ctx.lineTo(r.brx, r.bry);
        ctx.lineTo(r.blx, r.bly);
        ctx.closePath();
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);
    resize();

    window.addEventListener("mousemove", onMouseMove);
    wrapper.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove);
      wrapper.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={`relative overflow-visible ${className}`}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full opacity-60"
        aria-hidden="true"
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
