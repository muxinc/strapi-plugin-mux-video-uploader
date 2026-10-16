import React from 'react';
import { Accordion, Box, Checkbox, Flex, Typography } from '@strapi/design-system';

import type { RobotsDirectivesResponse } from '../../../../types/robots';
import { useRobotsApi } from '../robots/api';
import { useRobotsIntl } from '../robots/intl';
import { useCanRunRobots } from '../robots/use-can-run-robots';

/** `undefined` when Mux's listing may be partial, so no configured id can be called unknown. */
const knownIdsOf = (listing: RobotsDirectivesResponse) =>
  listing.complete ? new Set(listing.directives.map((directive) => directive.id)) : undefined;

/**
 * An item of the upload form's accordion. Only someone with Run Robots can uncheck a configured
 * directive; the server enforces the same rule.
 */
export default function AutomationSection({
  value,
  onChange,
}: {
  /** The configured ids still checked. `undefined` until the listing has loaded. */
  value?: string[];
  onChange: (directiveIds: string[]) => void;
}) {
  const api = useRobotsApi();
  const { t } = useRobotsIntl();
  const [listing, setListing] = React.useState<RobotsDirectivesResponse>();
  const canRun = useCanRunRobots();

  // Loaded here rather than in the collapsed content, which isn't mounted until it opens: the form
  // needs the checked directives either way.
  React.useEffect(() => {
    let cancelled = false;

    api
      .listDirectives()
      .then((result) => {
        if (cancelled) return;
        setListing(result);

        const known = knownIdsOf(result);
        onChange(result.defaultDirectiveIds.filter((id) => !known || known.has(id)));
      })
      .catch(() => {
        // Without the listing there's nothing to show; the server attaches the configured directives.
      });

    return () => {
      cancelled = true;
    };
  }, [api]);

  if (!listing) return null;

  const configured = listing.defaultDirectiveIds;
  if (configured.length === 0) return null;

  const known = knownIdsOf(listing);
  const nameOf = (id: string) => listing.directives.find((directive) => directive.id === id)?.name;
  const checked = value ?? configured;

  return (
    <Accordion.Item value="acc-04">
      <Accordion.Header>
        <Accordion.Trigger>{t('Robots.upload.title', 'Automation')}</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Content>
        <Box padding={4} width="100%">
          <Box paddingBottom={3}>
            <Typography variant="pi" textColor="neutral600">
              {canRun
                ? t(
                    'Robots.upload.help',
                    "Each directive runs Robots workflows on this video and consumes Mux AI units. Uncheck any you don't want for this upload."
                  )
                : t(
                    'Robots.upload.locked',
                    'These directives run on every upload. A Super Admin sets them in the plugin configuration.'
                  )}
            </Typography>
          </Box>
          <Flex direction="column" alignItems="stretch" gap={3}>
            {configured.map((id) => {
              const unknown = !!known && !known.has(id);
              return (
                <Box key={id} style={{ overflowWrap: 'anywhere' }}>
                  <Checkbox
                    checked={!unknown && (!canRun || checked.includes(id))}
                    disabled={unknown || !canRun}
                    onCheckedChange={(next: boolean | 'indeterminate') =>
                      onChange(next === true ? [...checked, id] : checked.filter((entry) => entry !== id))
                    }
                  >
                    {nameOf(id) ?? id}
                  </Checkbox>
                  <Box paddingLeft={6}>
                    <Typography variant="pi" textColor="neutral600">
                      {id}
                    </Typography>
                    {unknown && (
                      <Typography variant="pi" textColor="danger600" tag="p">
                        {t(
                          'Robots.upload.unknown',
                          "Mux doesn't have this directive. Remove it from defaultDirectiveIds."
                        )}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Flex>
        </Box>
      </Accordion.Content>
    </Accordion.Item>
  );
}
