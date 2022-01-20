const React = require('react');
const { Switch, Route } = require('react-router-dom');
const { CheckPagePermissions, NotFound } = require('@strapi/helper-plugin');
const { Main } = require('@strapi/design-system');

const pluginPermissions = require('./../../permissions');
const pluginId = require('../../pluginId');
const HomePage = require('../HomePage');

const App = () => {
  return (
    <CheckPagePermissions permissions={pluginPermissions.main}>
      <Main>
        <Switch>
          <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
          <Route component={NotFound} />
        </Switch>
      </Main>
    </CheckPagePermissions>
  );
};

export default App;
