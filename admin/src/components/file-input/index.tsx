import React from 'react';
import { Field } from '@strapi/design-system';

interface Props {
  error?: string;
  label?: string;
  name: string;
  required?: boolean;
  onFiles: (files: File[]) => void;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export const FileInput = (props: Props) => {
  const { name, label = undefined, error = undefined, required = false, onFiles = () => {} } = props;
  const handleOnChange = (e: any) => onFiles(e.target.files);

  return (
    <div>
      <Field.Root name={name} error={error}>
        <Field.Label aria-required>{label}</Field.Label>
        <Field.Input type="file" onChange={handleOnChange} />
        <Field.Error />
      </Field.Root>
    </div>
  );
};

FileInput.displayName = 'FileInput';
