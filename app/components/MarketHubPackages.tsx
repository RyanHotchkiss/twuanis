'use client'

import {
  CalendarDays,
  CreditCard,
  PackageCheck,
  RefreshCw
} from 'lucide-react'

type SupportedLanguage =
  | 'en'
  | 'es'

export type BillingCycle =
  | 'free'
  | 'monthly'
  | 'annual'

type IncludedPackageBenefit = {
  name: string
  engineCount: number
  features: string[]
  active: boolean
}

type UsageSummary = {
    enginesUsed: number
    savedAnalyses: number
    savedSearches: number
    reportsGenerated: number
    listingsAnalyzed: number
}

export type MarketHubPackagesProps = {
  language: SupportedLanguage
  currentPlan: string
  packageDescription: string
  subscriptionStatus: string
  listingLimit: number | null
  storageLimitMb: number | null
  accountPermissions: string[]
  monthlyPriceUSD: string
  monthlyPriceCRC: string
  renewalDate: string
  billingCycle: BillingCycle
  includedPackages: IncludedPackageBenefit[]
  usageSummary: UsageSummary
  upgradePackages: UpgradePackage[]
  availableUpgradeCount: number
  listingAddons: ListingAddon[]
  exposureOptions?: ExposureOption[]
  presentationOptions?: PresentationOption[]
  trustOptions?: TrustOption[]
  paymentMethods?: PaymentMethodOption[]
  onSelectUpgradePackage: (
    packageItem: UpgradePackage
  ) => void
  selectedUpgradePackage:
  SelectedUpgradePackage | null

  pendingUpgrade:
  PendingUpgrade | null

  upgradeOutcome:
  UpgradeOutcome | null

  paymentCurrency:
    'CRC' | 'USD'

  onPaymentCurrencyChange: (
    value: 'CRC' | 'USD'
  ) => void

  sinpeReference:
    string

  onSinpeReferenceChange: (
    value: string
  ) => void

  senderName:
    string

  onSenderNameChange: (
    value: string
  ) => void

  senderPhone:
  string

  onSenderPhoneChange: (
    value: string
  ) => void

  paymentDate:
    string

  onPaymentDateChange: (
    value: string
  ) => void

  submittingUpgrade:
    boolean

  upgradeError:
    string

  onSubmitUpgrade: () => void

  onCloseUpgrade: () => void

  }

type TrustOption = {
  name: string
  price: string
}

type PaymentMethodOption = {
  name: string
  future?: boolean
}

type UpgradePackage = {
  packageId: string
  name: string
  priceUSD: string
  priceCRC: string
  features: string[]
  current: boolean
  premium: boolean
}

export type SelectedUpgradePackage = {
  packageId: string
  name: string
  priceUSD: string
  priceCRC: string
}

type ListingAddon = {
  name: string
  price: string
  description: string
  duration: string
}

type ExposureOption = {
  name: string
  price: string
}

type PresentationOption = {
  name: string
  price: string
}

type PendingUpgrade = {
  packageName: string
  subscriptionStatus: string
  paymentStatus: string | null
  sinpeReference: string | null
  amount: number | null
  currency: 'CRC' | 'USD' | null
  submittedAt: string | null
}

type UpgradeOutcome = {
  paymentId: string
  status:
    | 'approved'
    | 'rejected'
    | 'cancelled'
  packageName: string
  rejectionReason: string | null
  resolvedAt: string
}

