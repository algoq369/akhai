'use client'

export function FibonacciBackground() {
  const positions = [
    { x: '5%', y: '10%', size: 'text-[200px]', opacity: 0.04, num: 1 },
    { x: '90%', y: '15%', size: 'text-[150px]', opacity: 0.05, num: 1 },
    { x: '3%', y: '45%', size: 'text-[250px]', opacity: 0.035, num: 2 },
    { x: '95%', y: '50%', size: 'text-[120px]', opacity: 0.05, num: 3 },
    { x: '8%', y: '80%', size: 'text-[180px]', opacity: 0.04, num: 5 },
    { x: '88%', y: '85%', size: 'text-[140px]', opacity: 0.045, num: 8 },
    { x: '50%', y: '3%', size: 'text-[100px]', opacity: 0.06, num: 13 },
    { x: '50%', y: '97%', size: 'text-[80px]', opacity: 0.05, num: 21 },
    { x: '20%', y: '28%', size: 'text-[70px]', opacity: 0.04, num: 34 },
    { x: '80%', y: '35%', size: 'text-[60px]', opacity: 0.045, num: 55 },
    { x: '25%', y: '65%', size: 'text-[50px]', opacity: 0.05, num: 89 },
    { x: '75%', y: '70%', size: 'text-[45px]', opacity: 0.04, num: 144 },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Fibonacci Numbers */}
      {positions.map((pos, i) => (
        <span
          key={i}
          className={`absolute font-mono font-thin ${pos.size} select-none`}
          style={{
            left: pos.x,
            top: pos.y,
            opacity: pos.opacity,
            color: '#525252',
            transform: 'translate(-50%, -50%)',
          }}
        >
          {pos.num}
        </span>
      ))}

      {/* Golden Spiral SVG - More visible */}
      <svg
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]"
        viewBox="0 0 600 600"
        fill="none"
        style={{ opacity: 0.06 }}
      >
        <path
          d="M 300 300
             A 1 1 0 0 1 301 299
             A 2 2 0 0 1 303 301
             A 3 3 0 0 1 300 304
             A 5 5 0 0 1 295 299
             A 8 8 0 0 1 303 291
             A 13 13 0 0 1 316 304
             A 21 21 0 0 1 295 325
             A 34 34 0 0 1 261 291
             A 55 55 0 0 1 316 236
             A 89 89 0 0 1 405 325
             A 144 144 0 0 1 261 469
             A 233 233 0 0 1 28 236"
          stroke="#525252"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Fibonacci Rectangles */}
        <rect x="295" y="295" width="13" height="13" stroke="#525252" strokeWidth="0.8" fill="none" />
        <rect x="282" y="282" width="34" height="34" stroke="#525252" strokeWidth="0.8" fill="none" />
        <rect x="248" y="248" width="89" height="89" stroke="#525252" strokeWidth="0.8" fill="none" />
        <rect x="159" y="159" width="233" height="233" stroke="#525252" strokeWidth="0.8" fill="none" />
      </svg>

      {/* Golden Ratio Lines */}
      <div className="absolute inset-0" style={{
        background: `
          linear-gradient(90deg, transparent 38.2%, rgba(82,82,82,0.03) 38.2%, rgba(82,82,82,0.03) 38.4%, transparent 38.4%),
          linear-gradient(90deg, transparent 61.8%, rgba(82,82,82,0.03) 61.8%, rgba(82,82,82,0.03) 62%, transparent 62%),
          linear-gradient(0deg, transparent 38.2%, rgba(82,82,82,0.02) 38.2%, rgba(82,82,82,0.02) 38.4%, transparent 38.4%),
          linear-gradient(0deg, transparent 61.8%, rgba(82,82,82,0.02) 61.8%, rgba(82,82,82,0.02) 62%, transparent 62%)
        `
      }} />
    </div>
  )
}
