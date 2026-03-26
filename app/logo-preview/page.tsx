export default function LogoPreview() {
  const concepts = [
    {
      label: 'A — Continuous Color Wheel + CW Side by Side',
      desc: 'Full spectrum ring with smooth color transitions. "CW" sits side by side in the center — C in Duke blue, W in orange.',
      src: '/logos/v3-wheel-a.svg',
    },
    {
      label: 'B — Thin Wheel Ring + Bold CW',
      desc: 'Thinner, more refined wheel ring. Larger bold "CW" centered inside — feels like a badge or app icon.',
      src: '/logos/v3-wheel-b.svg',
    },
    {
      label: 'C — Segmented Wheel + Stacked CW',
      desc: 'Modern segmented wheel with visible gaps between each color (like an app icon). C stacked on top, W below — cleaner separation.',
      src: '/logos/v3-wheel-c.svg',
    },
  ]

  return (
    <div style={{ padding: '60px 40px', fontFamily: 'Helvetica Neue, Arial, sans-serif', background: '#f5f5f5', minHeight: '100vh', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px', color: '#222', fontWeight: 300 }}>
        Logo Concepts — Color Wheel Direction
      </h1>
      <p style={{ fontSize: '14px', color: '#999', marginBottom: '50px' }}>
        Full color wheel with CW monogram in the center.
      </p>

      {concepts.map((c, i) => (
        <div key={i}>
          {/* White background */}
          <div style={{
            background: '#ffffff',
            padding: '48px 56px',
            borderRadius: '14px',
            marginBottom: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}>
            <p style={{
              fontSize: '11px',
              color: '#aaa',
              marginBottom: '28px',
              fontWeight: 600,
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
            }}>
              {c.label}
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt={c.label} style={{ height: '110px', display: 'block' }} />
            <p style={{ color: '#999', marginTop: '20px', fontSize: '13px', lineHeight: 1.6 }}>
              {c.desc}
            </p>
          </div>

          {/* Dark background */}
          <div style={{
            background: '#0a0a0a',
            padding: '48px 56px',
            borderRadius: '14px',
            marginBottom: '48px',
          }}>
            <p style={{
              fontSize: '10px',
              color: '#444',
              marginBottom: '20px',
              fontWeight: 500,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              on dark
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.src} alt={`${c.label} dark`} style={{ height: '110px', display: 'block', filter: 'brightness(1.5)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
