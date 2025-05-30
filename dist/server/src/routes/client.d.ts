declare const routes: ({
    method: string;
    path: string;
    handler: string;
    config: {
        policies: any[];
        auth?: undefined;
        description?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        auth: boolean;
        policies?: undefined;
        description?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        auth: boolean;
        description: string;
        policies?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        policies?: undefined;
        auth?: undefined;
        description?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        policies: any[];
        auth: boolean;
        description?: undefined;
    };
} | {
    method: string;
    path: string;
    handler: string;
    config: {
        policies: any[];
        description: string;
        auth?: undefined;
    };
})[];
export default routes;
