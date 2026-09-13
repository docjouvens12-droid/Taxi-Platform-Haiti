import type { ReactNode } from 'react'
import DriverMapMarkerPriorityFix from '../../../components/DriverMapMarkerPriorityFix'
import DriverLiveLocationSync from '../../../components/DriverLiveLocationSync'
import './driver-dashboard-v2.css'
import './driver-menu-stability.css'
import './driver-map-polish.css'
import './driver-close-route.css'

export default function DriverDashboardV2Layout({ children }: { children: ReactNode }) {
  return <><DriverMapMarkerPriorityFix/><DriverLiveLocationSync/>{children}</>
}
