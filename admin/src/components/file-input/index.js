const React = require('react');
const { Field, FieldLabel, FieldError, FieldInput } = require('@strapi/design-system/Field');
const { Stack } = require('@strapi/design-system/Stack');
const { Flex } = require('@strapi/design-system/Flex');
// const { InputFileOnChange } = require('../../../../types');

const FileInput = ({ name, error, label, required, onFiles }) => {
  const handleOnChange = (e) => onFiles(e.target.files);

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

module.exports = FileInput;
