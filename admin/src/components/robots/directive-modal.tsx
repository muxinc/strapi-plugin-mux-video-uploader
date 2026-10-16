import React from 'react';
import {
  Button,
  Field,
  Flex,
  Link,
  Loader,
  Modal,
  SingleSelect,
  SingleSelectOption,
  Typography,
} from '@strapi/design-system';

import type { RobotsDirectiveSummary } from '../../../../types/robots';
import { useRobotsIntl } from './intl';
import { PricingLink, ROBOTS_DASHBOARD_URL } from './links';
import Note from './note';

interface DirectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The modal closes whatever the outcome: the tab reports it. */
  onRun: (directiveId: string) => Promise<unknown>;
  videoTitle: string;
  directives?: RobotsDirectiveSummary[];
  loadError?: string;
  blockedReason?: string;
}

export default function DirectiveModal({
  isOpen,
  onClose,
  onRun,
  videoTitle,
  directives,
  loadError,
  blockedReason,
}: DirectiveModalProps) {
  const { t } = useRobotsIntl();
  const [selected, setSelected] = React.useState<string>();
  const [confirming, setConfirming] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setSelected(undefined);
    setConfirming(false);
    setSubmitting(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const directive = directives?.find((candidate) => candidate.id === selected);

  const run = async () => {
    if (!directive || submitting) return;
    setSubmitting(true);
    await onRun(directive.id);
    onClose();
  };

  return (
    <Modal.Root open onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Content>
        <Modal.Header>
          <Modal.Title>
            {confirming
              ? t('Robots.run.confirm-title', 'Confirm this run')
              : t('Robots.directive.title', 'Run a directive')}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {confirming && directive ? (
            <Flex direction="column" alignItems="stretch" gap={3}>
              <Typography variant="omega">
                {t(
                  'Robots.directive.confirm',
                  'This will run the directive {name} on "{title}". Each of its workflows consumes Mux AI units.',
                  {
                    name: directive.name,
                    title: videoTitle,
                  }
                )}
              </Typography>
              <Typography variant="omega">
                <PricingLink />
              </Typography>
            </Flex>
          ) : loadError ? (
            <Note variant="danger">{loadError}</Note>
          ) : !directives ? (
            <Loader small>{t('Robots.loading', 'Loading…')}</Loader>
          ) : directives.length === 0 ? (
            <Note
              action={
                <Link href={ROBOTS_DASHBOARD_URL} isExternal>
                  {t('Robots.directive.open-dashboard', 'Open the Mux dashboard')}
                </Link>
              }
            >
              {t(
                'Robots.directive.none',
                'This Mux environment has no directives yet. Create them in the Mux dashboard.'
              )}
            </Note>
          ) : (
            <Flex direction="column" alignItems="stretch" gap={3}>
              <Field.Root name="directive">
                <Field.Label>{t('Robots.directive.label', 'Directive')}</Field.Label>
                <SingleSelect
                  value={selected}
                  placeholder={t('Robots.directive.placeholder', 'Choose a directive')}
                  onChange={(next: string | number) => setSelected(String(next))}
                >
                  {directives.map((candidate) => (
                    <SingleSelectOption key={candidate.id} value={candidate.id}>
                      {candidate.name === candidate.id ? candidate.id : `${candidate.name} (${candidate.id})`}
                    </SingleSelectOption>
                  ))}
                </SingleSelect>
              </Field.Root>
              {blockedReason && <Note variant="warning">{blockedReason}</Note>}
            </Flex>
          )}
        </Modal.Body>
        <Modal.Footer>
          {confirming ? (
            <>
              <Button variant="tertiary" onClick={() => setConfirming(false)} disabled={submitting}>
                {t('Robots.run.back', 'Back')}
              </Button>
              <Button onClick={run} loading={submitting} disabled={submitting || !!blockedReason}>
                {t('Robots.directive.run', 'Run {name}', { name: directive?.name ?? '' })}
              </Button>
            </>
          ) : (
            <>
              <Button variant="tertiary" onClick={onClose}>
                {t('Common.cancel-button', 'Cancel')}
              </Button>
              <Button disabled={!directive || !!blockedReason} onClick={() => setConfirming(true)}>
                {t('Robots.run.continue', 'Continue')}
              </Button>
            </>
          )}
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
