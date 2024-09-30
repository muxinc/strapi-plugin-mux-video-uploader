import { PLUGIN_NAME } from '../constants';
import * as Config from './config';
import { ServiceName, ServiceType } from './types';

const getService = <T extends ServiceName>(name: ServiceName): ServiceType<T> => {
  return strapi.plugin(PLUGIN_NAME).service(name);
};

export { getService, Config };
