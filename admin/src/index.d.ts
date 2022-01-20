declare const _default: {
    register(app: any): void;
    bootstrap(): void;
    registerTrads({ locales }: {
        locales: string[];
    }): Promise<({
        data: any;
        locale: string;
    } | {
        data: {};
        locale: string;
    })[]>;
};
export default _default;
