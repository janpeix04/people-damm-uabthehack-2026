import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

/**
 * i18n lleuger, sense dependències.
 *
 * - Idiomes: català (per defecte), castellà i anglès.
 * - Cada fitxer de `./messages/<ns>.ts` exporta per defecte `{ ca: {...}, es: {...}, en: {...} }`.
 *   Les claus s'hi accedeixen com `<ns>.<clau>` (p. ex. `t('hrNav.home')`).
 * - Interpolació: `{name}` → `t('k', { name: 'Anna' })`.
 * - Plurals: si es passa `count` i existeixen `<clau>_one` / `<clau>_other` (i opcionalment `<clau>_zero`), es tria la forma.
 * - Si falta una traducció es fa servir el català i, si tampoc hi és, la clau.
 */

export type Lang = 'ca' | 'es' | 'en'
export type Dict = Record<string, string>
export type Messages = Record<Lang, Dict>
export type Vars = Record<string, string | number>

export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: 'ca', label: 'Català', short: 'CA' },
  { code: 'es', label: 'Castellano', short: 'ES' },
  { code: 'en', label: 'English', short: 'EN' },
]

const LOCALES: Record<Lang, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' }
const STORAGE_KEY = 'damm-lang'
const FALLBACK: Lang = 'ca'

// Carrega tots els diccionaris de ./messages (un fitxer per espai de noms).
const modules = import.meta.glob<{ default: Messages }>('./messages/*.ts', { eager: true })
const DICTS: Messages = { ca: {}, es: {}, en: {} }
for (const [path, mod] of Object.entries(modules)) {
  const ns = path.replace(/^.*\/(.+)\.ts$/, '$1')
  for (const lang of Object.keys(DICTS) as Lang[]) {
    for (const [k, v] of Object.entries(mod.default[lang] ?? {})) DICTS[lang][`${ns}.${k}`] = v
  }
}

const isLang = (v: unknown): v is Lang => v === 'ca' || v === 'es' || v === 'en'

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLang(saved)) return saved
  } catch { /* sense emmagatzematge */ }
  const nav = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  for (const l of nav) {
    const base = l?.slice(0, 2).toLowerCase()
    if (isLang(base)) return base
  }
  return FALLBACK
}

// Idioma actual a nivell de mòdul, per a codi fora de React (errors d'API, format de números…).
let current: Lang = detectLang()
export const getLang = () => current
export const getLocale = () => LOCALES[current]

function lookup(lang: Lang, key: string): string | undefined {
  return DICTS[lang][key] ?? DICTS[FALLBACK][key]
}

export function translate(key: string, vars?: Vars, lang: Lang = current): string {
  let msg: string | undefined
  if (vars && typeof vars.count === 'number') {
    const n = vars.count
    if (n === 0) msg = lookup(lang, `${key}_zero`)
    if (msg == null) {
      const form = new Intl.PluralRules(LOCALES[lang]).select(n)
      msg = lookup(lang, `${key}_${form}`) ?? lookup(lang, `${key}_other`)
    }
  }
  msg ??= lookup(lang, key)
  if (msg == null) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing key: ${key}`)
    return key
  }
  return vars ? msg.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : msg
}

export type TFn = (key: string, vars?: Vars) => string

interface I18nValue {
  lang: Lang
  locale: string
  setLang: (l: Lang) => void
  t: TFn
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current)
  const setLang = useCallback((l: Lang) => {
    current = l
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* sense emmagatzematge */ }
  }, [])
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const value = useMemo<I18nValue>(() => ({ lang, locale: LOCALES[lang], setLang, t: (k, v) => translate(k, v, lang) }), [lang, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const v = useContext(I18nContext)
  if (!v) throw new Error('useI18n must be used inside I18nProvider')
  return v
}

/** Drecera: `const t = useT()` */
export const useT = () => useI18n().t
