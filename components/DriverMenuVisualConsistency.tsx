'use client'

import { useEffect } from 'react'

export default function DriverMenuVisualConsistency() {
  useEffect(() => {
    if (location.pathname !== '/driver/dashboard') return

    const styleId = 'driver-menu-visual-consistency'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @media (max-width: 600px) {
          .menuBackdrop {
            align-items:flex-start !important;
          }
          .drawer {
            width:min(62vw, 255px) !important;
            height:auto !important;
            min-height:0 !important;
            max-height:calc(100dvh - 18px) !important;
            overflow-y:auto !important;
            border-bottom-right-radius:24px !important;
            padding-bottom:18px !important;
          }
        }
        .drawer .menuSection {
          border-bottom:1px solid #e7ecef !important;
        }
        .drawer .menuSection > h3 {
          font-size:15px !important;
          font-weight:800 !important;
          line-height:1.3 !important;
          color:#0f6f59 !important;
          letter-spacing:0 !important;
          text-transform:none !important;
          margin:0 !important;
          padding:7px 0 !important;
        }
        .drawer .menuSection > h3 > span[aria-hidden="true"] {
          font-size:21px !important;
          line-height:1 !important;
          color:#0f6f59 !important;
          font-weight:700 !important;
        }
        .drawer .menuSection p {
          font-size:13px !important;
          line-height:1.35 !important;
          margin:9px 0 !important;
        }
        .drawer .menuSection p > span {
          color:#7a8998 !important;
          font-weight:500 !important;
        }
        .drawer .menuSection p > b {
          color:#102033 !important;
          font-weight:750 !important;
        }
        .drawer .menuSection small {
          color:#688074;
        }
        .drawer .langButtons button {
          font-size:13px !important;
          font-weight:800 !important;
          color:#354657;
        }
        .drawer .langButtons button.active {
          color:#0f6f59 !important;
        }
      `
      document.head.appendChild(style)
    }

    const normalize = () => {
      const drawer = document.querySelector('.drawer') as HTMLElement | null
      if (!drawer) return

      drawer.querySelectorAll<HTMLElement>('.menuSection > h3').forEach((title) => {
        const arrows = Array.from(title.querySelectorAll<HTMLElement>(':scope > span[aria-hidden="true"]'))
        arrows.slice(1).forEach((arrow) => arrow.remove())
      })
    }

    normalize()
    const observer = new MutationObserver(normalize)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])

  return null
}
