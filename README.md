# Mux Video Uploader

A [Strapi](https://strapi.io/) plugin for managing uploads to [Mux](https://mux.com).

This plugin provides the ability to upload content via a url or a direct file upload to [Mux](https://mux.com).

## 🤩 Features

- Upload videos using a url or a file to [Mux](https://mux.com) from inside of [Strapi](https://strapi.io/)
- Manage assets with the plugin's asset grid and pagination capabilities
- Search for assets using title or [Mux](https://mux.com) Asset ID values
- Preview content using a player (powered by the [mux-player-react](https://github.com/muxinc/elements/tree/main/packages/mux-player-react) project)
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
- The **Webhook Signing Secret** which can be created in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks) (See the [Webhooks](#Webhooks) section for more info)
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
      // Optional: Mux Robots directives to run on every new upload, e.g. ['drv_...']
      defaultDirectiveIds: [],
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
      // Optional: Mux Robots directives to run on every new upload, e.g. ['drv_...']
      defaultDirectiveIds: [],
    }
  }
  // ...
});
```

## 🪝 Webhooks

The plugin verifies every webhook's signature with your `webhookSigningSecret` and rejects requests that don't match, so make sure it matches the signing secret shown for this webhook in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks).

Verification needs the raw request body, so the plugin turns on `includeUnparsed` for the `strapi::body` middleware listed in your `config/middlewares` file. If you've set `includeUnparsed: false` there, the plugin rejects webhooks with a 500 and logs an error. Keeping the raw body costs memory for the length of each JSON or form request; nothing else about request parsing changes.

If `webhookSigningSecret` is empty, the plugin logs a warning when Strapi starts: every webhook is rejected with a 401 and new uploads stay in "Preparing". Once the secret is right, resend the rejected events from Mux (for example with `mux webhooks events replay`) and the videos catch up.

Mux webhooks are also how Robots results reach Strapi: jobs, directive runs, their outputs, and the new captions or chapters they add to a video.

When setting up your Webhook configuration in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks), the "URL to notify" field should be in the format of—

```
{STRAPI_BASE_URL}/mux-video-uploader/webhook-handler
```

Where `{STRAPI_BASE_URL}` is the publicly accessible hostname of your [Strapi](https://strapi.io/) instance.

To receive webhooks on a local [Strapi](https://strapi.io/), the [Mux CLI](https://www.mux.com/docs/integrations/mux-cli) can forward them. It prints a signing secret to use as `webhookSigningSecret`—

```bash
mux webhooks listen --forward-to http://localhost:1337/mux-video-uploader/webhook-handler
```

## 🤖 Mux Robots

[Mux Robots](https://www.mux.com/docs/guides/robots) runs AI workflows on your Mux videos. Each run consumes Mux AI units: see [Robots pricing](https://www.mux.com/docs/pricing/overview#mux-robots-pricing).

- **Access token.** Robots needs an access token with the Robots permission (`robots:*`). Existing tokens can't gain new permissions, so create a new token in the [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens) and use it for `accessTokenId` / `secretKey`. Robots must also be enabled for your Mux account.
- **The Robots tab.** A video's details have a Robots tab: run any of the 12 workflows, run a directive, cancel a running job, and see every job and directive run on that video with its output. Results arrive through [webhooks](#-webhooks), so the tab updates on its own while something runs.
- **Directives on upload.** List directive ids in `defaultDirectiveIds` and every new upload gets them. The upload form shows them checked; only people with the Run Robots permission can uncheck one. Create directives in the [Mux Dashboard](https://dashboard.mux.com).
- **Stored results.** The newest summary and moderation scores are stored on the Mux Asset (`description`, `tags` and `robots_outputs`) and returned by the plugin's content API, so any role with `find` or `findOne` can read them, moderation scores included. "Use as video title" in a summary's output sets the video's title in Strapi. Captions, dubs and chapters are added to the Mux video itself.
- **Apply summary.** Entries of content types with a relation to Mux Asset show a "Mux Robots" panel in the Content Manager. Apply summary writes the linked video's newest summary into the entry's own fields, as unsaved changes: you choose the target fields and save the entry. Only top-level relations are found (not ones inside components or dynamic zones), and the panel reads the saved entry, so a video linked in the form shows after you save.
- **No automatic retries.** The plugin never repeats a request to Mux on its own, so a run is never started or billed twice by accident. If Mux doesn't answer, the run shows as "Not confirmed" until it appears or you tell the plugin nothing is running.
- **One Strapi process.** The check that holds back a second run while Mux hasn't confirmed the first works within one Strapi process. With several instances behind a load balancer, two clicks that reach different instances can each start, and bill, a run.

## 🧑‍⚖️ Permissions

The plugin's permissions are set per role in **Settings → Administration Panel → Roles → Plugins → Mux Video Uploader**. Super Admin has all of them. They're enforced by the plugin's admin API as well as in the admin panel—

- **Read**: see the plugin, its videos and their Robots results
- **Create**: upload videos
- **Update**: edit titles and captions, "Use as video title", and create a playback ID for a video that has none
- **Delete**: delete videos
- **Run Robots**: run workflows and directives, cancel jobs, and uncheck default directives when uploading. Running Robots consumes Mux AI units, so no role but Super Admin has it until you grant it.

Apply summary in the Content Manager follows the Content Manager's own permissions: anyone who can edit the entry can apply a summary to it.

**Please note**: End Users can only have read operation permissions (`find`, `findOne` and `count`). Write operations are not supported due to potential security reasons.

## ⬆️ Upgrading to 3.2

- **Webhook signatures are verified.** Set `webhookSigningSecret` to the signing secret of your webhook in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks). If it's missing or wrong, Mux webhooks are rejected with 401 and new uploads stay in "Preparing"; after fixing it, resend the failed events from Mux. The plugin turns on `includeUnparsed` for `strapi::body` to read the raw body; if your app sets `includeUnparsed: false`, webhooks fail with 500 and a log message.
- **The admin API enforces the plugin's permissions.** The admin panel already applied Read, Create, Update and Delete; calls made directly to the plugin's admin API by roles without them now get a 403.
- **Custom caption files have unguessable URLs.** Mux downloads each custom caption file from a public URL that now names the stored file by its `documentId` instead of a sequential id, and gets the right file: before, every caption URL returned the first file stored.

Strapi adds the new Mux Asset fields, the database indexes and the Robots jobs table when it starts. There's no migration to run.

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
