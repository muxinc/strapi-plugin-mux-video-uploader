import React from 'react';
import {
  Badge,
  Box,
  Button,
  Flex,
  Loader,
  SingleSelect,
  SingleSelectOption,
  TextButton,
  Tooltip,
  Typography,
} from '@strapi/design-system';
import { unstable_useContentManagerContext, useForm, useNotification } from '@strapi/strapi/admin';
import { useNavigate } from 'react-router-dom';

import type { RobotsEntryVideosResponse, RobotsSummarizeOutput } from '../../../../types/robots';
import { EntryFieldOption, muxAssetRelationFields } from '../../../../types/robots-format';
import { PLUGIN_ID } from '../../pluginId';
import { robotsErrorOf, useRobotsApi } from '../robots/api';
import { useRobotsIntl } from '../robots/intl';
import ApplyDialog from './apply-dialog';

interface PanelProps {
  model: string;
  documentId?: string;
  document?: { documentId?: string; locale?: string | null; updatedAt?: string } & Record<string, unknown>;
  activeTab?: 'draft' | 'published' | null;
}

interface LayoutField {
  name: string;
  label: string;
  type: string;
  attribute?: { type?: string; maxLength?: number; minLength?: number };
}

/** The top-level fields the edit view shows, with their display names. */
function useEditFields(): LayoutField[] {
  const { layout } = unstable_useContentManagerContext();

  return React.useMemo(
    () => ((layout?.edit?.layout ?? []) as unknown as LayoutField[][][]).flat(2).filter((field) => !!field?.name),
    [layout]
  );
}

const MuxRobotsPanel = ({ model, documentId, document, activeTab }: PanelProps) => {
  const { contentType } = unstable_useContentManagerContext();
  const { t } = useRobotsIntl();
  const relationFields = muxAssetRelationFields(contentType?.attributes as Record<string, any> | undefined);

  if (relationFields.length === 0) return null;

  return {
    title: t('Robots.panel.title', 'Mux Robots'),
    content: (
      <PanelBody
        model={model}
        // Single types have no id in their URL: only the document knows it.
        documentId={documentId ?? document?.documentId}
        locale={document?.locale ?? undefined}
        savedAt={document?.updatedAt}
        relationFields={relationFields}
        readOnly={activeTab === 'published'}
      />
    ),
  };
};

MuxRobotsPanel.type = 'mux-robots';

