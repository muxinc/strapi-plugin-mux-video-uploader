const React = require('react');
const styled = require('styled-components');
const { Box } = require('@strapi/design-system/Box');
const { Flex } = require('@strapi/design-system/Flex');
const { ProgressBar } = require('@strapi/design-system/ProgressBar');
const { Stack } = require('@strapi/design-system/Stack');
const { Typography } = require('@strapi/design-system/Typography');

const ProgressBarWrapper = styled.div`
  width: 60%;
`;

const ProgessBarUnleased = styled(ProgressBar)`
  width: 100%;
`;

const Uploading = (props) => {
  return (
    <Stack>
      <Box paddingBottom={5}>
        <Flex justifyContent="center">
          <Typography variant="alpha">Uploading to Mux</Typography>
        </Flex>
      </Box>
      <Box paddingBottom={5}>
        <Flex justifyContent="center">
          <ProgressBarWrapper>
            <ProgessBarUnleased value={props.percent} />
          </ProgressBarWrapper>
        </Flex>
      </Box>
    </Stack>
  );
};

module.exports = Uploading;
