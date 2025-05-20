import { IntlShape } from 'react-intl';
import type translations from '../translations/en.json';
export type TranslationKey = keyof typeof translations;
export type FormatMessage = (id: string, defaultMessage?: string) => string;
interface UsePluginIntlReturnType extends Omit<IntlShape, 'formatMessage'> {
    formatMessage: FormatMessage;
}
type UsePluginIntlFunction = () => UsePluginIntlReturnType;
declare const usePluginIntl: UsePluginIntlFunction;
export default usePluginIntl;
