'use client'

import {
  Camera,
  Settings,
  UserRound
} from 'lucide-react'

type SupportedLanguage =
  | 'en'
  | 'es'

type PersonalInformation = {
  name: string
  profilePhoto: string
  bio: string
}

type MarketHubSettingsProps = {
  language: SupportedLanguage
  personalInformation: PersonalInformation
  contactInformation: ContactInformation
  professionalInformation: ProfessionalInformation
  publicProfileInformation: PublicProfileInformation
  languagePreferences: LanguagePreferences
  notificationPreferences: NotificationPreferences
  appearancePreferences: AppearancePreferences
  regionalSettings: RegionalSettings
  privacySettings: PrivacySettings
  securitySettings: SecuritySettings
  sessionSettings: SessionSettings
  connectedAccounts: ConnectedAccount[]
  exportDataSettings: ExportDataSettings
  billingRecordsSettings: BillingRecordsSettings
  accountRecoverySettings: AccountRecoverySettings
  deleteAccountSettings: DeleteAccountSettings
}

type LanguagePreferences = {
  language: string
}

type ContactInformation = {
  email: string
  phone: string
  whatsapp: string
  office: string
}

type ProfessionalInformation = {
  professionalType: string
  licenseNumber: string
  company: string
  website: string
}

type PublicProfileInformation = {
  publicProfileUrl: string
  agentPage: string
  socialLinks: string
  visibility: string
}

type NotificationPreferences = {
  email: boolean
  sms: boolean
  push: boolean
  marketing: boolean
}

type AppearancePreferences = {
  appearance: 'Light' | 'Dark' | 'System'
}

type RegionalSettings = {
  currency: string
  units: string
  dateFormat: string
  timeZone: string
}

type PrivacySettings = {
  publicProfile: boolean
  searchVisibility: boolean
  analyticsSharing: boolean
}

type SecuritySettings = {
  recoveryEmail: string
  twoFactorEnabled: boolean
}

type SessionSettings = {
  loggedInDevices: number
  activeSessions: number
}

type ConnectedAccount = {
  provider: 'Google' | 'Apple' | 'Facebook' | 'Microsoft'
  connected: boolean
  account?: string
}

type ExportDataSettings = {
  listings: boolean
  favorites: boolean
  savedSearches: boolean
  marketAnalyses: boolean
}

type BillingRecordsSettings = {
  invoices: number
  paymentHistory: number
  receipts: number
}

type AccountRecoverySettings = {
  backupCodesRemaining: number
  recoveryOptions: number
  accountRestorable: boolean
}

type DeleteAccountSettings = {
  downloadDataAvailable: boolean
  listingsToDelete: number
}

