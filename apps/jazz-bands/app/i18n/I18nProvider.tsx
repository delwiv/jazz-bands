import { IntlProvider } from 'react-intl'
import { ReactNode } from 'react'
import { frMessages } from './locales'

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <IntlProvider locale="fr" messages={frMessages}>
      {children}
    </IntlProvider>
  )
}
