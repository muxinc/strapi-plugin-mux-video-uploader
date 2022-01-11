import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { CheckPagePermissions, NotFound } from '@strapi/helper-plugin';
import { Main } from '@strapi/design-system';

import pluginPermissions from './../../permissions';
import pluginId from '../../pluginId';
import HomePage from '../HomePage';

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
