const React = require('react');

const usePrevious = function (value) {
  const ref = React.useRef();

  React.useEffect(() => { ref.current = value; });
  
  return ref.current;
}

module.exports = usePrevious;
