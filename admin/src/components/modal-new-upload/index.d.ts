interface DefaultProps {
    onToggle: (refresh: boolean) => void;
}
interface Props extends DefaultProps {
    isOpen: boolean;
}
declare const ModalNewUpload: {
    (props: Props): JSX.Element;
    defaultProps: DefaultProps;
};
export default ModalNewUpload;
