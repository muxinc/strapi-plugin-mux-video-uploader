declare const deleteConfig: (key: string) => any;
declare const getConfig: (key: string) => Promise<any>;
declare const setConfig: (key: string, value: any) => Promise<boolean>;
export { deleteConfig, getConfig, setConfig };
