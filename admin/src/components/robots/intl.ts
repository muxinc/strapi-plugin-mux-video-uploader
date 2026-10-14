import React from 'react';
import { useIntl } from 'react-intl';

import { getTranslation } from '../../utils/getTranslation';

type Values = Record<string, string | number | boolean | null | undefined | Date>;

/** Like `usePluginIntl`, but `t` also takes ICU values. */
export function useRobotsIntl() {
  const intl = useIntl();

  const t = React.useCallback(
    (id: string, defaultMessage: string, values?: Values) =>
      intl.formatMessage({ id: getTranslation(id), defaultMessage }, values) as string,
    [intl]
  );

  return { t };
}

export type Translate = ReturnType<typeof useRobotsIntl>['t'];
