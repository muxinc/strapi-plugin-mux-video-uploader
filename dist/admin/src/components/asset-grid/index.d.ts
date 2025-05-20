import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
interface Props {
    muxAssets: MuxAsset[] | undefined;
    onMuxAssetClick?: (muxAsset: MuxAsset) => void;
}
declare const AssetGrid: (props: Props) => import("react/jsx-runtime").JSX.Element | null;
export default AssetGrid;
