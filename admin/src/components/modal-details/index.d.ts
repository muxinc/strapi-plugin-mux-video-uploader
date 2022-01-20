import { MuxAsset } from '../../../../types';
interface DefaultProps {
    onToggle: (refresh?: boolean) => void;
}
interface Props extends DefaultProps {
    isOpen: boolean;
    muxAsset?: MuxAsset;
}
declare const ModalDetails: {
    (props: Props): JSX.Element | null;
    defaultProps: DefaultProps;
};
export default ModalDetails;
