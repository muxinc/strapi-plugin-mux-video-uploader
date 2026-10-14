# Webhook fixtures

`robots-events.m1.ndjson` holds the Robots events Mux delivered in manual test M1 on 2026-10-13,
captured with `mux webhooks listen --json`, in the order they arrived:

1. a summarize job created through the API
2. a directive run that dispatched a moderate and a summarize job
3. a generate-premium-captions job

The environment and the signed caption URL's query string are redacted; everything else is as Mux
sent it. Capture again rather than editing by hand.

`robots.directive_run.partial.json` is written by hand in the captured shape: M1 had no partial run,
and the tests need failed and waiting steps.
