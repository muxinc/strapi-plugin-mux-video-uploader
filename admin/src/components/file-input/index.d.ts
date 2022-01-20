interface Props {
    error?: string;
    label?: string;
    name: string;
    required?: boolean;
    onFiles: (files: File[]) => void;
}
export declare const FileInput: {
    ({ name, error, label, required, onFiles }: Props): JSX.Element;
    displayName: string;
    defaultProps: {
        label: undefined;
        error: undefined;
        required: boolean;
        onFiles: () => void;
    };
};
export {};
