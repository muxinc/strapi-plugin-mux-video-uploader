import React from 'react';
import { Button, InputText, Padded, Toggle } from '@buffetjs/core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { HeaderModal, HeaderModalTitle, Label, Modal, ModalBody, ModalForm, ModalFooter } from 'strapi-helper-plugin';
import styled from 'styled-components';

import { MuxAsset } from '../../../../models/mux-asset';
import PreviewPlayer from '../preview-player';
import Summary from './summary';
import { setMuxAsset } from '../../services/strapi';

const HeaderTitle = styled(HeaderModalTitle)`
  text-transform: none;
  align-items: center;
`;

const BodyWrapper = styled.div`
  display: flex;
  flex: 1;
  margin-bottom: 60px;
  overflow: hidden;

  & > div {
    flex: 1;
    margin: 0 15px;
  }
`;

const MetadataContainer = styled.div`
  padding: -10px 0;

  & > div {
    padding-bottom: 20px;
  }
`;

const ErrorContainer = styled(Padded)`
  background-color: #FEEDE6;
`;

const LeftFooterContainer = styled.div`
  margin: auto 0px;

  & > * {
    margin-right: 10px !important;
  }
`;

interface DefaultProps {
  onToggle: (updatedMuxAsset:MuxAsset) => void;
}

interface Props extends DefaultProps{
  isOpen: boolean;
  muxAsset?: MuxAsset;
}

const ModalDetails = (props:Props) => {
  const { isOpen, muxAsset, onToggle } = props;

  const handleOnTitleChange = (e:InputTextOnChange) => setTitle(e.target.value);
  const handleOnIsReadyChange = (e:ToggleOnChange) => setIsReady(e.target.value);

  if(muxAsset === undefined) return null;

  const [title, setTitle] = React.useState<string>(muxAsset.title);
  const [isReady, setIsReady] = React.useState<boolean>(muxAsset.isReady);

  const handleOnDelete = () => {

  };

  const handleOnSubmit = async (e:any) => {
    e.preventDefault();

    const updatedMuxAsset = await setMuxAsset({ id: muxAsset.id, title, isReady });

    onToggle(updatedMuxAsset);
  };

  return (
    <Modal isOpen={isOpen} onToggle={onToggle}>
      <HeaderModal onToggle={onToggle}>
        <section>
          <HeaderTitle>Details</HeaderTitle>
        </section>
      </HeaderModal>
      <form onSubmit={handleOnSubmit}>
        <ModalForm>
          <ModalBody>
            <BodyWrapper>
              <div>
                <PreviewPlayer muxAsset={muxAsset} />
              </div>
              <MetadataContainer>
                { 
                  muxAsset.error_message &&
                  <div>
                    <ErrorContainer top bottom right left size="sm">
                      {muxAsset.error_message}
                    </ErrorContainer>
                  </div>
                }
                <div>
                  <Label message='Title' />
                  <InputText
                    name="title"
                    type="text"
                    value={title}
                    onChange={handleOnTitleChange}
                    required
                  />
                </div>
                <div>
                  <Label message='Is ready' />
                  <Toggle
                    name="toggle"
                    onChange={handleOnIsReadyChange}
                    value={isReady}
                  />
                </div>
                <div>
                  <Summary muxAsset={muxAsset} />
                </div>
              </MetadataContainer>
            </BodyWrapper>
          </ModalBody>
        </ModalForm>
        <ModalFooter>
          <section>
            <LeftFooterContainer>
              <Button onClick={onToggle} color="cancel">Cancel</Button>
              <Button onClick={handleOnDelete} color="delete" icon={<FontAwesomeIcon icon={faTrashAlt} />}>Delete</Button>
            </LeftFooterContainer>
            <Button type="submit" color="success">Finish</Button>
          </section>
        </ModalFooter>
      </form>
    </Modal>
  )
}

ModalDetails.defaultProps = {
  onToggle: () => {}
} as DefaultProps;

export default ModalDetails;
