import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { NotFound } from '@strapi/helper-plugin';
import { Main } from '@strapi/design-system';

import pluginId from '../../pluginId';
import HomePage from '../HomePage';

const App = () => {
  return (
    <Main>
      <Routes>
        <Route path={`/plugins/${pluginId}`} element={HomePage} />
        <Route element={NotFound} />
      </Routes>
    </Main>
  );
};

export default App;
