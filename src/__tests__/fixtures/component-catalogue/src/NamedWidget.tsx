import {useTranslation} from 'react-i18next'
import type {JSX} from 'react'
import './Styled.css'

export function NamedWidget(): JSX.Element {
  const {t} = useTranslation()
  return <p>{t('widget.label')}</p>
}

const registeredComponents = [NamedWidget]
void registeredComponents
