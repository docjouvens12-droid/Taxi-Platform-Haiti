import { ImageResponse } from 'next/og'

export const size = { width: 1024, height: 1024 }
export const contentType = 'image/png'

export default function Icon() {
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
          borderRadius: 220,
          background: 'linear-gradient(145deg,#22c47b 0%,#0c9b61 48%,#05633f 100%)',
          color: 'white',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(circle at 26% 12%,rgba(255,255,255,.18),transparent 34%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 190,
            top: 300,
            fontSize: 500,
            fontWeight: 900,
            lineHeight: 0.72,
            letterSpacing: -70,
            color: '#fff',
            transform: 'scaleX(1.08)',
          }}
        >
          M
        </div>
        <div
          style={{
            position: 'absolute',
            width: 188,
            height: 226,
            borderRadius: '98px 98px 98px 0',
            background: 'linear-gradient(180deg,#9af4ad 0%,#57df83 100%)',
            transform: 'rotate(-45deg)',
            top: 150,
            right: 168,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 18px 34px rgba(0,55,38,.26)',
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 999,
              background: '#0a8b5b',
              transform: 'rotate(45deg)',
            }}
          />
        </div>
      </div>
    ),
    size,
  )
}
