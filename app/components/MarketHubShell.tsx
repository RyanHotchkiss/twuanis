'use client'
import {useSiteTheme} from '@/app/components/theme/ThemeProvider'

import {
  useState,
  type ReactNode
} from 'react'

import TopBar
  from '@/app/components/TopBar'

import {
  Bell,
  BookOpen,
  BrainCircuit,
  Building2,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  LayoutDashboard,
  Menu,
  Settings,
  X
} from 'lucide-react'


type SupportedLanguage =
  | 'en'
  | 'es'


type MarketHubWorkspace =
  | 'overview'
  | 'listings'
  | 'knowledge'
  | 'intelligence'
  | 'commercial'
  | 'notifications'
  | 'settings'


type MarketHubShellProps = {
  language:
    SupportedLanguage

  overview:
    ReactNode

  listings:
    ReactNode

  knowledge:
    ReactNode

  intelligence:
    ReactNode

  commercial:
    ReactNode

  notifications?:
    ReactNode

  settings:
    ReactNode
}


export default function MarketHubShell({
  language,
  overview,
  listings,
  knowledge,
  intelligence,
  commercial,
  notifications,
  settings
}: MarketHubShellProps) {

  const [
    activeWorkspace,
    setActiveWorkspace
  ] =
    useState<
      MarketHubWorkspace
    >(
      'overview'
    )


  const [
    mobileNavigationOpen,
    setMobileNavigationOpen
  ] =
    useState(
      false
    )

  const {theme,setTheme} = useSiteTheme()

  const labels =
    language === 'es'
      ? {
          marketHub:
            'MarketHub',

          workspace:
            'Centro de Operaciones',

          overview:
            'Resumen',

          listings:
            'Publicaciones',

          knowledge:
            'Conocimiento',

          intelligence:
            'Inteligencia',

          commercial:
            'Comercial',

          notifications:
            'Notificaciones',

          settings:
            'Configuración',

          overviewTitle:
            'Resumen',

          overviewDescription:
            'Vea lo que requiere atención, lo que cambió y dónde continuar trabajando.',

          listingsTitle:
            'Publicaciones',

          listingsDescription:
            'Administre sus propiedades y su ciclo operativo completo.',

          knowledgeTitle:
            'Conocimiento',

          knowledgeDescription:
            'Sus propiedades, búsquedas, análisis, comparaciones, colecciones y notas guardadas.',

          intelligenceTitle:
            'Inteligencia de Mercado',

          intelligenceDescription:
            'Investigue mercados, valore propiedades y trabaje con los motores de inteligencia de Twuanis.',

          commercialTitle:
            'Comercial',

          commercialDescription:
            'Administre su paquete, capacidades, compras, promociones y actividad comercial.',

          notificationsTitle:
            'Notificaciones',

          notificationsDescription:
            'Actividad que requiere su atención.',

          settingsTitle:
            'Configuración',

          settingsDescription:
            'Administre su cuenta, preferencias, privacidad y seguridad.',

          notificationsEmpty:
            'La experiencia centralizada de notificaciones se integrará aquí.'
        }
      : {
          marketHub:
            'MarketHub',

          workspace:
            'Operations Center',

          overview:
            'Overview',

          listings:
            'Listings',

          knowledge:
            'Knowledge',

          intelligence:
            'Intelligence',

          commercial:
            'Commercial',

          notifications:
            'Notifications',

          settings:
            'Settings',

          overviewTitle:
            'Overview',

          overviewDescription:
            'See what needs attention, what changed, and where to continue working.',

          listingsTitle:
            'Listings',

          listingsDescription:
            'Manage your properties and their complete operational lifecycle.',

          knowledgeTitle:
            'Knowledge',

          knowledgeDescription:
            'Your saved properties, searches, analyses, comparisons, collections, and notes.',

          intelligenceTitle:
            'Market Intelligence',

          intelligenceDescription:
            'Investigate markets, value properties, and work with the Twuanis intelligence engines.',

          commercialTitle:
            'Commercial',

          commercialDescription:
            'Manage your package, capabilities, purchases, promotions, and commercial activity.',

          notificationsTitle:
            'Notifications',

          notificationsDescription:
            'Activity requiring your attention.',

          settingsTitle:
            'Settings',

          settingsDescription:
            'Manage your account, preferences, privacy, and security.',

          notificationsEmpty:
            'The centralized notification workspace will live here.'
        }


  const navigationItems: {
    id:
      MarketHubWorkspace

    label:
      string

    icon:
      typeof LayoutDashboard
  }[] = [
    {
      id:
        'overview',

      label:
        labels.overview,

      icon:
        LayoutDashboard
    },

    {
      id:
        'listings',

      label:
        labels.listings,

      icon:
        Building2
    },

    {
      id:
        'knowledge',

      label:
        labels.knowledge,

      icon:
        BookOpen
    },

    {
      id:
        'intelligence',

      label:
        labels.intelligence,

      icon:
        BrainCircuit
    },

    {
      id:
        'commercial',

      label:
        labels.commercial,

      icon:
        CreditCard
    },

    {
      id:
        'notifications',

      label:
        labels.notifications,

      icon:
        Bell
    },

    {
      id:
        'settings',

      label:
        labels.settings,

      icon:
        Settings
    }
  ]


  const workspaceMeta =
    {
      overview: {
        title:
          labels.overviewTitle,

        description:
          labels.overviewDescription
      },

      listings: {
        title:
          labels.listingsTitle,

        description:
          labels.listingsDescription
      },

      knowledge: {
        title:
          labels.knowledgeTitle,

        description:
          labels.knowledgeDescription
      },

      intelligence: {
        title:
          labels.intelligenceTitle,

        description:
          labels.intelligenceDescription
      },

      commercial: {
        title:
          labels.commercialTitle,

        description:
          labels.commercialDescription
      },

      notifications: {
        title:
          labels.notificationsTitle,

        description:
          labels.notificationsDescription
      },

      settings: {
        title:
          labels.settingsTitle,

        description:
          labels.settingsDescription
      }
    } satisfies Record<
      MarketHubWorkspace,
      {
        title:
          string

        description:
          string
      }
    >


  const activeMeta =
    workspaceMeta[
      activeWorkspace
    ]


  function selectWorkspace(
    workspace:
      MarketHubWorkspace
  ) {
    setActiveWorkspace(
      workspace
    )

    setMobileNavigationOpen(
      false
    )

    window.scrollTo({
      top:
        0,

      behavior:
        'smooth'
    })
  }


  function renderWorkspace():
    ReactNode {

    switch (
      activeWorkspace
    ) {
      case 'listings':
        return listings

      case 'knowledge':
        return knowledge

      case 'intelligence':
        return intelligence

      case 'commercial':
        return commercial

      case 'notifications':
        return (
          notifications ??
          (
            <div className="marketHubEmptyWorkspace">
              <Bell
                size={30}
                strokeWidth={1}
              />

              <p>
                {
                  labels.notificationsEmpty
                }
              </p>
            </div>
          )
        )

      case 'settings':
        return settings

      case 'overview':
      default:
        return overview
    }
  }


  return (
      <div
        className={`marketHubTheme marketHubTheme-${theme}`}
      >
        <TopBar
          theme={theme}

          onThemeToggle={() =>
            setTheme(current =>
              current === 'dark'
                ? 'light'
                : 'dark'
            )
          }
        />

        <div className="marketHubShell">

        <aside
          className={
            mobileNavigationOpen
              ? 'marketHubRail marketHubRailOpen'
              : 'marketHubRail'
          }
        >
          <div className="marketHubRailHeader">
            <div>
              <div className="marketHubBrand">
                {labels.marketHub}
              </div>

              <div className="marketHubRailEyebrow">
                {labels.workspace}
              </div>
            </div>

            <button
              type="button"
              className="marketHubRailClose"
              onClick={() =>
                setMobileNavigationOpen(
                  false
                )
              }
              aria-label="Close navigation"
            >
              <X
                size={20}
                strokeWidth={1.25}
              />
            </button>
          </div>


          <nav className="marketHubNavigation">
            {navigationItems.map(
              item => {

                const Icon =
                  item.icon

                const active =
                  activeWorkspace ===
                  item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={
                      active
                        ? 'marketHubNavigationItem marketHubNavigationItemActive'
                        : 'marketHubNavigationItem'
                    }
                    onClick={() =>
                      selectWorkspace(
                        item.id
                      )
                    }
                  >
                    <span className="marketHubNavigationIcon">
                      <Icon
                        size={19}
                        strokeWidth={
                          active
                            ? 1.6
                            : 1.15
                        }
                      />
                    </span>

                    <span className="marketHubNavigationLabel">
                      {item.label}
                    </span>

                    <ChevronRight
                      className="marketHubNavigationArrow"
                      size={15}
                      strokeWidth={1}
                    />
                  </button>
                )
              }
            )}
          </nav>


          <div className="marketHubRailFooter">
            <CircleUserRound
              size={18}
              strokeWidth={1}
            />

            <span>
              Twuanis
            </span>
          </div>
        </aside>


        {mobileNavigationOpen && (
          <button
            type="button"
            className="marketHubRailBackdrop"
            onClick={() =>
              setMobileNavigationOpen(
                false
              )
            }
            aria-label="Close navigation"
          />
        )}

         <button
                type="button"
                className="marketHubMobileMenu"
                onClick={() =>
                  setMobileNavigationOpen(
                    true
                  )
                }
                aria-label="Open MarketHub navigation"
              >
                <Menu
                  size={21}
                  strokeWidth={1.25}
                />
              </button>

        <section className="marketHubWorkspace">

          <header className="marketHubWorkspaceHeader">

            <div className="marketHubWorkspaceIdentity">

              <div>
                <div className="marketHubWorkspaceEyebrow">
                  {labels.marketHub}
                </div>

                <h1 className="marketHubWorkspaceTitle">
                  {activeMeta.title}
                </h1>

                <p className="marketHubWorkspaceDescription">
                  {activeMeta.description}
                </p>
              </div>
            </div>

          </header>


          <div className="marketHubWorkspaceDivider" />


          <main className="marketHubWorkspaceCanvas">
            {renderWorkspace()}
          </main>

        </section>

      </div>


      <style>{`
        .marketHubTheme {
          min-height: 100vh;

          background-color:
            var(--hub-bg);

          background-image:
            var(--hub-background-image);

          background-size:
            cover;

          background-position:
            center top;

          background-repeat:
            no-repeat;

          background-attachment:
            fixed;

          color:
            var(--hub-text);

          transition:
            background-color 250ms ease,
            color 250ms ease;
        }


        .marketHubTheme-dark {
          --hub-bg: #0a0a0a;

          --hub-background-image:
          url('/images/market-hub-dark.webp');

          --hub-rail-start: #101010;
          --hub-rail-end: #0d0d0d;

          --hub-text: #ededed;
          --hub-text-strong: #ffffff;
          --hub-text-secondary: #858585;
          --hub-text-muted: #656565;

          --hub-border: #242424;
          --hub-border-soft: #202020;

          --hub-nav-hover: #171717;
          --hub-nav-active: #1b1b1b;

          --hub-nav-surface:
            rgba(15, 15, 15, .92);

          --hub-nav-surface-border:
            rgba(199, 164, 75, .18);

          --hub-nav-text: #8c8c8c;
          --hub-nav-hover-text: #dddddd;

          --hub-divider-start: #303030;
          --hub-divider-middle: #1c1c1c;

          --hub-control-bg: #151515;
          --hub-control-border: #292929;

          --hub-empty-border: #2b2b2b;

          --hub-surface-primary:
            rgba(21, 21, 21, .96);

          --hub-surface-secondary:
            rgba(27, 27, 27, .96);

          --hub-surface-tertiary:
            rgba(18, 18, 18, .96);

          --hub-surface-border:
            #303030;

          --hub-surface-text:
            #ffffff;

          --hub-surface-muted:
            #999999;
        }


        .marketHubTheme-light {
          --hub-bg: #f7f7f4;

          --hub-background-image:
          url('/images/market-hub-light.webp');

          --hub-rail-start: #ffffff;
          --hub-rail-end: #f1f1ed;

          --hub-text: #222222;
          --hub-text-strong: #000000;
          --hub-text-secondary: #555555;
          --hub-text-muted: #777777;

          --hub-border: #d8d8d2;
          --hub-border-soft: #ddddda;

          --hub-nav-hover: #ecece7;
          --hub-nav-active:
            rgba(239, 232, 213, .97);

          --hub-nav-surface:
            rgba(248, 243, 229, .94);

          --hub-nav-surface-border:
            rgba(199, 164, 75, .22);

          --hub-nav-text: #666666;
          --hub-nav-hover-text: #111111;

          --hub-divider-start: #c8c8c2;
          --hub-divider-middle: #ddddda;

          --hub-control-bg: #ffffff;
          --hub-control-border: #d4d4ce;

          --hub-empty-border: #c9c9c3;

          --hub-surface-primary:
            rgba(248, 243, 229, .96);

          --hub-surface-secondary:
            rgba(252, 248, 238, .96);

          --hub-surface-tertiary:
            rgba(239, 232, 213, .96);

          --hub-surface-border:
            rgba(113, 96, 58, .28);

          --hub-surface-text:
            #222222;

          --hub-surface-muted:
            #68645c;
        }
        .marketHubShell {
          width: 100%;
          min-height: calc(100vh - 72px);
          display: grid;
          grid-template-columns: 228px minmax(0, 1fr);
          background: transparent;
          color: var(--hub-text);
        }

        .marketHubRail {
          position: sticky;
          top: 0;
          align-self: start;
          height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 28px 16px 18px;
          background:
            transparent;

          border-right:
            1px solid var(--hub-border);
          z-index: 40;
        }

        .marketHubRailHeader {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;

          margin:
            0 0 20px;

          padding:
            14px 16px;

          background:
            var(--hub-nav-surface);

          border:
            1px solid var(--hub-nav-surface-border);

          border-radius:
            14px;

          backdrop-filter:
            blur(8px);

          -webkit-backdrop-filter:
            blur(8px);
        }

        .marketHubBrand {
          color: var(--hub-text-strong);
          font-size: 20px;
          font-weight: 750;
          letter-spacing: -0.025em;
        }

        .marketHubRailEyebrow {
          margin-top: 5px;
          color: var(--hub-text-muted);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: .12em;
          text-transform: uppercase;
        }

        .marketHubRailClose {
          display: none;
          padding: 6px;
          color: var(--hub-text-secondary);
          background: transparent;
          border: 0;
          cursor: pointer;
        }

        .marketHubNavigation {
          display: grid;
          gap: 8px;
        }

        .marketHubNavigationItem {
          position: relative;
          width: 100%;
          min-height: 46px;
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr) auto;
          align-items: center;
          gap: 9px;
          padding: 0 11px;
          color: var(--hub-nav-text);
          background:
            var(--hub-nav-surface);

          border:
            1px solid
            var(--hub-nav-surface-border);

          border-radius:
            10px;
          font-family: inherit;
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition:
            color 140ms ease,
            background 140ms ease;
        }

        .marketHubNavigationItem:hover {
          color: var(--hub-nav-hover-text);
          background: var(--hub-nav-hover);
        }

        .marketHubNavigationItemActive {
          color: var(--hub-text-strong);
          background: var(--hub-nav-active);
        }

        .marketHubNavigationItemActive::before {
          content: '';
          position: absolute;
          left: 0;
          top: 11px;
          bottom: 11px;
          width: 2px;
          background: #C7A44B;
          border-radius: 999px;
        }

        .marketHubNavigationIcon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: currentColor;
        }

        .marketHubNavigationItemActive
        .marketHubNavigationIcon {
          color: #C7A44B;
        }

        .marketHubNavigationLabel {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 550;
        }

        .marketHubNavigationArrow {
          opacity: 0;
          color: var(--hub-text-muted);
          transition: opacity 140ms ease;
        }

        .marketHubNavigationItem:hover
        .marketHubNavigationArrow,
        .marketHubNavigationItemActive
        .marketHubNavigationArrow {
          opacity: 1;
        }

        .marketHubRailFooter {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 10px 2px;
          color: var(--hub-text-muted);
          font-size: 11px;
          border-top:
            1px solid var(--hub-border-soft);
        }

        .marketHubWorkspace {
          min-width: 0;
          padding: 34px clamp(24px, 4vw, 64px) 80px;
        }

        .marketHubWorkspaceHeader {
            width: 100%;
            max-width: 1500px;
            margin: 0 auto;

            padding:
              18px 22px;

            background:
              var(--hub-nav-surface);

            border:
              1px solid var(--hub-nav-surface-border);

            border-radius:
              16px;

            backdrop-filter:
              blur(8px);

            -webkit-backdrop-filter:
              blur(8px);

            box-sizing:
              border-box;
          }

        .marketHubWorkspaceIdentity {
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        .marketHubWorkspaceEyebrow {
          margin-bottom: 7px;
          color: #C7A44B;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: .13em;
          text-transform: uppercase;
        }

        .marketHubWorkspaceTitle {
          margin: 0;
          color: var(--hub-text-strong);
          font-size: clamp(28px, 3.1vw, 42px);
          font-weight: 720;
          line-height: 1.05;
          letter-spacing: -0.035em;
        }

        .marketHubWorkspaceDescription {
          max-width: 760px;
          margin: 11px 0 0;
          color: var(--hub-text-secondary);
          font-size: 14px;
          line-height: 1.6;
        }

        .marketHubWorkspaceDivider {
          width: 100%;
          max-width: 1500px;
          height: 1px;
          margin: 20px auto 0;
          background:
          linear-gradient(
            90deg,
            var(--hub-divider-start) 0%,
            var(--hub-divider-middle) 65%,
            transparent 100%
          );
        }

        .marketHubWorkspaceCanvas {
          width: 100%;
          max-width: 1500px;
          margin: 28px auto 0;
        }

        .marketHubMobileMenu {
          display: none;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          flex: 0 0 auto;
          margin-top: 1px;
          color: var(--hub-text-strong);
          background:
            var(--hub-control-bg);
          border:
            1px solid var(--hub-control-border);
          border-radius: 9px;
          cursor: pointer;
        }

        .marketHubRailBackdrop {
          display: none;
        }

        .marketHubEmptyWorkspace {
          min-height: 320px;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 14px;
          color: var(--hub-text-muted);
            border:
              1px dashed var(--hub-empty-border);
          border-radius: 14px;
        }

        .marketHubEmptyWorkspace p {
          max-width: 420px;
          margin: 0;
          color: var(--hub-text-secondary);
          font-size: 13px;
          line-height: 1.6;
          text-align: center;
        }

        @media (max-width: 900px) {
          .marketHubShell {
            grid-template-columns: minmax(0, 1fr);
          }

          .marketHubRail {
            position: fixed;
            top: 0;
            left: 0;
            width: min(290px, 86vw);
            height: 100dvh;
            transform: translateX(-105%);
            box-shadow: 24px 0 60px rgba(0, 0, 0, .45);
            transition: transform 180ms ease;
          }

          .marketHubRailOpen {
            transform: translateX(0);
          }

          .marketHubRailClose {
            display: inline-flex;
          }

          .marketHubRailBackdrop {
            position: fixed;
            inset: 0;
            display: block;
            background: rgba(0, 0, 0, .62);
            border: 0;
            z-index: 30;
          }

          .marketHubMobileMenu {
            position: fixed;

            top: 1rem;
            left: calc(50% + 48px);

            z-index: 10000;

            display: inline-flex;

            width: 50px;
            height: 50px;

            margin: 0;

            border-radius: 18px;

            box-shadow:
              0 8px 30px rgba(0, 0, 0, .18);
          }

          .marketHubWorkspace {
            padding:
              24px
              clamp(16px, 4vw, 28px)
              60px;
          }

          .marketHubWorkspaceDivider {
            margin-top: 22px;
          }

          .marketHubWorkspaceCanvas {
            margin-top: 22px;
          }
        }
      `}</style>
    </div>
  )
}