import bootstrap from './bootstrap';
import services from './services';
import policies from './policies';
import routes from './routes';
import controllers from './controllers';
import contentTypes from './content-types';
import register from './register';
// import config from './config';

export = () => ({
  register,
  bootstrap,
  // config,
  policies,
  routes,
  controllers,
  contentTypes,
  services,
});
