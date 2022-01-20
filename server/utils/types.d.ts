import { MuxService } from './../services/mux';
export declare type ServiceName = 'mux';
export declare type ServiceType<T> = T extends 'mux' ? MuxService : never;
