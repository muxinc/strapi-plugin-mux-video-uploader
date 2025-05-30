"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const admin = require("@strapi/strapi/admin");
const reactRouterDom = require("react-router-dom");
const designSystem = require("@strapi/design-system");
const React = require("react");
const reactIntl = require("react-intl");
const styled = require("styled-components");
const icons = require("@strapi/icons");
const index = require("./index-DAjid8mg.js");
const luxon = require("luxon");
const upchunk = require("@mux/upchunk");
const formik = require("formik");
const zod = require("zod");
const LanguagesList = require("iso-639-1");
const copy = require("copy-to-clipboard");
const MuxPlayer = require("@mux/mux-player-react");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const React__default = /* @__PURE__ */ _interopDefault(React);
const styled__default = /* @__PURE__ */ _interopDefault(styled);
const LanguagesList__default = /* @__PURE__ */ _interopDefault(LanguagesList);
const copy__default = /* @__PURE__ */ _interopDefault(copy);
const MuxPlayer__default = /* @__PURE__ */ _interopDefault(MuxPlayer);
const secondsToFormattedString = (seconds) => {
  const date = luxon.Duration.fromMillis(seconds * 1e3);
  const parts = date.shiftTo("hours", "minutes", "seconds").toObject();
  const secs = parts.seconds && Math.round(parts.seconds).toString().padStart(2, "0");
  if (parts.hours === 0) {
    return `${parts.minutes}:${secs}`;
  } else {
    const mins = parts.minutes?.toString().padStart(2, "0");
    return `${parts.hours}:${mins}:${secs}`;
  }
};
const SignedTokensContext = React__default.default.createContext({
  video: async () => null,
  thumbnail: async () => null,
  storyboard: async () => null,
  animated: async () => null
});
function useSignedTokens() {
  return React__default.default.useContext(SignedTokensContext);
}
function SignedTokensProvider({ muxAsset, children }) {
  const { get } = admin.useFetchClient();
  const video = async function(muxAsset2) {
    const { data } = await get(`${index.PLUGIN_ID}/sign/${muxAsset2.playback_id}?type=video`);
    return data.token;
  };
  const thumbnail = async function(muxAsset2) {
    const { data } = await get(`${index.PLUGIN_ID}/sign/${muxAsset2.playback_id}?type=thumbnail`);
    return data.token;
  };
  const storyboard = async function(muxAsset2) {
    const { data } = await get(`${index.PLUGIN_ID}/sign/${muxAsset2.playback_id}?type=storyboard`);
    return data.token;
  };
  const animated = async function(muxAsset2) {
    const { data } = await get(`${index.PLUGIN_ID}/sign/${muxAsset2.playback_id}?type=animated`);
    return data.token;
  };
  return /* @__PURE__ */ jsxRuntime.jsx(
    SignedTokensContext.Provider,
    {
      value: {
        video,
        thumbnail,
        storyboard,
        animated
      },
      children
    }
  );
}
const BoxStyled = styled__default.default(designSystem.Box)`
  cursor: pointer;

  svg {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
const CardTitleStyled = styled__default.default(designSystem.CardTitle)`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  min-height: 2.66em;
`;
const AssetCard = (props) => {
  const { muxAsset, onClick = () => {
  } } = props;
  const [thumbnailImageUrl, setThumbnailImageUrl] = React__default.default.useState(
    // Empty pixel
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  );
  const { formatMessage, formatDate } = reactIntl.useIntl();
  const { thumbnail } = useSignedTokens();
  const isLoading = muxAsset.asset_id === null;
  const init = async (muxAsset2) => {
    const { playback_id } = muxAsset2;
    if (muxAsset2.playback_id !== null && muxAsset2.signed) {
      const token = await thumbnail(muxAsset2);
      setThumbnailImageUrl(`/${index.PLUGIN_ID}/thumbnail/${playback_id}?token=${token}`);
    } else if (muxAsset2.playback_id !== null) {
      setThumbnailImageUrl(`/${index.PLUGIN_ID}/thumbnail/${playback_id}`);
    }
  };
  React__default.default.useEffect(() => {
    init(muxAsset);
  }, []);
  const renderCardAssetStatus = React__default.default.useCallback(() => {
    if (muxAsset.error_message !== null) {
      return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { children: /* @__PURE__ */ jsxRuntime.jsx(icons.WarningCircle, { fill: "danger500" }) });
    } else if (isLoading || !muxAsset.playback_id) {
      return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Loader, { small: true, children: formatMessage({ id: index.getTranslation("AssetCard.loading"), defaultMessage: "Loading" }) }) });
    }
  }, [muxAsset]);
  const handleOnClick = () => {
    onClick(muxAsset);
  };
  const loadingTitle = isLoading && formatMessage({
    id: index.getTranslation("AssetCard.is-loading"),
    defaultMessage: "Asset is being processed"
  });
  const errorTitle = isLoading && formatMessage({
    id: index.getTranslation("AssetCard.is-error"),
    defaultMessage: "Asset encountered an error"
  });
  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  const statusLabel = (() => {
    if (aspect_ratio)
      return aspect_ratio;
    if (muxAsset.isReady)
      return formatMessage({
        id: index.getTranslation("AssetCard.no-aspect-ratio"),
        defaultMessage: "No aspect ratio"
      });
    if (muxAsset.error_message !== null)
      return formatMessage({
        id: index.getTranslation("AssetCard.processing-error"),
        defaultMessage: "Error"
      });
    return formatMessage({
      id: index.getTranslation("AssetCard.processing-pending"),
      defaultMessage: "Processing"
    });
  })();
  return /* @__PURE__ */ jsxRuntime.jsx(BoxStyled, { onClick: handleOnClick, title: errorTitle || loadingTitle || void 0, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Card, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.CardHeader, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.CardAsset, { src: thumbnailImageUrl, style: { objectFit: "cover" }, children: renderCardAssetStatus() }),
      muxAsset.duration && /* @__PURE__ */ jsxRuntime.jsx(designSystem.CardTimer, { children: secondsToFormattedString(muxAsset.duration) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.CardBody, { children: [
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.CardContent, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(CardTitleStyled, { title: muxAsset.title, children: muxAsset.title }),
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.CardSubtitle, { children: [
          muxAsset.createdAt ? formatDate(muxAsset.createdAt) : null,
          " - ",
          statusLabel
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.CardBadge, { children: /* @__PURE__ */ jsxRuntime.jsx("span", { title: muxAsset.signed ? "Private Playback" : "Public Playback", children: muxAsset.signed ? /* @__PURE__ */ jsxRuntime.jsx(icons.Lock, {}) : /* @__PURE__ */ jsxRuntime.jsx(icons.Earth, {}) }) })
    ] })
  ] }) });
};
const AssetGrid = (props) => {
  const { muxAssets, onMuxAssetClick = () => {
  } } = props;
  const { formatMessage } = reactIntl.useIntl();
  if (muxAssets === void 0)
    return null;
  if (muxAssets.length === 0)
    return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", padding: 5, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "omega", textColor: "neutral700", children: formatMessage({
      id: index.getTranslation("HomePage.no-assets"),
      defaultMessage: "No assets found"
    }) }) });
  const assets = muxAssets.map((muxAsset) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 3, m: 4, xs: 12, s: 6, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { width: "100%", children: /* @__PURE__ */ jsxRuntime.jsx(AssetCard, { muxAsset, onClick: onMuxAssetClick }) }) }, muxAsset.id));
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingTop: 6, paddingBottom: 8, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Root, { gap: 4, children: assets }) });
};
const appendQueryParameter = (location, queryParameters) => {
  const params = new URLSearchParams(location.search);
  for (let key in queryParameters) {
    params.set(key, queryParameters[key]);
  }
  return { ...location, search: params.toString() };
};
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const first = function(params) {
  const { pages, activePage } = params;
  return Array.from({ length: clamp(pages, 1, 3) }, (x, i) => ({
    type: "PageItem",
    label: (i + 1).toString(),
    value: i + 1,
    active: activePage === i + 1
  }));
};
const middle = function(params) {
  const { pages, activePage } = params;
  const dotsStart = {
    type: "DotsItem",
    display: false,
    value: 0,
    additional: void 0
  };
  const dotsEnd = {
    type: "DotsItem",
    display: false,
    value: 1,
    additional: void 0
  };
  if (pages < 4)
    return { dotsStart, dotsEnd, items: [] };
  const arr = Array.from({ length: pages }).map((_value, index2) => index2 + 1);
  arr.splice(0, 3);
  const omega = arr.length > 6 ? arr.splice(arr.length - 3, 3) : [];
  const cursor = { start: 0, end: 0 };
  const midActiveIndex = arr.findIndex((value) => value === activePage);
  if (activePage < 4) {
    cursor.start = 0;
  } else if (midActiveIndex !== -1 && arr.length - 1 === midActiveIndex) {
    cursor.start = midActiveIndex - 2;
  } else if (midActiveIndex !== -1) {
    cursor.start = midActiveIndex !== 0 ? midActiveIndex - 1 : 0;
  } else {
    cursor.start = arr.length > 2 ? arr.length - 3 : 0;
  }
  cursor.end = cursor.start + 3;
  const items = new Array();
  dotsStart.display = activePage > 5 && pages > 7;
  dotsStart.additional = dotsStart.display ? cursor.start : void 0;
  dotsEnd.display = omega.length > 0 && cursor.end < arr.length;
  dotsEnd.additional = omega.length > 0 && cursor.end < arr.length ? arr.length - cursor.end : void 0;
  items.push(
    ...arr.slice(cursor.start, cursor.end).map(
      (value) => ({
        type: "PageItem",
        label: value.toString(),
        value,
        active: activePage === value
      })
    )
  );
  return {
    dotsStart,
    dotsEnd,
    items
  };
};
const last = function(params) {
  const { pages, activePage } = params;
  const remainder = clamp(pages - 6, 0, 3);
  return Array.from({ length: remainder }, (x, i) => {
    const value = pages - (remainder - (i + 1));
    return {
      type: "PageItem",
      label: value.toString(),
      value,
      active: activePage === value
    };
  });
};
const createPagination = function(params) {
  const { pages, activePage } = params;
  const f = first({ pages, activePage });
  const m = middle({ pages, activePage });
  const l = last({ pages, activePage });
  const result = {
    items: []
  };
  result.items.push(...f);
  result.items.push(m.dotsStart);
  result.items.push(...m.items);
  result.items.push(m.dotsEnd);
  result.items.push(...l);
  return result;
};
const ListPagination = (props) => {
  const { page, pages } = props;
  const navigate = reactRouterDom.useNavigate();
  const { formatMessage } = reactIntl.useIntl();
  const prevIntl = {
    id: index.getTranslation("ListPagination.previous-page"),
    defaultMessage: "Previous page"
  };
  const nextIntl = {
    id: index.getTranslation("ListPagination.next-page"),
    defaultMessage: "Next page"
  };
  const gotoIntl = {
    id: index.getTranslation("ListPagination.goto-page-n"),
    defaultMessage: "Go to page {pageNumber}"
  };
  const dotsIntl = {
    id: index.getTranslation("ListPagination.dots"),
    defaultMessage: "And {more} other pages"
  };
  if (page === void 0 || pages === void 0)
    return null;
  const { location } = window;
  const handleOnChangePage = (page2) => {
    const loc = appendQueryParameter(location, { page: page2.toString() });
    navigate(`?${loc.search}`);
  };
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Root, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Pagination, { activePage: page, pageCount: pages, children: [
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.PreviousLink, { onClick: () => handleOnChangePage(page - 1), children: formatMessage(prevIntl) }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.NextLink, { onClick: () => handleOnChangePage(page + 1), children: formatMessage(nextIntl) }),
    createPagination({ activePage: page, pages }).items.map((item) => {
      if (item.type === "PageItem") {
        return /* @__PURE__ */ jsxRuntime.jsx(designSystem.PageLink, { number: item.value, onClick: () => handleOnChangePage(item.value), children: formatMessage(gotoIntl, { pageNumber: item.label }) }, item.value);
      } else if (item.type === "DotsItem" && item.display) {
        return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Dots, { children: formatMessage(dotsIntl, { more: item.additional }) }, `dots-${item.value}`);
      }
    })
  ] }) }) });
};
var SearchField = /* @__PURE__ */ ((SearchField2) => {
  SearchField2["BY_ASSET_ID"] = "by_asset_id";
  SearchField2["BY_TITLE"] = "by_title";
  return SearchField2;
})(SearchField || {});
strapi.config?.server.url;
function getMuxTextTrackUrl({
  playback_id,
  track,
  signedToken
}) {
  return `https://stream.mux.com/${playback_id}/text/${track.id}.vtt${signedToken ? `?token=${signedToken}` : ""}`;
}
const SUPPORTED_MUX_LANGUAGES = [
  { label: "English", code: "en", state: "Stable" },
  { label: "Spanish", code: "es", state: "Stable" },
  { label: "Italian", code: "it", state: "Stable" },
  { label: "Portuguese", code: "pt", state: "Stable" },
  { label: "German", code: "de", state: "Stable" },
  { label: "French", code: "fr", state: "Stable" },
  { label: "Polish", code: "pl", state: "Beta" },
  { label: "Russian", code: "ru", state: "Beta" },
  { label: "Dutch", code: "nl", state: "Beta" },
  { label: "Catalan", code: "ca", state: "Beta" },
  { label: "Turkish", code: "tr", state: "Beta" },
  { label: "Swedish", code: "sv", state: "Beta" },
  { label: "Ukrainian", code: "uk", state: "Beta" },
  { label: "Norwegian", code: "no", state: "Beta" },
  { label: "Finnish", code: "fi", state: "Beta" },
  { label: "Slovak", code: "sk", state: "Beta" },
  { label: "Greek", code: "el", state: "Beta" },
  { label: "Czech", code: "cs", state: "Beta" },
  { label: "Croatian", code: "hr", state: "Beta" },
  { label: "Danish", code: "da", state: "Beta" },
  { label: "Romanian", code: "ro", state: "Beta" },
  { label: "Bulgarian", code: "bg", state: "Beta" }
];
const SUPPORTED_MUX_LANGUAGES_VALUES = SUPPORTED_MUX_LANGUAGES.map((l) => l.code);
const TextTrackFile = zod.z.object({
  contents: zod.z.string(),
  type: zod.z.string(),
  name: zod.z.string(),
  size: zod.z.number()
});
const CustomTextTrack = zod.z.object({
  file: TextTrackFile,
  name: zod.z.string(),
  language_code: zod.z.string(),
  closed_captions: zod.z.boolean().default(false),
  stored_track: zod.z.custom((value) => typeof value === "object" && value && "id" in value).optional()
});
const UploadConfig = zod.z.object({
  /**
   * Enable static renditions by setting this to 'standard'. Can be overwritten on a per-asset basis.
   * @see {@link https://docs.mux.com/guides/video/enable-static-mp4-renditions#why-enable-mp4-support}
   * @defaultValue 'none'
   */
  mp4_support: zod.z.enum(["none", "standard"]).default("none"),
  /**
   * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
   * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
   * @defaultValue '1080p'
   */
  max_resolution_tier: zod.z.enum(["2160p", "1440p", "1080p"]).default("1080p"),
  /**
   * The video quality informs the cost, quality, and available platform features for the asset.
   * @see {@link https://docs.mux.com/guides/use-video-quality-levels}
   * @defaultValue 'plus'
   */
  video_quality: zod.z.enum(["basic", "plus"]).default("plus"),
  /**
   * Whether or not to use signed URLs, making the asset private
   * @see {@link https://docs.mux.com/guides/use-encoding-tiers}
   * @defaultValue 'false'
   */
  signed: zod.z.boolean().default(false),
  autogenerated_captions_languages: zod.z.array(
    zod.z.object({
      code: zod.z.enum(SUPPORTED_MUX_LANGUAGES_VALUES),
      isSourceLanguage: zod.z.boolean().default(false)
    })
  ).optional(),
  custom_text_tracks: zod.z.array(CustomTextTrack).optional(),
  upload_type: zod.z.enum(["file", "url"]).default("file")
}).transform((v) => {
  if (v.video_quality === "basic") {
    return {
      ...v,
      max_resolution_tier: "1080p",
      mp4_support: "none"
    };
  }
  return v;
});
const UploadData = zod.z.object({ title: zod.z.string().min(1) }).and(
  zod.z.discriminatedUnion("upload_type", [
    zod.z.object({ upload_type: zod.z.literal("file"), file: zod.z.custom((value) => value instanceof File) }),
    zod.z.object({ upload_type: zod.z.literal("url"), url: zod.z.string().url() })
  ])
).and(UploadConfig);
zod.z.object({ title: zod.z.string().min(1) }).and(
  zod.z.discriminatedUnion("upload_type", [
    zod.z.object({ upload_type: zod.z.literal("file") }),
    zod.z.object({ upload_type: zod.z.literal("url"), url: zod.z.string().url() })
  ])
).and(UploadConfig);
const getTrad = (id) => `${index.PLUGIN_ID}.${id}`;
const usePluginIntl = () => {
  const intl = reactIntl.useIntl();
  const formatMessage = (id, defaultMessage) => intl.formatMessage({
    id: getTrad(id),
    defaultMessage
  });
  return {
    ...intl,
    formatMessage
  };
};
const FileInput = (props) => {
  const { name: name2, label = void 0, error = void 0, required = false, onFiles = () => {
  } } = props;
  const handleOnChange = (e) => onFiles(e.target.files);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { name: name2, error, children: [
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { "aria-required": true, children: label }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Input, { type: "file", onChange: handleOnChange }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Error, {})
  ] }) });
};
FileInput.displayName = "FileInput";
function TrackForm({
  track,
  modifyTrack,
  deleteTrack,
  muxAsset
}) {
  const { video } = useSignedTokens();
  const [editable, setEditable] = React__default.default.useState(track.stored_track?.id ? false : true);
  const { formatMessage } = reactIntl.useIntl();
  async function handleFiles(files2) {
    const parsed = await fileToTrackFile(files2[0]);
    if (!parsed.success) {
      modifyTrack({ file: void 0 });
      return;
    }
    modifyTrack({ file: parsed.data });
  }
  async function downloadOnClick(e) {
    e.preventDefault();
    if (!muxAsset?.playback_id || !track.stored_track)
      return;
    const token = await video(muxAsset);
    const trackUrl = getMuxTextTrackUrl({
      playback_id: muxAsset.playback_id,
      track: track.stored_track,
      signedToken: token || void 0
    });
    const anchor = document.createElement("a");
    anchor.setAttribute("href", trackUrl);
    anchor.setAttribute("download", "true");
    anchor.click();
  }
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Card, { width: "100%", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.CardBody, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.CardContent, { width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Root, { width: "100%", gap: 4, children: [
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Item, { col: 12, s: 12, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { grow: 1, children: /* @__PURE__ */ jsxRuntime.jsxs(
        designSystem.Field.Root,
        {
          hint: formatMessage({
            id: index.getTranslation("CustomTextTrackForm.language"),
            defaultMessage: "Language"
          }),
          children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
              id: index.getTranslation("CustomTextTrackForm.language"),
              defaultMessage: "Language"
            }) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              designSystem.Combobox,
              {
                value: track.language_code,
                onChange: (newValue) => {
                  modifyTrack({ language_code: newValue, name: LanguagesList__default.default.getNativeName(newValue) });
                },
                required: true,
                disabled: !editable,
                children: LanguagesList__default.default.getAllCodes().map((code) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.ComboboxOption, { value: code, children: LanguagesList__default.default.getNativeName(code) }, code))
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Error, {})
          ]
        }
      ) }),
      track.stored_track?.id && muxAsset?.playback_id && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { marginLeft: 4, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: " " }),
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.IconButton,
          {
            label: formatMessage({
              id: index.getTranslation("Common.download-button"),
              defaultMessage: "Download"
            }),
            withTooltip: false,
            onClick: downloadOnClick,
            children: /* @__PURE__ */ jsxRuntime.jsx(icons.Download, {})
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Item, { col: 12, s: 12, children: [
      editable && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { marginRight: 4, children: /* @__PURE__ */ jsxRuntime.jsx(
        FileInput,
        {
          name: "file",
          label: formatMessage({
            id: index.getTranslation("Common.file-label"),
            defaultMessage: "Subtitles file (.vtt or .srt)"
          }),
          required: true,
          onFiles: handleFiles,
          inputProps: {
            accept: ".vtt,.srt"
          }
        }
      ) }),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: editable ? " " : null }),
        /* @__PURE__ */ jsxRuntime.jsx(
          designSystem.Checkbox,
          {
            value: track.closed_captions ? 1 : 0,
            onChange: (e) => {
              modifyTrack({ closed_captions: e.currentTarget.value === 1 ? true : false });
            },
            disabled: !editable,
            children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { style: { whiteSpace: "nowrap" }, children: formatMessage({
              id: index.getTranslation("CustomTextTrackForm.closed-captions"),
              defaultMessage: "Closed captions"
            }) })
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Item, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { marginRight: 4, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Trash, {}), onClick: deleteTrack, variant: "danger-light", children: formatMessage({
        id: index.getTranslation("Common.delete-button"),
        defaultMessage: "Delete"
      }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { marginRight: 4, children: !editable && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClick: () => setEditable(true), startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Pencil, {}), children: formatMessage({
        id: index.getTranslation("Common.update-button"),
        defaultMessage: "Update"
      }) }) })
    ] })
  ] }) }) }) });
}
function CustomTextTrackForm({
  custom_text_tracks,
  modifyCustomTextTracks,
  muxAsset
}) {
  const { formatMessage } = reactIntl.useIntl();
  function handleNew() {
    modifyCustomTextTracks([
      ...custom_text_tracks || [],
      {
        file: void 0,
        language_code: "",
        name: "",
        closed_captions: false
      }
    ]);
  }
  function modifyTrack(index2) {
    return (newValues) => {
      modifyCustomTextTracks(
        custom_text_tracks?.map((track, i) => {
          if (i === index2) {
            return {
              ...track,
              ...newValues
            };
          }
          return track;
        }) || [newValues]
      );
    };
  }
  function deleteTrack(index2) {
    return () => {
      modifyCustomTextTracks(custom_text_tracks?.filter((_, i) => i !== index2) || []);
    };
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Root, { gap: 2, children: [
    custom_text_tracks?.map((track, index2) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 12, s: 12, children: /* @__PURE__ */ jsxRuntime.jsx(
      TrackForm,
      {
        track,
        modifyTrack: modifyTrack(index2),
        deleteTrack: deleteTrack(index2),
        muxAsset
      },
      track.stored_track?.id || `${index2}-${track.language_code}`
    ) }, index2)),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 12, s: 12, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { type: "button", startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Plus, {}), onClick: handleNew, style: { justifyContent: "center" }, children: formatMessage({
      id: index.getTranslation("CustomTextTrackForm.new-caption"),
      defaultMessage: "New caption/subtitle"
    }) }) })
  ] });
}
function getFileTextContents(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
async function fileToTrackFile(file) {
  return TextTrackFile.safeParse({
    name: file.name,
    size: file.size,
    type: file.type,
    contents: await getFileTextContents(file)
  });
}
const NEW_UPLOAD_INITIAL_VALUES = {
  ...UploadConfig.parse({}),
  title: "",
  upload_type: "file",
  // @ts-expect-error initialize the form without a file. It'll be properly validated before submission
  file: void 0
};
const generateUploadInfo = ({
  body,
  formatMessage
}) => {
  const errors = {};
  const parsed = UploadData.safeParse(body);
  if (parsed.success)
    return parsed.data;
  parsed.error.issues.forEach((issue) => {
    const issuePath = Array.isArray(issue.path) ? issue.path.join(".") : issue.path;
    errors[issuePath] = formatMessage(`ModalNewUpload.formErrors.${issuePath}`, issue.message);
  });
  throw errors;
};
const UploadError = (props) => {
  const { message } = props;
  const { formatMessage } = reactIntl.useIntl();
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingTop: 5, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { variant: "alpha", children: [
      formatMessage({
        id: index.getTranslation("UploadError.upload-error"),
        defaultMessage: "Upload Error"
      }),
      " ",
      /* @__PURE__ */ jsxRuntime.jsx(icons.WarningCircle, { color: "danger600" })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingTop: 5, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { variant: "omega", children: [
      formatMessage({
        id: index.getTranslation("UploadError.message"),
        defaultMessage: "An error occurred while uploading the file.  Submit an issue with the following error message"
      }),
      " - ",
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Link, { isExternal: true, href: "https://github.com/muxinc/strapi-plugin-mux-video-uploader/issues", children: formatMessage({
        id: index.getTranslation("UploadError.issues"),
        defaultMessage: "File issue"
      }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingTop: 5, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "omega", textColor: "danger500", children: message }) })
  ] });
};
const Uploaded = () => {
  const { formatMessage } = reactIntl.useIntl();
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingTop: 2, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "delta", children: formatMessage({
      id: index.getTranslation("Uploaded.upload-complete"),
      defaultMessage: "Video uploaded successfully"
    }) }) }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingTop: 5, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "omega", children: formatMessage({
      id: index.getTranslation("Uploaded.message"),
      defaultMessage: "The file has been successfully uploaded to Mux and is now able to be referenced by other Content Types within Strapi."
    }) }) })
  ] });
};
const ProgressBarWrapper = styled__default.default.div`
  width: 60%;
`;
const ProgessBarUnleased = styled__default.default(designSystem.ProgressBar)`
  width: 100%;
`;
const Uploading = (props) => {
  const { formatMessage } = reactIntl.useIntl();
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 5, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "alpha", children: formatMessage({
      id: index.getTranslation("Uploading.uploading"),
      defaultMessage: "Uploading to Mux"
    }) }) }) }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 5, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", children: /* @__PURE__ */ jsxRuntime.jsx(ProgressBarWrapper, { children: /* @__PURE__ */ jsxRuntime.jsx(ProgessBarUnleased, { value: props.percent }) }) }) })
  ] });
};
const ModalNewUpload = ({ isOpen, onToggle = () => {
} }) => {
  const [uploadPercent, setUploadPercent] = React__default.default.useState();
  const [isComplete, setIsComplete] = React__default.default.useState(false);
  const [uploadError, setUploadError] = React__default.default.useState();
  const uploadRef = React__default.default.useRef();
  const { post } = admin.useFetchClient();
  const { formatMessage } = usePluginIntl();
  const uploadFile = (endpoint, file) => {
    setUploadPercent(0);
    uploadRef.current = upchunk.createUpload({ endpoint, file });
    uploadRef.current.on("error", (err) => setUploadError(err.detail));
    uploadRef.current.on("progress", (progressEvt) => {
      if (isComplete)
        return;
      setUploadPercent(Math.floor(progressEvt.detail));
    });
    uploadRef.current.on("success", () => {
      setIsComplete(true);
      setUploadPercent(void 0);
    });
  };
  const handleOnSubmit = async (body, { resetForm: resetForm2, setErrors }) => {
    let uploadInfo;
    try {
      uploadInfo = generateUploadInfo({ body, formatMessage });
    } catch (errors2) {
      setErrors(errors2);
      return;
    }
    const url = `${index.PLUGIN_ID}/${uploadInfo.upload_type === "url" ? "remote-upload" : "direct-upload"}`;
    const result = await post(url, uploadInfo).catch((error) => {
      console.log({ error });
      switch (typeof error) {
        case "string": {
          setUploadError(error);
          break;
        }
        case "object": {
          setUploadError(error.message);
          break;
        }
        default: {
          setUploadError(formatMessage("ModalNewUpload.unknown-error", "Unknown error encountered"));
          break;
        }
      }
      return void 0;
    });
    if (!result)
      return;
    const { status, data } = result;
    if (status && status !== 200 || data?.errors) {
      return data?.errors;
    } else if (uploadInfo.upload_type === "file") {
      if (!data.url)
        return setUploadError(formatMessage("ModalNewUpload.unknown-error", "No upload URL returned"));
      uploadFile(data.url, uploadInfo.file);
    } else if (uploadInfo.upload_type === "url") {
      setUploadPercent(100);
      setIsComplete(true);
    } else {
      console.log(formatMessage("ModalNewUpload.unresolvable-upload-state", "Unable to resolve upload state"));
    }
    resetForm2();
  };
  const handleOnModalClose = (forceRefresh = false) => {
    onToggle(forceRefresh);
    handleOnReset();
  };
  const handleOnAbort = () => {
    uploadRef.current?.abort();
    handleOnModalClose();
  };
  const handleOnModalFinish = () => handleOnModalClose(true);
  const renderFooter = () => {
    if (uploadError || isComplete) {
      return /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Modal.Footer, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "secondary", startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Plus, {}), onClick: handleOnReset, children: formatMessage("Uploaded.upload-another-button", "Upload another asset") }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClick: handleOnModalFinish, children: formatMessage("Common.finish-button", "Finish") })
      ] });
    }
    if (uploadPercent !== void 0) {
      return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Footer, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClick: handleOnAbort, variant: "tertiary", children: formatMessage("Common.cancel-button", "Cancel") }) });
    }
    return /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Modal.Footer, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClick: () => handleOnModalClose(), variant: "tertiary", children: formatMessage("Common.cancel-button", "Cancel") }),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClick: handleSubmit, children: formatMessage("Common.save-button", "Save") })
    ] });
  };
  const { values, errors, resetForm, setFieldValue, handleChange, handleSubmit } = formik.useFormik({
    initialValues: NEW_UPLOAD_INITIAL_VALUES,
    enableReinitialize: true,
    validateOnChange: false,
    onSubmit: handleOnSubmit
  });
  const handleOnReset = () => {
    setUploadPercent(void 0);
    setIsComplete(false);
    setUploadError(void 0);
    resetForm();
  };
  const handleOnOpenChange = (open) => {
    if (open)
      return;
    handleOnModalClose();
  };
  if (!isOpen)
    return null;
  return /* @__PURE__ */ jsxRuntime.jsx("form", { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Root, { open: isOpen, onOpenChange: handleOnOpenChange, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Modal.Content, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Header, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Title, { children: formatMessage("ModalNewUpload.header", "New upload") }) }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Body, { children: /* @__PURE__ */ jsxRuntime.jsx(
      FormBody,
      {
        errors,
        values,
        setFieldValue,
        handleChange,
        isComplete,
        uploadError,
        uploadPercent
      }
    ) }),
    renderFooter()
  ] }) }) });
};
function FormBody(props) {
  const { errors, values, setFieldValue, handleChange } = props;
  const { formatMessage } = reactIntl.useIntl();
  const handleAutogeneratedCaptionsLanguagesChange = (vals) => {
    const languages = [];
    vals.forEach((value) => {
      const language = SUPPORTED_MUX_LANGUAGES.find((lang) => lang.code === value);
      language && languages.push(language);
    });
    setFieldValue("autogenerated_captions_languages", languages);
  };
  if (props.uploadError) {
    return /* @__PURE__ */ jsxRuntime.jsx(UploadError, { message: props.uploadError });
  }
  if (props.isComplete) {
    return /* @__PURE__ */ jsxRuntime.jsx(Uploaded, {});
  }
  if (props.uploadPercent !== void 0) {
    return /* @__PURE__ */ jsxRuntime.jsx(Uploading, { percent: props.uploadPercent });
  }
  return /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { padding: 1, background: "neutral0", children: [
    /* @__PURE__ */ jsxRuntime.jsx(FieldWrapper, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { error: errors.title, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
        id: index.getTranslation("Common.title-label"),
        defaultMessage: "Title"
      }) }),
      /* @__PURE__ */ jsxRuntime.jsx(
        designSystem.TextInput,
        {
          name: "title",
          value: values.title,
          hasError: errors.title !== void 0,
          required: true,
          onChange: handleChange
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Error, {}),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Hint, {})
    ] }) }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
        id: index.getTranslation("Common.upload_type_label-label"),
        defaultMessage: "Upload via"
      }) }),
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tabs.Root, { id: "upload_type", defaultValue: "file", variant: "simple", children: [
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tabs.List, { "aria-label": "Manage your attribute", children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Trigger, { value: "file", onClick: () => setFieldValue("upload_type", "file"), children: "File" }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Trigger, { value: "url", onClick: () => setFieldValue("upload_type", "url"), children: "URL" })
        ] }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Content, { value: "file", children: /* @__PURE__ */ jsxRuntime.jsx(FieldWrapper, { children: /* @__PURE__ */ jsxRuntime.jsx(
          FileInput,
          {
            name: "file",
            label: formatMessage({
              id: index.getTranslation("Common.file-label"),
              defaultMessage: "File"
            }),
            inputProps: {
              accept: "video/*,audio/*"
            },
            error: "file" in errors ? errors.file : void 0,
            required: true,
            onFiles: (files2) => setFieldValue(
              // @ts-expect-error
              "file",
              files2[0]
            )
          }
        ) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Content, { value: "url", children: /* @__PURE__ */ jsxRuntime.jsxs(FieldWrapper, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Root, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
            id: index.getTranslation("Common.url-label"),
            defaultMessage: "Url"
          }) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(
            designSystem.TextInput,
            {
              name: "url",
              value: "url" in values ? values.url : "",
              hasError: "url" in errors ? true : false,
              required: true,
              onChange: handleChange
            }
          )
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Accordion.Root, { children: [
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Accordion.Item, { value: "acc-01", children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Header, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Trigger, { children: formatMessage({
          id: index.getTranslation("ModalNewUpload.section_encoding_settings-label"),
          defaultMessage: "Encoding settings"
        }) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Content, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Root, { gap: 4, children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
              id: index.getTranslation("Common.video_quality-label"),
              defaultMessage: "Video quality"
            }) }),
            /* @__PURE__ */ jsxRuntime.jsxs(
              designSystem.Radio.Group,
              {
                onValueChange: (value) => setFieldValue("video_quality", value),
                value: values.video_quality,
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "basic", children: formatMessage({
                    id: index.getTranslation("Common.video_quality_basic-label"),
                    defaultMessage: "Basic"
                  }) }),
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "plus", children: formatMessage({
                    id: index.getTranslation("Common.video_quality_plus-label"),
                    defaultMessage: "Plus"
                  }) })
                ]
              }
            )
          ] }) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
              id: index.getTranslation("Common.max_resolution_tier-label"),
              defaultMessage: "Maximum stream resolution"
            }) }),
            /* @__PURE__ */ jsxRuntime.jsxs(
              designSystem.Radio.Group,
              {
                "aria-labelledby": "max_resolution_tier_label",
                onValueChange: (value) => setFieldValue("max_resolution_tier", value),
                value: values.max_resolution_tier,
                style: { marginTop: "0.5rem" },
                disabled: values.video_quality === "basic",
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "2160p", children: "2160p (4k)" }),
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "1440p", children: "1440p (2k)" }),
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Radio.Item, { value: "1080p", children: "1080p" })
                ]
              }
            )
          ] }) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Accordion.Item, { value: "acc-02", children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Header, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Trigger, { children: formatMessage({
          id: index.getTranslation("ModalNewUpload.section_delivery_settings-label"),
          defaultMessage: "Delivery settings"
        }) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Content, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Root, { gap: 4, children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
              id: index.getTranslation("Common.signed-label"),
              defaultMessage: "Signed Playback URL"
            }) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              designSystem.Toggle,
              {
                name: "Private",
                value: values.signed ? "on" : "off",
                onLabel: "on",
                offLabel: "off",
                checked: values.signed,
                onChange: (e) => {
                  setFieldValue("signed", e.target.checked);
                }
              }
            )
          ] }) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
              id: index.getTranslation("Common.mp4_support-label"),
              defaultMessage: "Allow downloading via MP4"
            }) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              designSystem.Toggle,
              {
                name: "mp4_support",
                value: values.mp4_support,
                onLabel: "on",
                offLabel: "off",
                checked: values.mp4_support === "standard",
                disabled: values.video_quality === "basic",
                onChange: (e) => {
                  setFieldValue(
                    "mp4_support",
                    e.target.checked ? "standard" : "none"
                  );
                }
              }
            )
          ] }) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Accordion.Item, { value: "acc-03", children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Header, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Trigger, { children: formatMessage({
          id: index.getTranslation("ModalNewUpload.section_additional_settings-label"),
          defaultMessage: "Additional settings"
        }) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Accordion.Content, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tabs.Root, { defaultValue: "autogenerated", children: [
          /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Tabs.List, { "aria-label": "Manage your attribute", children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Trigger, { value: "autogenerated", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { justifyContent: "center", children: [
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { children: formatMessage({
                id: index.getTranslation("ModalNewUpload.tab_captions_autogenerated-label"),
                defaultMessage: "Auto-generated"
              }) }),
              values.autogenerated_captions_languages && values.autogenerated_captions_languages.length > 0 && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { marginLeft: 4, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Badge, { backgroundColor: "primary600", textColor: "neutral1000", children: values.autogenerated_captions_languages.length }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Trigger, { value: "custom", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { justifyContent: "center", children: [
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { children: formatMessage({
                id: index.getTranslation("ModalNewUpload.tab_captions_custom-label"),
                defaultMessage: "Custom"
              }) }),
              values.custom_text_tracks && values.custom_text_tracks.length > 0 && /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { marginLeft: 4, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Badge, { backgroundColor: "primary600", textColor: "neutral1000", children: values.custom_text_tracks.length }) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Content, { value: "autogenerated", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Root, { gap: 4, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { width: "100%", paddingTop: 4, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage({
              id: index.getTranslation("ModalNewUpload.autogenerated_languages-label"),
              defaultMessage: "Languages"
            }) }),
            /* @__PURE__ */ jsxRuntime.jsx(
              designSystem.MultiSelect,
              {
                name: "autogenerated_captions_languages",
                hasError: errors.autogenerated_captions_languages,
                value: values.autogenerated_captions_languages?.map((lang) => lang.code),
                onChange: handleAutogeneratedCaptionsLanguagesChange,
                withTags: true,
                children: SUPPORTED_MUX_LANGUAGES.map((language) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.MultiSelectOption, { value: language.code, children: language.label }, language.code))
              }
            )
          ] }) }) }) }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Tabs.Content, { value: "custom", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { width: "100%", paddingTop: 4, children: /* @__PURE__ */ jsxRuntime.jsx(
            CustomTextTrackForm,
            {
              custom_text_tracks: values.custom_text_tracks || [],
              modifyCustomTextTracks: (tracks) => setFieldValue("custom_text_tracks", tracks)
            }
          ) }) })
        ] }) }) })
      ] })
    ] })
  ] });
}
function FieldWrapper(props) {
  return /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingTop: 4, paddingBottom: 4, children: props.children });
}
const Header = (props) => {
  const { onUploadNewAssetModalClose = () => {
  } } = props;
  const [isNewUploadOpen, setIsNewUploadOpen] = React__default.default.useState(false);
  const permissions = React__default.default.useMemo(() => {
    return [index.pluginPermissions.mainCreate];
  }, []);
  const { formatMessage } = reactIntl.useIntl();
  const {
    allowedActions: { canCreate }
  } = admin.useRBAC(permissions);
  const handleOnNewUploadClick = () => setIsNewUploadOpen(true);
  const handleOnNewUploadClose = (refresh) => {
    setIsNewUploadOpen(false);
    if (!refresh)
      return;
    onUploadNewAssetModalClose();
  };
  return /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      admin.Layouts.Header,
      {
        title: formatMessage({
          id: index.getTranslation("HomePage.section-label"),
          defaultMessage: "Mux Video Uploader"
        }),
        primaryAction: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { disabled: !canCreate, startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Plus, {}), onClick: handleOnNewUploadClick, children: formatMessage({
          id: index.getTranslation("HomePage.new-upload-button"),
          defaultMessage: "Upload new assets"
        }) })
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(ModalNewUpload, { isOpen: isNewUploadOpen, onToggle: handleOnNewUploadClose })
  ] });
};
const name = "strapi-plugin-mux-video-uploader";
const version = "3.1.0";
const description = "This plugin allows you to upload your content to Mux and use it with Strapi.";
const license = "MIT";
const type = "commonjs";
const strapi$1 = {
  name: "mux-video-uploader",
  displayName: "Mux Video Uploader",
  icon: "plug",
  description: "This plugin allows you to upload your content to Mux and use it with Strapi.",
  kind: "plugin"
};
const author = {
  name: "Erik Peña",
  email: "erikpena@users.noreply.github.com",
  url: "https://github.com/erikpena"
};
const maintainers = [
  {
    name: "Erik Peña",
    email: "erikpena@users.noreply.github.com",
    url: "https://github.com/erikpena"
  }
];
const scripts = {
  build: "strapi-plugin build",
  "test:ts:back": "run -T tsc -p server/tsconfig.json",
  "test:ts:front": "run -T tsc -p admin/tsconfig.json",
  verify: "strapi-plugin verify",
  watch: "strapi-plugin watch",
  "watch:link": "strapi-plugin watch:link",
  preprepare: "husky install"
};
const dependencies = {
  "@mux/mux-node": "^8.8.0",
  "@mux/mux-player-react": "^3.0.0",
  "@mux/upchunk": "^3.4.0",
  "@strapi/design-system": "^2.0.0-rc.11",
  "@strapi/icons": "^2.0.0-rc.11",
  "@strapi/utils": "^4.20.5",
  axios: "^1.7.7",
  "copy-to-clipboard": "^3.3.3",
  formik: "^2.4.6",
  "iso-639-1": "^3.1.3",
  luxon: "^3.5.0",
  "react-intl": "^6.7.0",
  zod: "^3.22.4"
};
const devDependencies = {
  "@strapi/sdk-plugin": "^5.2.6",
  "@strapi/strapi": "^5.0.6",
  "@strapi/typescript-utils": "^5.0.6",
  "@types/luxon": "^3.4.2",
  "@types/react": "^18.3.9",
  "@types/react-dom": "^18.3.0",
  husky: "^9.0.11",
  prettier: "^3.3.3",
  "pretty-quick": "^4.0.0",
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "styled-components": "^6.1.13",
  typescript: "^5.6.2"
};
const peerDependencies = {
  "@strapi/sdk-plugin": "^5.2.6",
  "@strapi/strapi": "^5.0.6",
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "styled-components": "^6.1.13"
};
const exports$1 = {
  "./package.json": "./package.json",
  "./strapi-admin": {
    types: "./dist/admin/src/index.d.ts",
    source: "./admin/src/index.ts",
    "import": "./dist/admin/index.mjs",
    require: "./dist/admin/index.js",
    "default": "./dist/admin/index.js"
  },
  "./strapi-server": {
    types: "./dist/server/src/index.d.ts",
    source: "./server/src/index.ts",
    "import": "./dist/server/index.mjs",
    require: "./dist/server/index.js",
    "default": "./dist/server/index.js"
  }
};
const files = [
  "dist"
];
const pluginPkg = {
  name,
  version,
  description,
  license,
  type,
  strapi: strapi$1,
  author,
  maintainers,
  scripts,
  dependencies,
  devDependencies,
  peerDependencies,
  exports: exports$1,
  files
};
const MuxPlayerStyled = styled__default.default(MuxPlayer__default.default)`
  width: 100%;
`;
const PreviewPlayer = (props) => {
  const { muxAsset } = props;
  const [videoToken, setVideoToken] = React__default.default.useState();
  const [posterUrl, setPosterUrl] = React__default.default.useState(
    // Empty pixel
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  );
  const [storyboardUrl, setStoryboardUrl] = React__default.default.useState();
  const [animatedUrl, setAnimatedUrl] = React__default.default.useState();
  const { video, thumbnail, storyboard, animated } = useSignedTokens();
  const init = async (muxAsset2) => {
    const { playback_id } = muxAsset2;
    if (muxAsset2.playback_id !== null && muxAsset2.signed) {
      const videoToken2 = await video(muxAsset2);
      const thumbnailToken = await thumbnail(muxAsset2);
      const storyboardToken = await storyboard(muxAsset2);
      const animatedToken = await animated(muxAsset2);
      setVideoToken(videoToken2);
      setPosterUrl(`/${index.PLUGIN_ID}/thumbnail/${playback_id}?token=${thumbnailToken}`);
      setStoryboardUrl(`/${index.PLUGIN_ID}/storyboard/${playback_id}?token=${storyboardToken}`);
      setAnimatedUrl(`/${index.PLUGIN_ID}/animated/${playback_id}?token=${animatedToken}`);
    } else if (muxAsset2.playback_id !== null) {
      setPosterUrl(`/${index.PLUGIN_ID}/thumbnail/${playback_id}`);
    }
  };
  React__default.default.useEffect(() => {
    muxAsset && init(muxAsset);
  }, []);
  if (!muxAsset?.playback_id || muxAsset.signed && !videoToken)
    return null;
  return /* @__PURE__ */ jsxRuntime.jsx(
    MuxPlayerStyled,
    {
      playbackId: muxAsset.playback_id,
      poster: posterUrl,
      "playback-token": videoToken,
      metadata: {
        video_id: muxAsset.id,
        video_title: muxAsset.title,
        player_name: "Strapi Admin Dashboard",
        player_version: pluginPkg.version,
        page_type: "Preview Player"
      },
      streamType: "on-demand",
      style: { display: "block" }
    }
  );
};
const TypographyWrapped = styled__default.default(designSystem.Typography)`
  overflow-wrap: break-word;
`;
const Summary = (props) => {
  const { muxAsset } = props;
  const { formatMessage, formatDate, formatTime } = reactIntl.useIntl();
  if (muxAsset === void 0)
    return null;
  const created_date = formatDate(Date.parse(muxAsset.createdAt));
  const created_time = formatTime(Date.parse(muxAsset.createdAt));
  const updated_date = formatDate(Date.parse(muxAsset.updatedAt));
  const updated_time = formatTime(Date.parse(muxAsset.updatedAt));
  return /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { padding: 4, background: "neutral100", hasRadius: true, children: [
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 1, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: index.getTranslation("Common.isReady-label"),
        defaultMessage: "State"
      }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.isReady ? /* @__PURE__ */ jsxRuntime.jsx(designSystem.Badge, { active: true, children: formatMessage({
        id: index.getTranslation("Common.ready"),
        defaultMessage: "Ready"
      }) }) : /* @__PURE__ */ jsxRuntime.jsx(designSystem.Badge, { children: formatMessage({
        id: index.getTranslation("Common.preparing"),
        defaultMessage: "Preparing"
      }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 1, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: index.getTranslation("Summary.assetId"),
        defaultMessage: "Asset Id"
      }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.asset_id })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 1, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: index.getTranslation("Summary.uploadId"),
        defaultMessage: "Upload Id"
      }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.upload_id })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 1, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: index.getTranslation("Summary.playbackId"),
        defaultMessage: "Playback Id"
      }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.playback_id })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 1, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: index.getTranslation("Summary.playbackPolicy"),
        defaultMessage: "Playback Policy"
      }) }) }),
      /* @__PURE__ */ jsxRuntime.jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.signed ? "Signed" : "Public" })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Root, { gap: 4, children: [
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 6, s: 12, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 1, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
          id: index.getTranslation("Summary.created"),
          defaultMessage: "Created"
        }) }) }),
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { variant: "pi", textColor: "neutral700", children: [
          created_date,
          " ",
          created_time
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 6, s: 12, children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Box, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 1, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
          id: index.getTranslation("Summary.updated"),
          defaultMessage: "Updated"
        }) }) }),
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Typography, { variant: "pi", textColor: "neutral700", children: [
          updated_date,
          " ",
          updated_time
        ] })
      ] }) })
    ] }) })
  ] });
};
function ModalDetails(props) {
  const { isOpen, muxAsset, enableUpdate, enableDelete, onToggle = () => {
  } } = props;
  const { del, put } = admin.useFetchClient();
  const { formatMessage } = usePluginIntl();
  const deleteButtonRef = React__default.default.useRef(null);
  const [touchedFields, setTouchedFields] = React__default.default.useState({});
  const [showDeleteWarning, setShowDeleteWarning] = React__default.default.useState(false);
  const [deletingState, setDeletingState] = React__default.default.useState("idle");
  const [codeSnippet, setCodeSnippet] = React__default.default.useState("");
  const { toggleNotification } = admin.useNotification();
  React__default.default.useEffect(() => {
    if (!muxAsset)
      return;
    setCodeSnippet(`<mux-player
  playback-id="${muxAsset?.playback_id}"
  playback-token="TOKEN"
  env-key="ENV_KEY"
  metadata-video-title="${muxAsset?.title}"
  controls
/>`);
  }, [muxAsset]);
  const subtitles = (muxAsset?.asset_data?.tracks ?? []).filter(
    (track) => track.type === "text" && track.text_type === "subtitles" && track.status !== "errored"
  );
  const toggleDeleteWarning = () => setShowDeleteWarning((prevState) => !prevState);
  const handleCopyCodeSnippet = () => {
    copy__default.default(codeSnippet);
    toggleNotification({
      type: "success",
      message: formatMessage("ModalDetails.copied-to-clipboard", "Copied code snippet to clipboard")
    });
  };
  const handleOnDeleteConfirm = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingState("deleting");
    toggleDeleteWarning();
    if (!muxAsset)
      return;
    try {
      await del(`${index.PLUGIN_ID}/mux-asset/${muxAsset.id}`, {
        params: {
          delete_on_mux: true
        }
      });
      setDeletingState("idle");
      onToggle(true);
      toggleNotification({
        type: "success",
        message: formatMessage("ModalDetails.delete-success", "Video deleted successfully")
      });
    } catch (error) {
      toggleNotification({
        type: "danger",
        message: formatMessage("ModalDetails.failed-to-delete", "Failed to delete video")
      });
    }
  };
  const initialValues = {
    id: muxAsset?.id || 0,
    title: muxAsset?.title || muxAsset?.asset_id || muxAsset?.createdAt,
    // @ts-expect-error Due to changes in @mux/mux-node v8, where `TextTrack`, `VideoTrack` and `AudioTrack` were unified,
    // properties required to subtitles as text tracks are showing as optional and breaking the `custom_text_tracks` type.
    custom_text_tracks: subtitles.map((s) => ({
      closed_captions: s.closed_captions,
      file: void 0,
      language_code: s.language_code,
      name: s.name,
      status: s.status,
      stored_track: s
    }))
  };
  const handleOnSubmit = async (values2, { setErrors, setSubmitting }) => {
    const title = formatMessage("Common.title-required", "No title specified");
    if (!values2.title) {
      setErrors({ title });
      return;
    }
    const tracksModified = JSON.stringify(values2.custom_text_tracks || []) !== JSON.stringify(initialValues.custom_text_tracks || []);
    const data = {
      id: muxAsset?.id || 0,
      title: touchedFields.title ? values2.title : void 0,
      custom_text_tracks: tracksModified ? values2.custom_text_tracks : void 0
    };
    if (data.title || data.custom_text_tracks) {
      await put(`${index.PLUGIN_ID}/mux-asset/${muxAsset?.id}`, data);
    }
    setSubmitting(false);
    onToggle(true);
  };
  const handleOnOpenChange = (open) => {
    if (open)
      return;
    onToggle(false);
  };
  const { errors, values, isSubmitting, handleChange, handleSubmit, setFieldValue } = formik.useFormik({
    initialValues,
    validateOnChange: false,
    enableReinitialize: true,
    onSubmit: handleOnSubmit
  });
  if (!muxAsset)
    return null;
  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  return /* @__PURE__ */ jsxRuntime.jsx("form", { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Root, { open: isOpen, onOpenChange: handleOnOpenChange, children: /* @__PURE__ */ jsxRuntime.jsxs(
    designSystem.Modal.Content,
    {
      style: {
        width: "min(90vw, 100rem)",
        maxWidth: "unset"
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Header, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Title, { children: formatMessage("ModalDetails.header", "Video details") }) }),
        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Body, { style: { paddingInline: 20 }, children: deletingState === "deleting" ? /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", padding: 4, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { variant: "omega", textColor: "neutral700", children: formatMessage("ModalDetails.deleting", "Deleting...") }) }) : /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Root, { gap: 4, style: { alignItems: "flex-start" }, children: [
          /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: [
            /* @__PURE__ */ jsxRuntime.jsxs(
              designSystem.Box,
              {
                background: "neutral150",
                style: {
                  aspectRatio: aspect_ratio ? aspect_ratio.replace(":", " / ") : void 0,
                  marginBottom: "1.5rem",
                  padding: "3rem 0",
                  position: "relative"
                },
                width: "100%",
                children: [
                  /* @__PURE__ */ jsxRuntime.jsx(PreviewPlayer, { muxAsset }),
                  /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Dialog.Root, { open: showDeleteWarning, children: [
                    /* @__PURE__ */ jsxRuntime.jsx(designSystem.Dialog.Trigger, { children: /* @__PURE__ */ jsxRuntime.jsx(
                      designSystem.IconButton,
                      {
                        label: formatMessage("Common.delete-button", "Delete"),
                        disabled: !enableDelete,
                        onClick: toggleDeleteWarning,
                        withTooltip: false,
                        ref: deleteButtonRef,
                        style: {
                          position: "absolute",
                          top: "0.5rem",
                          right: "0.5rem"
                        },
                        children: /* @__PURE__ */ jsxRuntime.jsx(icons.Trash, {})
                      }
                    ) }),
                    /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Dialog.Content, { children: [
                      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Dialog.Header, { children: formatMessage(
                        "ModalDetails.delete-confirmation-prompt",
                        "Are you sure you want to delete this item?"
                      ) }),
                      /* @__PURE__ */ jsxRuntime.jsx(designSystem.Dialog.Body, { children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Flex, { padding: 4, direction: "column", gap: 2, children: [
                        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { textAlign: "center", children: /* @__PURE__ */ jsxRuntime.jsx(icons.WarningCircle, {}) }),
                        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: formatMessage(
                          "ModalDetails.delete-confirmation-prompt",
                          "Are you sure you want to delete this item?"
                        ) }) }),
                        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Flex, { justifyContent: "center", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: formatMessage(
                          "ModalDetails.delete-confirmation-callout",
                          "This will also delete the Asset from Mux."
                        ) }) })
                      ] }) }),
                      /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Dialog.Footer, { children: [
                        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { onClickCapture: toggleDeleteWarning, variant: "tertiary", children: formatMessage("Common.cancel-button", "Cancel") }),
                        /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "danger-light", startIcon: /* @__PURE__ */ jsxRuntime.jsx(icons.Trash, {}), onClickCapture: handleOnDeleteConfirm, children: formatMessage("Common.confirm-button", "Confirm") })
                      ] })
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { children: [
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage("Captions.title", "Captions / subtitles") }),
              /* @__PURE__ */ jsxRuntime.jsx(
                CustomTextTrackForm,
                {
                  custom_text_tracks: values.custom_text_tracks || [],
                  modifyCustomTextTracks: (newTracks) => setFieldValue("custom_text_tracks", newTracks),
                  muxAsset
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: [
            muxAsset.error_message ? /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Status, { variant: "danger", children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Typography, { children: muxAsset.error_message }) }) }) : null,
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Root, { id: "with_field", error: errors.title, children: [
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Label, { children: formatMessage("Common.title-label", "Title") }),
              /* @__PURE__ */ jsxRuntime.jsx(
                designSystem.Field.Input,
                {
                  name: "title",
                  hasError: errors.title !== void 0,
                  value: values.title,
                  disabled: !enableUpdate,
                  required: true,
                  onChange: (e) => {
                    setTouchedFields({ ...touchedFields, title: true });
                    handleChange(e);
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Error, {})
            ] }) }),
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsx(Summary, { muxAsset }) }),
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsxRuntime.jsxs(
              designSystem.Field.Root,
              {
                hint: /* @__PURE__ */ jsxRuntime.jsxs(jsxRuntime.Fragment, { children: [
                  formatMessage("ModalDetails.powered-by-mux", "Powered by mux-player."),
                  " ",
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Link, { href: "https://docs.mux.com/guides/video/mux-player", isExternal: true, children: formatMessage("ModalDetails.read-more", "Read more about it") })
                ] }),
                children: [
                  /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Field.Label, { style: { alignItems: "center", justifyContent: "space-between" }, children: [
                    formatMessage("ModalDetails.code-snippet", "Code snippet"),
                    /* @__PURE__ */ jsxRuntime.jsx(
                      designSystem.IconButton,
                      {
                        label: "More actions",
                        borderStyle: "none",
                        withTooltip: false,
                        onClick: handleCopyCodeSnippet,
                        children: /* @__PURE__ */ jsxRuntime.jsx(icons.Duplicate, {})
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Textarea, { name: "codeSnippet", value: codeSnippet, rows: 7, disabled: true }),
                  /* @__PURE__ */ jsxRuntime.jsx(designSystem.Field.Hint, {})
                ]
              }
            ) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Modal.Footer, { children: [
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Modal.Close, { children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "tertiary", onClick: () => onToggle(false), disabled: deletingState === "deleting", children: formatMessage("Common.cancel-button", "Cancel") }) }),
          /* @__PURE__ */ jsxRuntime.jsx(designSystem.Button, { variant: "success", disabled: deletingState === "deleting" || isSubmitting, onClick: handleSubmit, children: formatMessage("Common.finish-button", "Finish") })
        ] })
      ]
    }
  ) }) });
}
const ProtectedHomePage = () => /* @__PURE__ */ jsxRuntime.jsx(admin.Page.Protect, { permissions: [index.pluginPermissions.mainRead], children: /* @__PURE__ */ jsxRuntime.jsx(HomePage, {}) });
const HomePage = () => {
  const location = reactRouterDom.useLocation();
  const navigate = reactRouterDom.useNavigate();
  const { get } = admin.useFetchClient();
  const { formatMessage } = reactIntl.useIntl();
  const SEARCH_FIELDS = [
    {
      label: formatMessage({
        id: index.getTranslation("Common.title-search-field"),
        defaultMessage: "By Title"
      }),
      value: SearchField.BY_TITLE
    },
    {
      label: formatMessage({
        id: index.getTranslation("Common.assetId-search-field"),
        defaultMessage: "By Asset Id"
      }),
      value: SearchField.BY_ASSET_ID
    }
  ];
  const [isReady, setIsReady] = React__default.default.useState(false);
  const [muxAssets, setMuxAssets] = React__default.default.useState();
  const [selectedAsset, setSelectedAsset] = React__default.default.useState();
  const [searchField, setSearchField] = React__default.default.useState(SEARCH_FIELDS[0].value);
  const [searchValue, setSearchValue] = React__default.default.useState("");
  const [pageLimit] = React__default.default.useState(12);
  const [pages, setPages] = React__default.default.useState(1);
  const [page, setPage] = React__default.default.useState();
  const [isDetailsOpen, setIsDetailsOpen] = React__default.default.useState(false);
  const loadMuxAssets = async () => {
    if (page === void 0)
      return;
    let searchVector = void 0;
    if (searchValue !== void 0 && searchValue) {
      searchVector = {
        field: searchField,
        value: searchValue
      };
    }
    const sortVector = { field: "createdAt", desc: true };
    const start = (page - 1) * pageLimit;
    let search;
    switch (searchVector?.field) {
      case "by_title": {
        search = `&filters[title][$containsi]=${searchVector.value}`;
        break;
      }
      case "by_asset_id": {
        search = `&filters[asset_id][$containsi]=${searchVector.value}`;
        break;
      }
      default: {
        search = "";
      }
    }
    const sort = sortVector ? `&sort=${sortVector.field}&order=${"desc"}` : "";
    const { data } = await get(`${index.PLUGIN_ID}/mux-asset?start=${start}${sort}&limit=${pageLimit}${search}`);
    const pages2 = Math.ceil(data.totalCount / pageLimit);
    setMuxAssets(data);
    setPages(pages2);
  };
  React__default.default.useEffect(() => {
    get(`${index.PLUGIN_ID}/mux-settings`).then((result) => {
      const { data } = result;
      setIsReady(data === true);
    });
  }, []);
  React__default.default.useEffect(() => {
    const { page: page2, field, value } = Object.fromEntries(new URLSearchParams(location.search));
    setSearchField(field || SearchField.BY_TITLE);
    setSearchValue(value);
    if (value && value !== searchValue || field && field !== searchField) {
      setPage(1);
    } else {
      setPage(parseInt(page2) || 1);
    }
  }, [location]);
  React__default.default.useEffect(() => {
    loadMuxAssets();
  }, [page, searchField, searchValue, pageLimit]);
  const permissions = React__default.default.useMemo(() => {
    return [index.pluginPermissions.mainCreate, index.pluginPermissions.mainUpdate, index.pluginPermissions.mainDelete];
  }, []);
  React__default.default.useEffect(() => {
    if (!selectedAsset)
      return;
    setIsDetailsOpen(true);
  }, [selectedAsset]);
  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canCreate, canUpdate, canDelete }
  } = admin.useRBAC(permissions);
  const handleOnUploadNewAssetModalClose = () => loadMuxAssets();
  const handleOnSearchFieldChange = (field) => {
    navigate(appendQueryParameter(location, { field }));
  };
  const handleOnSearchValueChange = (event) => {
    navigate(appendQueryParameter(location, { value: event?.target.value || "" }));
  };
  const handleOnMuxAssetClick = (muxAsset) => setSelectedAsset(muxAsset);
  const handleOnDetailsClose = (refresh) => {
    setIsDetailsOpen(false);
    setSelectedAsset(void 0);
    if (!refresh)
      return;
    loadMuxAssets();
  };
  if (isLoadingForPermissions)
    return null;
  return /* @__PURE__ */ jsxRuntime.jsx(SignedTokensProvider, { children: /* @__PURE__ */ jsxRuntime.jsxs(admin.Layouts.Root, { children: [
    /* @__PURE__ */ jsxRuntime.jsxs(admin.Page.Main, { children: [
      /* @__PURE__ */ jsxRuntime.jsx(Header, { onUploadNewAssetModalClose: handleOnUploadNewAssetModalClose }),
      /* @__PURE__ */ jsxRuntime.jsx(
        admin.Layouts.Action,
        {
          startActions: /* @__PURE__ */ jsxRuntime.jsxs(designSystem.Grid.Root, { gap: 4, children: [
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 2, xs: 12, s: 12, children: /* @__PURE__ */ jsxRuntime.jsx(
              designSystem.SingleSelect,
              {
                "aria-label": formatMessage({
                  id: index.getTranslation("HomePage.search-label"),
                  defaultMessage: "Choose the field to search"
                }),
                placeholder: formatMessage({
                  id: index.getTranslation("HomePage.search-placeholder"),
                  defaultMessage: "Search field"
                }),
                value: searchField,
                onChange: (value) => handleOnSearchFieldChange(value.toString()),
                children: SEARCH_FIELDS.map((searchField2) => /* @__PURE__ */ jsxRuntime.jsx(designSystem.SingleSelectOption, { value: searchField2.value, children: searchField2.label }, searchField2.value))
              }
            ) }),
            /* @__PURE__ */ jsxRuntime.jsx(designSystem.Grid.Item, { col: 8, xs: 12, s: 12, children: /* @__PURE__ */ jsxRuntime.jsx(designSystem.Box, { width: "100%", children: /* @__PURE__ */ jsxRuntime.jsx(
              designSystem.Searchbar,
              {
                name: "searchbar",
                onClear: () => setSearchValue(""),
                value: searchValue,
                onChange: handleOnSearchValueChange,
                clearLabel: formatMessage({
                  id: index.getTranslation("HomePage.clear-label"),
                  defaultMessage: "Clear search"
                }),
                children: formatMessage({
                  id: index.getTranslation("HomePage.searching"),
                  defaultMessage: "Searching for Mux assets"
                })
              }
            ) }) })
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntime.jsxs(admin.Layouts.Content, { children: [
        /* @__PURE__ */ jsxRuntime.jsx(AssetGrid, { muxAssets: muxAssets?.items, onMuxAssetClick: handleOnMuxAssetClick }),
        /* @__PURE__ */ jsxRuntime.jsx(ListPagination, { page, pages })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntime.jsx(
      ModalDetails,
      {
        isOpen: isDetailsOpen,
        muxAsset: selectedAsset,
        enableUpdate: canUpdate,
        enableDelete: canDelete,
        onToggle: handleOnDetailsClose
      }
    )
  ] }) });
};
const App = () => {
  return /* @__PURE__ */ jsxRuntime.jsxs(reactRouterDom.Routes, { children: [
    /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Route, { index: true, element: /* @__PURE__ */ jsxRuntime.jsx(ProtectedHomePage, {}) }),
    /* @__PURE__ */ jsxRuntime.jsx(reactRouterDom.Route, { path: "*", element: /* @__PURE__ */ jsxRuntime.jsx(admin.Page.Error, {}) })
  ] });
};
exports.default = App;
//# sourceMappingURL=App-kCL60IyN.js.map
