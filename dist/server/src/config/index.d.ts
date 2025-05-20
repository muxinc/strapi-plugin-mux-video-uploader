import { Config } from '../utils/config';
declare const _default: {
    default: {
        accessTokenId: string;
        secretKey: string;
        webhookSigningSecret: string;
        playbackSigningId: string;
        playbackSigningSecret: string;
    };
    validator(config: Config): void;
};
export default _default;
