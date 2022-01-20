declare const routes: {
    method: string;
    path: string;
    handler: string;
    config: {
        policies: never[];
        prefix: boolean;
    };
}[];
export default routes;
