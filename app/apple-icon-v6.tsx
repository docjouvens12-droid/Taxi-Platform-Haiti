import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIconV6() {
  return new ImageResponse(
    (
      <svg width="180" height="180" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="100" y1="70" x2="900" y2="950" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#44ef72" />
            <stop offset="0.46" stopColor="#10cf72" />
            <stop offset="1" stopColor="#00ad68" />
          </linearGradient>
          <radialGradient id="shine" cx="0" cy="0" r="1" gradientTransform="translate(250 110) rotate(48) scale(610 560)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="mark" x1="240" y1="260" x2="790" y2="790" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#eefef4" />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="1008" height="1008" rx="238" fill="url(#bg)" />
        <rect x="8" y="8" width="1008" height="1008" rx="238" fill="url(#shine)" />
        <path d="M260 724V365c0-39 22-67 55-75 31-8 61 4 82 30l118 146 122-151c21-26 51-37 81-29 34 9 56 37 56 76v362c0 36-29 65-65 65s-65-29-65-65V508l-88 109c-17 21-38 32-61 32s-45-11-62-32l-83-103v210c0 36-29 65-65 65s-65-29-65-65Z" fill="url(#mark)" />
        <path d="M709 208c-73 0-132 59-132 132 0 91 132 222 132 222s132-131 132-222c0-73-59-132-132-132Z" fill="url(#mark)" />
        <circle cx="709" cy="337" r="43" fill="#05b968" />
      </svg>
    ),
    size,
  )
}
