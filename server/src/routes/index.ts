import adminRoutes from './admin';
import clientRoutes from './client';

const routes = {
  admin: {
    type: 'admin',
    routes: adminRoutes,
  },
  'content-api': {
    type: 'content-api',
    routes: clientRoutes,
  },
};

export default routes;