export default function MarketHubSettings({
  language,
  personalInformation,
  contactInformation,
  professionalInformation,
  publicProfileInformation,
  languagePreferences,
  notificationPreferences,
  appearancePreferences,
  regionalSettings,
  privacySettings,
  securitySettings,
  sessionSettings,
  connectedAccounts,
  exportDataSettings,
  billingRecordsSettings,
  accountRecoverySettings,
  deleteAccountSettings
}: MarketHubSettingsProps) {
  const labels =
    language === 'es'
      ? {
          heading: 'Configuración',
          purpose:
            'Administre su cuenta de MarketHub, preferencias, privacidad y seguridad.',
          phase1: 'Fase 1',
          profile: 'Perfil',
          step1: 'Paso 1',
          personalInformation:
            'Información Personal',
          personalInformationDescription:
            'Administre su nombre, fotografía de perfil y biografía.',
          name: 'Nombre',
          profilePhoto:
            'Fotografía de Perfil',
          bio: 'Biografía',
          uploadPhoto:
            'Subir Fotografía',
          saveChanges:
            'Guardar Cambios',
          
          step2: 'Paso 2',
          contactInformation:
          'Información de Contacto',
          contactInformationDescription:
          'Administre la información que compradores y clientes utilizan para comunicarse con usted.',
          email:
          'Correo Electrónico',
          phone:
          'Teléfono',
          whatsapp:
          'WhatsApp',
          office:
          'Oficina',

          step3: 'Paso 3',
          professionalInformation:
          'Información Profesional',
          professionalInformationDescription:
          'Administre la información profesional que aparece en su perfil público.',
          professionalType:
          'Individual / Corredora',
          licenseNumber:
          'Número de Licencia',
          company:
          'Empresa',
          website:
          'Sitio Web',

          step4: 'Paso 4',
          publicProfile:
          'Perfil Público',
          publicProfileDescription:
          'Administre cómo aparece su perfil para compradores y visitantes.',
          publicProfileUrl:
          'URL del Perfil Público',
          agentPage:
          'Página del Agente',
          socialLinks:
          'Redes Sociales',
          visibility:
          'Visibilidad',

          phase2: 'Fase 2',
          preferences:
          'Preferencias',
          step5: 'Paso 1',
          languagePreferences:
          'Idioma',
          languagePreferencesDescription:
          'Seleccione el idioma predeterminado para MarketHub.',
          english:
          'English',
          spanish:
          'Español',

          preferencesStep2: 'Paso 2',
          notifications:
          'Notificaciones',
          notificationsDescription:
          'Elija cómo desea recibir actualizaciones, alertas y comunicaciones de MarketHub.',
          emailNotifications:
          'Correo Electrónico',
          emailNotificationsDescription:
          'Reciba actualizaciones importantes y actividad de su cuenta por correo electrónico.',
          smsNotifications:
          'SMS',
          smsNotificationsDescription:
          'Reciba alertas importantes mediante mensajes de texto.',
          pushNotifications:
          'Notificaciones Push',
          pushNotificationsDescription:
          'Reciba alertas en tiempo real en sus dispositivos.',
          marketingNotifications:
          'Marketing',
          marketingNotificationsDescription:
          'Reciba novedades, recomendaciones y ofertas de Twuanis.',

          preferencesStep3: 'Paso 3',
          appearance:
          'Apariencia',
          appearanceDescription:
          'Seleccione el tema visual predeterminado para MarketHub.',
          light:
          'Claro',
          dark:
          'Oscuro',
          system:
          'Sistema',

          preferencesStep4: 'Paso 4',
          regionalSettings:
          'Configuración Regional',
          regionalSettingsDescription:
          'Seleccione las preferencias regionales utilizadas en todo MarketHub.',
          currency:
          'Moneda',
          units:
          'Unidades',
          dateFormat:
          'Formato de Fecha',
          timeZone:
          'Zona Horaria',

          phase3: 'Fase 3',
          privacySecurity:
          'Privacidad y Seguridad',
          privacyStep1:
          'Paso 1',
          privacy:
          'Privacidad',
          privacyDescription:
          'Controle quién puede ver su perfil y cómo se utilizan sus datos.',
          publicProfileVisibility:
          'Perfil Público',
          publicProfileVisibilityDescription:
          'Permita que otros usuarios vean su perfil público.',
          searchVisibility:
          'Visibilidad en Búsquedas',
          searchVisibilityDescription:
          'Permita que su perfil aparezca en los resultados de búsqueda.',
          analyticsSharing:
          'Compartir Analíticas',
          analyticsSharingDescription:
          'Ayude a mejorar MarketHub compartiendo datos de uso anónimos.',

          privacyStep2: 'Paso 2',
          security:
          'Seguridad',
          securityDescription:
          'Proteja su cuenta y administre sus opciones de recuperación.',
          password:
          'Contraseña',
          passwordDescription:
          'Actualice la contraseña utilizada para acceder a su cuenta.',
          changePassword:
          'Cambiar Contraseña',
          twoFactorAuthentication:
          'Autenticación de Dos Factores',
          twoFactorAuthenticationDescription:
          'Agregue una segunda capa de protección al iniciar sesión.',
          enabled:
          'Activada',
          disabled:
          'Desactivada',
          recoveryEmail:
          'Correo de Recuperación',
          recoveryEmailDescription:
          'Utilice este correo para recuperar el acceso a su cuenta.',

          privacyStep3: 'Paso 3',
          sessions:
          'Sesiones',
          sessionsDescription:
          'Administre los dispositivos conectados y las sesiones activas de su cuenta.',
          loggedInDevices:
          'Dispositivos Conectados',
          activeSessions:
          'Sesiones Activas',
          signOutEverywhere:
          'Cerrar Sesión en Todos los Dispositivos',

          privacyStep4: 'Paso 4',
          connectedAccounts:
          'Cuentas Conectadas',
          connectedAccountsDescription:
          'Conecte servicios externos para iniciar sesión y administrar su cuenta.',
          connected:
          'Conectada',
          notConnected:
          'No Conectada',
          connect:
          'Conectar',
          disconnect:
          'Desconectar',

          phase4:
          'Fase 4',
          dataManagement:
          'Gestión de Datos',
          dataManagementDescription:
          'Exporte, recupere o elimine los datos asociados con su cuenta de MarketHub.',
          dataStep1:
          'Paso 1',
          exportData:
          'Exportar Datos',
          exportDataDescription:
          'Seleccione los datos de MarketHub que desea incluir en su archivo de exportación.',
          exportListings:
          'Propiedades',
          exportListingsDescription:
          'Exporte sus propiedades publicadas y borradores.',
          exportFavorites:
          'Favoritos',
          exportFavoritesDescription:
          'Exporte las propiedades que ha guardado como favoritas.',
          exportSavedSearches:
          'Búsquedas Guardadas',
          exportSavedSearchesDescription:
          'Exporte sus búsquedas guardadas y criterios de búsqueda.',
          exportMarketAnalyses:
          'Análisis de Mercado',
          exportMarketAnalysesDescription:
          'Exporte los análisis de mercado creados o guardados en MarketHub.',
          exportSelectedData:
          'Exportar Datos Seleccionados',

          dataStep2:
          'Paso 2',
          billingRecords:
          'Historial de Facturación',
          billingRecordsDescription:
          'Acceda a sus facturas, historial de pagos y recibos.',
          invoices:
          'Facturas',
          paymentHistory:
          'Historial de Pagos',
          receipts:
          'Recibos',
          viewAll:
          'Ver Todo',

          dataStep3:
          'Paso 3',
          accountRecovery:
          'Recuperación de Cuenta',
          accountRecoveryDescription:
          'Administre sus métodos de recuperación y restaure el acceso a su cuenta.',
          backupCodes:
          'Códigos de Respaldo',
          backupCodesDescription:
          'Use códigos de respaldo cuando no pueda acceder a su método de autenticación.',
          codesRemaining:
          'Códigos Restantes',
          generateNewCodes:
          'Generar Nuevos Códigos',
          recoveryOptions:
          'Opciones de Recuperación',
          recoveryOptionsDescription:
          'Revise los métodos disponibles para recuperar el acceso a su cuenta.',
          manageOptions:
          'Administrar Opciones',
          restoreAccount:
          'Restaurar Cuenta',
          restoreAccountDescription:
          'Restaure una cuenta desactivada cuando la recuperación todavía esté disponible.',
          available:
          'Disponible',
          unavailable:
          'No Disponible',
          beginRecovery:
          'Iniciar Recuperación',

          dataStep4:
          'Paso 4',
          deleteAccount:
          'Eliminar Cuenta',
          deleteAccountDescription:
          'Descargue sus datos, elimine sus publicaciones y cierre permanentemente su cuenta.',
          downloadData:
          'Descargar Datos',
          downloadDataDescription:
          'Descargue una copia completa de la información asociada con su cuenta.',
          downloadArchive:
          'Descargar Archivo',
          deleteListings:
          'Eliminar Propiedades',
          deleteListingsDescription:
          'Elimine permanentemente todas las propiedades publicadas por esta cuenta.',
          listingsScheduled:
          'Propiedades',
          deleteAllListings:
          'Eliminar Todas las Propiedades',
          permanentlyDeleteAccount:
          'Eliminar Cuenta Permanentemente',
          permanentlyDeleteAccountDescription:
          'Esta acción no se puede deshacer. Todos los datos de MarketHub serán eliminados permanentemente.',
          deleteForever:
          'Eliminar Permanentemente',

        }
      : {
          heading: 'Settings',
          purpose:
            'Manage your MarketHub account, preferences, privacy, and security.',
          phase1: 'Phase 1',
          profile: 'Profile',
          step1: 'Step 1',
          personalInformation:
            'Personal Information',
          personalInformationDescription:
            'Manage your name, profile photo, and bio.',
          name: 'Name',
          profilePhoto:
            'Profile Photo',
          bio: 'Bio',
          uploadPhoto:
            'Upload Photo',
          saveChanges:
            'Save Changes',

          step2: 'Step 2',
          contactInformation:
          'Contact Information',
          contactInformationDescription:
          'Manage the information buyers and clients use to contact you.',
          email:
          'Email',
          phone:
          'Phone',
          whatsapp:
          'WhatsApp',
          office:
          'Office',

          step3: 'Step 3',
          professionalInformation:
          'Professional Information',
          professionalInformationDescription:
          'Manage the professional information displayed on your public profile.',
          professionalType:
          'Individual / Brokerage',
          licenseNumber:
          'License Number',
          company:
          'Company',
          website:
          'Website',

          step4: 'Step 4',
          publicProfile:
          'Public Profile',
          publicProfileDescription:
          'Manage how your profile appears to buyers and visitors.',
          publicProfileUrl:
          'Public Profile URL',
          agentPage:
          'Agent Page',
          socialLinks:
          'Social Links',
          visibility:
          'Visibility',

          phase2: 'Phase 2',
          preferences:
          'Preferences',
          step5: 'Step 1',
          languagePreferences:
          'Language',
          languagePreferencesDescription:
          'Choose the default language for your MarketHub experience.',
          english:
          'English',
          spanish:
          'Español',

          preferencesStep2: 'Step 2',
          notifications:
          'Notifications',
          notificationsDescription:
          'Choose how you receive MarketHub updates, alerts, and communications.',
          emailNotifications:
          'Email',
          emailNotificationsDescription:
          'Receive important account updates and activity by email.',
          smsNotifications:
          'SMS',
          smsNotificationsDescription:
          'Receive important alerts through text messages.',
          pushNotifications:
          'Push',
          pushNotificationsDescription:
          'Receive real-time alerts on your devices.',
          marketingNotifications:
          'Marketing',
          marketingNotificationsDescription:
          'Receive Twuanis news, recommendations, and offers.',
          
          preferencesStep3: 'Step 3',
          appearance:
          'Appearance',
          appearanceDescription:
          'Choose the default visual theme for MarketHub.',
          light:
          'Light',
          dark:
          'Dark',
          system:
          'System',

          preferencesStep4: 'Step 4',
          regionalSettings:
          'Regional Settings',
          regionalSettingsDescription:
          'Choose the regional preferences used throughout MarketHub.',
          currency:
          'Currency',
          units:
          'Units',
          dateFormat:
          'Date Format',
          timeZone:
          'Time Zone',

          phase3: 'Phase 3',
          privacySecurity:
          'Privacy & Security',
          privacyStep1:
          'Step 1',
          privacy:
          'Privacy',
          privacyDescription:
          'Control who can see your profile and how your information is used.',
          publicProfileVisibility:
          'Public Profile',
          publicProfileVisibilityDescription:
          'Allow other users to view your public profile.',
          searchVisibility:
          'Search Visibility',
          searchVisibilityDescription:
          'Allow your profile to appear in search results.',
          analyticsSharing:
          'Analytics Sharing',
          analyticsSharingDescription:
          'Help improve MarketHub by sharing anonymous usage analytics.',

          privacyStep2: 'Step 2',
          security:
          'Security',
          securityDescription:
          'Protect your account and manage your recovery options.',
          password:
          'Password',
          passwordDescription:
          'Update the password used to access your account.',
          changePassword:
          'Change Password',
          twoFactorAuthentication:
          'Two-Factor Authentication',
          twoFactorAuthenticationDescription:
          'Add a second layer of protection when signing in.',
          enabled:
          'Enabled',
          disabled:
          'Disabled',
          recoveryEmail:
          'Recovery Email',
          recoveryEmailDescription:
          'Use this email to recover access to your account.',

          privacyStep3: 'Step 3',
          sessions:
          'Sessions',
          sessionsDescription:
          'Manage connected devices and active sessions across your account.',
          loggedInDevices:
          'Logged-in Devices',
          activeSessions:
          'Active Sessions',
          signOutEverywhere:
          'Sign Out Everywhere',

          privacyStep4: 'Step 4',
          connectedAccounts:
          'Connected Accounts',
          connectedAccountsDescription:
          'Connect external services for sign-in and account management.',
          connected:
          'Connected',
          notConnected:
          'Not Connected',
          connect:
          'Connect',
          disconnect:
          'Disconnect',

          phase4:
          'Phase 4',
          dataManagement:
          'Data Management',
          dataManagementDescription:
          'Export, recover, or remove the data associated with your MarketHub account.',
          dataStep1:
          'Step 1',
          exportData:
          'Export Data',
          exportDataDescription:
          'Choose which MarketHub data should be included in your export file.',
          exportListings:
          'Listings',
          exportListingsDescription:
          'Export your published listings and listing drafts.',
          exportFavorites:
          'Favorites',
          exportFavoritesDescription:
          'Export the properties you have saved as favorites.',
          exportSavedSearches:
          'Saved Searches',
          exportSavedSearchesDescription:
          'Export your saved searches and search criteria.',
          exportMarketAnalyses:
          'Market Analyses',
          exportMarketAnalysesDescription:
          'Export the market analyses you created or saved in MarketHub.',
          exportSelectedData:
          'Export Selected Data',

          dataStep2:
          'Step 2',
          billingRecords:
          'Billing Records',
          billingRecordsDescription:
          'Access your invoices, payment history, and receipts.',
          invoices:
          'Invoices',
          paymentHistory:
          'Payment History',
          receipts:
          'Receipts',
          viewAll:
          'View All',

          dataStep3:
          'Step 3',
          accountRecovery:
          'Account Recovery',
          accountRecoveryDescription:
          'Manage your recovery methods and restore access to your account.',
          backupCodes:
          'Backup Codes',
          backupCodesDescription:
          'Use backup codes when you cannot access your authentication method.',
          codesRemaining:
          'Codes Remaining',
          generateNewCodes:
          'Generate New Codes',
          recoveryOptions:
          'Recovery Options',
          recoveryOptionsDescription:
          'Review the methods available for recovering access to your account.',
          manageOptions:
          'Manage Options',
          restoreAccount:
          'Restore Account',
          restoreAccountDescription:
          'Restore a disabled account while account recovery remains available.',
          available:
          'Available',
          unavailable:
          'Unavailable',
          beginRecovery:
          'Begin Recovery',

          dataStep4:
          'Step 4',
          deleteAccount:
          'Delete Account',
          deleteAccountDescription:
          'Download your data, remove your listings, and permanently close your account.',
          downloadData:
          'Download Data',
          downloadDataDescription:
          'Download a complete archive of the information associated with your account.',
          downloadArchive:
          'Download Archive',
          deleteListings:
          'Delete Listings',
          deleteListingsDescription:
          'Permanently remove every listing published from this account.',
          listingsScheduled:
          'Listings',
          deleteAllListings:
          'Delete All Listings',
          permanentlyDeleteAccount:
          'Permanently Delete Account',
          permanentlyDeleteAccountDescription:
          'This action cannot be undone. All MarketHub data will be permanently removed.',
          deleteForever:
          'Delete Forever',

        }

  return (
    <section style={section}>
      <header>
        <div style={titleRow}>
          <Settings
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

      <section style={profileSection}>
        <div style={phaseEyebrow}>
          {labels.phase1}
        </div>

        <h3 style={phaseHeading}>
          {labels.profile}
        </h3>

        <div style={stepHeader}>
          <div style={stepEyebrow}>
            {labels.step1}
          </div>

          <h4 style={stepHeading}>
            {labels.personalInformation}
          </h4>

          <p style={stepDescription}>
            {labels.personalInformationDescription}
          </p>
        </div>

        <div style={personalInformationGrid}>
          <article style={profilePhotoCard}>
            <div style={fieldLabel}>
              {labels.profilePhoto}
            </div>

            <div style={profilePhotoContainer}>
              {personalInformation.profilePhoto ? (
                <img
                  src={personalInformation.profilePhoto}
                  alt={personalInformation.name}
                  style={profilePhoto}
                />
              ) : (
                <UserRound
                  size={40}
                  strokeWidth={1}
                  color="#777"
                />
              )}
            </div>

            <button
              type="button"
              style={secondaryButton}
            >
              <Camera
                size={16}
                strokeWidth={1.5}
              />

              {labels.uploadPhoto}
            </button>
          </article>

          <article style={profileFormCard}>
            <label style={fieldGroup}>
              <span style={fieldLabel}>
                {labels.name}
              </span>

              <input
                type="text"
                defaultValue={
                  personalInformation.name
                }
                style={textInput}
              />
            </label>

            <label style={fieldGroup}>
              <span style={fieldLabel}>
                {labels.bio}
              </span>

              <textarea
                defaultValue={
                  personalInformation.bio
                }
                rows={6}
                style={textArea}
              />
            </label>

            <button
              type="button"
              style={primaryButton}
            >
              {labels.saveChanges}
            </button>
          </article>
        </div>
      </section>
      
      <section style={contactSection}>
          <div style={stepHeader}>
              <div style={stepEyebrow}>
                  {labels.step2}
              </div>
              <h4 style={stepHeading}>
                  {labels.contactInformation}
              </h4>
              <p style={stepDescription}>
                  {labels.contactInformationDescription}
              </p>
          </div>
          <div style={contactCard}>
              <label style={fieldGroup}>
                  <span style={fieldLabel}>
                      {labels.email}
                  </span>
                  <input
                      type="email"
                      defaultValue={contactInformation.email}
                      style={textInput}
                  />
              </label>
              <label style={fieldGroup}>
                  <span style={fieldLabel}>
                      {labels.phone}
                  </span>
                  <input
                      type="text"
                      defaultValue={contactInformation.phone}
                      style={textInput}
                  />
              </label>
              <label style={fieldGroup}>
                  <span style={fieldLabel}>
                      {labels.whatsapp}
                  </span>
                  <input
                      type="text"
                      defaultValue={contactInformation.whatsapp}
                      style={textInput}
                  />
              </label>
              <label style={fieldGroup}>
                  <span style={fieldLabel}>
                      {labels.office}
                  </span>
                  <input
                      type="text"
                      defaultValue={contactInformation.office}
                      style={textInput}
                  />
              </label>
              <button
                  type="button"
                  style={primaryButton}
              >
                  {labels.saveChanges}
              </button>
          </div>
      </section>

          <section style={professionalSection}>
              <div style={stepHeader}>
                <div style={stepEyebrow}>
                  {labels.step3}
                </div>
                <h4 style={stepHeading}>
                  {labels.professionalInformation}
                </h4>
                <p style={stepDescription}>
                  {labels.professionalInformationDescription}
                </p>
              </div>
              <div style={professionalCard}>
                <label style={fieldGroup}>
                  <span style={fieldLabel}>
                    {labels.professionalType}
                  </span>
                  <input
                    type="text"
                    defaultValue={professionalInformation.professionalType}
                    style={textInput}
                  />
                </label>
                <label style={fieldGroup}>
                  <span style={fieldLabel}>
                    {labels.licenseNumber}
                  </span>
                  <input
                    type="text"
                    defaultValue={professionalInformation.licenseNumber}
                    style={textInput}
                  />
                </label>
                <label style={fieldGroup}>
                  <span style={fieldLabel}>
                    {labels.company}
                  </span>
                  <input
                    type="text"
                    defaultValue={professionalInformation.company}
                    style={textInput}
                  />
                </label>
                <label style={fieldGroup}>
                  <span style={fieldLabel}>
                    {labels.website}
                  </span>
                  <input
                    type="url"
                    defaultValue={professionalInformation.website}
                    style={textInput}
                  />
                </label>
                <button
                  type="button"
                  style={primaryButton}
                >
                  {labels.saveChanges}
                </button>
              </div>
            </section>

            <section style={publicProfileSection}>
                  <div style={stepHeader}>
                    <div style={stepEyebrow}>
                      {labels.step4}
                    </div>
                    <h4 style={stepHeading}>
                      {labels.publicProfile}
                    </h4>
                    <p style={stepDescription}>
                      {labels.publicProfileDescription}
                    </p>
                  </div>
                  <div style={publicProfileCard}>
                    <label style={fieldGroup}>
                      <span style={fieldLabel}>
                        {labels.publicProfileUrl}
                      </span>
                      <input
                        type="text"
                        defaultValue={publicProfileInformation.publicProfileUrl}
                        style={textInput}
                      />
                    </label>
                    <label style={fieldGroup}>
                      <span style={fieldLabel}>
                        {labels.agentPage}
                      </span>
                      <input
                        type="text"
                        defaultValue={publicProfileInformation.agentPage}
                        style={textInput}
                      />
                    </label>
                    <label style={fieldGroup}>
                      <span style={fieldLabel}>
                        {labels.socialLinks}
                      </span>
                      <input
                        type="text"
                        defaultValue={publicProfileInformation.socialLinks}
                        style={textInput}
                      />
                    </label>
                    <label style={fieldGroup}>
                      <span style={fieldLabel}>
                        {labels.visibility}
                      </span>
                      <select
                        defaultValue={publicProfileInformation.visibility}
                        style={textInput}
                      >
                        <option>Public</option>
                        <option>Private</option>
                        <option>Contacts Only</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      style={primaryButton}
                    >
                      {labels.saveChanges}
                    </button>
                  </div>
                </section>

                <section style={preferencesSection}>
                    <div style={phaseEyebrow}>
                      {labels.phase2}
                    </div>
                    <h3 style={phaseHeading}>
                      {labels.preferences}
                    </h3>
                    <div style={stepHeader}>
                      <div style={stepEyebrow}>
                        {labels.step5}
                      </div>
                      <h4 style={stepHeading}>
                        {labels.languagePreferences}
                      </h4>
                      <p style={stepDescription}>
                        {labels.languagePreferencesDescription}
                      </p>
                    </div>
                    <div style={preferencesCard}>
                      <label style={radioRow}>
                        <input
                          type="radio"
                          name="language"
                          value="English"
                          defaultChecked={
                            languagePreferences.language === 'English'
                          }
                        />
                        <span>
                          {labels.english}
                        </span>
                      </label>
                      <label style={radioRow}>
                        <input
                          type="radio"
                          name="language"
                          value="Español"
                          defaultChecked={
                            languagePreferences.language === 'Español'
                          }
                        />
                        <span>
                          {labels.spanish}
                        </span>
                      </label>
                      <button
                        type="button"
                        style={primaryButton}
                      >
                        {labels.saveChanges}
                      </button>
                    </div>
                  </section>

                  <section style={notificationSection}>
                      <div style={stepHeader}>
                        <div style={stepEyebrow}>
                          {labels.preferencesStep2}
                        </div>
                        <h4 style={stepHeading}>
                          {labels.notifications}
                        </h4>
                        <p style={stepDescription}>
                          {labels.notificationsDescription}
                        </p>
                      </div>
                      <div style={notificationCard}>
                        <label style={notificationRow}>
                          <div style={notificationCopy}>
                            <span style={notificationName}>
                              {labels.emailNotifications}
                            </span>
                            <span style={notificationDescription}>
                              {labels.emailNotificationsDescription}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={notificationPreferences.email}
                            style={notificationCheckbox}
                          />
                        </label>
                        <div style={notificationDivider} />
                        <label style={notificationRow}>
                          <div style={notificationCopy}>
                            <span style={notificationName}>
                              {labels.smsNotifications}
                            </span>
                            <span style={notificationDescription}>
                              {labels.smsNotificationsDescription}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={notificationPreferences.sms}
                            style={notificationCheckbox}
                          />
                        </label>
                        <div style={notificationDivider} />
                        <label style={notificationRow}>
                          <div style={notificationCopy}>
                            <span style={notificationName}>
                              {labels.pushNotifications}
                            </span>
                            <span style={notificationDescription}>
                              {labels.pushNotificationsDescription}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={notificationPreferences.push}
                            style={notificationCheckbox}
                          />
                        </label>
                        <div style={notificationDivider} />
                        <label style={notificationRow}>
                          <div style={notificationCopy}>
                            <span style={notificationName}>
                              {labels.marketingNotifications}
                            </span>
                            <span style={notificationDescription}>
                              {labels.marketingNotificationsDescription}
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            defaultChecked={notificationPreferences.marketing}
                            style={notificationCheckbox}
                          />
                        </label>
                        <button
                          type="button"
                          style={primaryButton}
                        >
                          {labels.saveChanges}
                        </button>
                      </div>
                    </section>

                    <section style={appearanceSection}>
                        <div style={stepHeader}>
                          <div style={stepEyebrow}>
                            {labels.preferencesStep3}
                          </div>
                          <h4 style={stepHeading}>
                            {labels.appearance}
                          </h4>
                          <p style={stepDescription}>
                            {labels.appearanceDescription}
                          </p>
                        </div>
                        <div style={appearanceGrid}>
                          {[
                            labels.light,
                            labels.dark,
                            labels.system
                          ].map(option => (
                            <label
                              key={option}
                              style={{
                                ...appearanceCard,
                                border:
                                  appearancePreferences.appearance === option
                                    ? '2px solid #C7A44B'
                                    : '1px solid #303030'
                              }}
                            >
                              <input
                                type="radio"
                                name="appearance"
                                value={option}
                                defaultChecked={
                                  appearancePreferences.appearance === option
                                }
                                style={{
                                  marginBottom: '1rem'
                                }}
                              />
                              <h5 style={appearanceTitle}>
                                {option}
                              </h5>
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          style={{
                            ...primaryButton,
                            marginTop: '1.5rem'
                          }}
                        >
                          {labels.saveChanges}
                        </button>
                      </section>

                 <section style={regionalSection}>
                      <div style={stepHeader}>
                        <div style={stepEyebrow}>
                          {labels.preferencesStep4}
                        </div>
                        <h4 style={stepHeading}>
                          {labels.regionalSettings}
                        </h4>
                        <p style={stepDescription}>
                          {labels.regionalSettingsDescription}
                        </p>
                      </div>
                      <div style={regionalCard}>
                        <label style={fieldGroup}>
                          <span style={fieldLabel}>
                            {labels.currency}
                          </span>
                          <select
                            defaultValue={regionalSettings.currency}
                            style={textInput}
                          >
                            <option>USD ($)</option>
                            <option>CRC (₡)</option>
                            <option>EUR (€)</option>
                          </select>
                        </label>
                        <label style={fieldGroup}>
                          <span style={fieldLabel}>
                            {labels.units}
                          </span>
                          <select
                            defaultValue={regionalSettings.units}
                            style={textInput}
                          >
                            <option>Imperial</option>
                            <option>Metric</option>
                          </select>
                        </label>
                        <label style={fieldGroup}>
                          <span style={fieldLabel}>
                            {labels.dateFormat}
                          </span>
                          <select
                            defaultValue={regionalSettings.dateFormat}
                            style={textInput}
                          >
                            <option>MM/DD/YYYY</option>
                            <option>DD/MM/YYYY</option>
                            <option>YYYY-MM-DD</option>
                          </select>
                        </label>
                        <label style={fieldGroup}>
                          <span style={fieldLabel}>
                            {labels.timeZone}
                          </span>
                          <select
                            defaultValue={regionalSettings.timeZone}
                            style={textInput}
                          >
                            <option>America/Costa_Rica</option>
                            <option>America/Chicago</option>
                            <option>America/New_York</option>
                            <option>UTC</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          style={primaryButton}
                        >
                          {labels.saveChanges}
                        </button>
                      </div>
                    </section>

                    <section style={privacySection}>
                        <div style={phaseEyebrow}>
                          {labels.phase3}
                        </div>
                        <h3 style={phaseHeading}>
                          {labels.privacySecurity}
                        </h3>
                        <div style={stepHeader}>
                          <div style={stepEyebrow}>
                            {labels.privacyStep1}
                          </div>
                          <h4 style={stepHeading}>
                            {labels.privacy}
                          </h4>
                          <p style={stepDescription}>
                            {labels.privacyDescription}
                          </p>
                        </div>
                        <div style={privacyCard}>
                          <label style={notificationRow}>
                            <div style={notificationCopy}>
                              <span style={notificationName}>
                                {labels.publicProfileVisibility}
                              </span>
                              <span style={notificationDescription}>
                                {labels.publicProfileVisibilityDescription}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              defaultChecked={privacySettings.publicProfile}
                              style={notificationCheckbox}
                            />
                          </label>
                          <div style={notificationDivider} />
                          <label style={notificationRow}>
                            <div style={notificationCopy}>
                              <span style={notificationName}>
                                {labels.searchVisibility}
                              </span>
                              <span style={notificationDescription}>
                                {labels.searchVisibilityDescription}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              defaultChecked={privacySettings.searchVisibility}
                              style={notificationCheckbox}
                            />
                          </label>
                          <div style={notificationDivider} />
                          <label style={notificationRow}>
                            <div style={notificationCopy}>
                              <span style={notificationName}>
                                {labels.analyticsSharing}
                              </span>
                              <span style={notificationDescription}>
                                {labels.analyticsSharingDescription}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              defaultChecked={privacySettings.analyticsSharing}
                              style={notificationCheckbox}
                            />
                          </label>
                          <button
                            type="button"
                            style={primaryButton}
                          >
                            {labels.saveChanges}
                          </button>
                        </div>
                      </section>

                  <section style={securitySection}>
                      <div style={stepHeader}>
                        <div style={stepEyebrow}>
                          {labels.privacyStep2}
                        </div>
                        <h4 style={stepHeading}>
                          {labels.security}
                        </h4>
                        <p style={stepDescription}>
                          {labels.securityDescription}
                        </p>
                      </div>
                      <div style={securityGrid}>
                        <article style={securityCard}>
                          <div style={securityCardHeader}>
                            <div>
                              <h5 style={securityTitle}>
                                {labels.password}
                              </h5>
                              <p style={securityDescription}>
                                {labels.passwordDescription}
                              </p>
                            </div>
                            <div style={passwordDots}>
                              ••••••••••••
                            </div>
                          </div>
                          <button
                            type="button"
                            style={secondaryButton}
                          >
                            {labels.changePassword}
                          </button>
                        </article>
                        <article style={securityCard}>
                          <div style={securityCardHeader}>
                            <div>
                              <h5 style={securityTitle}>
                                {labels.twoFactorAuthentication}
                              </h5>
                              <p style={securityDescription}>
                                {labels.twoFactorAuthenticationDescription}
                              </p>
                            </div>
                            <span
                              style={{
                                ...securityStatus,
                                color: securitySettings.twoFactorEnabled
                                  ? '#a9d8b3'
                                  : '#aaa',
                                background: securitySettings.twoFactorEnabled
                                  ? '#18261c'
                                  : '#292929',
                                borderColor: securitySettings.twoFactorEnabled
                                  ? '#294531'
                                  : '#444'
                              }}
                            >
                              {securitySettings.twoFactorEnabled
                                ? labels.enabled
                                : labels.disabled}
                            </span>
                          </div>
                          <label style={securityToggleRow}>
                            <span style={securityToggleLabel}>
                              {labels.twoFactorAuthentication}
                            </span>
                            <input
                              type="checkbox"
                              defaultChecked={
                                securitySettings.twoFactorEnabled
                              }
                              style={notificationCheckbox}
                            />
                          </label>
                        </article>
                        <article style={securityCard}>
                          <div>
                            <h5 style={securityTitle}>
                              {labels.recoveryEmail}
                            </h5>
                            <p style={securityDescription}>
                              {labels.recoveryEmailDescription}
                            </p>
                          </div>
                          <label style={fieldGroup}>
                            <span style={fieldLabel}>
                              {labels.recoveryEmail}
                            </span>
                            <input
                              type="email"
                              defaultValue={
                                securitySettings.recoveryEmail
                              }
                              style={textInput}
                            />
                          </label>
                          <button
                            type="button"
                            style={primaryButton}
                          >
                            {labels.saveChanges}
                          </button>
                        </article>
                      </div>
                    </section>

              <section style={sessionsSection}>
                  <div style={stepHeader}>
                    <div style={stepEyebrow}>
                      {labels.privacyStep3}
                    </div>
                    <h4 style={stepHeading}>
                      {labels.sessions}
                    </h4>
                    <p style={stepDescription}>
                      {labels.sessionsDescription}
                    </p>
                  </div>
                  <div style={sessionsGrid}>
                    <article style={sessionCard}>
                      <div style={sessionNumber}>
                        {sessionSettings.loggedInDevices}
                      </div>
                      <h5 style={sessionTitle}>
                        {labels.loggedInDevices}
                      </h5>
                    </article>
                    <article style={sessionCard}>
                      <div style={sessionNumber}>
                        {sessionSettings.activeSessions}
                      </div>
                      <h5 style={sessionTitle}>
                        {labels.activeSessions}
                      </h5>
                    </article>
                    <article style={sessionCard}>
                      <button
                        type="button"
                        style={dangerButton}
                      >
                        {labels.signOutEverywhere}
                      </button>
                    </article>
                  </div>
                </section>

               <section style={connectedAccountsSection}>
                  <div style={stepHeader}>
                    <div style={stepEyebrow}>
                      {labels.privacyStep4}
                    </div>
                    <h4 style={stepHeading}>
                      {labels.connectedAccounts}
                    </h4>
                    <p style={stepDescription}>
                      {labels.connectedAccountsDescription}
                    </p>
                  </div>
                  <div style={connectedAccountsGrid}>
                    {connectedAccounts.map(account => (
                      <article
                        key={account.provider}
                        style={{
                          ...connectedAccountCard,
                          borderColor: account.connected
                            ? '#5f532e'
                            : '#303030'
                        }}
                      >
                        <div style={connectedAccountHeader}>
                          <div style={providerIcon}>
                            {account.provider.charAt(0)}
                          </div>
                          <div style={connectedAccountCopy}>
                            <h5 style={connectedAccountTitle}>
                              {account.provider}
                            </h5>
                            <span
                              style={{
                                ...connectedAccountStatus,
                                color: account.connected
                                  ? '#d9c77b'
                                  : '#888'
                              }}
                            >
                              {account.connected
                                ? labels.connected
                                : labels.notConnected}
                            </span>
                          </div>
                        </div>
                        {account.account && (
                          <p style={connectedAccountEmail}>
                            {account.account}
                          </p>
                        )}
                        <button
                          type="button"
                          style={
                            account.connected
                              ? secondaryButton
                              : primaryButton
                          }
                        >
                          {account.connected
                            ? labels.disconnect
                            : labels.connect}
                        </button>
                      </article>
                    ))}
                  </div>
                </section>

                <section style={dataManagementSection}>
                    <div style={phaseEyebrow}>
                      {labels.phase4}
                    </div>
                    <h3 style={phaseHeading}>
                      {labels.dataManagement}
                    </h3>
                    <p style={phaseDescription}>
                      {labels.dataManagementDescription}
                    </p>
                    <div style={stepHeader}>
                      <div style={stepEyebrow}>
                        {labels.dataStep1}
                      </div>
                      <h4 style={stepHeading}>
                        {labels.exportData}
                      </h4>
                      <p style={stepDescription}>
                        {labels.exportDataDescription}
                      </p>
                    </div>
                    <div style={exportDataCard}>
                      <label style={exportDataRow}>
                        <div style={exportDataCopy}>
                          <span style={exportDataName}>
                            {labels.exportListings}
                          </span>
                          <span style={exportDataDescription}>
                            {labels.exportListingsDescription}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={exportDataSettings.listings}
                          style={notificationCheckbox}
                        />
                      </label>
                      <div style={exportDataDivider} />
                      <label style={exportDataRow}>
                        <div style={exportDataCopy}>
                          <span style={exportDataName}>
                            {labels.exportFavorites}
                          </span>
                          <span style={exportDataDescription}>
                            {labels.exportFavoritesDescription}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={exportDataSettings.favorites}
                          style={notificationCheckbox}
                        />
                      </label>
                      <div style={exportDataDivider} />
                      <label style={exportDataRow}>
                        <div style={exportDataCopy}>
                          <span style={exportDataName}>
                            {labels.exportSavedSearches}
                          </span>
                          <span style={exportDataDescription}>
                            {labels.exportSavedSearchesDescription}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={exportDataSettings.savedSearches}
                          style={notificationCheckbox}
                        />
                      </label>
                      <div style={exportDataDivider} />
                      <label style={exportDataRow}>
                        <div style={exportDataCopy}>
                          <span style={exportDataName}>
                            {labels.exportMarketAnalyses}
                          </span>
                          <span style={exportDataDescription}>
                            {labels.exportMarketAnalysesDescription}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          defaultChecked={exportDataSettings.marketAnalyses}
                          style={notificationCheckbox}
                        />
                      </label>
                      <button
                        type="button"
                        style={exportDataButton}
                      >
                        {labels.exportSelectedData}
                      </button>
                    </div>
                  </section>

                    <section style={billingRecordsSection}>
                        <div style={stepHeader}>
                          <div style={stepEyebrow}>
                            {labels.dataStep2}
                          </div>
                          <h4 style={stepHeading}>
                            {labels.billingRecords}
                          </h4>
                          <p style={stepDescription}>
                            {labels.billingRecordsDescription}
                          </p>
                        </div>
                        <div style={billingRecordsGrid}>
                          <article style={billingRecordCard}>
                            <div style={billingNumber}>
                              {billingRecordsSettings.invoices}
                            </div>
                            <div style={billingTitle}>
                              {labels.invoices}
                            </div>
                            <button
                              type="button"
                              style={secondaryButton}
                            >
                              {labels.viewAll}
                            </button>
                          </article>
                          <article style={billingRecordCard}>
                            <div style={billingNumber}>
                              {billingRecordsSettings.paymentHistory}
                            </div>
                            <div style={billingTitle}>
                              {labels.paymentHistory}
                            </div>
                            <button
                              type="button"
                              style={secondaryButton}
                            >
                              {labels.viewAll}
                            </button>
                          </article>
                          <article style={billingRecordCard}>
                            <div style={billingNumber}>
                              {billingRecordsSettings.receipts}
                            </div>
                            <div style={billingTitle}>
                              {labels.receipts}
                            </div>
                            <button
                              type="button"
                              style={secondaryButton}
                            >
                              {labels.viewAll}
                            </button>
                          </article>
                        </div>
                      </section>

                    <section style={accountRecoverySection}>
                        <div style={stepHeader}>
                          <div style={stepEyebrow}>
                            {labels.dataStep3}
                          </div>
                          <h4 style={stepHeading}>
                            {labels.accountRecovery}
                          </h4>
                          <p style={stepDescription}>
                            {labels.accountRecoveryDescription}
                          </p>
                        </div>
                        <div style={accountRecoveryGrid}>
                          <article style={accountRecoveryCard}>
                            <div>
                              <h5 style={accountRecoveryTitle}>
                                {labels.backupCodes}
                              </h5>
                              <p style={accountRecoveryDescription}>
                                {labels.backupCodesDescription}
                              </p>
                            </div>
                            <div style={recoveryMetric}>
                              <span style={recoveryMetricNumber}>
                                {accountRecoverySettings.backupCodesRemaining}
                              </span>
                              <span style={recoveryMetricLabel}>
                                {labels.codesRemaining}
                              </span>
                            </div>
                            <button
                              type="button"
                              style={secondaryButton}
                            >
                              {labels.generateNewCodes}
                            </button>
                          </article>
                          <article style={accountRecoveryCard}>
                            <div>
                              <h5 style={accountRecoveryTitle}>
                                {labels.recoveryOptions}
                              </h5>
                              <p style={accountRecoveryDescription}>
                                {labels.recoveryOptionsDescription}
                              </p>
                            </div>
                            <div style={recoveryMetric}>
                              <span style={recoveryMetricNumber}>
                                {accountRecoverySettings.recoveryOptions}
                              </span>
                              <span style={recoveryMetricLabel}>
                                {labels.recoveryOptions}
                              </span>
                            </div>
                            <button
                              type="button"
                              style={secondaryButton}
                            >
                              {labels.manageOptions}
                            </button>
                          </article>
                          <article style={accountRecoveryCard}>
                            <div>
                              <h5 style={accountRecoveryTitle}>
                                {labels.restoreAccount}
                              </h5>
                              <p style={accountRecoveryDescription}>
                                {labels.restoreAccountDescription}
                              </p>
                            </div>
                            <span
                              style={{
                                ...recoveryStatus,
                                color: accountRecoverySettings.accountRestorable
                                  ? '#a9d8b3'
                                  : '#aaa',
                                background: accountRecoverySettings.accountRestorable
                                  ? '#18261c'
                                  : '#292929',
                                borderColor: accountRecoverySettings.accountRestorable
                                  ? '#294531'
                                  : '#444'
                              }}
                            >
                              {accountRecoverySettings.accountRestorable
                                ? labels.available
                                : labels.unavailable}
                            </span>
                            <button
                              type="button"
                              disabled={!accountRecoverySettings.accountRestorable}
                              style={{
                                ...primaryButton,
                                opacity: accountRecoverySettings.accountRestorable
                                  ? 1
                                  : 0.45,
                                cursor: accountRecoverySettings.accountRestorable
                                  ? 'pointer'
                                  : 'not-allowed'
                              }}
                            >
                              {labels.beginRecovery}
                            </button>
                          </article>
                        </div>
                      </section>

                      <section style={deleteAccountSection}>
                          <div style={stepHeader}>
                            <div style={stepEyebrow}>
                              {labels.dataStep4}
                            </div>
                            <h4 style={stepHeading}>
                              {labels.deleteAccount}
                            </h4>
                            <p style={stepDescription}>
                              {labels.deleteAccountDescription}
                            </p>
                          </div>
                          <div style={deleteAccountGrid}>
                            <article style={deleteCard}>
                              <h5 style={deleteCardTitle}>
                                {labels.downloadData}
                              </h5>
                              <p style={deleteCardDescription}>
                                {labels.downloadDataDescription}
                              </p>
                              <button
                                type="button"
                                style={secondaryButton}
                              >
                                {labels.downloadArchive}
                              </button>
                            </article>
                            <article style={deleteCard}>
                              <h5 style={deleteCardTitle}>
                                {labels.deleteListings}
                              </h5>
                              <p style={deleteCardDescription}>
                                {labels.deleteListingsDescription}
                              </p>
                              <div style={deleteMetric}>
                                {deleteAccountSettings.listingsToDelete}
                              </div>
                              <div style={deleteMetricLabel}>
                                {labels.listingsScheduled}
                              </div>
                              <button
                                type="button"
                                style={dangerButton}
                              >
                                {labels.deleteAllListings}
                              </button>
                            </article>
                            <article
                              style={{
                                ...deleteCard,
                                border: '2px solid #7a1f1f'
                              }}
                            >
                              <h5 style={deleteCardTitle}>
                                {labels.permanentlyDeleteAccount}
                              </h5>
                              <p style={deleteCardDescription}>
                                {labels.permanentlyDeleteAccountDescription}
                              </p>
                              <button
                                type="button"
                                style={deleteForeverButton}
                              >
                                {labels.deleteForever}
                              </button>
                            </article>
                          </div>
                        </section>

    </section>
  )
}

const section: React.CSSProperties = {
  padding: '1.5rem',
  background: '#151515',
  border: '1px solid #303030',
  borderRadius: '18px'
}

const titleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '.65rem'
}

const heading: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '1.75rem',
  lineHeight: 1.2
}

const purpose: React.CSSProperties = {
  maxWidth: '700px',
  margin: '.6rem 0 0',
  color: '#aaa',
  fontSize: '.92rem',
  lineHeight: 1.5
}

const divider: React.CSSProperties = {
  height: '1px',
  margin: '1.5rem 0',
  background: '#303030'
}

const profileSection: React.CSSProperties = {
  marginTop: '.25rem'
}

const phaseEyebrow: React.CSSProperties = {
  marginBottom: '.4rem',
  color: '#C7A44B',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.08em',
  textTransform: 'uppercase'
}

const phaseHeading: React.CSSProperties = {
  margin: 0,
  color: '#ff3b00',
  fontSize: '1.2rem'
}

const stepHeader: React.CSSProperties = {
  maxWidth: '680px',
  marginTop: '1.5rem'
}

const stepEyebrow: React.CSSProperties = {
  marginBottom: '.4rem',
  color: '#777',
  fontSize: '.7rem',
  fontWeight: 700,
  letterSpacing: '.06em',
  textTransform: 'uppercase'
}

const stepHeading: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '1.05rem'
}

