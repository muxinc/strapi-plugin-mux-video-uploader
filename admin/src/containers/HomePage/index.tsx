import React from 'react';
import styled from 'styled-components';
import { createUpload } from '@mux/upchunk';

import Well from '../../components/well';
import Header from '../../components/header';
import Form from '../../components/form';
import Uploading from '../../components/uploading';
import Uploaded from '../../components/uploaded';
import SetupNeeded from '../../components/setup-needed';
import { getIsConfigured, submitUpload } from '../../services/strapi';

const ContainerStyled = styled.div`
  padding: 3.1rem 2.5rem 0 2.5rem;
`;

const HomePage = () => {
  const formRef = React.useRef<React.ElementRef<typeof Form>>(null);

  const [isReady, setIsReady] = React.useState<boolean|undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = React.useState<number>();
  const [isComplete, setIsComplete] = React.useState<boolean>(false);
  const [uploadError, setUploadError] = React.useState<string>();

  React.useEffect(() => {
    getIsConfigured().then(data => {
      setIsReady(data === true);

      if(!data) setIsSubmitting(true);
    });
  }, []);

  const uploadFile = (endpoint:string, file:File) => {
    setUploadPercent(0);
    
    const uploadTask = createUpload({ endpoint, file });

    uploadTask.on('error', (err) => setUploadError(err.detail));

    uploadTask.on('progress', (progressEvt) => setUploadPercent(Math.floor(progressEvt.detail)));

    uploadTask.on('success', () => setIsComplete(true));
  }

  const handleOnClick = React.useCallback(() => formRef.current?.submit(), []);

  const handleOnSubmit = React.useCallback(async (title, uploadMethod, media) => {
    setIsSubmitting(true);

    let result;
    
    try {
      result = await submitUpload(title, uploadMethod, media);
    } catch(error) {
      setUploadError(error);

      return;
    }

    const { statusCode, data } = result;

    if(statusCode && statusCode !== 200) {
      setIsSubmitting(false);

      return data?.errors;
    } else if(uploadMethod === "upload") {
      uploadFile(result.url, media);
    } else {
      setUploadPercent(100);
      setIsComplete(true);
    }
  }, []);

  const handleOnReset = () => {
    setIsSubmitting(false);
    setUploadPercent(undefined);
    setIsComplete(false);
    setUploadError(undefined);
  }

  const renderBody = () => {
    if(!isReady) {
      return (<SetupNeeded />);
    } else if(isComplete) {
      return (<Uploaded onReset={handleOnReset} />);
    } else if(uploadPercent !== undefined) {
      return (<Uploading percent={uploadPercent} />);
    } else {
      return (<Form ref={formRef} onSubmit={handleOnSubmit} />);
    }
  }

  if(isReady === undefined) return null;

  return (
    <ContainerStyled>
      <Header onSubmitClick={handleOnClick} disableSubmit={isSubmitting} />
      <Well>
        {renderBody()}
      </Well>
    </ContainerStyled>
  );
};

export default React.memo(HomePage);
