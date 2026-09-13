import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 40,
          background: 'linear-gradient(145deg,#22c47b 0%,#0c9b61 48%,#05633f 100%)',
          color: 'white',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 26% 12%,rgba(255,255,255,.18),transparent 34%)' }} />
        <div
          style={{
            position: 'absolute',
            left: 31,
            top: 54,
            fontSize: 89,
            fontWeight: 900,
            lineHeight: 0.72,
            letterSpacing: -12,
            color: '#fff',
            transform: 'scaleX(1.08)',
          }}
        >
          M
        </div>
        <div
          style={{
            position: 'absolute',
            width: 34,
            height: 41,
            borderRadius: '18px 18px 18px 0',
            background: 'linear-gradient(180deg,#9af4ad 0%,#57df83 100%)',
            transform: 'rotate(-45deg)',
            top: 27,
            right: 29,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div style={{ width: 12, height: 12, borderRadius: 999, background: '#0a8b5b', transform: 'rotate(45deg)' }} />
        </div>
      </div>
    ),
    size,
  )
}
