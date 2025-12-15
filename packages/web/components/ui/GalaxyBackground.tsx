'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speed: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  layer: number; // For parallax depth
}

interface GalaxyBackgroundProps {
  className?: string;
  starCount?: number;
  interactive?: boolean;
}

export function GalaxyBackground({
  className = '',
  starCount = 200,
  interactive = true
}: GalaxyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const starsRef = useRef<Star[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Reinitialize stars on resize
      if (starsRef.current.length === 0) {
        initStars();
      } else {
        // Reposition stars within new bounds
        starsRef.current.forEach(star => {
          if (star.x > newWidth) star.x = Math.random() * newWidth;
          if (star.y > newHeight) star.y = Math.random() * newHeight;
        });
      }
    };

    // Initialize stars with parallax layers
    const initStars = () => {
      starsRef.current = [];
      for (let i = 0; i < starCount; i++) {
        const layer = Math.random(); // 0-1, smaller = closer/faster
        starsRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.6 + 0.4,
          speed: (1 - layer) * 0.5 + 0.1, // Closer stars move faster
          twinkleSpeed: Math.random() * 0.02 + 0.01,
          twinkleOffset: Math.random() * Math.PI * 2,
          layer,
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse/touch interaction
    const handleMouseMove = (e: MouseEvent) => {
      if (interactive) {
        mouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (interactive && e.touches[0]) {
        mouseRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Animation loop
    let animationFrame: number;
    let time = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const mouse = mouseRef.current;

      starsRef.current.forEach((star) => {
        // Continuous drift movement
        star.y += star.speed * 0.3;
        star.x += star.speed * 0.15;

        // Wrap around screen
        if (star.y > canvas.height + 10) {
          star.y = -10;
          star.x = Math.random() * canvas.width;
        }
        if (star.x > canvas.width + 10) {
          star.x = -10;
          star.y = Math.random() * canvas.height;
        }

        // Parallax effect based on mouse position
        let parallaxX = 0;
        let parallaxY = 0;

        if (interactive) {
          const mouseOffsetX = mouse.x - centerX;
          const mouseOffsetY = mouse.y - centerY;
          // Parallax strength based on star layer (closer = more movement)
          const parallaxStrength = (1 - star.layer) * 0.05;
          parallaxX = mouseOffsetX * parallaxStrength;
          parallaxY = mouseOffsetY * parallaxStrength;
        }

        const drawX = star.x + parallaxX;
        const drawY = star.y + parallaxY;

        // Twinkling effect
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
        const finalOpacity = star.opacity * twinkle;

        // Greyscale gradient (white to grey)
        const gradient = ctx.createRadialGradient(
          drawX,
          drawY,
          0,
          drawX,
          drawY,
          star.radius * 2.5
        );

        const brightness = Math.floor(200 + star.radius * 25); // Larger = brighter
        gradient.addColorStop(0, `rgba(${brightness}, ${brightness}, ${brightness}, ${finalOpacity})`);
        gradient.addColorStop(0.5, `rgba(180, 180, 180, ${finalOpacity * 0.5})`);
        gradient.addColorStop(1, `rgba(100, 100, 100, 0)`);

        ctx.beginPath();
        ctx.arc(drawX, drawY, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Add glow for larger stars
        if (star.radius > 1.2) {
          ctx.beginPath();
          ctx.arc(drawX, drawY, star.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${finalOpacity * 0.1})`;
          ctx.fill();
        }
      });

      time += 1;
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [starCount, interactive]);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 -z-10 ${className}`}
      style={{ background: '#000000', pointerEvents: 'none' }}
    />
  );
}