export default function MarketHubPackages({
    language,
    currentPlan,
    packageDescription,
    subscriptionStatus,
    listingLimit,
    storageLimitMb,
    accountPermissions,
    monthlyPriceUSD,
    monthlyPriceCRC,
    renewalDate,
    billingCycle,
    includedPackages,
    usageSummary,
    upgradePackages,
    availableUpgradeCount,
    listingAddons,
    exposureOptions = [],
    presentationOptions = [],
    trustOptions = [],
    paymentMethods = [],
    onSelectUpgradePackage,
    selectedUpgradePackage,
    paymentCurrency,
    onPaymentCurrencyChange,
    sinpeReference,
    onSinpeReferenceChange,
    senderName,
    onSenderNameChange,
    senderPhone,
    onSenderPhoneChange,
    paymentDate,
    onPaymentDateChange,
    submittingUpgrade,
    upgradeError,
    onSubmitUpgrade,
    onCloseUpgrade,
    pendingUpgrade,
    upgradeOutcome,
}: MarketHubPackagesProps) {
  const labels =
    language === 'es'
      ? {
            heading:
                'Paquetes',
            purpose:
                'Administre su paquete actual, mejoras, complementos y facturación.',
            currentPackage:
                'Paquete Actual',
            currentPackageDescription:
                'Revise su paquete, precio, fecha de renovación y ciclo de facturación.',
            includedPackages:
             'Paquetes Incluidos',
            engines:
            'Motores',

            featuresIncluded:
            'Funciones Incluidas',

            activitySummary:
            'Resumen de Actividad',

            enginesUsed:
            'Motores Utilizados',

            savedAnalyses:
            'Análisis Guardados',

            savedSearches:
            'Búsquedas Guardadas',

            reportsGenerated:
            'Informes Generados',

            listingsAnalyzed:
            'Propiedades Analizadas',

            active:
            'Activo',

            inactive:
            'Inactivo',
            currentPlan:
                'Plan Actual',
            monthlyPrice:
                'Precio Mensual',
            renewalDate:
                'Fecha de Renovación',
            billingCycle:
                'Ciclo de Facturación',
            monthly:
                'Mensual',
            annual:
                'Anual',
            upgradePackages:
            'Mejorar Paquete',

            upgradePackagesDescription:
            'Compare los paquetes disponibles y desbloquee inteligencia de mercado adicional.',

            free:
            'Gratis',

            currentPlanButton:
            'Plan Actual',

            included:
            'Incluido',

            premiumPackages:
            'Paquetes Premium',

            premiumPackagesDescription:
            'Paquetes avanzados de inteligencia para análisis profesional del mercado y toma de decisiones estratégicas.',

            upgrade:
            'Mejorar',

            duration: 'Duración',
            days30: '30 días',
            phase3: 'Fase 3',
            listingAddons: 'Complementos para Anuncios',
            listingAddonsDescription:
            'Aumente la visibilidad de propiedades individuales con mejoras promocionales de compra única.',
            activeFor30Days: 'Activo durante 30 días',
            purchase: 'Comprar',
            exposure: 'Exposure',
            
            exposureDescription:
            'Promocione su propiedad con mejoras de visibilidad de compra única.',
            
            step3: 'Paso 3',
            presentation: 'Presentación',
            premiumGallery: 'Galería Premium',
            presentationDescription:
            'Mejore la presentación visual de su propiedad con servicios profesionales.',

            step4: 'Paso 4',
            trust: 'Confianza',
            verifiedOwnership: 'Propiedad Verificada',
            trustDescription:
            'Genere confianza verificando información importante de la propiedad.',
            premiumTemplates:
            'Plantillas Premium',

            phase4: 'Fase 4',
            paymentMethods: 'Métodos de Pago',
            paymentMethodsDescription:
            'Administre los métodos disponibles para suscripciones, mejoras y compras.',
            available: 'Disponible',
            future: 'Próximamente',
            manage: 'Administrar',
            connect: 'Conectar',

            subscriptionStatus: 'Estado de Suscripción',

            listingLimit: 'Límite de Propiedades',
            storageLimit: 'Límite de Almacenamiento',
            accountPermissions: 'Permisos de Cuenta',
            unlimited: 'Ilimitado',
            upgradeCheckout:
              'Mejorar Suscripción',
            selectedPackage:
              'Paquete Seleccionado',
            sinpePayment:
              'Pago por SINPE',
            sinpePaymentDescription:
              'Ingrese los datos de su pago por SINPE para solicitar la mejora de su suscripción.',
            currency:
              'Moneda',
            sinpeReference:
              'Referencia SINPE',
            senderName:
              'Nombre del Remitente',
            senderPhone:
              'Teléfono del Remitente',
            optional:
              'Opcional',
            paymentDate:
              'Fecha de Pago',
            continueUpgrade:
              'Continuar',
            cancel:
              'Cancelar',

            upgradePending:
              'Mejora Pendiente',

            upgradePendingDescription:
              'Su paquete actual permanece activo mientras revisamos su pago por SINPE.',

            targetPackage:
              'Paquete Solicitado',

            paymentStatus:
              'Estado del Pago',

            submitted:
              'Enviado',

            underReview:
              'En Revisión',

            reference:
              'Referencia SINPE',

            upgradeSuccessful:
              'Suscripción Mejorada',

            upgradeSuccessfulDescription:
              'Su paquete mejorado está activo y su nuevo acceso a Inteligencia de Mercado está disponible.',

            paymentRejected:
              'Pago Rechazado',

            paymentRejectedDescription:
              'Su paquete actual permanece activo. Revise el motivo antes de enviar otro pago.',

            upgradeCancelled:
              'Mejora Cancelada',

            upgradeCancelledDescription:
              'La solicitud de mejora fue cancelada. Su paquete actual permanece activo.',

            activatedPackage:
              'Paquete Activo',

            rejectionReason:
              'Motivo del Rechazo'

                        }
                  : {
            heading:
                'Packages',
            purpose:
                'Manage your current package, upgrades, add-ons, and billing.',
            currentPackage:
                'Current Package',
            currentPackageDescription:
                'Review your plan, price, renewal date, and billing cycle.',
            includedPackages:
                'Included Packages',
            engines:
            'Engines',

            featuresIncluded:
            'Features Included',

            activitySummary:
            'Activity Summary',

            enginesUsed:
            'Engines Used',

            savedAnalyses:
            'Saved Analyses',

            savedSearches:
            'Saved Searches',

            reportsGenerated:
            'Reports Generated',

            listingsAnalyzed:
            'Listings Analyzed',

            active:
            'Active',

            inactive:
            'Inactive',
            currentPlan:
                'Current Plan',
            monthlyPrice:
                'Monthly Price',
            renewalDate:
                'Renewal Date',
            billingCycle:
                'Billing Cycle',
            monthly:
                'Monthly',
            annual:
                'Annual',
            perMonth:
                'per month',
            upgradePackages:
            'Upgrade Packages',

            upgradePackagesDescription:
            'Compare available packages and unlock additional market intelligence.',

            free:
            'Free',

            currentPlanButton:
            'Current Plan',

            included:
            'Included',

            premiumPackages:
            'Premium Packages',

            premiumPackagesDescription:
            'Advanced intelligence packages for professional market analysis and strategic decision-making.',

            upgrade:
            'Upgrade',

            duration: 'Duration',
            days30: '30 Days',
            phase3: 'Phase 3',
            listingAddons: 'Listing Add-ons',
            listingAddonsDescription:
            'Increase the visibility of individual listings with one-time promotional upgrades.',
            activeFor30Days: 'Active for 30 Days',
            purchase: 'Purchase',
            exposure: 'Exposure',
            exposureDescription:
            'Promote your listing with one-time visibility upgrades.',
            
            step3: 'Step 3',
            presentation: 'Presentation',
            premiumGallery: 'Premium Gallery',
            presentationDescription:
            'Improve your property presentation with professional visual services.',

            step4: 'Step 4',
            trust: 'Trust',
            verifiedOwnership: 'Verified Ownership',
            trustDescription:
            'Increase buyer confidence with verified property information.',
            premiumTemplates:
            'Premium Listing Templates',

            phase4: 'Phase 4',
            paymentMethods: 'Payment Methods',
            paymentMethodsDescription:
            'Manage payment methods for subscriptions, upgrades, and purchases.',
            available: 'Available',
            future: 'Future',
            manage: 'Manage',
            connect: 'Connect',

            subscriptionStatus: 'Subscription Status',

            listingLimit: 'Listing Limit',
            storageLimit: 'Storage Limit',
            accountPermissions: 'Account Permissions',
            unlimited: 'Unlimited',

            upgradeCheckout:
              'Upgrade Subscription',
            selectedPackage:
              'Selected Package',
            sinpePayment:
              'SINPE Payment',
            sinpePaymentDescription:
              'Enter your SINPE payment information to request your subscription upgrade.',
            currency:
              'Currency',
            sinpeReference:
              'SINPE Reference',
            senderName:
              'Sender Name',
            senderPhone:
              'Sender Phone',
            optional:
              'Optional',
            paymentDate:
              'Payment Date',
            continueUpgrade:
              'Continue',
            cancel:
              'Cancel',
            
            upgradePending:
              'Upgrade Pending',

            upgradePendingDescription:
              'Your current package remains active while your SINPE payment is reviewed.',

            targetPackage:
              'Target Package',

            paymentStatus:
              'Payment Status',

            submitted:
              'Submitted',

            underReview:
              'Under Review',

            reference:
              'SINPE Reference',

            upgradeSuccessful:
              'Subscription Upgraded',

            upgradeSuccessfulDescription:
              'Your upgraded package is active and your new Market Intelligence access is available.',

            paymentRejected:
              'Payment Rejected',

            paymentRejectedDescription:
              'Your existing package remains active. Review the reason below before submitting another payment.',

            upgradeCancelled:
              'Upgrade Cancelled',

            upgradeCancelledDescription:
              'The upgrade request was cancelled. Your existing package remains active.',

            activatedPackage:
              'Active Package',

            rejectionReason:
              'Rejection Reason'

            }

      const billingCycleLabel =
      billingCycle === 'free'
        ? labels.free
        : billingCycle === 'annual'
          ? labels.annual
          : labels.monthly

      const normalizedSubscriptionStatus =
        subscriptionStatus.toLowerCase()

      const subscriptionStatusLabel =
        normalizedSubscriptionStatus === 'active'
          ? labels.active
          : normalizedSubscriptionStatus === 'inactive'
            ? labels.inactive
            : subscriptionStatus

      const storageLimitLabel =
        storageLimitMb === null
          ? labels.unlimited
          : storageLimitMb >= 1000
            ? `${storageLimitMb / 1000} GB`
            : `${storageLimitMb} MB`

        return (
            <section style={section}>
            <header>
                <div style={titleRow}>
                <PackageCheck
                    size={25}
                    strokeWidth={1}
                    color="#C7A44B"
                />

                <h2 style={heading}>
                    {labels.heading}
                </h2>
                </div>

                <p style={purpose}>
                {labels.purpose}
                </p>
            </header>

            <div style={divider} />

            <div style={phaseHeader}>
                <div>
                <h3 style={phaseTitle}>
                    {labels.currentPackage}
                </h3>

                <p style={phaseDescription}>
                    {labels.currentPackageDescription}
                </p>
                </div>

                <div
                  style={{
                    ...activeBadge,
                    background:
                      normalizedSubscriptionStatus === 'active'
                        ? '#1b4727'
                        : '#303030'
                  }}
                >
                  <span
                    style={{
                      ...activeDot,
                      background:
                        normalizedSubscriptionStatus === 'active'
                          ? '#59c173'
                          : '#777'
                    }}
                  />

                  {subscriptionStatusLabel}
                </div>
            </div>

            <div style={summaryGrid}>
                <article style={planCard}>
                <div style={cardHeadingRow}>
                    <div style={iconContainer}>
                    <PackageCheck
                        size={25}
                        strokeWidth={1}
                        color="#C7A44B"
                    />
                    </div>

                    <span style={cardLabel}>
                    {labels.currentPlan}
                    </span>
                </div>

                <div style={planName}>
                    {currentPlan}
                  </div>

                  <div style={planDescription}>
                    {packageDescription}
                  </div>
                </article>

                <article style={priceCard}>
                <div style={cardHeadingRow}>
                    <div style={iconContainer}>
                    <CreditCard
                        size={25}
                        strokeWidth={1}
                        color="#C7A44B"
                    />
                    </div>

                    <span style={cardLabel}>
                    {labels.monthlyPrice}
                    </span>
                </div>

                <div style={priceUSD}>
                    {monthlyPriceUSD}
                </div>

                <div style={priceCRC}>
                    {monthlyPriceCRC}
                </div>

                <div style={pricePeriod}>
                    {labels.perMonth}
                </div>
                </article>

                <article style={detailCard}>
                <div style={cardHeadingRow}>
                    <div style={iconContainer}>
                    <CalendarDays
                        size={25}
                        strokeWidth={1}
                        color="#C7A44B"
                    />
                    </div>

                    <span style={cardLabel}>
                    {labels.renewalDate}
                    </span>
                </div>

                <div style={detailValue}>
                    {renewalDate}
                </div>
                </article>

                <article style={detailCard}>
                <div style={cardHeadingRow}>
                    <div style={iconContainer}>
                    <RefreshCw
                        size={25}
                        strokeWidth={1}
                        color="#C7A44B"
                    />
                    </div>

                    <span style={cardLabel}>
                    {labels.billingCycle}
                    </span>
                </div>

                <div style={detailValue}>
                    {billingCycleLabel}
                </div>
                </article>

              <article style={detailCard}>
                <div style={cardHeadingRow}>
                  <div style={iconContainer}>
                    <PackageCheck
                      size={25}
                      strokeWidth={1}
                      color="#C7A44B"
                    />
                  </div>

                  <span style={cardLabel}>
                    Available Upgrades
                  </span>
                </div>

                <div style={detailValue}>
                  {availableUpgradeCount}
                </div>
              </article>

              <article style={detailCard}>
              <div style={cardHeadingRow}>
                <div style={iconContainer}>
                  <PackageCheck
                    size={25}
                    strokeWidth={1}
                    color="#C7A44B"
                  />
                </div>

                <span style={cardLabel}>
                  {labels.listingLimit}
                </span>
              </div>

              <div style={detailValue}>
                {listingLimit === null
                  ? labels.unlimited
                  : listingLimit.toLocaleString()}
              </div>
            </article>

            <article style={detailCard}>
              <div style={cardHeadingRow}>
                <div style={iconContainer}>
                  <PackageCheck
                    size={25}
                    strokeWidth={1}
                    color="#C7A44B"
                  />
                </div>

                <span style={cardLabel}>
                  {labels.storageLimit}
                </span>
              </div>

              <div style={detailValue}>
                {storageLimitLabel}
              </div>
            </article>

            <article style={detailCard}>
              <div style={cardHeadingRow}>
                <div style={iconContainer}>
                  <PackageCheck
                    size={25}
                    strokeWidth={1}
                    color="#C7A44B"
                  />
                </div>

                <span style={cardLabel}>
                  {labels.accountPermissions}
                </span>
              </div>

              <div style={permissionList}>
                {accountPermissions.map(permission => (
                  <div
                    key={permission}
                    style={permissionItem}
                  >
                    <span style={permissionCheck}>
                      ✓
                    </span>

                    <span>
                      {permission}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            </div>

      

            <div style={divider} />

                <div style={includedSection}>
                    <h3 style={includedHeading}>
                        {labels.includedPackages}
                    </h3>

                    <div style={includedGrid}>
                        {includedPackages.map(packageItem => (
                        <article
                            key={packageItem.name}
                            style={packageBenefitCard}
                        >
                            <div style={packageBenefitHeader}>
                            <div style={packageIdentity}>
                                <div style={packageCheck}>
                                ✓
                                </div>

                                <div>
                                <h4 style={packageBenefitName}>
                                    {packageItem.name}
                                </h4>

                                <div style={engineCount}>
                                    {packageItem.engineCount}{' '}
                                    {labels.engines}
                                </div>
                                </div>
                            </div>

                            <div
                                style={{
                                ...packageStatus,
                                background:
                                    packageItem.active
                                    ? '#1b4727'
                                    : '#303030'
                                }}
                            >
                                <span
                                style={{
                                    ...packageStatusDot,
                                    background:
                                    packageItem.active
                                        ? '#59c173'
                                        : '#777'
                                }}
                                />

                                {packageItem.active
                                ? labels.active
                                : labels.inactive}
                            </div>
                            </div>

                            <div style={featuresLabel}>
                            {labels.featuresIncluded}
                            </div>

                            <div style={featureList}>
                            {packageItem.features.map(feature =>
                                feature === '+' ? (
                                    <div
                                    key="plus"
                                    style={upgradePackageDivider}
                                    >
                                    +
                                    </div>
                                ) : (
                                    <div
                                    key={feature}
                                    style={upgradeFeatureItem}
                                    >
                                    <span style={upgradeFeatureCheck}>
                                        ✓
                                    </span>

                                    <span>
                                        {feature}
                                    </span>
                                    </div>
                                )
                                )}
                            </div>
                        </article>
                        ))}
                    </div>
                </div>

                <div style={divider} />

                        <div style={includedSection}>
                        <h3 style={includedHeading}>
                            {labels.activitySummary}
                        </h3>

                        <div style={activityGrid}>
                            <div style={activityCard}>
                            <div style={activityValue}>
                                {usageSummary.enginesUsed}
                            </div>

                            <div style={activityLabel}>
                                {labels.enginesUsed}
                            </div>
                            </div>

                            <div style={activityCard}>
                            <div style={activityValue}>
                                {usageSummary.savedAnalyses}
                            </div>

                            <div style={activityLabel}>
                                {labels.savedAnalyses}
                            </div>
                            </div>

                            <div style={activityCard}>
                            <div style={activityValue}>
                                {usageSummary.savedSearches}
                            </div>

                            <div style={activityLabel}>
                                {labels.savedSearches}
                            </div>
                            </div>

                            <div style={activityCard}>
                            <div style={activityValue}>
                                {usageSummary.reportsGenerated}
                            </div>

                            <div style={activityLabel}>
                                {labels.reportsGenerated}
                            </div>
                            </div>

                            <div style={activityCard}>
                            <div style={activityValue}>
                                {usageSummary.listingsAnalyzed}
                            </div>

                            <div style={activityLabel}>
                                {labels.listingsAnalyzed}
                            </div>
                            </div>
                        </div>
                    </div>

                    <div style={phaseDivider} />

                    <div style={upgradeSection}>
                    <div style={upgradeSectionHeader}>
                        <div>
                        <div style={phaseEyebrow}>
                            Phase 2
                        </div>

                        <h3 style={upgradeHeading}>
                            {labels.upgradePackages}
                        </h3>

                        <p style={upgradeDescription}>
                            {labels.upgradePackagesDescription}
                        </p>
                        </div>
                    </div>

                    <div style={upgradeGrid}>
                        {upgradePackages
                            .filter(packageItem => !packageItem.premium)
                            .map(packageItem => (
                        <article
                            key={packageItem.name}
                            style={{
                            ...upgradeCard,
                            borderColor:
                                packageItem.current
                                ? '#C7A44B'
                                : '#303030'
                            }}
                        >
                            <div style={upgradeCardHeader}>
                            <div>
                                <div style={freeBadge}>
                                {labels.free}
                                </div>

                                <h4 style={upgradePackageName}>
                                {packageItem.name}
                                </h4>
                            </div>

                            {packageItem.current && (
                                <div style={currentBadge}>
                                <span style={currentBadgeDot} />

                                {labels.active}
                                </div>
                            )}
                            </div>

                            <div style={upgradePriceSection}>
                            <div style={upgradePriceUSD}>
                                {packageItem.priceUSD}
                            </div>

                            <div style={upgradePriceCRC}>
                                {packageItem.priceCRC}
                            </div>

                            <div style={upgradePricePeriod}>
                                {labels.perMonth}
                            </div>
                            </div>

                            <div style={upgradeFeaturesLabel}>
                            {labels.included}
                            </div>

                            <div style={upgradeFeatureList}>
                            {packageItem.features.map(feature => (
                                <div
                                key={feature}
                                style={upgradeFeatureItem}
                                >
                                <span style={upgradeFeatureCheck}>
                                    ✓
                                </span>

                                <span>
                                    {feature}
                                </span>
                                </div>
                            ))}
                            </div>

                            <button
                                type="button"
                                disabled={packageItem.current}
                                onClick={() =>
                                  onSelectUpgradePackage(
                                    packageItem
                                  )
                                }
                                style={{
                                ...upgradeButton,
                                cursor:
                                packageItem.current
                                    ? 'default'
                                    : 'pointer',
                                opacity:
                                packageItem.current
                                    ? 1
                                    : 0.9
                            }}
                            >
                            {packageItem.current
                                ? labels.currentPlanButton
                                : packageItem.name}
                            </button>
                        </article>
                        ))}
                    </div>
                    </div>
                    
                    <div style={premiumSection}>
                        <div style={premiumSectionHeader}>
                            <div>
                                <div style={premiumEyebrow}>
                                    Premium
                                </div>

                                <h3 style={premiumHeading}>
                                    {labels.premiumPackages}
                                </h3>

                                <p style={premiumDescription}>
                                    {labels.premiumPackagesDescription}
                                </p>
                            </div>
                        </div>

                        <div style={premiumGrid}>
                            {upgradePackages
                                .filter(packageItem => packageItem.premium)
                                .map(packageItem => (
                                    <article
                                        key={packageItem.name}
                                        style={premiumCard}
                                    >
                                        <div style={premiumCardTop}>
                                            <div style={premiumIcon}>◈</div>

                                            <div style={premiumBadge}>
                                                Premium
                                            </div>
                                        </div>

                                        <h4 style={premiumPackageName}>
                                            {packageItem.name}
                                        </h4>

                                        <div style={premiumPriceRow}>
                                            <span style={premiumPriceUSD}>
                                                {packageItem.priceUSD}
                                            </span>

                                            <span style={premiumPricePeriod}>
                                                / {labels.perMonth}
                                            </span>
                                        </div>

                                        <div style={premiumPriceCRC}>
                                            {packageItem.priceCRC} / {labels.perMonth}
                                        </div>

                                        <div style={premiumInheritance}>
                                            <span style={premiumInheritanceLabel}>
                                                {packageItem.features[0]}
                                            </span>

                                            <span style={premiumPlus}>+</span>
                                        </div>

                                        <div style={premiumFeatureGrid}>
                                            {packageItem.features.slice(2).map(feature => (
                                                <div
                                                    key={feature}
                                                    style={premiumFeatureCard}
                                                >
                                                    <span style={premiumFeatureIcon}>
                                                        ✓
                                                    </span>

                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            onSelectUpgradePackage(
                                              packageItem
                                            )
                                          }
                                          style={premiumButton}
                                        >
                                          {labels.upgrade}
                                        </button>
                                    </article>
                                ))}
                        </div>
                        </div>

                        {upgradeOutcome && (
                          <section
                            style={{
                              ...upgradeOutcomeCard,

                              borderColor:
                                upgradeOutcome.status ===
                                'approved'
                                  ? '#315f3a'
                                  : upgradeOutcome.status ===
                                      'rejected'
                                    ? '#6a3028'
                                    : '#4a4a4a',

                              background:
                                upgradeOutcome.status ===
                                'approved'
                                  ? '#17231a'
                                  : upgradeOutcome.status ===
                                      'rejected'
                                    ? '#291816'
                                    : '#202020'
                            }}
                          >
                            <div
                              style={{
                                ...upgradeOutcomeIcon,

                                color:
                                  upgradeOutcome.status ===
                                  'approved'
                                    ? '#59c173'
                                    : upgradeOutcome.status ===
                                        'rejected'
                                      ? '#ff8d79'
                                      : '#aaa'
                              }}
                            >
                              {upgradeOutcome.status ===
                              'approved'
                                ? '✓'
                                : upgradeOutcome.status ===
                                    'rejected'
                                  ? '×'
                                  : '—'}
                            </div>

                            <div>
                              <div style={phaseEyebrow}>
                                {upgradeOutcome.status ===
                                'approved'
                                  ? labels.upgradeSuccessful
                                  : upgradeOutcome.status ===
                                      'rejected'
                                    ? labels.paymentRejected
                                    : labels.upgradeCancelled}
                              </div>

                              <h3 style={upgradeOutcomeHeading}>
                                {upgradeOutcome.packageName}
                              </h3>

                              <p style={upgradeOutcomeDescription}>
                                {upgradeOutcome.status ===
                                'approved'
                                  ? labels.upgradeSuccessfulDescription
                                  : upgradeOutcome.status ===
                                      'rejected'
                                    ? labels.paymentRejectedDescription
                                    : labels.upgradeCancelledDescription}
                              </p>

                              <div style={upgradeOutcomeDetails}>
                                <div>
                                  <div style={pendingUpgradeLabel}>
                                    {labels.activatedPackage}
                                  </div>

                                  <div style={pendingUpgradeValue}>
                                    {upgradeOutcome.packageName}
                                  </div>
                                </div>

                                {upgradeOutcome.status ===
                                  'rejected' &&
                                upgradeOutcome.rejectionReason && (
                                  <div>
                                    <div style={pendingUpgradeLabel}>
                                      {labels.rejectionReason}
                                    </div>

                                    <div style={pendingUpgradeValue}>
                                      {upgradeOutcome.rejectionReason}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </section>
                        )}

                        {pendingUpgrade && (
                          <section style={pendingUpgradeCard}>
                            <div style={phaseEyebrow}>
                              {labels.upgradePending}
                            </div>

                            <h3 style={pendingUpgradeHeading}>
                              {pendingUpgrade.packageName}
                            </h3>

                            <p style={pendingUpgradeDescription}>
                              {labels.upgradePendingDescription}
                            </p>

                            <div style={pendingUpgradeDetails}>
                              <div>
                                <div style={pendingUpgradeLabel}>
                                  {labels.targetPackage}
                                </div>

                                <div style={pendingUpgradeValue}>
                                  {pendingUpgrade.packageName}
                                </div>
                              </div>

                              <div>
                                <div style={pendingUpgradeLabel}>
                                  {labels.paymentStatus}
                                </div>

                                <div style={pendingUpgradeValue}>
                                  {pendingUpgrade.paymentStatus ===
                                  'under_review'
                                    ? labels.underReview
                                    : labels.submitted}
                                </div>
                              </div>

                              {pendingUpgrade.sinpeReference && (
                                <div>
                                  <div style={pendingUpgradeLabel}>
                                    {labels.reference}
                                  </div>

                                  <div style={pendingUpgradeValue}>
                                    {pendingUpgrade.sinpeReference}
                                  </div>
                                </div>
                              )}
                            </div>
                          </section>
                        )}

                        {selectedUpgradePackage && (
                          <section style={upgradeCheckoutSection}>
                            <div style={upgradeCheckoutHeader}>
                              <div>
                                <div style={phaseEyebrow}>
                                  {labels.upgradeCheckout}
                                </div>

                                <h3 style={upgradeCheckoutHeading}>
                                  {labels.sinpePayment}
                                </h3>

                                <p style={upgradeCheckoutDescription}>
                                  {labels.sinpePaymentDescription}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={onCloseUpgrade}
                                style={upgradeCloseButton}
                                aria-label={labels.cancel}
                              >
                                ×
                              </button>
                            </div>

                            <div style={selectedPackageCard}>
                              <div>
                                <div style={selectedPackageLabel}>
                                  {labels.selectedPackage}
                                </div>

                                <div style={selectedPackageName}>
                                  {selectedUpgradePackage.name}
                                </div>
                              </div>

                              <div style={selectedPackagePrices}>
                                <div style={selectedPackageUSD}>
                                  {selectedUpgradePackage.priceUSD}
                                </div>

                                <div style={selectedPackageCRC}>
                                  {selectedUpgradePackage.priceCRC}
                                </div>
                              </div>
                            </div>

                            <form
                              style={sinpeForm}
                              onSubmit={event => {
                                event.preventDefault()
                                onSubmitUpgrade()
                              }}
                            >
                              <div style={formField}>
                                <label style={formLabel}>
                                  {labels.currency}
                                </label>

                                <select
                                  name="currency"
                                  value={paymentCurrency}
                                  onChange={event =>
                                    onPaymentCurrencyChange(
                                      event.target.value as
                                        'CRC' | 'USD'
                                    )
                                  }
                                  style={formInput}
                                >
                                  <option value="CRC">
                                    CRC
                                  </option>

                                  <option value="USD">
                                    USD
                                  </option>
                                </select>
                              </div>

                              <div style={formField}>
                                <label style={formLabel}>
                                  {labels.sinpeReference}
                                </label>

                                <input
                                  type="text"
                                  name="sinpeReference"
                                  value={sinpeReference}
                                  onChange={event =>
                                    onSinpeReferenceChange(
                                      event.target.value
                                    )
                                  }
                                  required
                                  style={formInput}
                                />
                              </div>

                              <div style={formField}>
                                <label style={formLabel}>
                                  {labels.senderName}
                                </label>

                                <input
                                  type="text"
                                  name="senderName"
                                  value={senderName}
                                  onChange={event =>
                                    onSenderNameChange(
                                      event.target.value
                                    )
                                  }
                                  required
                                  style={formInput}
                                />
                              </div>

                              <div style={formField}>
                                <label style={formLabel}>
                                  {labels.senderPhone}{' '}
                                  <span style={optionalLabel}>
                                    ({labels.optional})
                                  </span>
                                </label>

                                <input
                                  type="tel"
                                  name="senderPhone"
                                  value={senderPhone}
                                  onChange={event =>
                                    onSenderPhoneChange(
                                      event.target.value
                                    )
                                  }
                                  style={formInput}
                                />
                              </div>

                              <div style={formField}>
                                <label style={formLabel}>
                                  {labels.paymentDate}
                                </label>

                                <input
                                  type="date"
                                  name="paymentDate"
                                  value={paymentDate}
                                  onChange={event =>
                                    onPaymentDateChange(
                                      event.target.value
                                    )
                                  }
                                  required
                                  style={formInput}
                                />
                              </div>

                              {upgradeError && (
                                <div style={upgradeErrorMessage}>
                                  {upgradeError}
                                </div>
                              )}

                              <div style={formActions}>
                                <button
                                  type="button"
                                  onClick={onCloseUpgrade}
                                  style={cancelUpgradeButton}
                                >
                                  {labels.cancel}
                                </button>

                                <button
                                  type="submit"
                                  disabled={submittingUpgrade}
                                  style={{
                                    ...continueUpgradeButton,
                                    opacity:
                                      submittingUpgrade
                                        ? 0.6
                                        : 1,
                                    cursor:
                                      submittingUpgrade
                                        ? 'default'
                                        : 'pointer'
                                  }}
                                >
                                  {submittingUpgrade
                                    ? (
                                        language === 'es'
                                          ? 'Enviando...'
                                          : 'Submitting...'
                                      )
                                    : labels.continueUpgrade}
                                </button>
                              </div>
                            </form>
                          </section>
                        )}

                        <section style={listingAddonsSection}>
                        <div style={listingAddonsHeader}>
                            <div style={listingAddonsEyebrow}>
                                {labels.phase3}
                            </div>

                            <h3 style={listingAddonsHeading}>
                                {labels.listingAddons}
                            </h3>

                            <p style={listingAddonsDescription}>
                                {labels.listingAddonsDescription}
                            </p>
                        </div>

                        <div style={listingAddonsGrid}>
                            {listingAddons.map(addon => (
                                <article
                                    key={addon.name}
                                    style={listingAddonCard}
                                >
                                    <div style={listingAddonTop}>
                                        <div style={listingAddonIcon}>
                                            ↗
                                        </div>

                                        <div style={listingAddonPrice}>
                                            {addon.price}
                                        </div>
                                    </div>

                                    <h4 style={listingAddonName}>
                                        {addon.name}
                                    </h4>

                                    <p style={listingAddonDescription}>
                                        {addon.description}
                                    </p>

                                    <div style={listingAddonDurationBadge}>
                                        <span style={listingAddonStatusDot} />

                                        <span>
                                            {labels.activeFor30Days}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        style={listingAddonButton}
                                    >
                                        {labels.purchase}
                                    </button>
                                </article>
                            ))}
                        </div>
                    </section>


                    <section style={listingAddonsSection}>
                        <div style={listingAddonsHeader}>
                            <div style={listingAddonsEyebrow}>
                                Phase 4
                            </div>

                            <h3 style={listingAddonsHeading}>
                                {labels.exposure}
                            </h3>

                            <p style={listingAddonsDescription}>
                                {labels.exposureDescription}
                            </p>
                        </div>

                        <div style={exposureGrid}>
                            {exposureOptions.map(option => (
                                <article
                                    key={option.name}
                                    style={exposureCard}
                                >
                                    <div style={exposureName}>
                                        {option.name}
                                    </div>

                                    <div style={exposurePrice}>
                                        {option.price}
                                    </div>

                                    <button
                                        type="button"
                                        style={purchaseButton}
                                    >
                                        {labels.purchase}
                                    </button>
                                </article>
                            ))}
                        </div>
                    </section>

                     <section style={presentationSection}>
                        <div style={presentationHeader}>
                            <div style={presentationEyebrow}>
                            {labels.step3}
                            </div>

                            <h3 style={presentationHeading}>
                            {labels.presentation}
                            </h3>

                            <h4 style={presentationSubheading}>
                            {labels.premiumGallery}
                            </h4>

                            <p style={presentationDescription}>
                            {labels.presentationDescription}
                            </p>
                        </div>

                        <div style={presentationGrid}>
                            {presentationOptions.map(option => (
                            <article
                                key={option.name}
                                style={presentationCard}
                            >
                                <div style={presentationIcon}>
                                ◫
                                </div>

                                <h4 style={presentationOptionName}>
                                {option.name}
                                </h4>

                                <div style={presentationPrice}>
                                {option.price}
                                </div>

                                <button
                                type="button"
                                style={presentationButton}
                                >
                                {labels.purchase}
                                </button>
                            </article>
                            ))}
                        </div>
                        </section>

                        <section style={trustSection}>
                            <div style={trustHeader}>
                                <div style={trustEyebrow}>
                                    {labels.step4}
                                </div>
                                <h3 style={trustHeading}>
                                    {labels.trust}
                                </h3>
                                <h4 style={trustSubheading}>
                                    {labels.verifiedOwnership}
                                </h4>
                                <p style={trustDescription}>
                                    {labels.trustDescription}
                                </p>
                            </div>
                            <div style={trustGrid}>
                                {trustOptions.map(option => (
                                    <article
                                        key={option.name}
                                        style={trustCard}
                                    >
                                        <div style={trustIcon}>
                                            ✓
                                        </div>
                                        <h4 style={trustName}>
                                            {option.name}
                                        </h4>
                                        <div style={trustPrice}>
                                            {option.price}
                                        </div>
                                        <button
                                            type="button"
                                            style={trustButton}
                                        >
                                            {labels.purchase}
                                        </button>
                                    </article>
                                ))}
                            </div>
                            <div style={templatesDivider} />
                            <h3 style={templateHeading}>
                                {labels.premiumTemplates}
                            </h3>
                            <div style={templateGrid}>

                                {[
                                    'Luxury',
                                    'Beach',
                                    'Farm',
                                    'Commercial',
                                    'Investment',
                                    'Condominium'
                                ].map(template => (
                                    <article
                                        key={template}
                                        style={templateCard}
                                    >
                                        <div style={templateIcon}>
                                            ★
                                        </div>
                                        <h4 style={templateName}>
                                            {template}
                                        </h4>
                                    </article>
                                ))}

                            </div>

                        </section>

                    <section style={billingSection}>
                        <div style={billingHeader}>
                            <div style={billingPhaseEyebrow}>
                            {labels.phase4}
                            </div>

                            <div style={billingStepEyebrow}>
                            Step 1
                            </div>

                            <h3 style={billingHeading}>
                            {labels.paymentMethods}
                            </h3>

                            <p style={billingDescription}>
                            {labels.paymentMethodsDescription}
                            </p>
                        </div>

                        <div style={paymentMethodsGrid}>
                            {paymentMethods.map(method => (
                            <article
                                key={method.name}
                                style={{
                                ...paymentMethodCard,
                                opacity: method.future ? 0.65 : 1
                                }}
                            >
                                <div style={paymentMethodTop}>
                                <div style={paymentMethodIcon}>
                                    {method.name === 'Credit Cards' && '▣'}
                                    {method.name === 'ACH' && '↔'}
                                    {method.name === 'SINPE Móvil' && '₡'}
                                    {method.name === 'PayPal' && 'P'}
                                    {method.name === 'Wire Transfer' && '⌁'}
                                </div>

                                <div
                                    style={{
                                    ...paymentMethodStatus,
                                    background: method.future
                                        ? '#292929'
                                        : '#18261c',
                                    borderColor: method.future
                                        ? '#444'
                                        : '#294531',
                                    color: method.future
                                        ? '#aaa'
                                        : '#a9d8b3'
                                    }}
                                >
                                    <span
                                    style={{
                                        ...paymentMethodStatusDot,
                                        background: method.future
                                        ? '#777'
                                        : '#56b96b'
                                    }}
                                    />

                                    {method.future
                                    ? labels.future
                                    : labels.available}
                                </div>
                                </div>

                                <h4 style={paymentMethodName}>
                                {method.name}
                                </h4>

                                <button
                                type="button"
                                disabled={method.future}
                                style={{
                                    ...paymentMethodButton,
                                    cursor: method.future
                                    ? 'default'
                                    : 'pointer',
                                    opacity: method.future
                                    ? 0.6
                                    : 1
                                }}
                                >
                                {method.future
                                    ? labels.future
                                    : labels.connect}
                                </button>
                            </article>
                            ))}
                        </div>
                        </section>


                    </section>
                    )
                    }
         

const section = {
  padding: '1.5rem',
  background: '#151515',
  border: '1px solid #303030',
  borderRadius: '18px'
}

const titleRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem'
}

const heading = {
  margin: 0,
  color: '#fff',
  fontSize: '1.75rem',
  lineHeight: 1.2
}

const purpose = {
  maxWidth: '700px',
  margin: '.6rem 0 0',
  color: '#aaa',
  fontSize: '.92rem',
  lineHeight: 1.5
}

const divider = {
  height: '1px',
  margin: '1.5rem 0',
  background: '#303030'
}

const phaseHeader = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const phaseTitle = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const phaseDescription = {
  maxWidth: '650px',
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const activeBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.45rem',
  padding: '.4rem .75rem',
  color: '#fff',
  background: '#1b4727',
  borderRadius: '999px',
  fontSize: '.76rem',
  fontWeight: 600
}

const activeDot = {
  width: '.5rem',
  height: '.5rem',
  background: '#59c173',
  borderRadius: '999px'
}

const summaryGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const baseCard = {
  minHeight: '165px',
  padding: '1.15rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const planCard = {
  ...baseCard,
  display: 'flex',
  flexDirection: 'column' as const
}

const priceCard = {
  ...baseCard,
  display: 'flex',
  flexDirection: 'column' as const
}

const detailCard = {
  ...baseCard,
  display: 'flex',
  flexDirection: 'column' as const
}

const cardHeadingRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '.7rem'
}

const iconContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.75rem',
  height: '2.75rem',
  flexShrink: 0,
  background: '#202020',
  border: '1px solid #303030',
  borderRadius: '999px'
}

const cardLabel = {
  color: '#888',
  fontSize: '.75rem',
  fontWeight: 600,
  letterSpacing: '.04em',
  textTransform: 'uppercase' as const
}

const planName = {
  marginTop: 'auto',
  paddingTop: '1.2rem',
  color: '#fff',
  fontSize: '1.45rem',
  fontWeight: 700,
  lineHeight: 1.25
}

const planDescription = {
  marginTop: '.65rem',
  color: '#888',
  fontSize: '.8rem',
  lineHeight: 1.5
}

const priceUSD = {
  marginTop: 'auto',
  paddingTop: '1rem',
  color: '#fff',
  fontSize: '2rem',
  fontWeight: 700,
  lineHeight: 1
}

const priceCRC = {
  marginTop: '.45rem',
  color: '#888',
  fontSize: '1rem',
  fontWeight: 600
}

const pricePeriod = {
  marginTop: '.35rem',
  color: '#666',
  fontSize: '.72rem'
}

const detailValue = {
  marginTop: 'auto',
  paddingTop: '1.2rem',
  color: '#fff',
  fontSize: '1.3rem',
  fontWeight: 700,
  lineHeight: 1.3
}

const includedSection = {
  marginTop: '.25rem'
}

const includedHeading = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const includedGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const packageCheck = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.1rem',
  height: '2.1rem',
  flexShrink: 0,
  color: '#fff',
  background: '#1b4727',
  borderRadius: '999px',
  fontSize: '.95rem',
  fontWeight: 700
}

const packageBenefitCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: '250px',
  padding: '1.15rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px'
}

const packageBenefitHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const packageIdentity = {
  display: 'flex',
  alignItems: 'center',
  gap: '.8rem',
  minWidth: 0
}

const packageBenefitName = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem',
  lineHeight: 1.3
}

const engineCount = {
  marginTop: '.3rem',
  color: '#C7A44B',
  fontSize: '.76rem',
  fontWeight: 600
}

const packageStatus = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.4rem',
  flexShrink: 0,
  padding: '.35rem .65rem',
  color: '#fff',
  borderRadius: '999px',
  fontSize: '.7rem',
  fontWeight: 600
}

