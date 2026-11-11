// Presentation preference only. No account, network or analytical dependency.
export type SiteTheme = 'dark' | 'light'
export const THEME_KEY = 'twuanis-theme'
export type SiteFont = 'original' | 'modern' | 'classic'
export const FONT_KEY = 'twuanis-font'
export const siteFonts = {original:'var(--font-cinzel), serif',modern:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',classic:'Georgia, "Times New Roman", serif'} as const
export const validFont = (value:unknown):SiteFont => value==='original'||value==='classic'?value:'modern'
const fontPreviewCss=Object.entries(siteFonts).map(([font,family])=>':root:root body [data-preference-font="'+font+'"]{font-family:'+family+'!important}').join('')
function fontCss(font:SiteFont){return ':root:root body{--site-font-family:'+siteFonts[font]+'}'+(font==='original'?'':':root:root body,:root:root body *{font-family:'+siteFonts[font]+'!important}:root:root body :is(code,pre,kbd,samp,.font-mono,[style*="monospace"]),:root:root body :is(code,pre,kbd,samp,.font-mono,[style*="monospace"]) *{font-family:monospace!important}')+fontPreviewCss}
export const themeTokens = {
 dark: {'--background':'#0a0a0a','--ih-background-image': "url('/images/dark-mode-IH-bg.png')", '--ih-input-label': '#d4af37', '--foreground':'#ededed','--surface':'#131313','--surface-raised':'#202020','--muted':'#b8b8b8','--border':'#666666','--input':'#1c1c1c','--shadow':'rgba(0,0,0,.35)','--accent-text':'#f4db87','--evidence-surface':'#19170f', '--analysis-evidence-surface':'rgba(10,10,10,.90)', '--error-text':'#ffb4a5','--success-text':'#7ee2a8'},
 light: {'--background':'#fafaf7', '--ih-background-image': "url('/images/light-mode-IH-bg.png')", '--ih-input-label': '#556247', '--foreground':'#171717','--surface':'#ffffff','--surface-raised':'#efefeb','--muted':'#525252','--border':'#737373','--input':'#ffffff','--shadow':'rgba(0,0,0,.15)','--accent-text':'#765700','--evidence-surface':'#f8f3df', '--analysis-evidence-surface':'rgba(250,250,247,.92)', '--error-text':'#9b2412','--success-text':'#166534'}
} as const
export type SiteBackground = 'topo' | 'arch' | 'nat' | 'none'
export const BACKGROUND_KEY = 'twuanis-background'
export const validBackground = (value:unknown):SiteBackground => value==='topo'||value==='arch'||value==='nat'||value==='none'?value:'nat'
export function backgroundImage(background:SiteBackground,context:'market-hub'|'packages',theme:SiteTheme){return background==='none'?'none':`url('/images/${background}-${context==='packages'?'packages-bg':'market-hub'}-${theme}.webp')`}
function backgroundCss(theme:SiteTheme,background:SiteBackground){return ':root:root{--ih-background-image:'+backgroundImage(background,'packages',theme)+';--market-hub-background-image:'+backgroundImage(background,'market-hub',theme)+'}'}
function themeColorCss(theme:SiteTheme){return ':root:root{color-scheme:'+theme+';'+Object.entries(themeTokens[theme]).map(([key,value])=>key+':'+value).join(';')+'}'}
export function themeCss(theme:SiteTheme,font:SiteFont='modern',background:SiteBackground='nat'){return themeColorCss(theme)+fontCss(font)+backgroundCss(theme,background)}
const backgroundRules=Object.fromEntries((['dark','light'] as SiteTheme[]).map(theme=>[theme,Object.fromEntries((['topo','arch','nat','none'] as SiteBackground[]).map(background=>[background,backgroundCss(theme,background)]))]))
// Restore all three presentation preferences before paint using the existing stylesheet.
export const themeBootstrap=`(()=>{let t='dark',f='modern',b='nat';try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==='light')t='light';const v=localStorage.getItem(${JSON.stringify(FONT_KEY)});if(v==='original'||v==='modern'||v==='classic')f=v;const a=localStorage.getItem(${JSON.stringify(BACKGROUND_KEY)});if(a==='topo'||a==='arch'||a==='nat'||a==='none')b=a}catch{}const s=document.createElement('style');s.id='twuanis-preference-style';s.textContent=(t==='light'?${JSON.stringify(themeColorCss('light'))}:${JSON.stringify(themeColorCss('dark'))})+({original:${JSON.stringify(fontCss('original'))},modern:${JSON.stringify(fontCss('modern'))},classic:${JSON.stringify(fontCss('classic'))}}[f]||'')+${JSON.stringify(backgroundRules)}[t][b];document.head.appendChild(s)})()`
