import React from 'react';

import pluginId from '../../plugin-id';

const Initializer = ({ updatePlugin }: { updatePlugin: Function }) => {
  const ref = React.useRef<any>();

  ref.current = updatePlugin;

  React.useEffect(() => {
    ref.current(pluginId, 'isReady', true);
  }, []);

  return null;
};

export default Initializer;