const packageStatusDot = {
  width: '.45rem',
  height: '.45rem',
  borderRadius: '999px'
}

const featuresLabel = {
  marginTop: '1.25rem',
  color: '#777',
  fontSize: '.7rem',
  fontWeight: 600,
  letterSpacing: '.05em',
  textTransform: 'uppercase' as const
}

const featureList = {
  display: 'grid',
  gap: '.65rem',
  marginTop: '.75rem'
}

const featureItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '.55rem',
  color: '#aaa',
  fontSize: '.8rem',
  lineHeight: 1.4
}

const featureDot = {
  width: '.4rem',
  height: '.4rem',
  flexShrink: 0,
  marginTop: '.35rem',
  background: '#C7A44B',
  borderRadius: '999px'
}

const activityGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const activityCard = {
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '14px',
  textAlign: 'center' as const
}

const activityValue = {
  color: '#ffffff',
  fontSize: '2.2rem',
  fontWeight: 700,
  lineHeight: 1
}

const activityLabel = {
  marginTop: '.75rem',
  color: '#888',
  fontSize: '.82rem',
  fontWeight: 600
}

const phaseDivider = {
  height: '1px',
  margin: '2rem 0',
  background: '#3a3a3a'
}

const upgradeSection = {
  marginTop: '.25rem'
}

const upgradeSectionHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const phaseEyebrow = {
  marginBottom: '.4rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase' as const
}

const upgradeHeading = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const upgradeDescription = {
  maxWidth: '650px',
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const upgradeGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(270px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const upgradeCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: '470px',
  padding: '1.35rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const upgradeCardHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const freeBadge = {
  display: 'inline-flex',
  padding: '.3rem .6rem',
  color: '#C7A44B',
  background: '#282314',
  border: '1px solid #514523',
  borderRadius: '999px',
  fontSize: '.67rem',
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const
}

const upgradePackageName = {
  margin: '.8rem 0 0',
  color: '#fff',
  fontSize: '1.25rem',
  lineHeight: 1.25
}

const currentBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.4rem',
  flexShrink: 0,
  padding: '.35rem .65rem',
  color: '#fff',
  background: '#1b4727',
  borderRadius: '999px',
  fontSize: '.7rem',
  fontWeight: 600
}

const currentBadgeDot = {
  width: '.45rem',
  height: '.45rem',
  background: '#59c173',
  borderRadius: '999px'
}

const upgradePriceSection = {
  marginTop: '1.5rem',
  paddingBottom: '1.25rem',
  borderBottom: '1px solid #303030'
}

const upgradePriceUSD = {
  color: '#fff',
  fontSize: '2.5rem',
  fontWeight: 700,
  lineHeight: 1
}

