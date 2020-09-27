import React from 'react';
import styled from 'styled-components';
import { Label, InputErrors } from 'strapi-helper-plugin';
import { Enumeration, InputText } from '@buffetjs/core';

import { UploadMethod } from './types';

const FirstRowStyled = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 33% auto;
  grid-gap: 1rem;
  padding-bottom: 3rem;
`;

const SecondRowStyled = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: 75% auto;
  grid-gap: 1rem;
  padding-bottom: 3rem;
`;

const FileInputText = styled.input`
  display: block;
  border: 1px solid #E3E9F3;
  width: 100%;
  padding: .5rem;
`;

interface Props {
  onSubmit: (title:string, uploadMethod:UploadMethod, media: string | File | undefined) => any;
}

interface FormHandles {
  submit(): void;
}

const Form:React.ForwardRefRenderFunction<FormHandles, Props> = (props, ref) => {
  const [title, setTitle] = React.useState('');
  const [titleErrs, setTitleErrs] = React.useState([]);
  const [url, setUrl] = React.useState<string>('');
  const [urlErrs, setUrlErrs] = React.useState([]);
  const [uploadMethod, setUploadMethod] = React.useState<UploadMethod>('url');
  const [file, setFile] = React.useState<File>();

  React.useImperativeHandle(ref, () => ({
    submit: async () => {
      setTitleErrs([]);
      setUrlErrs([]);

      const media = uploadMethod === 'url' ? url : file;

      const errors = props.onSubmit(title, uploadMethod, media);

      if(errors === undefined) return;

      setTitleErrs(errors.title || []);
      setUrlErrs(errors.url || []);
    }
  }), [title, uploadMethod, url, file]);

  const handleOnUploadMethodChange = ({ target: { value } }: { target: { value: UploadMethod }}) => {
    setUrlErrs([]);
    setUploadMethod(value);
  }

  const renderUploadMethod = React.useCallback(() => {
    if(uploadMethod === "url") {
      return (<div>
        <Label message={'Url'} />
        <InputText
          name='upload-url'
          onChange={({ target: { value } }:InputTextOnChange) => {
            setUrl(value);
          }}
          type="text"
          placeholder='https://storage.googleapis.com/muxdemofiles/mux-video-intro.mp4'
          value={url}
        />
        <InputErrors errors={urlErrs} />
      </div>);
    } else if(uploadMethod === "upload") {
      return (<div>
        <Label message={'File'} />
        <FileInputText
          name='upload-file'
          onChange={({ target: { files }}) => files && setFile(files[0])}
          type="file"
          accept="video/*"
        />
        <InputErrors errors={urlErrs} />
      </div>);
    } else {
      return null;
    }
  }, [uploadMethod, url, urlErrs]);

  return (
    <>
      <FirstRowStyled>
        <div>
          <Label message={'Title'} />
          <InputText
            name="title"
            onChange={({ target: { value } }:InputTextOnChange) => {
              setTitle(value);
            }}
            placeholder="Title of asset"
            type="text"
            value={title}
          />
          <InputErrors errors={(titleErrs) || []} />
          </div>
          <div>
        <Label message={''} />
          <Enumeration
            name="uploadMethod"
            onChange={handleOnUploadMethodChange}
            options={[
              {
                value: 'url',
                label: 'Url',
              },
              {
                value: 'upload',
                label: 'Upload',
              },
            ]}
            value={uploadMethod}
          />
        </div>
      </FirstRowStyled>
      <SecondRowStyled>
        {renderUploadMethod()}
      </SecondRowStyled>
    </>
  )
};

export default React.forwardRef(Form);
