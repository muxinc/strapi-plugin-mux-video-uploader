import { MuxAsset } from '../../../../types';
interface DefaultProps {
    onClick: (muxAsset: MuxAsset) => void;
}
interface Props extends DefaultProps {
    muxAsset: MuxAsset;
}
declare const AssetCard: {
    (props: Props): JSX.Element;
    defaultProps: DefaultProps;
};
export default AssetCard;