const upgradePriceCRC = {
  marginTop: '.5rem',
  color: '#888',
  fontSize: '1.1rem',
  fontWeight: 600
}

const upgradePricePeriod = {
  marginTop: '.4rem',
  color: '#666',
  fontSize: '.72rem'
}

const upgradeFeaturesLabel = {
  marginTop: '1.25rem',
  color: '#777',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const
}

const upgradeFeatureList = {
  display: 'grid',
  gap: '.75rem',
  marginTop: '.85rem'
}

const upgradeFeatureItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem',
  color: '#bbb',
  fontSize: '.84rem',
  lineHeight: 1.4
}

const upgradeFeatureCheck = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.35rem',
  height: '1.35rem',
  flexShrink: 0,
  color: '#fff',
  background: '#1b4727',
  borderRadius: '999px',
  fontSize: '.68rem',
  fontWeight: 700
}

const upgradeButton = {
  width: '100%',
  marginTop: 'auto',
  padding: '.8rem 1rem',
  color: '#fff',
  background: '#303030',
  border: '1px solid #474747',
  borderRadius: '10px',
  fontSize: '.82rem',
  fontWeight: 700
}
const upgradePackageDivider = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '.25rem 0',
  color: '#C7A44B',
  fontSize: '1.5rem',
  fontWeight: 700
}

