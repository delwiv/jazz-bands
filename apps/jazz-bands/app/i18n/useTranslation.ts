import { useIntl } from 'react-intl'

export function useTranslation() {
  const intl = useIntl()

  const t = (key: string): string => {
    return intl.formatMessage({ id: key })
  }

  return { t }
}
