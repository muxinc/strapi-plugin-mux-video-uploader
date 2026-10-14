import React from 'react';
import { Box, Typography } from '@strapi/design-system';

type NoteVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

const COLORS: Record<NoteVariant, { background: string; borderColor: string }> = {
  neutral: { background: 'neutral100', borderColor: 'neutral200' },
  info: { background: 'primary100', borderColor: 'primary200' },
  success: { background: 'success100', borderColor: 'success200' },
  warning: { background: 'warning100', borderColor: 'warning200' },
  danger: { background: 'danger100', borderColor: 'danger200' },
};

/** Not the design system's Alert, which always shows a close button. */
export default function Note({
  variant = 'neutral',
  title,
  action,
  children,
}: React.PropsWithChildren<{
  variant?: NoteVariant;
  title?: string;
  action?: React.ReactNode;
}>) {
  return (
    <Box {...(COLORS[variant] as any)} hasRadius padding={4} role={variant === 'danger' ? 'alert' : 'status'}>
      {title && (
        <Typography variant="omega" fontWeight="bold" textColor="neutral800" tag="p">
          {title}
        </Typography>
      )}
      {children && (
        <Box paddingTop={title ? 1 : 0}>
          <Typography variant="omega" textColor="neutral800" tag="div">
            {children}
          </Typography>
        </Box>
      )}
      {action && <Box paddingTop={3}>{action}</Box>}
    </Box>
  );
}
