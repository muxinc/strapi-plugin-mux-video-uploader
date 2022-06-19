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
- [Mux](https://mux.com) updates [Strapi](https://strapi.io/) automatically when the asset is ready using Webhooks

## 🧑‍💻 Install

For installing with **Strapi v4**, install the latest—

```
npm i strapi-plugin-mux-video-uploader@latest

yarn add strapi-plugin-mux-video-uploader@latest
```

For installing with **Strapi v3**, install v2.0.0—

```
npm i strapi-plugin-mux-video-uploader@2.0.0

yarn add strapi-plugin-mux-video-uploader@2.0.0
```

## 🖐 Requirements

- A [Mux](https://mux.com) account
- You will need both the **Access Token** and **Secret Key** scoped with "Full Access" permissions which can be created in the [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens)
- The **Webhook Signing Secret** which can be created in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks) (See the [Webhooks](#Webhooks) section for more info)
- Tested with [Strapi](https://strapi.io/) v4.0.5 Community Edition

## ⚙️ Configuration

In order for this plugin to communicate with [Mux](https://mux.com), some configuration values need to be set for the plugin before it can be used.

With your **Access Token**, **Secret Key** and **Webhook Signing Secret**, navigate to the Settings view within [Strapi](https://strapi.io/) and click the "General" section under **MUX VIDEO UPLOADER**.

On this view, set the appropriate values to their fields and click the Save button.

## 🪝 Webhooks

**Please note**: We've currently disabled webhook signature verification as there is not a way to access the raw request body from the Koa.js middleware (which [Strapi](https://strapi.io/) is using for parsing requests). This is needed to ensure that we are verifying the signature and that the request JSON payload has properties in the same order that was used for generating the signature.

When setting up your Webhook configuration in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks), the "URL to notify" field should be in the format of—

```
{STRAPI_BASE_URL}/mux-video-uploader/webhook-handler
```

Where `{STRAPI_BASE_URL}` is the publicly accessible hostname of your [Strapi](https://strapi.io/) instance.

## 🧑‍⚖️ Permissions

Currently, anyone with "Super Admin" access to your [Strapi](https://strapi.io/) instance will be able to utilize the plugin for uploading and managing content.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

If you encounter an error or have questions, please feel free to file inquiries on the [Issues](https://github.com/muxinc/strapi-plugin-mux-video-uploader/issues) page for `strapi-plugin-mux-video-uploader`.

## 🗣 FAQ

### My Strapi instance is not publicly available, can I still use Webhooks?

Yes! However, in order to make it work, you'll need a "Webhook Relay" that runs from within your network. You can use a Webhook Relay service like Smee (https://smee.io/) or ngrok (https://ngrok.com/) to forward Webhook events to an instance of [Strapi](https://strapi.io/) behind a firewall.

### I've installed the plugin, but the Strapi Admin UI doesn't show it

This happens when you need to rebuild your [Strapi](https://strapi.io/) instance. To do this, you need delete the `.cache` and `build` folders (while [Strapi](https://strapi.io/) is off) and restart to rebuild the instance.

Here is an example of how to do this on a unix-based operating system from within the [Strapi](https://strapi.io/) application root—

```
% rm -rf ./.cache ./build
```

## ❤️ Thanks

[Strapi.io](https://strapi.io/)

## 📚 References

- [Mux - Webhooks](https://docs.mux.com/docs/webhooks)
- [Mux - Authentication](https://docs.mux.com/docs/authentication)
- [Strapi.io](https://strapi.io/)
