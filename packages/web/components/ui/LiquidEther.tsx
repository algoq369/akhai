'use client';

import { useEffect, useRef } from 'react';

interface Blob {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  gradient?: CanvasGradient; // Cache the gradient
}

interface LiquidEtherProps {
  className?: string;
  blobCount?: number;
  speed?: number;
}

export function LiquidEther({
  className = '',
  blobCount = 5,
  speed = 0.5
}: LiquidEtherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blobsRef = useRef<Blob[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Reinitialize blobs on resize
      if (blobsRef.current.length === 0) {
        initBlobs();
      }
    };

    const initBlobs = () => {
      blobsRef.current = [];
      for (let i = 0; i < blobCount; i++) {
        blobsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 200 + 150,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          opacity: Math.random() * 0.15 + 0.05
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    // Animation loop
    let animationFrame: number;

    const animate = () => {
      // Fade effect instead of clear for smooth trails
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      blobsRef.current.forEach((blob) => {
        // Update position
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce off edges
        if (blob.x < -blob.radius || blob.x > canvas.width + blob.radius) {
          blob.vx *= -1;
        }
        if (blob.y < -blob.radius || blob.y > canvas.height + blob.radius) {
          blob.vy *= -1;
        }

        // Keep within bounds
        blob.x = Math.max(-blob.radius, Math.min(canvas.width + blob.radius, blob.x));
        blob.y = Math.max(-blob.radius, Math.min(canvas.height + blob.radius, blob.y));

        // Create/cache gradient (grey-only) - only create once
        if (!blob.gradient) {
          const gradient = ctx.createRadialGradient(
            0, 0, 0,
            0, 0, blob.radius
          );

          // Grey gradient with blur effect
          gradient.addColorStop(0, `rgba(120, 120, 120, ${blob.opacity})`);
          gradient.addColorStop(0.5, `rgba(80, 80, 80, ${blob.opacity * 0.5})`);
          gradient.addColorStop(1, 'rgba(40, 40, 40, 0)');

          blob.gradient = gradient;
        }

        // Draw blob with cached gradient
        ctx.save();
        ctx.translate(blob.x, blob.y);
        ctx.beginPath();
        ctx.arc(0, 0, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = blob.gradient;
        ctx.fill();
        ctx.restore();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [blobCount, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{
        background: '#000000',
        pointerEvents: 'none',
        filter: 'blur(20px)' // Reduced from 40px for better performance
      }}
    />
  );
}

export default LiquidEther;
