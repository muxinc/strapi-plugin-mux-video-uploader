const React = require('react');
const PropTypes = require('prop-types');

const pluginId = require('../../pluginId');

const Initializer = ({ updatePlugin }) => {
  const ref = React.useRef();

  ref.current = updatePlugin;

  React.useEffect(() => {
    ref.current(pluginId, 'isReady', true);
  }, []);

  return null;
};

Initializer.propTypes = {
  updatePlugin: PropTypes.func.isRequired,
};

module.exports = Initializer;
