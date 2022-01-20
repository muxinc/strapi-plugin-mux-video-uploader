interface DefaultProps {
    onReset: () => void;
}
interface Props extends DefaultProps {
}
declare const Uploaded: {
    (props: Props): JSX.Element;
    defaultProps: DefaultProps;
};
export default Uploaded;
