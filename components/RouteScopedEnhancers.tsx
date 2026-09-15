'use client'

import { usePathname } from 'next/navigation'
import PassengerStableAvatarUpload from './PassengerStableAvatarUpload'
import PassengerProfileDetails from './PassengerProfileDetails'
import PassengerTripsStableInline from './PassengerTripsStableInline'
import PassengerPaymentStableInline from './PassengerPaymentStableInline'
import PassengerLanguageSwitchStable from './PassengerLanguageSwitchStable'
import PassengerHelpStableInline from './PassengerHelpStableInline'
import PassengerLogoutStable from './PassengerLogoutStable'
import PassengerMenuPolish from './PassengerMenuPolish'
import PassengerMenuCompactPolish from './PassengerMenuCompactPolish'
import PassengerMenuFinalConsistency from './PassengerMenuFinalConsistency'
import PassengerMenuIconDedupPolish from './PassengerMenuIconDedupPolish'
import PassengerRideHistoryMenuPolish from './PassengerRideHistoryMenuPolish'
import PassengerMenuVisibilityFix from './PassengerMenuVisibilityFix'
import PassengerDashboardPaymentPanel from './PassengerDashboardPaymentPanel'
import PassengerAcceptedRideMiniMap from './PassengerAcceptedRideMiniMap'
import PassengerMiniMapMetricsNarrow from './PassengerMiniMapMetricsNarrow'
import PassengerRideStatusFlow from './PassengerRideStatusFlow'
import PassengerPendingRideCancel from './PassengerPendingRideCancel'
import PassengerActiveDriver from './PassengerActiveDriver'
import RideCommunicationPanel from './RideCommunicationPanel'

import DriverAvatarUploadPolish from './DriverAvatarUploadPolish'
import DriverDashboardTitleHide from './DriverDashboardTitleHide'
import DriverOnlineSwitchPolish from './DriverOnlineSwitchPolish'
import DriverBrandTaxiPolish from './DriverBrandTaxiPolish'
import DriverCompactBrandPolish from './DriverCompactBrandPolish'
import DriverLogoutPolish from './DriverLogoutPolish'
import DriverAutoRequestSearch from './DriverAutoRequestSearch'
import DriverRideExperiencePolish from './DriverRideExperiencePolish'
import DriverCompletedRideSummary from './DriverCompletedRideSummary'
import DriverHomeDashboardPolish from './DriverHomeDashboardPolish'
import DriverFinalMenuStable from './DriverFinalMenuStable'
import DriverApplicationSubmitButton from './DriverApplicationSubmitButton'
import DriverPayoutEditPolish from './DriverPayoutEditPolish'
import DriverFinalHelpTopics from './DriverFinalHelpTopics'
import DriverDrawerHeaderPolish from './DriverDrawerHeaderPolish'
import DriverProfileSectionPolish from './DriverProfileSectionPolish'
import DriverVehicleSectionPolish from './DriverVehicleSectionPolish'
import DriverPaymentsSectionPolish from './DriverPaymentsSectionPolish'
import DriverHistorySectionPolish from './DriverHistorySectionPolish'
import DriverEarningsSectionPolish from './DriverEarningsSectionPolish'
import DriverLanguageSectionPolish from './DriverLanguageSectionPolish'
import DriverAccessGate from './DriverAccessGate'
import DriverCleanMenu from './DriverCleanMenu'
import DriverCleanMenuFinalGuard from './DriverCleanMenuFinalGuard'
import DriverCleanHelpTopics from './DriverCleanHelpTopics'
import DriverCleanMenuOrder from './DriverCleanMenuOrder'
import DriverCleanHeaderRestore from './DriverCleanHeaderRestore'
import DriverCleanAvatarUpload from './DriverCleanAvatarUpload'
import DriverCleanApplicationPanel from './DriverCleanApplicationPanel'
import DriverCleanPaymentsPolish from './DriverCleanPaymentsPolish'
import DriverCleanHistoryPolish from './DriverCleanHistoryPolish'
import DriverCleanHistoryLabel from './DriverCleanHistoryLabel'
import DriverCleanEarningsPolish from './DriverCleanEarningsPolish'
import DriverCleanLanguagePolish from './DriverCleanLanguagePolish'

import AdminDriverApplicationProfileSnapshot from './AdminDriverApplicationProfileSnapshot'
import AdminDriverVehicleSnapshot from './AdminDriverVehicleSnapshot'

export default function RouteScopedEnhancers() {
  const pathname = usePathname()
  const isPassengerDashboard = pathname === '/' || pathname === '/movi' || pathname === '/passenger/dashboard'
  const isCleanDriverDashboard = pathname === '/driver/dashboard-v2'
  const isLegacyDriverDashboard = pathname === '/driver/dashboard'
  const isAdminDrivers = pathname === '/admin/drivers'

  return <>
    {isPassengerDashboard && <>
      <PassengerStableAvatarUpload />
      <PassengerProfileDetails />
      <PassengerTripsStableInline />
      <PassengerPaymentStableInline />
      <PassengerLanguageSwitchStable />
      <PassengerHelpStableInline />
      <PassengerLogoutStable />
      <PassengerMenuPolish />
      <PassengerMenuCompactPolish />
      <PassengerMenuFinalConsistency />
      <PassengerMenuIconDedupPolish />
      <PassengerRideHistoryMenuPolish />
      <PassengerMenuVisibilityFix />
      <PassengerDashboardPaymentPanel />
      <PassengerAcceptedRideMiniMap />
      <PassengerActiveDriver />
      <RideCommunicationPanel />
      <PassengerMiniMapMetricsNarrow />
    </>}

    {isCleanDriverDashboard && <>
      <RideCommunicationPanel />
      <DriverCompletedRideSummary />
      <DriverCleanMenu />
      <DriverCleanMenuFinalGuard />
      <DriverCleanHelpTopics />
      <DriverCleanMenuOrder />
      <DriverCleanHeaderRestore />
      <DriverCleanAvatarUpload />
      <DriverCleanApplicationPanel />
      <DriverCleanPaymentsPolish />
      <DriverCleanHistoryPolish />
      <DriverCleanHistoryLabel />
      <DriverCleanEarningsPolish />
      <DriverCleanLanguagePolish />
    </>}

    {isLegacyDriverDashboard && <>
      <DriverAccessGate />
      <DriverAvatarUploadPolish />
      <DriverDashboardTitleHide />
      <DriverOnlineSwitchPolish />
      <DriverBrandTaxiPolish />
      <DriverCompactBrandPolish />
      <DriverLogoutPolish />
      <DriverAutoRequestSearch />
      <DriverRideExperiencePolish />
      <DriverCompletedRideSummary />
      <DriverHomeDashboardPolish />
      <DriverFinalMenuStable />
      <DriverApplicationSubmitButton />
      <DriverPayoutEditPolish />
      <DriverFinalHelpTopics />
      <DriverDrawerHeaderPolish />
      <DriverProfileSectionPolish />
      <DriverVehicleSectionPolish />
      <DriverPaymentsSectionPolish />
      <DriverHistorySectionPolish />
      <DriverEarningsSectionPolish />
      <DriverLanguageSectionPolish />
    </>}

    {isAdminDrivers && <>
      <AdminDriverApplicationProfileSnapshot />
      <AdminDriverVehicleSnapshot />
    </>}
  </>
}
