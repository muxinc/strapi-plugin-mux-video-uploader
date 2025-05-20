import React from 'react';
interface Props {
    error?: string;
    label?: string;
    name: string;
    required?: boolean;
    onFiles: (files: File[]) => void;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}
export declare const FileInput: {
    (props: Props): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export {};
