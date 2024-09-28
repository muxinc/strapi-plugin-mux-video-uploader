import { useIntl } from 'react-intl';
import { PLUGIN_ID } from '../pluginId';
import type translations from '../translations/en.json';

const getTrad = (id: string) => `${PLUGIN_ID}.${id}`;

export default function usePluginIntl() {
  const intl = useIntl();

  const formatMessage = (id: string, defaultMessage?: string) =>
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
