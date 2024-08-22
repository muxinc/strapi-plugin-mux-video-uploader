import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Main } from '@strapi/design-system';

import pluginId from '../../plugin-id';
import HomePage from '../HomePage';

const App = () => {
  return (
    <Main>
      <Routes>
        <Route path={`/plugins/${pluginId}`} element={HomePage} exact />
      </Routes>
    </Main>
  );
};

export default App;
