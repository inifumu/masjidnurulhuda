// Brand colors mapped to Varlet M3 CSS variable overrides
// 60% neutral surface / 30% emerald primary / 10% gold accent

export const brandOverrides = {
  '--font-family-standard': "'Roboto', sans-serif",
  // PRIMARY — Emerald
  '--color-primary': '#0B6B4B',
  '--color-on-primary': '#FFFFFF',
  '--color-primary-container': '#B5F0CC',
  '--color-on-primary-container': '#002114',
  // SECONDARY — Gold (accent, used sparingly)
  '--color-secondary': '#D6A62E',
  '--color-on-secondary': '#FFFFFF',
  '--color-secondary-container': '#FDE68A',
  '--color-on-secondary-container': '#412E00',
  // TERTIARY
  '--color-tertiary': '#4A6552',
  '--color-on-tertiary': '#FFFFFF',
  '--color-tertiary-container': '#CCEBD3',
  '--color-on-tertiary-container': '#072011',
  // SURFACE — warm neutral (60%)
  '--color-background': '#F8FAF6',
  '--color-on-background': '#1A1C18',
  '--color-surface': '#F8FAF6',
  '--color-on-surface': '#1A1C18',
  '--color-surface-variant': '#DDE5DA',
  '--color-on-surface-variant': '#414941',
  // ERROR
  '--color-error': '#BA1A1A',
  '--color-on-error': '#FFFFFF',
  '--color-error-container': '#FFDAD6',
  '--color-on-error-container': '#410002',
  // OUTLINE
  '--color-outline': '#717972',
  '--color-outline-variant': '#C1C9C0',
  // ELEVATION
  '--color-elevation-1': '#F2F5EF',
  '--color-elevation-2': '#EDF0EA',
  '--color-elevation-3': '#E7EAE2',
}

export const DARK_OVERRIDES: Record<string, string> = {
  '--font-family-standard': "'Roboto', sans-serif",
  '--color-primary': '#95D5B1',
  '--color-on-primary': '#003921',
  '--color-primary-container': '#0B5235',
  '--color-on-primary-container': '#B5F0CC',
  '--color-secondary': '#F5D889',
  '--color-on-secondary': '#3E2D00',
  '--color-secondary-container': '#5A4100',
  '--color-on-secondary-container': '#FDE68A',
  '--color-background': '#1A1C18',
  '--color-on-background': '#E2E3DD',
  '--color-surface': '#1A1C18',
  '--color-on-surface': '#E2E3DD',
  '--color-surface-variant': '#414941',
  '--color-on-surface-variant': '#C1C9C0',
  '--color-outline': '#8B938A',
  '--color-outline-variant': '#414941',
  '--color-elevation-1': '#222420',
  '--color-elevation-2': '#272925',
  '--color-elevation-3': '#2C2E2A',
}