const stepDescription: React.CSSProperties = {
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.86rem',
  lineHeight: 1.5
}

const personalInformationGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
  'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const profilePhotoCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '350px',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const profilePhotoContainer: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '9rem',
  height: '9rem',
  marginTop: '1.5rem',
  overflow: 'hidden',
  background: '#202020',
  border: '1px solid #3a3a3a',
  borderRadius: '999px'
}

const profilePhoto: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover'
}

const profileFormCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  minHeight: '350px',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const fieldGroup: React.CSSProperties = {
  display: 'grid',
  gap: '.5rem'
}

const fieldLabel: React.CSSProperties = {
  color: '#aaa',
  fontSize: '.76rem',
  fontWeight: 700,
  letterSpacing: '.04em',
  textTransform: 'uppercase'
}

const textInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '.85rem 1rem',
  color: '#fff',
  background: '#111',
  border: '1px solid #3a3a3a',
  borderRadius: '10px',
  fontSize: '.9rem',
  outline: 'none'
}

const textArea: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '.85rem 1rem',
  color: '#fff',
  background: '#111',
  border: '1px solid #3a3a3a',
  borderRadius: '10px',
  resize: 'vertical',
  fontFamily: 'inherit',
  fontSize: '.9rem',
  lineHeight: 1.5,
  outline: 'none'
}

