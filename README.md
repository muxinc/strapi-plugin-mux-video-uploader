# Strapi plugin mux

## Summary

A [Strapi](https://strapi.io/) plugin for managing uploads to [Mux](https://mux.com).

This plugin provides the ability to upload content via a url or a direct file upload to [Mux](https://mux.com).

## Install

```
npm i strapi-plugin-mux-video-uploader
```

*- or -*

```
yarn add strapi-plugin-mux-video-uploader
```

## Usage

### Dependencies

- A [Mux](https://mux.com) account
- You will need both the **Access Token** and **Secret Key** scoped with "Full Access" permissions which can be created in the [Mux Dashboard](https://dashboard.mux.com/settings/access-tokens)
- The **Webhook Signing Secret** which can be created in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks) (See the [Webhooks](#Webhooks) section for more info)
- Tested with [Strapi](https://strapi.io/) v3.1.4

### Webhooks

When setting up your Webhook configuration in the [Mux Dashboard](https://dashboard.mux.com/settings/webhooks), the "URL to notify" field should be in the format of—

```
{STRAPI_BASE_URL}/mux-video-uploader/webhook-handler
```

Where `{STRAPI_BASE_URL}` is the publicly accessible hostname of your [Strapi](https://strapi.io/) instance.

### Configuration

In order for this plugin to communicate with [Mux](https://mux.com), some configuration values need to be set for the plugin before it can be used.

With your **Access Token**, **Secret Key** and **Webhook Signing Secret**, navigate to the Settings view within [Strapi](https://strapi.io/) and click the "General" section under **MUX VIDEO UPLOADER**.

On this view, set the appropriate values to their fields and click the Save button.

### Permissions

Currently, anyone that has administrative access to your Strapi instance will be able to utilize the plugin for uploading and managing content.

The only real permission that needs to be set to function is the public access to the `muxwebhookhandler` method.  This is needed so that Mux can send Webhook events to your Strapi instance for updating `MuxAsset` content types.

To enable this permission, do the following steps—

- Log into the Strapi admin UI and navigate to "Roles & Permissions"
- Click on the edit button aside the "Public" role
- Drop down the "MUX-VIDEO-UPLOADER" section and check the box nexzt to `muxwebhookhandler`
- Save changes

## Features

- Upload videos using a url or a file to [Mux](https://mux.com) from inside of [Strapi](https://strapi.io/)
- [Mux](https://mux.com) updates [Strapi](https://strapi.io/) when the asset is ready
- A `MuxAsset` content-type is provided to track asset readiness and that can be referenced by other [Strapi](https://strapi.io/) content-types

## Contributing
Contributions, issues and feature requests are welcome!

Feel free to check issues page.

## FAQ

#### My Strapi instance is not publicly available, can I still use Webhooks?

Yes!  However, in order to make it work, you'll need a "Webhook Relay" that runs from within your network.  You can use a Webhook Relay service like Smee (https://smee.io/) or ngrok (https://ngrok.com/) to forward Webhook events to an instance of [Strapi](https://strapi.io/) behind a firewall.

## Thanks

[Strapi.io](https://strapi.io/)

## References

- [Mux - Webhooks](https://docs.mux.com/docs/webhooks)
- [Mux - Authentication](https://docs.mux.com/docs/authentication)
- [Strapi.io](https://strapi.io/)
