import bootstrap from './bootstrap';
import services from './services';
import routes from './routes';
import controllers from './controllers';
import contentTypes from './content-types';
import config from './config';

export default () => ({
  bootstrap,
  config,
  routes,
  controllers,
  contentTypes,
  services,
});