const primaryButton: React.CSSProperties = {
  alignSelf: 'flex-start',
  marginTop: 'auto',
  padding: '.8rem 1rem',
  color: '#161616',
  background: '#C7A44B',
  border: '1px solid #D7B85E',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.82rem',
  fontWeight: 700
}

const secondaryButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '.5rem',
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

const contactSection: React.CSSProperties = {
    marginTop: '2rem',
    paddingTop: '2rem',
    borderTop: '1px solid #333'
}

const contactCard: React.CSSProperties = {
    display: 'grid',
    gap: '1rem',
    marginTop: '1.25rem',
    padding: '1.25rem',
    background: '#191919',
    border: '1px solid #303030',
    borderRadius: '16px'
}

const professionalSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const professionalCard: React.CSSProperties = {
  display: 'grid',
  gap: '1rem',
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const publicProfileSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const publicProfileCard: React.CSSProperties = {
  display: 'grid',
  gap: '1rem',
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const preferencesSection: React.CSSProperties = {
  marginTop: '2.5rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const preferencesCard: React.CSSProperties = {
  display: 'grid',
  gap: '1rem',
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const radioRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '.75rem',
  color: '#fff',
  fontSize: '.95rem'
}

const notificationSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const notificationCard: React.CSSProperties = {
  display: 'grid',
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const notificationRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1.5rem',
  padding: '.4rem 0',
  cursor: 'pointer'
}

const notificationCopy: React.CSSProperties = {
  display: 'grid',
  gap: '.35rem'
}

const notificationName: React.CSSProperties = {
  color: '#fff',
  fontSize: '.95rem',
  fontWeight: 700
}

const notificationDescription: React.CSSProperties = {
  maxWidth: '600px',
  color: '#888',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const notificationCheckbox: React.CSSProperties = {
  width: '1.1rem',
  height: '1.1rem',
  flexShrink: 0,
  accentColor: '#C7A44B',
  cursor: 'pointer'
}

const notificationDivider: React.CSSProperties = {
  height: '1px',
  margin: '1rem 0',
  background: '#303030'
}

const appearanceSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const appearanceGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const appearanceCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  padding: '1.5rem',
  background: '#191919',
  borderRadius: '16px',
  cursor: 'pointer',
  transition: '.2s'
}

const appearanceTitle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '1rem'
}

const regionalSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const regionalCard: React.CSSProperties = {
  display: 'grid',
  gap: '1rem',
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const privacySection: React.CSSProperties = {
  marginTop: '2.5rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const privacyCard: React.CSSProperties = {
  display: 'grid',
  marginTop: '1.25rem',
  padding: '1.25rem',
  background: '#191919',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const securitySection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const securityGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(260px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const securityCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  minHeight: '230px',
  padding: '1.25rem',
  background:
    'linear-gradient(145deg, #1d1d1d 0%, #171717 100%)',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const securityCardHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '1rem'
}

const securityTitle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '.95rem'
}

const securityDescription: React.CSSProperties = {
  maxWidth: '480px',
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.8rem',
  lineHeight: 1.45
}

const passwordDots: React.CSSProperties = {
  flexShrink: 0,
  color: '#C7A44B',
  fontSize: '.85rem',
  letterSpacing: '.08em'
}

const securityStatus: React.CSSProperties = {
  flexShrink: 0,
  padding: '.35rem .65rem',
  border: '1px solid',
  borderRadius: '999px',
  fontSize: '.68rem',
  fontWeight: 700
}

const securityToggleRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem',
  marginTop: 'auto',
  paddingTop: '1rem',
  borderTop: '1px solid #303030',
  cursor: 'pointer'
}

const securityToggleLabel: React.CSSProperties = {
  color: '#aaa',
  fontSize: '.8rem',
  fontWeight: 700
}

const sessionsSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const sessionsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const sessionCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '180px',
  padding: '1.5rem',
  background:
    'linear-gradient(145deg,#1d1d1d 0%,#171717 100%)',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const sessionNumber: React.CSSProperties = {
  color: '#C7A44B',
  fontSize: '2.75rem',
  fontWeight: 700,
  lineHeight: 1
}

const sessionTitle: React.CSSProperties = {
  marginTop: '.85rem',
  color: '#fff',
  fontSize: '.9rem',
  textAlign: 'center'
}

const dangerButton: React.CSSProperties = {
  width: '100%',
  padding: '.9rem 1rem',
  color: '#fff',
  background: '#7a1f1f',
  border: '1px solid #a53b3b',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.82rem',
  fontWeight: 700
}

const connectedAccountsSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const connectedAccountsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const connectedAccountCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.15rem',
  minHeight: '220px',
  padding: '1.25rem',
  background:
    'linear-gradient(145deg, #1d1d1d 0%, #171717 100%)',
  border: '1px solid',
  borderRadius: '16px'
}

const connectedAccountHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '.85rem'
}

const providerIcon: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  width: '42px',
  height: '42px',
  color: '#111',
  background: '#C7A44B',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 800
}

const connectedAccountCopy: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.25rem'
}

const connectedAccountTitle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '.95rem'
}

const connectedAccountStatus: React.CSSProperties = {
  fontSize: '.72rem',
  fontWeight: 700
}

const connectedAccountEmail: React.CSSProperties = {
  margin: 0,
  color: '#888',
  fontSize: '.78rem',
  lineHeight: 1.4,
  wordBreak: 'break-word'
}

const dataManagementSection: React.CSSProperties = {
  marginTop: '2.5rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const exportDataCard: React.CSSProperties = {
  display: 'grid',
  marginTop: '1.25rem',
  padding: '1.25rem',
  background:
    'linear-gradient(145deg, #1d1d1d 0%, #171717 100%)',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const exportDataRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1.5rem',
  padding: '.75rem 0',
  cursor: 'pointer'
}

const exportDataCopy: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.3rem'
}

const exportDataName: React.CSSProperties = {
  color: '#fff',
  fontSize: '.88rem',
  fontWeight: 700
}

const exportDataDescription: React.CSSProperties = {
  maxWidth: '620px',
  color: '#888',
  fontSize: '.76rem',
  lineHeight: 1.45
}

