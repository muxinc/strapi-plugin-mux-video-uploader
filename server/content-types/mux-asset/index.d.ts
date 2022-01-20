declare const _default: {
    kind: string;
    collectionName: string;
    info: {
        name: string;
        description: string;
        displayName: string;
        singularName: string;
        pluralName: string;
    };
    pluginOptions: {
        "content-manager": {
            visible: boolean;
        };
        "content-type-builder": {
            visible: boolean;
        };
    };
    options: {
        increments: boolean;
        timestamps: boolean;
    };
    attributes: {
        title: {
            type: string;
            private: boolean;
            required: boolean;
            maxLength: number;
            minLength: number;
        };
        upload_id: {
            type: string;
            required: boolean;
            maxLength: number;
        };
        asset_id: {
            type: string;
            required: boolean;
            maxLength: number;
        };
        playback_id: {
            type: string;
            required: boolean;
            maxLength: number;
        };
        error_message: {
            type: string;
            required: boolean;
            maxLength: number;
        };
        isReady: {
            type: string;
            default: boolean;
            required: boolean;
        };
    };
};
export = _default;
