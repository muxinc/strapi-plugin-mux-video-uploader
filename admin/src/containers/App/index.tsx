import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { CheckPagePermissions, NotFound } from 'strapi-helper-plugin';

import pluginPermissions from './../../permissions';
import pluginId from '../../pluginId';
import HomePage from '../HomePage';

const App = () => {
  return (
    <>
      <CheckPagePermissions permissions={pluginPermissions.main}>
        <Switch>
          <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
          <Route component={NotFound} />
        </Switch>
      </CheckPagePermissions>
    </>
  );
};

export default App;