const exportDataDivider: React.CSSProperties = {
  height: '1px',
  background: '#303030'
}

const exportDataButton: React.CSSProperties = {
  width: 'fit-content',
  marginTop: '1.25rem',
  padding: '.9rem 1.15rem',
  color: '#111',
  background: '#C7A44B',
  border: '1px solid #d5b75d',
  borderRadius: '10px',
  cursor: 'pointer',
  fontSize: '.82rem',
  fontWeight: 800
}

const phaseDescription: React.CSSProperties = {
  maxWidth: '700px',
  margin: '.5rem 0 0',
  color: '#888',
  fontSize: '.9rem',
  lineHeight: 1.6
}

const billingRecordsSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const billingRecordsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(220px,1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const billingRecordCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '1rem',
  minHeight: '200px',
  padding: '1.5rem',
  background:
    'linear-gradient(145deg,#1d1d1d 0%,#171717 100%)',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const billingNumber: React.CSSProperties = {
  fontSize: '2.75rem',
  fontWeight: 700,
  color: '#C7A44B'
}

const billingTitle: React.CSSProperties = {
  color: '#fff',
  fontSize: '.9rem',
  fontWeight: 700,
  textAlign: 'center'
}

const accountRecoverySection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const accountRecoveryGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const accountRecoveryCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
  minHeight: '250px',
  padding: '1.25rem',
  background:
    'linear-gradient(145deg, #1d1d1d 0%, #171717 100%)',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const accountRecoveryTitle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '.95rem'
}

