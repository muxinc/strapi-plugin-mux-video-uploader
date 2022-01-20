import React from 'react';
import { UploadMethod } from './types';
interface Props {
    onSubmit: (title: string, uploadMethod: UploadMethod, media: string | File | undefined) => any;
}
interface FormHandles {
    submit(): void;
}
declare const _default: React.ForwardRefExoticComponent<Props & React.RefAttributes<FormHandles>>;
export default _default;
