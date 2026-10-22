import React from 'react';
import {
  Box,
  Button,
  Checkbox,
  Field,
  Flex,
  IconButton,
  NumberInput,
  SingleSelect,
  SingleSelectOption,
  Textarea,
  TextInput,
  Typography,
} from '@strapi/design-system';
import { Plus, Trash } from '@strapi/icons';

import {
  asTaxonomyValue,
  emptyQuestionRow,
  emptyTaxonomyRow,
  groupFieldsBySection,
  isFieldVisible,
  QUESTION_ANSWER_MODES,
  QuestionRow,
  ReplacementRow,
  RobotsAssetContext,
  RobotsParamField,
  TaxonomyRow,
} from '../../../../types/robots-catalog';
import { SUPPORTED_MUX_LANGUAGES } from '../../../../types/shared-types';
import { useRobotsIntl } from './intl';

export interface CaptionTrackOption {
  id: string;
  name?: string;
  language_code?: string;
}

interface ParamFieldsProps {
  fields: RobotsParamField[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  /** Ready caption tracks only. */
  captions: CaptionTrackOption[];
  context: RobotsAssetContext;
}

/** The design system's selects can't hold an empty value, so "leave this out" travels as this. */
export const NONE = '__none__';

export default function ParamFields({ fields, values, onChange, captions, context }: ParamFieldsProps) {
  const { t } = useRobotsIntl();

  if (fields.length === 0) {
    return (
      <Typography variant="omega" textColor="neutral600">
        {t('Robots.form.no-options', 'This workflow takes no options.')}
      </Typography>
    );
  }

  const visible = fields.filter((field) => isFieldVisible(field, values, context));
  const renderFields = (group: RobotsParamField[]) =>
    group.map((field) => (
      <ParamField key={field.name} field={field} value={values[field.name]} onChange={onChange} captions={captions} />
    ));

  return (
    <Flex direction="column" alignItems="stretch" gap={4}>
      {groupFieldsBySection(visible).map((group) =>
        group.section ? (
          <Box key={group.section.id} padding={4} background="neutral100" hasRadius>
            <Typography variant="delta" tag="h3">
              {group.section.title}
            </Typography>
            {group.section.description && (
              <Box paddingTop={1}>
                <Typography variant="pi" textColor="neutral600">
                  {group.section.description}
                </Typography>
              </Box>
            )}
            <Flex direction="column" alignItems="stretch" gap={4} paddingTop={3}>
              {renderFields(group.fields)}
            </Flex>
          </Box>
        ) : (
          renderFields(group.fields)
        )
      )}
    </Flex>
  );
}

function ParamField({
  field,
  value,
  onChange,
  captions,
}: {
  field: RobotsParamField;
  value: unknown;
  onChange: (name: string, value: unknown) => void;
  captions: CaptionTrackOption[];
}) {
  const { t } = useRobotsIntl();
  const set = (next: unknown) => onChange(field.name, next);

  const wrap = (control: React.ReactNode, error?: string) => (
    <Field.Root name={field.name} hint={field.helpText} required={field.isRequired} error={error}>
      <Field.Label>{field.label}</Field.Label>
      {control}
      <Field.Hint />
      <Field.Error />
    </Field.Root>
  );

  switch (field.kind) {
    case 'boolean': {
      const checked = value === undefined ? !!field.defaultValue : !!value;
      return (
        <Box>
          <Checkbox checked={checked} onCheckedChange={(next: boolean | 'indeterminate') => set(next === true)}>
            {field.label}
          </Checkbox>
          {field.helpText && (
            <Box paddingTop={1} paddingLeft={6}>
              <Typography variant="pi" textColor="neutral600">
                {field.helpText}
              </Typography>
            </Box>
          )}
        </Box>
      );
    }

    case 'select': {
      const current = (value as string | undefined) ?? (field.defaultValue as string | undefined) ?? '';
      return wrap(
        <SingleSelect
          value={current === '' ? NONE : current}
          onChange={(next: string | number) => set(next === NONE ? '' : String(next))}
        >
          {(field.options ?? []).map((option) => (
            <SingleSelectOption key={option.value} value={option.value === '' ? NONE : option.value}>
              {option.label}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      );
    }

    case 'number':
      return wrap(
        <NumberInput
          value={typeof value === 'number' ? value : undefined}
          step={field.step}
          onValueChange={(next: number | undefined) => set(next === undefined || Number.isNaN(next) ? undefined : next)}
        />,
        // `validateParams` lists it too, under the form; this marks the field itself.
        field.integer && typeof value === 'number' && !Number.isInteger(value)
          ? t('Robots.form.whole-number', 'Use a whole number.')
          : undefined
      );

    case 'language': {
      const current = typeof value === 'string' && value ? value : field.isRequired ? undefined : NONE;
      return wrap(
        <SingleSelect
          value={current}
          placeholder={t('Robots.form.choose-language', 'Choose a language')}
          onChange={(next: string | number) => set(next === NONE ? '' : String(next))}
        >
          {!field.isRequired && (
            <SingleSelectOption value={NONE}>{t('Robots.form.language-empty', 'Leave empty')}</SingleSelectOption>
          )}
          {SUPPORTED_MUX_LANGUAGES.map((language) => (
            <SingleSelectOption key={language.code} value={language.code}>
              {`${language.label} (${language.code})`}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      );
    }

    case 'track':
      if (captions.length === 0) {
        return wrap(
          <Typography variant="omega" textColor="danger600">
            {t('Robots.form.no-caption-track', 'This video has no caption track to use.')}
          </Typography>
        );
      }
      return wrap(
        <SingleSelect
          value={typeof value === 'string' && value ? value : undefined}
          placeholder={t('Robots.form.choose-track', 'Choose a track')}
          onChange={(next: string | number) => set(String(next))}
        >
          {captions.map((track) => (
            <SingleSelectOption key={track.id} value={track.id}>
              {[track.name, track.language_code].filter(Boolean).join(' · ') || track.id}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      );

    case 'textarea':
      return wrap(
        <Textarea
          value={(value as string) ?? ''}
          onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => set(event.target.value)}
        />
      );

    case 'stringList':
      return wrap(<StringListInput field={field} value={value} onChange={set} />);

    case 'enumList': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      return wrap(
        <Flex direction="column" alignItems="start" gap={2} paddingTop={1}>
          {(field.options ?? []).map((option) => (
            <Checkbox
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={(next: boolean | 'indeterminate') =>
                set(next === true ? [...selected, option.value] : selected.filter((entry) => entry !== option.value))
              }
            >
              {option.label}
            </Checkbox>
          ))}
          {field.maxItems !== undefined && (
            <Typography variant="pi" textColor="neutral600">
              {t('Robots.form.chosen-of', '{count} of {max} chosen.', { count: selected.length, max: field.maxItems })}
            </Typography>
          )}
        </Flex>
      );
    }

    case 'questions':
      return wrap(<QuestionsInput value={value} onChange={set} />);

    case 'replacements':
      return wrap(<ReplacementsInput value={value} onChange={set} />);

    case 'taxonomy':
      return wrap(<TaxonomyInput field={field} value={value} onChange={set} />);

    case 'text':
    default:
      return wrap(
        <TextInput
          placeholder={field.placeholder}
          value={(value as string) ?? ''}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => set(event.target.value)}
        />
      );
  }
}

const splitLines = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

/**
 * Keeps a draft of the text as typed and only normalises what leaves, so a trailing space or a new
 * line isn't eaten mid-typing. Caps are left to validation, which names the entry that's too long.
 */
function StringListInput({
  field,
  value,
  onChange,
}: {
  field: RobotsParamField;
  value: unknown;
  onChange: (next: string[]) => void;
}) {
  const { t } = useRobotsIntl();
  const items = Array.isArray(value) ? (value as string[]) : [];
  const committed = items.join('\n');
  const [draft, setDraft] = React.useState(committed);
  const draftRef = React.useRef(draft);
  draftRef.current = draft;

  React.useEffect(() => {
    if (splitLines(draftRef.current).join('\n') !== committed) setDraft(committed);
  }, [committed]);

  return (
    <>
      <Textarea
        placeholder={t('Robots.form.one-per-line', 'One per line')}
        value={draft}
        onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
          setDraft(event.target.value);
          onChange(splitLines(event.target.value));
        }}
      />
      {!!field.maxItems && (
        <Typography variant="pi" textColor="neutral600">
          {t('Robots.form.used-of', '{count} of {max} used.', { count: items.length, max: field.maxItems })}
        </Typography>
      )}
    </>
  );
}

function RemoveButton({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <IconButton label={label} variant="ghost" onClick={onClick} disabled={disabled}>
      <Trash />
    </IconButton>
  );
}

function AddButton({ onClick, children }: React.PropsWithChildren<{ onClick: () => void }>) {
  return (
    <Button variant="secondary" size="S" startIcon={<Plus />} onClick={onClick}>
      {children}
    </Button>
  );
}

const patchAt = <Row,>(rows: Row[], index: number, changes: Partial<Row>) =>
  rows.map((row, i) => (i === index ? { ...row, ...changes } : row));

const removeAt = <Row,>(rows: Row[], index: number) => rows.filter((_, i) => i !== index);

function QuestionsInput({ value, onChange }: { value: unknown; onChange: (next: QuestionRow[]) => void }) {
  const { t } = useRobotsIntl();
  const rows = Array.isArray(value) ? (value as QuestionRow[]) : [emptyQuestionRow()];
  const patch = (index: number, changes: Partial<QuestionRow>) => onChange(patchAt(rows, index, changes));

  return (
    <Flex direction="column" alignItems="stretch" gap={2}>
      {rows.map((row, index) => {
        const freeForm = row.answerMode === 'free_form';
        return (
          <Flex key={index} gap={2} alignItems="center">
            <Box grow={2}>
              <TextInput
                aria-label={t('Robots.form.question', 'Question {number}', { number: index + 1 })}
                placeholder={t('Robots.form.question-placeholder', 'Question')}
                value={row.question}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  patch(index, { question: event.target.value })
                }
              />
            </Box>
            <Box minWidth="16rem">
              <SingleSelect
                aria-label={t('Robots.form.answer-mode', 'How question {number} is answered', { number: index + 1 })}
                value={row.answerMode ?? 'options'}
                onChange={(next: string | number) => patch(index, { answerMode: next as QuestionRow['answerMode'] })}
              >
                {QUESTION_ANSWER_MODES.map((mode) => (
                  <SingleSelectOption key={mode.value} value={mode.value}>
                    {mode.label}
                  </SingleSelectOption>
                ))}
              </SingleSelect>
            </Box>
            <Box grow={1}>
              <TextInput
                aria-label={t('Robots.form.answer-options', 'Answer options for question {number}', {
                  number: index + 1,
                })}
                placeholder={freeForm ? t('Robots.form.not-used', 'Not used') : 'yes, no'}
                disabled={freeForm}
                value={freeForm ? '' : row.answerOptions}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                  patch(index, { answerOptions: event.target.value })
                }
              />
            </Box>
            <RemoveButton
              label={t('Robots.form.remove-question', 'Remove question {number}', { number: index + 1 })}
              disabled={rows.length === 1}
              onClick={() => onChange(removeAt(rows, index))}
            />
          </Flex>
        );
      })}
      <Box>
        <AddButton onClick={() => onChange([...rows, emptyQuestionRow()])}>
          {t('Robots.form.add-question', 'Add question')}
        </AddButton>
      </Box>
    </Flex>
  );
}

function ReplacementsInput({ value, onChange }: { value: unknown; onChange: (next: ReplacementRow[]) => void }) {
  const { t } = useRobotsIntl();
  const rows = Array.isArray(value) ? (value as ReplacementRow[]) : [];
  const patch = (index: number, changes: Partial<ReplacementRow>) => onChange(patchAt(rows, index, changes));

  return (
    <Flex direction="column" alignItems="stretch" gap={2}>
      {rows.map((row, index) => (
        <Flex key={index} gap={2} alignItems="center">
          <Box grow={1}>
            <TextInput
              aria-label={t('Robots.form.find', 'Find text {number}', { number: index + 1 })}
              placeholder={t('Robots.form.find-placeholder', 'Find')}
              value={row.find}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => patch(index, { find: event.target.value })}
            />
          </Box>
          <Box grow={1}>
            <TextInput
              aria-label={t('Robots.form.replace', 'Replacement text {number}', { number: index + 1 })}
              placeholder={t('Robots.form.replace-placeholder', 'Replace with')}
              value={row.replace}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => patch(index, { replace: event.target.value })}
            />
          </Box>
          <Checkbox
            checked={row.caseSensitive}
            onCheckedChange={(next: boolean | 'indeterminate') => patch(index, { caseSensitive: next === true })}
          >
            {t('Robots.form.case-sensitive', 'Case sensitive')}
          </Checkbox>
          <RemoveButton
            label={t('Robots.form.remove-replacement', 'Remove replacement {number}', { number: index + 1 })}
            onClick={() => onChange(removeAt(rows, index))}
          />
        </Flex>
      ))}
      <Box>
        <AddButton onClick={() => onChange([...rows, { find: '', replace: '', caseSensitive: false }])}>
          {t('Robots.form.add-replacement', 'Add replacement')}
        </AddButton>
      </Box>
    </Flex>
  );
}

function TaxonomyInput({
  field,
  value,
  onChange,
}: {
  field: RobotsParamField;
  value: unknown;
  onChange: (next: unknown) => void;
}) {
  const { t } = useRobotsIntl();
  const taxonomy = asTaxonomyValue(value);
  const rows = taxonomy.values;
  const patch = (changes: Partial<typeof taxonomy>) => onChange({ ...taxonomy, ...changes });
  const patchRow = (index: number, changes: Partial<TaxonomyRow>) => patch({ values: patchAt(rows, index, changes) });

  return (
    <Flex direction="column" alignItems="stretch" gap={2}>
      <TextInput
        aria-label={t('Robots.form.taxonomy-name', 'Taxonomy name')}
        placeholder={t('Robots.form.taxonomy-name-placeholder', 'Taxonomy name, e.g. Content pillars')}
        value={taxonomy.name}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => patch({ name: event.target.value })}
      />
      {rows.map((row, index) => (
        <Flex key={index} gap={2} alignItems="center">
          <Box grow={1}>
            <TextInput
              aria-label={t('Robots.form.taxonomy-value', 'Taxonomy value {number}', { number: index + 1 })}
              placeholder={t('Robots.form.taxonomy-value-placeholder', 'Value')}
              value={row.label}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => patchRow(index, { label: event.target.value })}
            />
          </Box>
          <Box grow={2}>
            <TextInput
              aria-label={t('Robots.form.taxonomy-description', 'Description for taxonomy value {number}', {
                number: index + 1,
              })}
              placeholder={t('Robots.form.taxonomy-description-placeholder', 'When it applies')}
              value={row.description}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                patchRow(index, { description: event.target.value })
              }
            />
          </Box>
          <Box grow={1}>
            <TextInput
              aria-label={t('Robots.form.taxonomy-aliases', 'Aliases for taxonomy value {number}', {
                number: index + 1,
              })}
              placeholder={t('Robots.form.taxonomy-aliases-placeholder', 'Also known as, comma separated')}
              value={row.aliases}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                patchRow(index, { aliases: event.target.value })
              }
            />
          </Box>
          <RemoveButton
            label={t('Robots.form.remove-taxonomy-value', 'Remove taxonomy value {number}', { number: index + 1 })}
            onClick={() => patch({ values: removeAt(rows, index) })}
          />
        </Flex>
      ))}
      <Flex gap={3} alignItems="center">
        <AddButton onClick={() => patch({ values: [...rows, emptyTaxonomyRow()] })}>
          {t('Robots.form.add-value', 'Add value')}
        </AddButton>
        {field.taxonomyLimits?.maxValues !== undefined && (
          <Typography variant="pi" textColor="neutral600">
            {t('Robots.form.used-of', '{count} of {max} used.', {
              count: rows.length,
              max: field.taxonomyLimits.maxValues,
            })}
          </Typography>
        )}
      </Flex>
      <Checkbox
        checked={taxonomy.allowOther}
        onCheckedChange={(next: boolean | 'indeterminate') => patch({ allowOther: next === true })}
      >
        {t('Robots.form.allow-other', 'Allow values outside this list')}
      </Checkbox>
    </Flex>
  );
}
