import React from 'react';
import { Badge, Box, Flex, Td, Tr, Typography } from '@strapi/design-system';

import type { RobotsJobRow } from '../../../../types/robots';
import { SUPPORTED_MUX_LANGUAGES } from '../../../../types/shared-types';
import { asRows, asStrings, EM_DASH, formatMs, formatScore, formatSeconds, formatText } from './format';
import { Translate } from './intl';
import Note from './note';
import RobotsTable from './table';

type Outputs = Record<string, unknown>;

interface OutputView {
  /** When false, the viewer shows the raw JSON instead of an empty table. */
  hasContent: (outputs: Outputs, row: RobotsJobRow) => boolean;
  render: (outputs: Outputs, row: RobotsJobRow, t: Translate) => React.ReactElement;
}

function SimpleTable({ columns, rows }: { columns: string[]; rows: React.ReactNode[][] }) {
  return (
    <RobotsTable columns={columns} rowCount={rows.length}>
      {rows.map((cells, index) => (
        <Tr key={index}>
          {cells.map((cell, cellIndex) => (
            <Td key={cellIndex} style={{ whiteSpace: 'normal', verticalAlign: 'top' }}>
              <Typography variant="omega">{cell}</Typography>
            </Td>
          ))}
        </Tr>
      ))}
    </RobotsTable>
  );
}

function Labelled({ label, children }: React.PropsWithChildren<{ label: string }>) {
  return (
    <Box paddingBottom={4}>
      <Typography variant="sigma" textColor="neutral600" tag="p">
        {label}
      </Typography>
      <Box paddingTop={1}>{children}</Box>
    </Box>
  );
}

const Tags = ({ tags }: { tags: string[] }) => (
  <Flex gap={1} wrap="wrap">
    {tags.map((tag) => (
      <Badge key={tag}>{tag}</Badge>
    ))}
  </Flex>
);

const SUMMARIZE: OutputView = {
  hasContent: (outputs) =>
    typeof outputs.title === 'string' || typeof outputs.description === 'string' || asStrings(outputs.tags).length > 0,
  render: (outputs, _row, t) => {
    const tags = asStrings(outputs.tags);
    return (
      <>
        {typeof outputs.title === 'string' && (
          <Labelled label={t('Robots.output.title', 'Title')}>
            <Typography variant="omega">{outputs.title}</Typography>
          </Labelled>
        )}
        {typeof outputs.description === 'string' && (
          <Labelled label={t('Robots.output.description', 'Description')}>
            <Typography variant="omega">{outputs.description}</Typography>
          </Labelled>
        )}
        {tags.length > 0 && (
          <Labelled label={t('Robots.output.tags', 'Tags')}>
            <Tags tags={tags} />
          </Labelled>
        )}
      </>
    );
  },
};

const MODERATE: OutputView = {
  hasContent: (outputs) =>
    typeof outputs.exceeds_threshold === 'boolean' ||
    Object.keys((outputs.max_scores ?? {}) as Record<string, unknown>).length > 0,
  render: (outputs, _row, t) => {
    const scores = (outputs.max_scores ?? {}) as Record<string, unknown>;
    return (
      <>
        <Box paddingBottom={4}>
          <Badge
            backgroundColor={outputs.exceeds_threshold ? 'danger100' : 'success100'}
            textColor={outputs.exceeds_threshold ? 'danger700' : 'success700'}
          >
            {outputs.exceeds_threshold
              ? t('Robots.output.exceeds', 'Exceeds a threshold')
              : t('Robots.output.within', 'Within thresholds')}
          </Badge>
        </Box>
        <SimpleTable
          columns={[t('Robots.output.category', 'Category'), t('Robots.output.highest-score', 'Highest score')]}
          rows={Object.entries(scores).map(([category, score]) => [category, formatScore(score)])}
        />
      </>
    );
  },
};

const ASK_QUESTIONS: OutputView = {
  hasContent: (outputs) => asRows(outputs.answers).length > 0,
  render: (outputs, _row, t) => (
    <SimpleTable
      columns={[
        t('Robots.output.question', 'Question'),
        t('Robots.output.answer', 'Answer'),
        t('Robots.output.confidence', 'Confidence'),
        t('Robots.output.reasoning', 'Reasoning'),
      ]}
      rows={asRows(outputs.answers).map((answer) => [
        formatText(answer.question),
        answer.skipped ? t('Robots.output.skipped', 'Skipped') : formatText(answer.answer),
        formatScore(answer.confidence),
        formatText(answer.reasoning),
      ])}
    />
  ),
};

const GENERATE_CHAPTERS: OutputView = {
  hasContent: (outputs) => asRows(outputs.chapters).length > 0,
  render: (outputs, _row, t) => {
    const status = (outputs.asset_update as { status?: unknown } | undefined)?.status;
    return (
      <>
        <Box paddingBottom={4}>
          {status === 'created' ? (
            <Note variant="success">
              {t(
                'Robots.output.chapters-added',
                'The chapters were added to the Mux video. The player shows them in its progress bar.'
              )}
            </Note>
          ) : status === 'failed' ? (
            <Note variant="warning">
              {t(
                'Robots.output.chapters-failed',
                "Mux couldn't add these chapters to the video. They're listed below."
              )}
            </Note>
          ) : (
            <Note>
              {t(
                'Robots.output.chapters-not-added',
                "These chapters weren't added to the Mux video; they're listed below."
              )}
            </Note>
          )}
        </Box>
        <SimpleTable
          columns={[t('Robots.output.start', 'Start'), t('Robots.output.title', 'Title')]}
          rows={asRows(outputs.chapters).map((chapter) => [
            formatSeconds(chapter.start_time),
            formatText(chapter.title),
          ])}
        />
      </>
    );
  },
};

