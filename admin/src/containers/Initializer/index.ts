import React from 'react';
import PropTypes from 'prop-types';

import pluginId from '../../pluginId';

const Initializer = ({ updatePlugin }: any) => {
  const ref = React.useRef<any>();

  ref.current = updatePlugin;

  React.useEffect(() => {
    ref.current(pluginId, 'isReady', true);
  }, []);

  return null;
};

Initializer.propTypes = {
  updatePlugin: PropTypes.func.isRequired,
};

export default Initializer;
