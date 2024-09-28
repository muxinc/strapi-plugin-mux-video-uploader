import React from 'react';
import { useIntl } from 'react-intl';
import styled from 'styled-components';
import { Box, Flex, ProgressBar, Typography } from '@strapi/design-system';

import { getTranslation } from '../../utils/getTranslation';

const ProgressBarWrapper = styled.div`
  width: 60%;
`;

const ProgessBarUnleased = styled(ProgressBar)`
  width: 100%;
`;

interface Props {
  percent: number;
}

const Uploading = (props: Props) => {
  const { formatMessage } = useIntl();

  return (
    <>
      <Box paddingBottom={5}>
        <Flex justifyContent="center">
          <Typography variant="alpha">
            {formatMessage({
              id: getTranslation('Uploading.uploading'),
              defaultMessage: 'Uploading to Mux',
            })}
          </Typography>
        </Flex>
      </Box>
      <Box paddingBottom={5}>
        <Flex justifyContent="center">
          <ProgressBarWrapper>
            <ProgessBarUnleased value={props.percent} />
          </ProgressBarWrapper>
        </Flex>
      </Box>
    </>
  );
};

export default Uploading;