const formatRange = (startMs: unknown, endMs: unknown) => `${formatMs(startMs)} – ${formatMs(endMs)}`;

const narrative = (t: Translate, moment: Record<string, unknown>) => {
  const parts: string[] = [];
  if (typeof moment.audible_narrative === 'string' && moment.audible_narrative.trim()) {
    parts.push(`${t('Robots.output.heard', 'Heard')}: ${moment.audible_narrative.trim()}`);
  }
  if (typeof moment.visual_narrative === 'string' && moment.visual_narrative.trim()) {
    parts.push(`${t('Robots.output.seen', 'Seen')}: ${moment.visual_narrative.trim()}`);
  }
  const quote = (moment.quotable_segment as { text?: unknown } | undefined)?.text;
  if (typeof quote === 'string' && quote.trim()) parts.push(`${t('Robots.output.quote', 'Quote')}: ${quote.trim()}`);
  return parts.length > 0 ? parts.map((part) => <Box key={part}>{part}</Box>) : EM_DASH;
};

const FIND_KEY_MOMENTS: OutputView = {
  hasContent: (outputs) => asRows(outputs.moments).length > 0,
  render: (outputs, _row, t) => (
    <SimpleTable
      columns={[
        t('Robots.output.range', 'Range'),
        t('Robots.output.title', 'Title'),
        t('Robots.output.score', 'Score'),
        t('Robots.output.narrative', 'Narrative'),
      ]}
      rows={asRows(outputs.moments).map((moment) => [
        formatRange(moment.start_ms, moment.end_ms),
        formatText(moment.title),
        formatScore(moment.overall_score),
        narrative(t, moment),
      ])}
    />
  ),
};

const FIND_SCENES: OutputView = {
  hasContent: (outputs) => asRows(outputs.scenes).length > 0,
  render: (outputs, _row, t) => (
    <SimpleTable
      columns={[
        t('Robots.output.range', 'Range'),
        t('Robots.output.title', 'Title'),
        t('Robots.output.summary', 'Summary'),
      ]}
      rows={asRows(outputs.scenes).map((scene) => [
        formatRange(scene.start_ms, scene.end_ms),
        formatText(scene.title),
        formatText(scene.blended_narrative ?? scene.audible_narrative ?? scene.visual_narrative),
      ])}
    />
  ),
};

const FIND_BEST_THUMBNAILS: OutputView = {
  hasContent: (outputs) => asRows(outputs.best_thumbnails).length > 0,
  render: (outputs, _row, t) => (
    <SimpleTable
      columns={[
        t('Robots.output.time', 'Time'),
        t('Robots.output.score', 'Score'),
        t('Robots.output.description', 'Description'),
      ]}
      rows={asRows(outputs.best_thumbnails).map((thumbnail) => [
        formatMs(thumbnail.timestamp_ms),
        formatScore(thumbnail.overall),
        formatText(thumbnail.description),
      ])}
    />
  ),
};

const ENGAGEMENT_INSIGHTS: OutputView = {
  hasContent: (outputs) => {
    const overall = (outputs.overall_insight ?? {}) as Record<string, unknown>;
    return typeof overall.summary === 'string' || asStrings(overall.trends).length > 0;
  },
  render: (outputs) => {
    const overall = (outputs.overall_insight ?? {}) as Record<string, unknown>;
    return (
      <>
        {typeof overall.summary === 'string' && (
          <Box paddingBottom={3}>
            <Typography variant="omega">{overall.summary}</Typography>
          </Box>
        )}
        {asStrings(overall.trends).map((trend) => (
          <Box key={trend} paddingBottom={1}>
            <Typography variant="omega">• {trend}</Typography>
          </Box>
        ))}
      </>
    );
  },
};

const languageName = (code: unknown) =>
  typeof code === 'string'
    ? (SUPPORTED_MUX_LANGUAGES.find((language) => language.code === code)?.label ?? code)
    : undefined;

// The result is a track on the Mux video, so there's always something to say: where to find it.
const trackView = (audio: boolean): OutputView => ({
  hasContent: () => true,
  render: (outputs, row, t) => {
    const parameters = row.parameters ?? {};
    if (parameters.upload_to_mux === false) {
      return (
        <Note>
          {t(
            'Robots.output.not-attached',
            "This run didn't attach the result to the Mux video. Mux only returned a temporary download link, which has expired."
          )}
        </Note>
      );
    }
    const language =
      languageName(outputs.language_code) ??
      languageName(parameters.to_language_code) ??
      languageName(parameters.language_code) ??
      '';
    return (
      <Note variant="success">
        {audio
          ? t('Robots.output.added-audio', "Added audio track {language}; pick it in the player's audio menu.", {
              language,
            })
          : t('Robots.output.added-track', 'Added track {language}; see it in the Captions tab.', { language })}
      </Note>
    );
  },
});

export const OUTPUT_VIEWS: Record<string, OutputView> = {
  summarize: SUMMARIZE,
  moderate: MODERATE,
  'ask-questions': ASK_QUESTIONS,
  'generate-chapters': GENERATE_CHAPTERS,
  'find-key-moments': FIND_KEY_MOMENTS,
  'find-scenes': FIND_SCENES,
  'find-best-thumbnails': FIND_BEST_THUMBNAILS,
  'generate-engagement-insights': ENGAGEMENT_INSIGHTS,
  'generate-premium-captions': trackView(false),
  'edit-captions': trackView(false),
  'translate-captions': trackView(false),
  'translate-audio': trackView(true),
};
