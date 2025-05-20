import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
export default function ModalDetails(props: {
    onToggle: (refresh: boolean) => void;
    isOpen: boolean;
    muxAsset?: MuxAsset;
    enableUpdate: boolean;
    enableDelete: boolean;
}): import("react/jsx-runtime").JSX.Element | null;
