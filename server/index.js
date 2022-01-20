const bootstrap = require('./bootstrap');
const services = require('./services');
const routes = require('./routes');
const controllers = require('./controllers');
const contentTypes = require('./content-types');
// const register = require('./register';
// const config = require('./config';

module.exports = () => ({
  // register,
  bootstrap,
  // config,
  routes,
  controllers,
  contentTypes,
  services,
});
