import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { NotFound } from '@strapi/helper-plugin';
import { Main } from '@strapi/design-system';

import pluginId from '../../plugin-id';
import HomePage from '../HomePage';

const App = () => {
  return (
    <Main>
      {/* @ts-expect-error issue with react-router-dom typings */}
      <Switch>
        {/* @ts-expect-error issue with react-router-dom typings */}
        <Route path={`/plugins/${pluginId}`} component={HomePage} exact />
        {/* @ts-expect-error issue with react-router-dom typings */}
        <Route component={NotFound} />
      </Switch>
    </Main>
  );
};

export default App;