function PanelBody({
  model,
  documentId,
  locale,
  savedAt,
  relationFields,
  readOnly,
}: {
  model: string;
  documentId?: string;
  locale?: string;
  /** Changes with every save, which may have linked another video. */
  savedAt?: string;
  relationFields: string[];
  readOnly: boolean;
}) {
  const { t } = useRobotsIntl();
  const api = useRobotsApi();
  const navigate = useNavigate();
  const editFields = useEditFields();
  const formDisabled = useForm('MuxRobotsPanel', (state) => state.disabled);

  const [response, setResponse] = React.useState<RobotsEntryVideosResponse>();
  const [error, setError] = React.useState<string>();
  const [videoId, setVideoId] = React.useState<number>();
  const [applying, setApplying] = React.useState(false);

  React.useEffect(() => {
    if (!documentId) return;

    let cancelled = false;
    const query = new URLSearchParams({ model, documentId, ...(locale ? { locale } : {}) });

    setResponse(undefined);
    setError(undefined);
    api
      .listEntryVideos(query)
      .then((data) => !cancelled && setResponse(data))
      .catch((thrown) => !cancelled && setError(robotsErrorOf(thrown).message));

    return () => {
      cancelled = true;
    };
  }, [model, documentId, locale, savedAt]);

  const labelOf = (name: string) => editFields.find((field) => field.name === name)?.label ?? name;

  const targetFields: EntryFieldOption[] = React.useMemo(
    () =>
      editFields.map((field) => ({
        name: field.name,
        label: field.label || field.name,
        type: field.attribute?.type ?? field.type,
        maxLength: field.attribute?.maxLength,
        minLength: field.attribute?.minLength,
      })),
    [editFields]
  );

  if (!documentId) {
    return (
      <Typography variant="pi" textColor="neutral600">
        {t('Robots.panel.unsaved', "Save the entry to see its video's Robots results.")}
      </Typography>
    );
  }

  if (error) {
    return (
      <Typography variant="pi" textColor="danger600">
        {error}
      </Typography>
    );
  }

  if (!response) return <Loader small>{t('Robots.loading', 'Loading…')}</Loader>;

  const videos = response.fields.flatMap((field) => field.videos);

  if (videos.length === 0) {
    return (
      <Typography variant="pi" textColor="neutral600">
        {t('Robots.panel.no-video', 'Link a Mux video in {field} and save the entry.', {
          field: labelOf(relationFields[0]),
        })}
      </Typography>
    );
  }

  const video = videos.find((candidate) => candidate.id === videoId) ?? videos[0];
  const summary = video.summary;
  const canApply = !!summary && !readOnly && !formDisabled;

  const applyButton = (
    <Button variant="secondary" fullWidth disabled={!canApply} onClick={() => setApplying(true)}>
      {t('Robots.panel.apply', 'Apply summary')}
    </Button>
  );

  return (
    <Flex direction="column" alignItems="stretch" gap={3} width="100%">
      {videos.length > 1 && (
        <SingleSelect
          aria-label={t('Robots.panel.choose-video', 'Video')}
          value={String(video.id)}
          onChange={(next: string | number) => setVideoId(Number(next))}
        >
          {videos.map((candidate) => (
            <SingleSelectOption key={candidate.id} value={String(candidate.id)}>
              {candidate.title || candidate.asset_id || String(candidate.id)}
            </SingleSelectOption>
          ))}
        </SingleSelect>
      )}

      {summary ? (
        <SummaryPreview summary={summary} />
      ) : (
        <Box>
          <Typography variant="pi" textColor="neutral600">
            {t('Robots.panel.no-summary', 'No summary yet. Run Summarize on this video in Mux Video Uploader.')}
          </Typography>
          <Box paddingTop={1}>
            <TextButton onClick={() => navigate(`/plugins/${PLUGIN_ID}?asset=${video.id}&tab=robots`)}>
              {t('Robots.panel.open-video', 'Open the video in Mux Video Uploader')}
            </TextButton>
          </Box>
        </Box>
      )}

      {summary ? (
        applyButton
      ) : (
        <Tooltip
          label={t(
            'Robots.panel.apply-disabled',
            "Run a Summarize workflow to apply its title, description and tags to this entry's own fields."
          )}
        >
          <span>{applyButton}</span>
        </Tooltip>
      )}

      {applying && summary && (
        <EntryApplyDialog summary={summary} fields={targetFields} onClose={() => setApplying(false)} />
      )}
    </Flex>
  );
}

/** Writes into the entry's form as unsaved changes: nothing reaches Mux or the mux-asset until the entry is saved. */
function EntryApplyDialog({
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

  const apply = (applied: Record<string, unknown>) => {
    for (const [name, value] of Object.entries(applied)) onChange(name, value);

    toggleNotification({
      type: 'success',
      message: t(
        'Robots.apply.done',
        'Applied {count, plural, one {# generated value} other {# generated values}}. Save the entry to keep them.',
        {
          count: Object.keys(applied).length,
        }
      ),
    });
  };

  return (
    <ApplyDialog
      title={t('Robots.apply.title', 'Apply summary to this entry')}
      help={t('Robots.apply.help', 'Pick a field for each output, or leave it on Do not apply.')}
      summary={summary}
      fields={fields}
      values={values}
      onApply={apply}
      onClose={onClose}
    />
  );
}

function SummaryPreview({ summary }: { summary: RobotsSummarizeOutput }) {
  return (
    <Box>
      {summary.title && (
        <Typography variant="omega" fontWeight="bold" tag="p">
          {summary.title}
        </Typography>
      )}
      {summary.description && (
        <Box paddingTop={1}>
          <Typography variant="pi" textColor="neutral700">
            {summary.description}
          </Typography>
        </Box>
      )}
      {summary.tags && summary.tags.length > 0 && (
        <Flex gap={1} wrap="wrap" paddingTop={2}>
          {summary.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </Flex>
      )}
    </Box>
  );
}

export default MuxRobotsPanel;
