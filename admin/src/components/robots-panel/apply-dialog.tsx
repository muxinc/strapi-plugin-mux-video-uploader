import React from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Modal,
  SingleSelect,
  SingleSelectOption,
  Td,
  Tr,
  Typography,
} from '@strapi/design-system';
import { useForm, useNotification } from '@strapi/strapi/admin';

import type { RobotsSummarizeOutput } from '../../../../types/robots';
import {
  buildApplyRows,
  defaultTargets,
  EntryFieldOption,
  EntryOutputKey,
  isEmptyFieldValue,
  matchesGeneratedValue,
  minLengthProblem,
  plainTextOf,
  valueForField,
} from '../../../../types/robots-format';
import { useRobotsIntl } from '../robots/intl';
import { NONE } from '../robots/param-fields';
import RobotsTable from '../robots/table';

/**
 * Writes the summary into the entry's form as unsaved changes: nothing reaches Mux or the mux-asset
 * until the person saves the entry. A field can be the target of one output only.
 */
export default function ApplyDialog({
  summary,
  fields,
  onClose,
}: {
  summary: RobotsSummarizeOutput;
  fields: EntryFieldOption[];
  onClose: () => void;
}) {
  const { t } = useRobotsIntl();
  const { toggleNotification } = useNotification();
  const values = useForm('MuxRobotsApplySummary', (state) => state.values) as Record<string, unknown>;
  const onChange = useForm('MuxRobotsApplySummary', (state) => state.onChange);

  const rows = React.useMemo(() => buildApplyRows(summary, fields), [summary, fields]);
  // Suggested once, from what the entry holds when the dialog opens; the person decides from there.
  const [targets, setTargets] = React.useState(() => defaultTargets(rows, values));

  const outputLabel: Record<EntryOutputKey, string> = {
    title: t('Robots.apply.output.title', 'Title'),
    description: t('Robots.apply.output.description', 'Description'),
    tags: t('Robots.apply.output.tags', 'Tags'),
  };

  const targetOf = (row: (typeof rows)[number]) =>
    targets[row.key] ? fields.find((field) => field.name === targets[row.key]) : undefined;

  const columns = [
    t('Robots.apply.column.output', 'Output'),
    t('Robots.apply.column.target', 'Target field'),
    t('Robots.apply.column.current', 'Current value'),
    t('Robots.apply.column.new', 'New value'),
  ];

  const chosen = rows.flatMap((row) => {
    const field = targetOf(row);
    return field && !minLengthProblem(row.value, field) ? [{ row, field }] : [];
  });

  const apply = () => {
    for (const { row, field } of chosen) onChange(field.name, valueForField(row.value, field));

    toggleNotification({
      type: 'success',
      message: t('Robots.apply.done', 'Applied {count} generated value(s). Save the entry to keep them.', {
        count: chosen.length,
      }),
    });
    onClose();
  };

  return (
    <Modal.Root open onOpenChange={(open: boolean) => !open && onClose()}>
      <Modal.Content style={{ width: 'min(90vw, 96rem)', maxWidth: 'unset' }}>
        <Modal.Header>
          <Modal.Title>{t('Robots.apply.title', 'Apply summary')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Box paddingBottom={4}>
            <Typography variant="omega" textColor="neutral600">
              {t(
                'Robots.apply.help',
                "Choose where each part of the summary goes. Fields that already hold something aren't selected for you."
              )}
            </Typography>
          </Box>
          <RobotsTable columns={columns} rowCount={rows.length}>
            {rows.map((row) => {
              const field = targetOf(row);
              const current = field ? values[field.name] : undefined;
              const problem = field ? minLengthProblem(row.value, field) : undefined;
              const takenElsewhere = new Set(
                Object.entries(targets)
                  .filter(([key, name]) => key !== row.key && name)
                  .map(([, name]) => name)
              );
              // A suggested field that already holds something isn't selected: say whether that's this
              // summary, or content the person would have to choose to replace.
              const suggestedApplied =
                !field &&
                !!row.suggested &&
                matchesGeneratedValue(values[row.suggested.name], row.value, row.suggested);
              const suggestedHasContent =
                !field && !suggestedApplied && !!row.suggested && !isEmptyFieldValue(values[row.suggested.name]);
              const preview = plainTextOf(field ? valueForField(row.value, field) : row.value);

              return (
                <Tr key={row.key}>
                  <Td style={{ verticalAlign: 'top' }}>
                    <Typography variant="omega" fontWeight="bold">
                      {outputLabel[row.key]}
                    </Typography>
                  </Td>
                  <Td style={{ verticalAlign: 'top', whiteSpace: 'normal', minWidth: '20rem' }}>
                    <SingleSelect
                      aria-label={t('Robots.apply.target-for', 'Target field for {output}', {
                        output: outputLabel[row.key],
                      })}
                      value={targets[row.key] || NONE}
                      onChange={(next: string | number) =>
                        setTargets((previous) => ({ ...previous, [row.key]: next === NONE ? '' : String(next) }))
                      }
                    >
                      <SingleSelectOption value={NONE}>
                        {t('Robots.apply.do-not-apply', 'Do not apply')}
                      </SingleSelectOption>
                      {row.compatible.map((candidate) => (
                        <SingleSelectOption
                          key={candidate.name}
                          value={candidate.name}
                          disabled={takenElsewhere.has(candidate.name)}
                        >
                          {candidate.label}
                        </SingleSelectOption>
                      ))}
                    </SingleSelect>
                    {row.compatible.length === 0 && (
                      <Typography variant="pi" textColor="neutral600" tag="p">
                        {row.key === 'tags'
                          ? t('Robots.apply.no-json-field', 'This entry has no JSON field to hold a list of tags.')
                          : t('Robots.apply.no-text-field', 'This entry has no text field for it.')}
                      </Typography>
                    )}
                    {suggestedHasContent && (
                      <Typography variant="pi" textColor="neutral600" tag="p">
                        {t(
                          'Robots.apply.has-content',
                          '{field} already has content. Pick it as the target to replace it.',
                          {
                            field: row.suggested!.label,
                          }
                        )}
                      </Typography>
                    )}
                    {problem && (
                      <Typography variant="pi" textColor="danger600" tag="p">
                        {problem}
                      </Typography>
                    )}
                  </Td>
                  <Td style={{ verticalAlign: 'top', whiteSpace: 'normal' }}>
                    {suggestedApplied && (
                      <Flex direction="column" alignItems="start" gap={1}>
                        <Badge>{t('Robots.apply.already-applied', 'Already applied')}</Badge>
                        <Typography variant="pi" textColor="neutral600">
                          {row.suggested!.label}
                        </Typography>
                      </Flex>
                    )}
                    {field &&
                      (matchesGeneratedValue(current, row.value, field) ? (
                        <Badge>{t('Robots.apply.already-applied', 'Already applied')}</Badge>
                      ) : isEmptyFieldValue(current) ? (
                        <Badge>{t('Robots.apply.empty', 'Empty')}</Badge>
                      ) : (
                        <Flex direction="column" alignItems="start" gap={1}>
                          <Badge backgroundColor="warning100" textColor="warning700">
                            {t('Robots.apply.will-be-replaced', 'Will be replaced')}
                          </Badge>
                          <Typography variant="pi" textColor="neutral700">
                            {plainTextOf(current)}
                          </Typography>
                        </Flex>
                      ))}
                  </Td>
                  <Td style={{ verticalAlign: 'top', whiteSpace: 'normal' }}>
                    <Typography variant="omega">{preview}</Typography>
                  </Td>
                </Tr>
              );
            })}
          </RobotsTable>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="tertiary" onClick={onClose}>
            {t('Common.cancel-button', 'Cancel')}
          </Button>
          <Button disabled={chosen.length === 0} onClick={apply}>
            {t('Robots.apply.apply', 'Apply {count}', { count: chosen.length })}
          </Button>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
}
