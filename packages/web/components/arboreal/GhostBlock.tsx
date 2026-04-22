'use client';

interface GhostBlockProps {
  layerName: string;
  sigil: string;
  color: string;
  x: number;
  y: number;
}

export default function GhostBlock({ layerName, sigil, color, x, y }: GhostBlockProps) {
  return (
    <div
      className="absolute flex items-center justify-center rounded-md border border-dashed"
      style={{
        left: x - 70,
        top: y - 24,
        width: 140,
        height: 48,
        borderColor: `${color}33`,
        color: `${color}55`,
      }}
    >
      <span className="text-[9px] font-mono tracking-wider">
        {sigil} {layerName.toLowerCase()}
      </span>
    </div>
  );
}