const premiumSection = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #3a3a3a'
}

const premiumSectionHeader = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const premiumEyebrow = {
  marginBottom: '.4rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase' as const
}

const premiumHeading = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const premiumDescription = {
  maxWidth: '650px',
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const premiumGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(320px, 1fr))',
  gap: '1.25rem',
  marginTop: '1.25rem'
}

const premiumCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: '490px',
  padding: '1.5rem',
  background:
    'linear-gradient(145deg, #1e1e1e 0%, #151515 100%)',
  border: '1px solid #4c4023',
  borderRadius: '18px'
}

const premiumCardTop = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
}

const premiumIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.7rem',
  height: '2.7rem',
  color: '#C7A44B',
  background: '#292313',
  border: '1px solid #514523',
  borderRadius: '12px',
  fontSize: '1.25rem'
}

const premiumBadge = {
  padding: '.35rem .7rem',
  color: '#C7A44B',
  background: '#292313',
  border: '1px solid #514523',
  borderRadius: '999px',
  fontSize: '.68rem',
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase' as const
}

const premiumPackageName = {
  margin: '1.25rem 0 0',
  color: '#fff',
  fontSize: '1.4rem',
  lineHeight: 1.25
}

const premiumPriceRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '.45rem',
  marginTop: '1rem'
}

