import { MuxAsset } from '../../../../server/src/content-types/mux-asset/types';
interface Props {
    muxAsset: MuxAsset;
    onClick?: (muxAsset: MuxAsset) => void;
}
declare const AssetCard: (props: Props) => import("react/jsx-runtime").JSX.Element;
export default AssetCard;
