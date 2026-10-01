// Presentation preference only. No account, network or analytical dependency.
export type SiteTheme = 'dark' | 'light'
export const THEME_KEY = 'twuanis-theme'
export const themeTokens = {
 dark: {'--background':'#0a0a0a','--ih-background-image': "url('/images/dark-mode-IH-bg.png')", '--ih-input-label': '#d4af37', '--foreground':'#ededed','--surface':'#131313','--surface-raised':'#202020','--muted':'#b8b8b8','--border':'#666666','--input':'#1c1c1c','--shadow':'rgba(0,0,0,.35)','--accent-text':'#f4db87','--evidence-surface':'#19170f', '--analysis-evidence-surface':'rgba(10,10,10,.90)', '--error-text':'#ffb4a5','--success-text':'#7ee2a8'},
 light: {'--background':'#fafaf7', '--ih-background-image': "url('/images/light-mode-IH-bg.png')", '--ih-input-label': '#556247', '--foreground':'#171717','--surface':'#ffffff','--surface-raised':'#efefeb','--muted':'#525252','--border':'#737373','--input':'#ffffff','--shadow':'rgba(0,0,0,.15)','--accent-text':'#765700','--evidence-surface':'#f8f3df', '--analysis-evidence-surface':'rgba(250,250,247,.92)', '--error-text':'#9b2412','--success-text':'#166534'}
} as const
export function themeCss(theme:SiteTheme){return ':root:root{color-scheme:'+theme+';'+Object.entries(themeTokens[theme]).map(([key,value])=>key+':'+value).join(';')+'}'}
// The bootstrap creates an independent stylesheet, not attributes on React's hydrated tree.
export const themeBootstrap=`(()=>{let t='dark';try{const v=localStorage.getItem(${JSON.stringify(THEME_KEY)});if(v==='light'||v==='dark')t=v}catch{}const s=document.createElement('style');s.id='twuanis-preference-style';s.textContent=t==='light'?${JSON.stringify(themeCss('light'))}:${JSON.stringify(themeCss('dark'))};document.head.appendChild(s)})()`
