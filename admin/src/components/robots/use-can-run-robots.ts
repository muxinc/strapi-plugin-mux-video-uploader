import React from 'react';
import { useRBAC } from '@strapi/strapi/admin';

import pluginPermissions from '../../permissions';

export function useCanRunRobots() {
  const permissions = React.useMemo(() => [pluginPermissions.robotsRun], []);
  // `useRBAC` names each action after its last segment: `…robots.run` is `canRun`.
  const {
    allowedActions: { canRun },
  } = useRBAC(permissions);

  return !!canRun;
}
