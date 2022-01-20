import { MuxService } from './../services/mux';

export type ServiceName = 'mux'; 

export type ServiceType<T> = 
  T extends 'mux' ? MuxService :
  never;
