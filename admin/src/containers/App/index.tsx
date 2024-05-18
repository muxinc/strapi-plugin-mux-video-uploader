import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { NotFound } from '@strapi/helper-plugin';
import { Main } from '@strapi/design-system';

import pluginId from '../../plugin-id';
import HomePage from '../HomePage';

const App = () => {
  return (
    <Main>
      <Switch>
        <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
        <Route component={NotFound} />
      </Switch>
    </Main>
  );
};

export default App;
