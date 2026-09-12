import { type App } from 'vue'
import Varlet, { Themes, StyleProvider } from '@varlet/ui'
import '@varlet/ui/es/varlet.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { brandOverrides, DARK_OVERRIDES } from './theme'

let installed = false

export function installVarlet(app: App) {
  if (installed) return

  // Register Varlet components globally
  app.use(Varlet)

  // Start with MD3 Light as base, then apply brand overrides
  const md3 = Themes.toRem(Themes.md3Light)
  StyleProvider({ ...md3, ...brandOverrides })
  
  // Set global body font directly so everything uses Roboto in varlet zone
  document.body.style.fontFamily = "'Roboto', sans-serif"

  installed = true
}

export function setDarkMode(enabled: boolean) {
  const base = Themes.toRem(enabled ? Themes.md3Dark : Themes.md3Light)
  const overrides = enabled ? DARK_OVERRIDES : brandOverrides
  StyleProvider({ ...base, ...overrides })
}

export function uninstallVarlet() {
  if (!installed) return
  StyleProvider(null)
  document.body.style.fontFamily = ""
  installed = false
}
