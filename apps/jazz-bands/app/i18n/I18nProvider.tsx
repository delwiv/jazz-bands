import type { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { frMessages } from './locales'

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <IntlProvider locale="fr" messages={frMessages}>
      {children}
    </IntlProvider>
  )
}