const premiumPriceUSD = {
  color: '#fff',
  fontSize: '2.5rem',
  fontWeight: 700,
  lineHeight: 1
}

const premiumPricePeriod = {
  color: '#777',
  fontSize: '.78rem'
}

const premiumPriceCRC = {
  marginTop: '.5rem',
  color: '#888',
  fontSize: '.9rem'
}

const premiumInheritance = {
  display: 'flex',
  alignItems: 'center',
  gap: '.75rem',
  marginTop: '1.5rem',
  padding: '.85rem 1rem',
  background: '#202020',
  border: '1px solid #333',
  borderRadius: '12px'
}

const premiumInheritanceLabel = {
  color: '#ddd',
  fontSize: '.84rem',
  fontWeight: 600
}

const premiumPlus = {
  marginLeft: 'auto',
  color: '#C7A44B',
  fontSize: '1.25rem',
  fontWeight: 700
}

const premiumFeatureGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '.7rem',
  marginTop: '1rem'
}

const premiumFeatureCard = {
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem',
  minHeight: '3.4rem',
  padding: '.75rem',
  color: '#bbb',
  background: '#1d1d1d',
  border: '1px solid #303030',
  borderRadius: '10px',
  fontSize: '.8rem',
  lineHeight: 1.35
}

const premiumFeatureIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.3rem',
  height: '1.3rem',
  flexShrink: 0,
  color: '#fff',
  background: '#1b4727',
  borderRadius: '999px',
  fontSize: '.65rem',
  fontWeight: 700
}

const premiumButton = {
  width: '100%',
  marginTop: 'auto',
  padding: '.9rem 1rem',
  color: '#161616',
  background: '#C7A44B',
  border: '1px solid #D7B85E',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.84rem',
  fontWeight: 700
}

const listingAddonsSection = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const listingAddonsHeader = {
  maxWidth: '680px'
}

const listingAddonsEyebrow = {
  marginBottom: '.4rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase' as const
}

const listingAddonsHeading = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const listingAddonsDescription = {
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const listingAddonsGrid = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const listingAddonCard = {
  display: 'flex',
  flexDirection: 'column' as const,
  minHeight: '290px',
  padding: '1.25rem',
  background:
    'linear-gradient(145deg, #1d1d1d 0%, #151515 100%)',
  border: '1px solid #343434',
  borderRadius: '16px'
}

const listingAddonTop = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
}

const listingAddonIcon = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.5rem',
  height: '2.5rem',
  color: '#C7A44B',
  background: '#292313',
  border: '1px solid #4d4226',
  borderRadius: '11px',
  fontSize: '1.1rem',
  fontWeight: 700
}

const listingAddonPrice = {
  color: '#fff',
  fontSize: '1.6rem',
  fontWeight: 700
}

const listingAddonName = {
  margin: '1rem 0 0',
  color: '#fff',
  fontSize: '1.05rem'
}

const listingAddonDescription = {
  margin: '.6rem 0 0',
  color: '#929292',
  fontSize: '.82rem',
  lineHeight: 1.55
}

const listingAddonDurationBadge = {
  display: 'inline-flex',
  alignItems: 'center',
  alignSelf: 'flex-start',
  gap: '.5rem',
  marginTop: '1rem',
  padding: '.4rem .7rem',
  color: '#a9d8b3',
  background: '#18261c',
  border: '1px solid #294531',
  borderRadius: '999px',
  fontSize: '.7rem',
  fontWeight: 600
}

const listingAddonStatusDot = {
  width: '.45rem',
  height: '.45rem',
  background: '#56b96b',
  borderRadius: '999px',
  boxShadow: '0 0 8px rgba(86, 185, 107, .55)'
}

const listingAddonButton = {
  width: '100%',
  marginTop: 'auto',
  padding: '.8rem 1rem',
  color: '#fff',
  background: '#292929',
  border: '1px solid #444',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 700
}

const exposureGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))',
  gap: '1rem',
  marginTop: '1.5rem'
}

const exposureCard: React.CSSProperties = {
  background: '#181818',
  border: '1px solid #333',
  borderRadius: '14px',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between'
}

const exposureName: React.CSSProperties = {
  fontWeight: 700,
  fontSize: '1rem',
  marginBottom: '.75rem'
}

const exposurePrice: React.CSSProperties = {
  fontSize: '1.6rem',
  fontWeight: 800,
  color: '#FFD54A',
  marginBottom: '1rem'
}

const purchaseButton: React.CSSProperties = {
    width: '100%',
    padding: '.8rem 1rem',
    color: '#fff',
    background: '#292929',
    border: '1px solid #444',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '.8rem',
    fontWeight: 700
}

const presentationSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const presentationHeader: React.CSSProperties = {
  maxWidth: '680px'
}

const presentationEyebrow: React.CSSProperties = {
  marginBottom: '.4rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase'
}

const presentationHeading: React.CSSProperties = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const presentationSubheading: React.CSSProperties = {
  margin: '.35rem 0 0',
  color: '#fff',
  fontSize: '1rem'
}

const presentationDescription: React.CSSProperties = {
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const presentationGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const presentationCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '245px',
  padding: '1.25rem',
  background:
    'linear-gradient(145deg, #1d1d1d 0%, #151515 100%)',
  border: '1px solid #4c4023',
  borderRadius: '16px'
}

const presentationIcon: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.5rem',
  height: '2.5rem',
  color: '#C7A44B',
  background: '#292313',
  border: '1px solid #4d4226',
  borderRadius: '11px',
  fontSize: '1.1rem'
}

const presentationOptionName: React.CSSProperties = {
  margin: '1rem 0 0',
  color: '#fff',
  fontSize: '1rem'
}

const presentationPrice: React.CSSProperties = {
  marginTop: '.75rem',
  color: '#C7A44B',
  fontSize: '1.7rem',
  fontWeight: 800
}

const presentationButton: React.CSSProperties = {
  width: '100%',
  marginTop: 'auto',
  padding: '.8rem 1rem',
  color: '#161616',
  background: '#C7A44B',
  border: '1px solid #D7B85E',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 700
}

const trustSection = {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #333'
}

const trustHeader = {
    maxWidth: '680px'
}

const trustEyebrow = {
    marginBottom: '.4rem',
    color: '#C7A44B',
    fontSize: '.7rem',
    fontWeight: 700,
    letterSpacing: '.08em',
    textTransform: 'uppercase' as const
}

const trustHeading = {
    margin: 0,
    color: '#ff3b00',
    fontSize: '1.2rem'
}

const trustSubheading = {
    margin: '.35rem 0 0',
    color: '#fff',
    fontSize: '1rem'
}

const trustDescription = {
    margin: '.45rem 0 0',
    color: '#888',
    fontSize: '.86rem',
    lineHeight: 1.5
}

const trustGrid = {
    display: 'grid',
    gridTemplateColumns:
        'repeat(auto-fit, minmax(220px,1fr))',
    gap: '1rem',
    marginTop: '1.5rem'
}

const trustCard = {
    display: 'flex',
    flexDirection: 'column' as const,
    background: '#181818',
    border: '1px solid #333',
    borderRadius: '14px',
    padding: '1.25rem'
}

const trustIcon = {
    width: '2.4rem',
    height: '2.4rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1b4727',
    borderRadius: '50%',
    color: '#fff',
    fontWeight: 700
}

const trustName = {
    marginTop: '1rem',
    color: '#fff'
}

const trustPrice = {
    marginTop: '.75rem',
    color: '#C7A44B',
    fontSize: '1.6rem',
    fontWeight: 800
}

