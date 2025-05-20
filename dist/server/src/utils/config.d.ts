export interface Config {
    accessTokenId?: string;
    secretKey?: string;
    webhookSigningSecret?: string;
    playbackSigningId?: string;
    playbackSigningSecret?: string;
}
type GetConfigFunction = () => Promise<Config>;
declare const getConfig: GetConfigFunction;
export { getConfig };
