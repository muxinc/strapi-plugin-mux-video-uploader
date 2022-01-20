import React from 'react';
interface Props {
    onClose?: () => void;
    isOpen: boolean;
}
declare const ModalBlocking: ({ children, onClose, isOpen }: React.PropsWithChildren<Props>) => JSX.Element | null;
export default ModalBlocking;
