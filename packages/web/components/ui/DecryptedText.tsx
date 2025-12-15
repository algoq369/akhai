'use client';

import { useEffect, useState } from 'react';

interface DecryptedTextProps {
  text: string;
  className?: string;
  speed?: number;
  autoStart?: boolean;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';

export function DecryptedText({
  text,
  className = '',
  speed = 50,
  autoStart = true,
}: DecryptedTextProps) {
  const [displayText, setDisplayText] = useState(text.split('').map(() => ''));
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (!autoStart) return;

    const decrypt = async () => {
      setIsDecrypting(true);
      const iterations = 8;

      for (let iteration = 0; iteration <= iterations; iteration++) {
        await new Promise((resolve) => setTimeout(resolve, speed));

        setDisplayText((prev) =>
          text.split('').map((char, index) => {
            if (char === ' ') return ' ';

            if (iteration >= iterations) {
              return char;
            }

            if (iteration > index / 2) {
              return char;
            }

            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
        );
      }

      setIsDecrypting(false);
    };

    decrypt();
  }, [text, speed, autoStart]);

  return (
    <span className={`font-mono ${className}`}>
      {displayText.map((char, index) => (
        <span
          key={index}
          className={`inline-block transition-all duration-100 ${
            isDecrypting && char !== ' ' ? 'text-gray-500' : ''
          }`}
        >
          {char || ' '}
        </span>
      ))}
    </span>
  );
}

export function DecryptedTitle({
  text,
  className = '',
  speed = 30,
}: Omit<DecryptedTextProps, 'autoStart'>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <span className={className}>{text}</span>;
  }

  return <DecryptedText text={text} className={className} speed={speed} autoStart />;
}