const trustButton = {
    width: '100%',
    marginTop: 'auto',
    padding: '.8rem',
    background: '#292929',
    border: '1px solid #444',
    borderRadius: '10px',
    color: '#fff',
    cursor: 'pointer'
}

const templatesDivider = {
    height: '1px',
    margin: '2rem 0',
    background: '#333'
}

const templateHeading = {
    margin: 0,
    color: '#ff3b00',
    fontSize: '1.2rem'
}

const templateGrid = {
    display: 'grid',
    gridTemplateColumns:
        'repeat(auto-fit,minmax(180px,1fr))',
    gap: '1rem',
    marginTop: '1.25rem'
}

const templateCard = {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    background: '#1b1b1b',
    border: '1px solid #333',
    borderRadius: '14px'
}

const templateIcon = {
    fontSize: '1.5rem',
    color: '#C7A44B'
}

const templateName = {
    marginTop: '.75rem',
    color: '#fff',
    fontWeight: 600
}

const billingSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #3a3a3a'
}

const billingHeader: React.CSSProperties = {
  maxWidth: '680px'
}

const billingPhaseEyebrow: React.CSSProperties = {
  marginBottom: '.4rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase'
}

const billingStepEyebrow: React.CSSProperties = {
  marginBottom: '.4rem',
  color: '#777',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase'
}

const billingHeading: React.CSSProperties = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const billingDescription: React.CSSProperties = {
  maxWidth: '650px',
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const paymentMethodsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const paymentMethodCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '220px',
  padding: '1.25rem',
  background:
    'linear-gradient(145deg, #1d1d1d 0%, #151515 100%)',
  border: '1px solid #343434',
  borderRadius: '16px'
}

const paymentMethodTop: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const paymentMethodIcon: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '2.7rem',
  height: '2.7rem',
  flexShrink: 0,
  color: '#C7A44B',
  background: '#292313',
  border: '1px solid #4d4226',
  borderRadius: '11px',
  fontSize: '1.1rem',
  fontWeight: 700
}

const paymentMethodStatus: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '.4rem',
  padding: '.35rem .65rem',
  border: '1px solid',
  borderRadius: '999px',
  fontSize: '.68rem',
  fontWeight: 600
}

const paymentMethodStatusDot: React.CSSProperties = {
  width: '.45rem',
  height: '.45rem',
  borderRadius: '999px'
}

const paymentMethodName: React.CSSProperties = {
  margin: '1.15rem 0 0',
  color: '#fff',
  fontSize: '1.05rem'
}

const paymentMethodButton: React.CSSProperties = {
  width: '100%',
  marginTop: 'auto',
  padding: '.8rem 1rem',
  color: '#fff',
  background: '#292929',
  border: '1px solid #444',
  borderRadius: '10px',
  fontSize: '.8rem',
  fontWeight: 700
}

const permissionList = {
  display: 'grid',
  gap: '.55rem',
  marginTop: 'auto',
  paddingTop: '1.2rem'
}

const permissionItem = {
  display: 'flex',
  alignItems: 'center',
  gap: '.55rem',
  color: '#fff',
  fontSize: '.85rem',
  fontWeight: 600
}

const permissionCheck = {
  color: '#59c173',
  fontWeight: 700
}

const upgradeCheckoutSection: React.CSSProperties = {
  marginTop: '2rem',
  padding: '1.5rem',
  background: '#191919',
  border: '1px solid #4c4023',
  borderRadius: '18px'
}

const upgradeCheckoutHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const upgradeCheckoutHeading: React.CSSProperties = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const upgradeCheckoutDescription: React.CSSProperties = {
  maxWidth: '650px',
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const upgradeCloseButton: React.CSSProperties = {
  width: '2.25rem',
  height: '2.25rem',
  flexShrink: 0,
  color: '#aaa',
  background: '#242424',
  border: '1px solid #3a3a3a',
  borderRadius: '999px',
  cursor: 'pointer',
  fontSize: '1.25rem'
}

const selectedPackageCard: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginTop: '1.5rem',
  padding: '1.25rem',
  background: '#202020',
  border: '1px solid #333',
  borderRadius: '14px'
}

const selectedPackageLabel: React.CSSProperties = {
  color: '#777',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase'
}

const selectedPackageName: React.CSSProperties = {
  marginTop: '.4rem',
  color: '#fff',
  fontSize: '1.15rem',
  fontWeight: 700
}

const selectedPackagePrices: React.CSSProperties = {
  textAlign: 'right'
}

const selectedPackageUSD: React.CSSProperties = {
  color: '#fff',
  fontSize: '1.5rem',
  fontWeight: 700
}

const selectedPackageCRC: React.CSSProperties = {
  marginTop: '.3rem',
  color: '#888',
  fontSize: '.85rem',
  fontWeight: 600
}

const sinpeForm: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const formField: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.45rem'
}

const formLabel: React.CSSProperties = {
  color: '#aaa',
  fontSize: '.76rem',
  fontWeight: 600
}

const optionalLabel: React.CSSProperties = {
  color: '#666',
  fontWeight: 400
}

const formInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '.8rem .9rem',
  color: '#fff',
  background: '#151515',
  border: '1px solid #3a3a3a',
  borderRadius: '10px',
  fontSize: '.85rem',
  outline: 'none'
}

const formActions: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'flex-end',
  gap: '.75rem',
  gridColumn: '1 / -1',
  marginTop: '.5rem'
}

const cancelUpgradeButton: React.CSSProperties = {
  padding: '.8rem 1.1rem',
  color: '#aaa',
  background: '#292929',
  border: '1px solid #444',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 700
}

const continueUpgradeButton: React.CSSProperties = {
  padding: '.8rem 1.25rem',
  color: '#161616',
  background: '#C7A44B',
  border: '1px solid #D7B85E',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.8rem',
  fontWeight: 700
}

const upgradeErrorMessage:
  React.CSSProperties = {
    gridColumn: '1 / -1',
    padding: '.8rem 1rem',
    color: '#ff9b8a',
    background: '#2a1714',
    border: '1px solid #5b2d25',
    borderRadius: '10px',
    fontSize: '.8rem'
  }

  const pendingUpgradeCard:
  React.CSSProperties = {
    marginTop: '2rem',
    padding: '1.5rem',
    background: '#1d1b15',
    border: '1px solid #665526',
    borderRadius: '18px'
  }

  const pendingUpgradeHeading:
    React.CSSProperties = {
      margin: '.35rem 0 0',
      color: '#C7A44B',
      fontSize: '1.2rem'
    }

  const pendingUpgradeDescription:
    React.CSSProperties = {
      margin: '.5rem 0 0',
      color: '#aaa',
      fontSize: '.85rem',
      lineHeight: 1.5
    }

  const pendingUpgradeDetails:
    React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns:
        'repeat(auto-fit, minmax(180px, 1fr))',
      gap: '1rem',
      marginTop: '1.25rem'
    }

  const pendingUpgradeLabel:
    React.CSSProperties = {
      color: '#777',
      fontSize: '.68rem',
      fontWeight: 700,
      letterSpacing: '.05em',
      textTransform: 'uppercase'
    }

  const pendingUpgradeValue:
    React.CSSProperties = {
      marginTop: '.35rem',
      color: '#fff',
      fontSize: '.88rem',
      fontWeight: 600
    }

  const upgradeOutcomeCard:
    React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns:
        'auto minmax(0, 1fr)',
      gap: '1rem',
      marginTop: '2rem',
      padding: '1.5rem',
      border: '1px solid',
      borderRadius: '18px'
    }

  const upgradeOutcomeIcon:
    React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '2.75rem',
      height: '2.75rem',
      background: '#111',
      border: '1px solid #383838',
      borderRadius: '999px',
      fontSize: '1.25rem',
      fontWeight: 800
    }

  const upgradeOutcomeHeading:
    React.CSSProperties = {
      margin: '.35rem 0 0',
      color: '#fff',
      fontSize: '1.2rem'
    }

  const upgradeOutcomeDescription:
    React.CSSProperties = {
      maxWidth: '700px',
      margin: '.5rem 0 0',
      color: '#aaa',
      fontSize: '.85rem',
      lineHeight: 1.5
    }

  const upgradeOutcomeDetails:
    React.CSSProperties = {
      display: 'grid',
      gridTemplateColumns:
        'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1rem',
      marginTop: '1.1rem'
    }