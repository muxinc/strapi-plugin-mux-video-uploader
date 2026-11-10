# Mux Video Uploader

A [Strapi](https://strapi.io/) plugin for managing uploads to [Mux](https://mux.com).

This plugin provides the ability to upload content via a url or a direct file upload to [Mux](https://mux.com).

## 🤩 Features

- Upload videos using a url or a file to [Mux](https://mux.com) from inside of [Strapi](https://strapi.io/)
- Manage assets with the plugin's asset grid and pagination capabilities
- Search for assets using title or [Mux](https://mux.com) Asset ID values
- Preview content using a player (powered by [Video.js](https://videojs.org))
- Delete assets which result in the [Mux](https://mux.com) Asset also being deleted
- Support uploading audio files
- Attachment of either sidecar subtitle files (supports `.vtt` or `.srt` files) or Mux's auto-generated captions
- Enable Signed playback for protected video delivery
- Support of Mux's video quality and maximum stream resolution
- Enable MP4 downloads on assets during upload
- [Mux](https://mux.com) updates [Strapi](https://strapi.io/) automatically when the asset is ready using Webhooks
- Run [Mux Robots](https://www.mux.com/docs/guides/robots) AI workflows (summaries, captions, translations, chapters, moderation and more) from a video's details, and attach Robots directives to new uploads
- Apply a video's generated title, description and tags to the entries that use it, from the Content Manager

## 🧑‍💻 Install

For installing with **Strapi v5**, install the latest—

```bash
npm i strapi-plugin-mux-video-uploader@latest

yarn add strapi-plugin-mux-video-uploader@latest
```

For installing with **Strapi v4**, install v2.0.0—

```bash
npm i strapi-plugin-mux-video-uploader@2.8.4

yarn add strapi-plugin-mux-video-uploader@2.8.4
```

## 🖐 Requirements

- A [Mux](https://mux.com) account
- You will need both the **Access Token** and **Secret Key** scoped with "Full Access" permissions which can be created in the [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens)
- (Optional) If you plan to support [Signed video playback](https://docs.mux.com/guides/secure-video-playback), you will need to obtain a Signing key set
- The **Webhook Signing Secret** which can be created in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks) (See the [Webhooks](#-webhooks) section for more info)
- (Optional) To use Mux Robots, the access token also needs the Robots permission (`robots:*`). See [Mux Robots](#-mux-robots)
- Tested with [Strapi](https://strapi.io/) v5.0.6 Community Edition

## ⚙️ Configuration

In order for this plugin to communicate with [Mux](https://mux.com), some configuration values need to be set for the plugin before it can be used.

**Starting in v3.0.0 of this plugin, we have switch to Strapi's File Based Config**.  To increase the portability of clustered deployments, we have switched to this paradigm to manage app configs.  This means that setting the configurations using the Settings view in the [Strapi](https://strapi.io/) Admin UI will no longer be available.

In migrating to v3.0.0, you will need to transition to the [Strapi](https://strapi.io/) File Based Config and copy the values that you had used to initially set up your plugin—

### Typescript - Plugin Config

```ts
// Path: ./config/plugins.ts
export default ({env}) => ({
  // ...
  "mux-video-uploader": {
    enabled: true,
    config: {
      accessTokenId: env('ACCESS_TOKEN_ID'),
      secretKey: env('ACCESS_TOKEN_SECRET'),
      webhookSigningSecret: env('WEBHOOK_SIGNING_SECRET'),
      playbackSigningId: env('SIGNING_KEY_ID'),
      playbackSigningSecret: env('SIGNING_KEY_PRIVATE_KEY'),
      defaultDirectiveIds: env.array('MUX_DEFAULT_DIRECTIVE_IDS', []),
    }
  }
  // ...
});
```

### Javascript - Plugin Config

```js
// Path: ./config/plugins.js
module.exports = ({env}) => ({
  // ...
  "mux-video-uploader": {
    enabled: true,
    config: {
      accessTokenId: env('ACCESS_TOKEN_ID'),
      secretKey: env('ACCESS_TOKEN_SECRET'),
      webhookSigningSecret: env('WEBHOOK_SIGNING_SECRET'),
      playbackSigningId: env('SIGNING_KEY_ID'),
      playbackSigningSecret: env('SIGNING_KEY_PRIVATE_KEY'),
      defaultDirectiveIds: env.array('MUX_DEFAULT_DIRECTIVE_IDS', []),
    }
  }
  // ...
});
```

- `webhookSigningSecret` must be set, or every webhook is rejected. See [Webhooks](#-webhooks).
- `defaultDirectiveIds` is optional: the Mux Robots directives to run on every new upload (see [Directives on upload](#directives-on-upload)). Set `MUX_DEFAULT_DIRECTIVE_IDS` to a comma-separated list of directive ids, such as `drv_abc123,drv_def456`. Leave it empty or unset for none: the plugin trims each entry and ignores empty ones.

## 🪝 Webhooks

Mux webhooks tell Strapi when a video is ready, and bring Mux Robots results: jobs, directive runs, their outputs, and the new captions or chapters they add to a video.

1. In the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks), create a webhook whose "URL to notify" is—

   ```
   {STRAPI_BASE_URL}/mux-video-uploader/webhook-handler
   ```

   Where `{STRAPI_BASE_URL}` is the publicly accessible hostname of your [Strapi](https://strapi.io/) instance.

2. Copy that webhook's signing secret into `webhookSigningSecret`, and restart Strapi.

**`webhookSigningSecret` must be set.** The plugin checks every webhook's signature with it. If it's empty or wrong, every webhook is rejected with a 401 and new uploads stay in "Preparing"; if it's empty, Strapi also logs a warning when it starts. Once it's right, resend the rejected events from Mux (for example with `mux webhooks events replay`) and the videos catch up.

**Leave `includeUnparsed` on.** Checking a signature needs the raw request body, so the plugin turns on `includeUnparsed` for `strapi::body` in your `config/middlewares` file. If you set `includeUnparsed: false` there, the plugin warns when Strapi starts, and rejects webhooks with a 500 and an error in the log. Keeping the raw body costs memory for the length of each JSON or form request; nothing else about request parsing changes.

### Local development

The [Mux CLI](https://www.mux.com/docs/integrations/mux-cli) can forward webhooks to a local [Strapi](https://strapi.io/). It prints a signing secret to use as `webhookSigningSecret`—

```bash
mux webhooks listen --forward-to http://localhost:1337/mux-video-uploader/webhook-handler
```

## 🤖 Mux Robots

[Mux Robots](https://www.mux.com/docs/guides/robots) runs AI workflows on your Mux videos. Each run consumes Mux AI units: see [Robots pricing](https://www.mux.com/docs/pricing/overview#mux-robots-pricing).

Since 4.0 the plugin starts every job and directive run on Robots v1, the GA API. Robots v0 (beta) is deprecated and Mux keeps it until about April 2027: the plugin still reads, cancels and stores the v0 jobs and runs it finds, but never starts one. See **Upgrading to 4.0** below.

### Set up Robots

1. Make sure Robots is enabled for your Mux account.
2. Create a **new** access token with the Robots permission (`robots:*`) in the [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens), and use it for `accessTokenId` / `secretKey`. Existing tokens can't gain new permissions.
3. Set up [Webhooks](#-webhooks): they're how results reach Strapi.
4. Grant **Run Robots** to the roles that should run workflows (see Permissions below).
5. Optionally, set up [directives to run on every upload](#directives-on-upload).

### Run workflows and directives

The **Robots** tab of a video's details lets you:

- run any of the 12 workflows, or a v1 directive;
- cancel a running job;
- see every job and directive run on that video, with its output and the Mux AI units it consumed, v0 ones included.

**Analyze structure** writes a title, summary, tags, chapters, scenes and key moments in one job, and replaces Find scenes, which Robots v1 dropped. It costs more Mux AI units than Find scenes did, and on a video it also requests or reuses [Mux Shots](https://www.mux.com/docs/guides/find-different-shots-in-your-video), billed separately. It also runs on audio-only videos that have a caption track. Find scenes jobs that ran before stay listed, with their output.

Captions, dubs and chapters are added to the Mux video itself, and the preview player shows them.

### Description and tags

- When a summarize or analyze-structure job completes, its description (analyze-structure's summary) and tags fill the video's `description` and `tags`, but only if they're empty. Anything already there stays, and the title never changes on its own.
- Both fields are shown and editable in the video's **Details** tab.
- **Apply summary** in the Details tab writes the newest summary's title, description or tags into the form, replacing what's there. The newest summary is the latest completed of Summarize and Analyze structure, and the dialog names which. Review them, then save. The button is disabled until the video has one of them.

### Apply a summary to your entries

Entries of content types with a relation to Mux Asset show a **Mux Robots** panel in the Content Manager.

1. Click **Apply summary** in the panel.
2. Pick one of the entry's fields for each output (title, description, tags) and apply: the linked video's newest summary goes there as unsaved changes.
3. Save the entry.

Only top-level relations are found, not ones inside components or dynamic zones. The panel reads the saved entry, so a video you link in the form shows after you save.

### Directives on upload

1. Create directives in the [Mux Dashboard](https://dashboard.mux.com).
2. List their ids in `defaultDirectiveIds` (see the [plugin config](#typescript---plugin-config)).
3. Every new upload gets them. The upload form lists them, checked, in its **Automation** section. Only people with **Run Robots** can uncheck one. An id Mux doesn't have is flagged there and isn't attached.

A directive keeps the Robots version that created it, whatever the plugin calls: Mux runs a v0 directive on v0, and the plugin stores its runs and jobs. The upload form and the **Run a directive** dialog mark v0 directives, the dialog doesn't run them, and Strapi logs a warning each time an upload attaches one. To move one to v1, open it in the Mux Dashboard, choose **Create v1 copy**, and replace its id in `defaultDirectiveIds` with the copy's (see Mux's [directives migration guide](https://www.mux.com/docs/guides/robots-migrate-directives-to-v1)). Don't list both ids: both directives would run, and both bill.

### Good to know

- **How results arrive.** Mux sends every job and directive run update by webhook, and Strapi stores it. Opening the Robots tab reads Mux once, to pick up jobs started outside Strapi. After that, the tab re-reads Strapi every 4 seconds while something runs, and stops when nothing does or the details close. Nothing polls Mux.
- **Who can read results.** The newest summary, analyze-structure result and moderation scores are kept in the Mux Asset's `robots_outputs`. The plugin's content API returns `description`, `tags` and `robots_outputs`, so any role with `find` or `findOne` can read them, moderation scores included.
- **No automatic retries.** The plugin never repeats a request to Mux on its own, so a run is never started or billed twice by accident. If Mux doesn't answer, the run shows as "Not confirmed" until it appears or you tell the plugin nothing is running.
- **One Strapi process.** The check that holds back a second run while Mux hasn't confirmed the first works within one Strapi process. With several instances behind a load balancer, two clicks that reach different instances can each start, and bill, a run.

## 🧑‍⚖️ Permissions

Set the plugin's permissions per role in **Settings → Administration Panel → Roles → Plugins → Mux Video Uploader**. Super Admin has all of them. The plugin's admin API enforces them as well as the admin panel—

- **Read**: see the plugin, its videos and their Robots results
- **Create**: upload videos
- **Update**: edit titles, descriptions, tags and captions, apply a summary to a video, and create a playback ID for a video that has none
- **Delete**: delete videos
- **Run Robots**: run workflows and directives, cancel jobs, and uncheck default directives when uploading. Running Robots consumes Mux AI units, so no role but Super Admin has it until you grant it.

Apply summary in the Content Manager follows the Content Manager's own permissions: anyone who can edit the entry can apply a summary to it.

**Please note**: End Users can only have read operation permissions (`find`, `findOne` and `count`). Write operations are not supported due to potential security reasons.

These endpoints follow Strapi's content API rules: `filters`, `sort`, `fields` and `populate` can't use private fields or the admin users behind `createdBy`/`updatedBy` (the request gets a 400), and `find` returns at most `api.rest.maxLimit` items (100 when unset), paginated with `start`/`limit` or `pagination[page]`/`pagination[pageSize]`.

## ⬆️ Upgrading to 4.0

4.0 moves Robots to v1, the GA API. Everything else works as in 3.3, and there's no migration to run: Strapi adds one column, and nothing is deleted or rewritten.

1. Update the package, then rebuild the admin—

   ```bash
   npm install strapi-plugin-mux-video-uploader@^4.0.0
   npm run build
   ```

2. Start Strapi. It adds `api_version` to `muxrobotjobs`; rows stored by 3.2 or 3.3 keep it empty, and the plugin works out their version the next time it reads them from Mux.
3. Move your directives to v1: see [Directives on upload](#directives-on-upload). Until you do, `defaultDirectiveIds` keeps starting v0 runs, which work until Mux retires v0.

**Rolling back, or several instances.** 3.x doesn't know Robots v1: it acknowledges `robots.v1.*` webhooks without storing them, and can't read or cancel v1 jobs. Upgrade every Strapi instance that receives webhooks before running anything, and let running jobs finish before rolling back. A rollback also drops `api_version`; upgrading again works the versions out again.

What behaves differently—

- **New jobs and runs start on Robots v1.** v0 jobs and runs, from before the upgrade or from v0 directives, are still listed, updated by their webhooks, and read on v0. Mux doesn't see a v0 job and a v1 job of the same workflow as duplicates: the run form warns when a v0 one is still running, since both bill.
- **Webhooks of both versions are handled.** v1 jobs and runs send `robots.v1.job.*` and `robots.v1.directive_run.*` events. If a proxy or firewall in front of Strapi filters events by type, let both through.
- **Times are seconds.** Key moments, thumbnails and insights report seconds on v1, and the key moments form asks for its highlight lengths in seconds. Jobs that ran on v0 still show their times right.
- **Captions to read** lists the video's own ready caption languages. v1 reads a track only when its language matches exactly: `en` doesn't read an `en-US` track, and nothing prefers English anymore when you leave it empty.
- **Edit captions replaces the track it edits by default**, keeping its name, as v1 does. Choose to keep it to add the edited track beside it, under a new name. `track_name_suffix` and `delete_original_track` are gone.
- **Track replacement is a choice.** Generate premium captions, Translate captions and Translate audio ask what to do when the video already has a track in that language or with that name: don't run (Mux's default), replace it, or replace it only if Mux auto-generated it. Tracks Robots made count as uploaded.
- **Moderate also scores what is said.** On a video with a ready caption track, v1 moderates the transcript as well as sampled frames unless you uncheck it, so "Delete every playback ID" can now act on what is said, not only on what is seen.
- **Find scenes can't be run.** Run Analyze structure instead.
- **A `409` doesn't always mean "already running".** v1 also answers `409` while the video or the caption track a workflow reads is still being prepared; the form shows Mux's message.

## ⬆️ Upgrading to 3.2

Your videos and captions are kept: Strapi only adds tables, columns and indexes (see [Data stored by the plugin](#-data-stored-by-the-plugin)), and nothing is deleted or rewritten. There's no migration to run.

1. Update the package, then rebuild the admin—

   ```bash
   npm install strapi-plugin-mux-video-uploader@^3.2.0
   npm run build
   ```

2. Check that `webhookSigningSecret` matches the signing secret of your webhook in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks). Webhooks are now verified: with a missing or wrong secret they get a 401 and new uploads stay in "Preparing".
3. If your app's `config/middlewares` sets `includeUnparsed: false` on `strapi::body`, remove that option. Webhooks fail with 500 without it (see [Webhooks](#-webhooks)).
4. Start Strapi. It creates the `muxrobotjobs` table and the new `muxassets` columns and indexes on its own.
5. If webhooks were rejected while the secret was wrong, resend them from Mux, for example with `mux webhooks events replay`.
6. To use Mux Robots, follow [Set up Robots](#set-up-robots).

What behaves differently—

- **The admin API enforces the plugin's permissions.** The admin panel already applied Read, Create, Update and Delete; calls made directly to the plugin's admin API by roles without them now get a 403.
- **Failed requests to Mux aren't retried.** A retried create could start a second billed Robots job, so every call to Mux is made once and its error is shown as is.
- **Saving a video's details only deletes caption tracks the form showed.** Calls made directly to the update API delete a track only when its id is listed in `known_track_ids`.
- **Custom caption files have unguessable URLs.** Mux downloads each custom caption file from a public URL that now names the stored file by its `documentId` instead of a sequential id, and gets the right file: before, every caption URL returned the first file stored.

## 💾 Data stored by the plugin

For reference: besides Strapi's own columns (`id`, `document_id`, `created_at`, `updated_at`, `published_at`, `created_by_id`, `updated_by_id`), the plugin keeps three tables.

**`muxassets`**: Mux Asset (`plugin::mux-video-uploader.mux-asset`), one row per video. Indexed on `asset_id` and `upload_id` (new in 3.2).

| Column | Type | Holds |
| --- | --- | --- |
| `title` | string | The video's title in Strapi |
| `upload_id`, `asset_id`, `playback_id` | string | Mux ids |
| `signed` | boolean | Signed playback |
| `is_ready` | boolean | Mux finished processing the video |
| `error_message` | string | Mux's error for a failed upload or asset |
| `duration`, `aspect_ratio` | decimal, string | From Mux |
| `asset_data` | json | The Mux asset as last read: tracks, playback ids, renditions |
| `description` | text | **New in 3.2.** Filled by a summarize job when empty; editable |
| `tags` | json | **New in 3.2.** A list of strings, filled by a summarize job when empty; editable |
| `robots_outputs` | json | **New in 3.2.** The newest `summarize` (`job_id`, `completed_at`, `title`, `description`, `tags`) and `moderate` (`job_id`, `completed_at`, `exceeds_threshold`, `max_scores`) results. **New in 4.0:** `analyze_structure` (`job_id`, `completed_at`, `title`, `summary`, `tags`); its chapters, scenes and key moments stay in `muxrobotjobs` |

**`muxrobotjobs`**: Mux Robot Job (`plugin::mux-video-uploader.mux-robot-job`), **new in 3.2**, hidden from the Content Manager. Indexed on `mux_id` and `asset_id`.

- One row per Robots job or directive run Mux reports through webhooks, including runs on videos this Strapi doesn't have, so their results show if the video is added later.
- A short-lived row for each run started from Strapi, until Mux confirms it.
- Rows are never deleted, so results outlive Mux's own retention.

| Column | Type | Holds |
| --- | --- | --- |
| `mux_id` | string | `rjob_…` or `drvrun_…`; empty until Mux confirms a run started from Strapi |
| `api_version` | string | **New in 4.0.** `v1` or `v0`, the Robots version that created it, which every later read and cancel uses. Empty on rows stored by 3.2 until Mux names their version |
| `is_directive_run` | boolean | A directive run rather than a job |
| `workflow` | string | The workflow, e.g. `summarize` (jobs). Also `find-scenes` (Robots v0 only) and `generate-contextual-text`, which directives can dispatch but the plugin doesn't start |
| `directive_id`, `directive_run_id` | string | The directive and run that started a job, or the run's directive |
| `status` | string | `pending`, `processing`, `completed`, `errored`, `cancelled`; runs also `partial`; `requested` or `unconfirmed` while Mux hasn't confirmed a run |
| `asset_id` | string | The Mux asset id, matching a Mux Asset row's `asset_id` when this Strapi has the video |
| `parameters`, `outputs`, `errors` | json | As Mux reported them |
| `units_consumed` | integer | Mux AI units |
| `run_data` | json | A directive run's steps and timestamps |
| `mux_created_at`, `mux_updated_at` | datetime | Mux's timestamps |
| `detail_loaded` | boolean | Outputs and units are stored |
| `request_id`, `requested_at`, `requested_by` | string, datetime, integer | Who started a run from Strapi, and when |

**`muxtexttracks`**: Mux Text Track (`plugin::mux-video-uploader.mux-text-track`), unchanged: custom caption files (`name`, `language_code`, `closed_captions`, `file`) kept so Mux can download them from `/mux-video-uploader/mux-text-tracks/:documentId`.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Developers for this plugin should take a look at the `README_INTERNAL.md` document for details on setting up dev environments.

If you encounter an error or have questions, please feel free to file inquiries on the [Issues](https://github.com/muxinc/strapi-plugin-mux-video-uploader/issues) page for `strapi-plugin-mux-video-uploader`.

## 🗣 FAQ

### My Strapi instance is not publicly available, can I still use Webhooks?

Yes! However, in order to make it work, you'll need a "Webhook Relay" that runs from within your network. You can use a Webhook Relay service like Smee (https://smee.io/) or ngrok (https://ngrok.com/) to forward Webhook events to an instance of [Strapi](https://strapi.io/) behind a firewall.

### I've installed the plugin, but the Strapi Admin UI doesn't show it

This happens when you need to rebuild your [Strapi](https://strapi.io/) instance. To do this, you need delete the `.cache`, `.strapi`, and `build` folders (while [Strapi](https://strapi.io/) is off) and restart to rebuild the instance.

Here is an example of how to do this on a unix-based operating system from within the [Strapi](https://strapi.io/) application root—

```bash
rm -rf ./.cache ./build ./.strapi
```

### Thumbnails don't show when hovering the player's timeline

The player loads those thumbnails from a storyboard VTT on `image.mux.com`. Strapi's default Content Security Policy only allows media from `'self' data: blob:`, so the browser blocks it. Add `https://image.mux.com` to `media-src` (for the VTT) and `img-src` (for the images it points to) by replacing the `'strapi::security'` entry of your `config/middlewares` file with this—

```js
// Path: ./config/middlewares.js (in middlewares.ts, use `export default [`)
module.exports = [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': ["'self'", 'data:', 'blob:', 'https://market-assets.strapi.io', 'https://image.mux.com'],
          'media-src': ["'self'", 'data:', 'blob:', 'https://image.mux.com'],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  // ...the rest of your middlewares, unchanged
];
```

Keep all of Strapi's defaults in the directives you change, as above: Strapi merges your list over its own entry by entry, so leaving them out drops some of them. Then restart Strapi.

### Custom subtitles and captions aren't working

When uploading a video with custom text tracks, Mux asks for an URL pointing to these files. This feature currently works only on deployed [Strapi](https://strapi.io/) installations.

When developing locally with [Strapi](https://strapi.io/), we don't have a globally reachable URL. Unlike webhooks with which we can use a local webhook proxy (e.g. Smee.io or ngrok), the plugin currently offers no way to configure a base URL to receive Mux's caption download requests. You'll still be able to upload videos, but the tracks won't be properly parsed by Mux.

Another approach would be to use tunnel service such as Cloudflare ZeroTrust or Tailscale to route requests against a publicly accessible hostname to your local instance.  If you go this route, you will need to ensure that you configure [Strapi](https://strapi.io/) to use the hostname when generating the Mux's caption download requests.  Here is an example of how to do that—

### Typescript - Server Config

```ts
// Path: ./config/server.ts
export default ({ env }) => ({
  // ... Existing properties set by Strapi
  url: env('PUBLIC_URL', 'https://your_host.domain.tld'),
});
```

### Javascript - Server Config

```js
// Path: ./config/server.js
module.exports = ({ env }) => ({
  // ... Existing properties set by Strapi
  url: env('PUBLIC_URL', 'https://your_host.domain.tld'),
});
```

## ❤️ Thanks

[Strapi.io](https://strapi.io/)

## 📚 References

- [Mux - Webhooks](https://docs.mux.com/docs/webhooks)
- [Mux - Authentication](https://docs.mux.com/docs/authentication)
- [Strapi.io](https://strapi.io/)
