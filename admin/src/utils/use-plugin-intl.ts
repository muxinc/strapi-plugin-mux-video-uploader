import { useIntl } from 'react-intl';
import pluginId from '../plugin-id';
import type translations from '../translations/en.json';

const getTrad = (id: string) => `${pluginId}.${id}`;

export default function usePluginIntl() {
  const intl = useIntl();

  const formatMessage = (id: TranslationKey, defaultMessage?: string) =>
    intl.formatMessage({
      id: getTrad(id),
      defaultMessage,
    });

  return {
    ...intl,
    formatMessage,
  };
}

export type TranslationKey = keyof typeof translations;
export type FormatMessage = ReturnType<typeof usePluginIntl>['formatMessage'];
