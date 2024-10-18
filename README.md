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
    }
  }
  // ...
});
```

## 🪝 Webhooks

**Please note**: We've currently disabled webhook signature verification as there is not a way to access the raw request body from the Koa.js middleware (which [Strapi](https://strapi.io/) is using for parsing requests). This is needed to ensure that we are verifying the signature and that the request JSON payload has properties in the same order that was used for generating the signature.

When setting up your Webhook configuration in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks), the "URL to notify" field should be in the format of—

```
{STRAPI_BASE_URL}/mux-video-uploader/webhook-handler
```

Where `{STRAPI_BASE_URL}` is the publicly accessible hostname of your [Strapi](https://strapi.io/) instance.

## 🧑‍⚖️ Permissions

Currently, anyone with "Super Admin" access to your [Strapi](https://strapi.io/) instance will be able to utilize the plugin for uploading and managing content within the [Strapi](https://strapi.io/) CE version. More sophisticated permissions can be defined for [Strapi](https://strapi.io/) Enterprise users using [RBAC](https://docs.strapi.io/developer-docs/latest/setup-deployment-guides/configurations/optional/rbac.html#declaring-new-conditions).

**Please note**: End Users can only have read operation permissions (`find`, `findOne` and `count`). Write operations are not supported due to potential security reasons.

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
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  url: env('PUBLIC_URL', 'https://strapi.erikthe.red'),
});
```

### Javascript - Server Config

```js
// Path: ./config/server.js
module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  url: env('PUBLIC_URL', 'https://strapi.erikthe.red'),
});
```

## ❤️ Thanks

[Strapi.io](https://strapi.io/)

## 📚 References

- [Mux - Webhooks](https://docs.mux.com/docs/webhooks)
- [Mux - Authentication](https://docs.mux.com/docs/authentication)
- [Strapi.io](https://strapi.io/)
