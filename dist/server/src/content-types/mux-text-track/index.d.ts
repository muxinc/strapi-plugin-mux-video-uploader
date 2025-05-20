declare const _default: {
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
export default _default;
