import * as Config from './config';
import { ServiceName, ServiceType } from './types';
declare const getCoreStore: () => any;
declare const getService: <T extends "mux">(name: ServiceName) => ServiceType<T>;
export { getCoreStore, getService, Config };
