const React = require('react');
const styled = require('styled-components');
const CircleCheck = require('@strapi/icons/CheckCircle');
const { Box } = require('@strapi/design-system/Box');
const { Button } = require('@strapi/design-system/Button');
const { Flex } = require('@strapi/design-system/Flex');
const { Icon } = require('@strapi/design-system/Icon');
const { Stack } = require('@strapi/design-system/Stack');
const { Typography } = require('@strapi/design-system/Typography');

const IconStyled = styled(Icon)`
  display: inline-block
`;

const Uploaded = (props) => {
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
};

export default Uploaded;
