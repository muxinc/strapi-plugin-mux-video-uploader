import { MuxAsset } from '../../../../types';
import '@mux/videojs-kit/dist/index.css';
interface Props {
    muxAsset?: MuxAsset;
}
declare const PreviewPlayer: (props: Props) => JSX.Element | null;
export default PreviewPlayer;
