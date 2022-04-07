import { AxiosPromise } from 'axios';
import { CONFIG_NAME, PLUGIN_NAME } from './../constants';
import * as Config from './config';
import { ServiceName, ServiceType } from './types';

const getCoreStore = () => {
  return strapi.store({ type: 'plugin', name: CONFIG_NAME });
};

const getService = <T extends ServiceName>(
  name: ServiceName
): ServiceType<T> => {
  return strapi.plugin(PLUGIN_NAME).service(name);
};

const handleAxiosRequest = async (
  request: AxiosPromise<any>
): Promise<{ status: number; statusText: string; data?: any }> => {
  try {
    return await request;
  } catch (err: any) {
    if (err.response) {
      return {
        status: err.response.status,
        statusText: err.response.statusText,
      };
    } else if (err.request) {
      return {
        status: 500,
        statusText: 'No response received',
      };
    } else {
      let errMessage = '';

      if (typeof err === 'string') {
        errMessage = err;
      } else if (typeof err === 'object' && err.message) {
        errMessage = err.message;
      } else {
        errMessage = 'Internal server error';
      }

      return {
        status: 500,
        statusText: errMessage,
      };
    }
  }
};

export { getCoreStore, getService, handleAxiosRequest, Config };
