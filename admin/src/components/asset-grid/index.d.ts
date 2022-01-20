import { MuxAsset } from '../../../../types';
interface DefaultProps {
    onMuxAssetClick: (muxAsset: MuxAsset) => void;
}
interface Props extends DefaultProps {
    muxAssets: MuxAsset[] | undefined;
}
declare const AssetGrid: {
    (props: Props): JSX.Element | null;
    defaultProps: DefaultProps;
};
export default AssetGrid;
