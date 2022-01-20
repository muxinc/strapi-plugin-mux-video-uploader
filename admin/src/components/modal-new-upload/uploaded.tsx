import React from 'react';
import styled from 'styled-components';
import CircleCheck from '@strapi/icons/CheckCircle';
import { Box } from '@strapi/design-system/Box';
import { Button } from '@strapi/design-system/Button';
import { Flex } from '@strapi/design-system/Flex';
import { Icon } from '@strapi/design-system/Icon';
import { Stack } from '@strapi/design-system/Stack';
import { Typography } from '@strapi/design-system/Typography';

const IconStyled = styled(Icon)`
  display: inline-block
`;

interface DefaultProps {
  onReset: () => void;
}

interface Props extends DefaultProps {}

const Uploaded = (props:Props) => {
  return (
    <Stack>
      <Box paddingTop={5}>
        <Flex justifyContent="center">
          <Typography variant="alpha">
            Uploading Complete&nbsp;<IconStyled color="success500"><CircleCheck /></IconStyled>
          </Typography>
        </Flex>
      </Box>
      <Box paddingTop={5}>
        <Typography variant="omega">The file has been successfully uploaded to Mux and is now able to be referenced by other Content Types within Strapi.</Typography>
      </Box>
      <Box paddingTop={5}>
        <Flex justifyContent="center">
          <Button onClick={props.onReset}>Upload Another</Button>
        </Flex>
      </Box>
    </Stack>
  );
};

Uploaded.defaultProps = {
  onReset: () => {}
} as DefaultProps;

export default Uploaded;
