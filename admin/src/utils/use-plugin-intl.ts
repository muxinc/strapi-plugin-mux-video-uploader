import { IntlShape, useIntl } from 'react-intl';

import { PLUGIN_ID } from '../pluginId';
import type translations from '../translations/en.json';

const getTrad = (id: string) => `${PLUGIN_ID}.${id}`;

export type TranslationKey = keyof typeof translations;
export type FormatMessage = (id: string, defaultMessage?: string) => string;

interface UsePluginIntlReturnType extends Omit<IntlShape, 'formatMessage'> {
  formatMessage: FormatMessage;
}

type UsePluginIntlFunction = () => UsePluginIntlReturnType;

const usePluginIntl: UsePluginIntlFunction = () => {
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
};

export default usePluginIntl;
