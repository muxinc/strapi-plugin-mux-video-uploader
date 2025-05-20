import * as Config from './config';
import { ServiceName, ServiceType } from './types';
declare const getService: <T extends "mux">(name: ServiceName) => ServiceType<T>;
export { getService, Config };
