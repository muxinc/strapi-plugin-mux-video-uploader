import React from 'react';

import Note from './note';

/** A fault in the Robots tab mustn't take down the player, title and captions next to it. */
export default class RobotsErrorBoundary extends React.Component<
  React.PropsWithChildren<{ title: string; message: string }>,
  { error?: Error }
> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[mux-video-uploader] The Robots tab failed to render', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <Note variant="danger" title={this.props.title}>
        {this.props.message}
      </Note>
    );
  }
}
