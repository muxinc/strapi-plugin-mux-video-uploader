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

`robots-events.v1.ndjson` holds the Robots events Mux delivered on 2026-11-05, after Robots v1's
release, captured the same way on one test asset, in the order they arrived:

1. one v1 job of each workflow Strapi starts, but Translate audio and Generate premium captions
2. a v1 directive run that dispatched a v1 summarize job
3. a v0 directive run that dispatched a v0 edit-captions job, and a v0 summarize job created
   through `/robots/v0`: what keeps arriving after the upgrade

The listener lost the v0 summarize job's `completed` event when its connection dropped, so that job
stops at `processing`. Redacted like the M1 capture.