const accountRecoveryDescription: React.CSSProperties = {
  margin: '.45rem 0 0',
  color: '#888',
  fontSize: '.78rem',
  lineHeight: 1.45
}

const recoveryMetric: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '.25rem'
}

const recoveryMetricNumber: React.CSSProperties = {
  color: '#C7A44B',
  fontSize: '2.5rem',
  fontWeight: 700,
  lineHeight: 1
}

const recoveryMetricLabel: React.CSSProperties = {
  color: '#888',
  fontSize: '.72rem',
  fontWeight: 700
}

const recoveryStatus: React.CSSProperties = {
  width: 'fit-content',
  padding: '.4rem .7rem',
  border: '1px solid',
  borderRadius: '999px',
  fontSize: '.7rem',
  fontWeight: 700
}

const deleteAccountSection: React.CSSProperties = {
  marginTop: '2rem',
  paddingTop: '2rem',
  borderTop: '1px solid #333'
}

const deleteAccountGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns:
    'repeat(auto-fit,minmax(260px,1fr))',
  gap: '1rem',
  marginTop: '1.25rem'
}

const deleteCard: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  minHeight: '260px',
  padding: '1.5rem',
  background:
    'linear-gradient(145deg,#1d1d1d 0%,#171717 100%)',
  border: '1px solid #303030',
  borderRadius: '16px'
}

const deleteCardTitle: React.CSSProperties = {
  margin: 0,
  color: '#fff',
  fontSize: '.95rem'
}

const deleteCardDescription: React.CSSProperties = {
  margin: 0,
  color: '#888',
  fontSize: '.78rem',
  lineHeight: 1.45
}

const deleteMetric: React.CSSProperties = {
  color: '#C7A44B',
  fontSize: '2.75rem',
  fontWeight: 700
}

const deleteMetricLabel: React.CSSProperties = {
  color: '#888',
  fontSize: '.72rem',
  fontWeight: 700
}

const deleteForeverButton: React.CSSProperties = {
  marginTop: 'auto',
  padding: '1rem',
  color: '#fff',
  background: '#7a1f1f',
  border: '1px solid #b23b3b',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '.82rem'
}