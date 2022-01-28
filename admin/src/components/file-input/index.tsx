import React from 'react';
import { Field, FieldLabel, FieldError, FieldInput } from '@strapi/design-system/Field';
import { Stack } from '@strapi/design-system/Stack';
import { Flex } from '@strapi/design-system/Flex';

interface Props {
  error?: string;
  label?: string;
  name: string;
  required?: boolean;
  onFiles: (files: File[]) => void;
};

export const FileInput = ({ name, error, label, required, onFiles }: Props) => {
  const handleOnChange = (e: any) => onFiles(e.target.files);

  return (
    <div>
      <Field name={name} error={error}>
        <Stack size={1}>
          {label && (
            <Flex>
              <FieldLabel required={required}>{label}</FieldLabel>
            </Flex>
          )}
          <FieldInput type="file" onChange={handleOnChange} />
          <FieldError />
        </Stack>
      </Field>
    </div>
  );
};

FileInput.displayName = 'FileInput';

FileInput.defaultProps = {
  label: undefined,
  error: undefined,
  required: false,
  onFiles: () => {}
};
