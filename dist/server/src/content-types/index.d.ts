declare const _default: {
    'mux-asset': {
        schema: {
            kind: string;
            collectionName: string;
            info: {
                description: string;
                displayName: string;
                singularName: string;
                pluralName: string;
            };
            pluginOptions: {
                'content-manager': {
                    visible: boolean;
                };
                'content-type-builder': {
                    visible: boolean;
                };
            };
            options: {
                draftAndPublish: boolean;
            };
            attributes: {
                title: {
                    type: string;
                    private: boolean;
                    required: boolean;
                    maxLength: number;
                    minLength: number;
                    configurable: boolean;
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
                signed: {
                    type: string;
                    default: boolean;
                    required: boolean;
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
                duration: {
                    type: string;
                    required: boolean;
                };
                aspect_ratio: {
                    type: string;
                    required: boolean;
                };
                asset_data: {
                    type: string;
                };
            };
        };
    };
    'mux-text-track': {
        schema: {
            kind: string;
            collectionName: string;
            info: {
                description: string;
                displayName: string;
                singularName: string;
                pluralName: string;
            };
            pluginOptions: {
                'content-manager': {
                    visible: boolean;
                };
                'content-type-builder': {
                    visible: boolean;
                };
            };
            options: {
                draftAndPublish: boolean;
            };
            attributes: {
                name: {
                    type: string;
                    private: boolean;
                    required: boolean;
                };
                language_code: {
                    type: string;
                    private: boolean;
                    required: boolean;
                };
                closed_captions: {
                    type: string;
                    private: boolean;
                    required: boolean;
                };
                file: {
                    type: string;
                    private: boolean;
                    required: boolean;
                };
            };
        };
    };
};
export default _default;
