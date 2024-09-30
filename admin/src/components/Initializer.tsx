import React from 'react';

import { PLUGIN_ID } from '../pluginId';

type InitializerProps = {
  setPlugin: (id: string) => void;
};

const Initializer = ({ setPlugin }: InitializerProps) => {
  const ref = React.useRef(setPlugin);

  React.useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);

  return null;
};

export { Initializer };
