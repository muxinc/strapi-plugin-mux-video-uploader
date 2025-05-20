import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useFetchClient, useRBAC, Layouts, useNotification, Page } from "@strapi/strapi/admin";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import { Box, CardTitle, Flex, Loader, Card, CardHeader, CardAsset, CardTimer, CardBody, CardContent, CardSubtitle, CardBadge, Typography, Grid, Pagination, PreviousLink, NextLink, PageLink, Dots, Field, Button, Combobox, ComboboxOption, IconButton, Checkbox, Link, ProgressBar, Modal, TextInput, Tabs, Accordion, Radio, Toggle, Badge, MultiSelect, MultiSelectOption, Dialog, Status, Textarea, SingleSelect, SingleSelectOption, Searchbar } from "@strapi/design-system";
import React from "react";
import { useIntl } from "react-intl";
import styled from "styled-components";
import { WarningCircle, Lock, Earth, Plus, Download, Trash, Pencil, Duplicate } from "@strapi/icons";
import { P as PLUGIN_ID, g as getTranslation, p as pluginPermissions } from "./index-RQzhDFbW.mjs";
import { Duration } from "luxon";
import { createUpload } from "@mux/upchunk";
import { useFormik } from "formik";
import { z } from "zod";
import LanguagesList from "iso-639-1";
import copy from "copy-to-clipboard";
import MuxPlayer from "@mux/mux-player-react";
const secondsToFormattedString = (seconds) => {
  const date = Duration.fromMillis(seconds * 1e3);
  const parts = date.shiftTo("hours", "minutes", "seconds").toObject();
  const secs = parts.seconds && Math.round(parts.seconds).toString().padStart(2, "0");
  if (parts.hours === 0) {
    return `${parts.minutes}:${secs}`;
  } else {
    const mins = parts.minutes?.toString().padStart(2, "0");
    return `${parts.hours}:${mins}:${secs}`;
  }
};
const SignedTokensContext = React.createContext({
  video: async () => null,
  thumbnail: async () => null,
  storyboard: async () => null
});
function useSignedTokens() {
  return React.useContext(SignedTokensContext);
}
function SignedTokensProvider({ muxAsset, children }) {
  const { get } = useFetchClient();
  const video = async function(muxAsset2) {
    const { data } = await get(`${PLUGIN_ID}/sign/${muxAsset2.playback_id}?type=video`);
    return data.token;
  };
  const thumbnail = async function(muxAsset2) {
    const { data } = await get(`${PLUGIN_ID}/sign/${muxAsset2.playback_id}?type=thumbnail`);
    return data.token;
  };
  const storyboard = async function(muxAsset2) {
    const { data } = await get(`${PLUGIN_ID}/sign/${muxAsset2.playback_id}?type=storyboard`);
    return data.token;
  };
  return /* @__PURE__ */ jsx(
    SignedTokensContext.Provider,
    {
      value: {
        video,
        thumbnail,
        storyboard
      },
      children
    }
  );
}
const BoxStyled = styled(Box)`
  cursor: pointer;

  svg {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;
const CardTitleStyled = styled(CardTitle)`
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
  const [thumbnailImageUrl, setThumbnailImageUrl] = React.useState(
    // Empty pixel
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  );
  const { formatMessage, formatDate } = useIntl();
  const { thumbnail } = useSignedTokens();
  const isLoading = muxAsset.asset_id === null;
  const init = async (muxAsset2) => {
    const { playback_id } = muxAsset2;
    if (muxAsset2.playback_id !== null && muxAsset2.signed) {
      const token = await thumbnail(muxAsset2);
      setThumbnailImageUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}?token=${token}`);
    } else if (muxAsset2.playback_id !== null) {
      setThumbnailImageUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}`);
    }
  };
  React.useEffect(() => {
    init(muxAsset);
  }, []);
  const renderCardAssetStatus = React.useCallback(() => {
    if (muxAsset.error_message !== null) {
      return /* @__PURE__ */ jsx(Flex, { children: /* @__PURE__ */ jsx(WarningCircle, { fill: "danger500" }) });
    } else if (isLoading || !muxAsset.playback_id) {
      return /* @__PURE__ */ jsx(Flex, { children: /* @__PURE__ */ jsx(Loader, { small: true, children: formatMessage({ id: getTranslation("AssetCard.loading"), defaultMessage: "Loading" }) }) });
    }
  }, [muxAsset]);
  const handleOnClick = () => {
    onClick(muxAsset);
  };
  const loadingTitle = isLoading && formatMessage({
    id: getTranslation("AssetCard.is-loading"),
    defaultMessage: "Asset is being processed"
  });
  const errorTitle = isLoading && formatMessage({
    id: getTranslation("AssetCard.is-error"),
    defaultMessage: "Asset encountered an error"
  });
  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  const statusLabel = (() => {
    if (aspect_ratio)
      return aspect_ratio;
    if (muxAsset.isReady)
      return formatMessage({
        id: getTranslation("AssetCard.no-aspect-ratio"),
        defaultMessage: "No aspect ratio"
      });
    if (muxAsset.error_message !== null)
      return formatMessage({
        id: getTranslation("AssetCard.processing-error"),
        defaultMessage: "Error"
      });
    return formatMessage({
      id: getTranslation("AssetCard.processing-pending"),
      defaultMessage: "Processing"
    });
  })();
  return /* @__PURE__ */ jsx(BoxStyled, { onClick: handleOnClick, title: errorTitle || loadingTitle || void 0, children: /* @__PURE__ */ jsxs(Card, { children: [
    /* @__PURE__ */ jsxs(CardHeader, { children: [
      /* @__PURE__ */ jsx(CardAsset, { src: thumbnailImageUrl, style: { objectFit: "cover" }, children: renderCardAssetStatus() }),
      muxAsset.duration && /* @__PURE__ */ jsx(CardTimer, { children: secondsToFormattedString(muxAsset.duration) })
    ] }),
    /* @__PURE__ */ jsxs(CardBody, { children: [
      /* @__PURE__ */ jsxs(CardContent, { children: [
        /* @__PURE__ */ jsx(CardTitleStyled, { title: muxAsset.title, children: muxAsset.title }),
        /* @__PURE__ */ jsxs(CardSubtitle, { children: [
          muxAsset.createdAt ? formatDate(muxAsset.createdAt) : null,
          " - ",
          statusLabel
        ] })
      ] }),
      /* @__PURE__ */ jsx(CardBadge, { children: /* @__PURE__ */ jsx("span", { title: muxAsset.signed ? "Private Playback" : "Public Playback", children: muxAsset.signed ? /* @__PURE__ */ jsx(Lock, {}) : /* @__PURE__ */ jsx(Earth, {}) }) })
    ] })
  ] }) });
};
const AssetGrid = (props) => {
  const { muxAssets, onMuxAssetClick = () => {
  } } = props;
  const { formatMessage } = useIntl();
  if (muxAssets === void 0)
    return null;
  if (muxAssets.length === 0)
    return /* @__PURE__ */ jsx(Flex, { justifyContent: "center", padding: 5, children: /* @__PURE__ */ jsx(Typography, { variant: "omega", textColor: "neutral700", children: formatMessage({
      id: getTranslation("HomePage.no-assets"),
      defaultMessage: "No assets found"
    }) }) });
  const assets = muxAssets.map((muxAsset) => /* @__PURE__ */ jsx(Grid.Item, { col: 3, m: 4, xs: 12, s: 6, children: /* @__PURE__ */ jsx(Box, { width: "100%", children: /* @__PURE__ */ jsx(AssetCard, { muxAsset, onClick: onMuxAssetClick }) }) }, muxAsset.id));
  return /* @__PURE__ */ jsx(Box, { paddingTop: 6, paddingBottom: 8, children: /* @__PURE__ */ jsx(Grid.Root, { gap: 4, children: assets }) });
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
  const arr = Array.from({ length: pages }).map((_value, index) => index + 1);
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
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const prevIntl = {
    id: getTranslation("ListPagination.previous-page"),
    defaultMessage: "Previous page"
  };
  const nextIntl = {
    id: getTranslation("ListPagination.next-page"),
    defaultMessage: "Next page"
  };
  const gotoIntl = {
    id: getTranslation("ListPagination.goto-page-n"),
    defaultMessage: "Go to page {pageNumber}"
  };
  const dotsIntl = {
    id: getTranslation("ListPagination.dots"),
    defaultMessage: "And {more} other pages"
  };
  if (page === void 0 || pages === void 0)
    return null;
  const { location } = window;
  const handleOnChangePage = (page2) => {
    const loc = appendQueryParameter(location, { page: page2.toString() });
    navigate(`?${loc.search}`);
  };
  return /* @__PURE__ */ jsx(Grid.Root, { children: /* @__PURE__ */ jsx(Grid.Item, { children: /* @__PURE__ */ jsxs(Pagination, { activePage: page, pageCount: pages, children: [
    /* @__PURE__ */ jsx(PreviousLink, { onClick: () => handleOnChangePage(page - 1), children: formatMessage(prevIntl) }),
    /* @__PURE__ */ jsx(NextLink, { onClick: () => handleOnChangePage(page + 1), children: formatMessage(nextIntl) }),
    createPagination({ activePage: page, pages }).items.map((item) => {
      if (item.type === "PageItem") {
        return /* @__PURE__ */ jsx(PageLink, { number: item.value, onClick: () => handleOnChangePage(item.value), children: formatMessage(gotoIntl, { pageNumber: item.label }) }, item.value);
      } else if (item.type === "DotsItem" && item.display) {
        return /* @__PURE__ */ jsx(Dots, { children: formatMessage(dotsIntl, { more: item.additional }) }, `dots-${item.value}`);
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
const TextTrackFile = z.object({
  contents: z.string(),
  type: z.string(),
  name: z.string(),
  size: z.number()
});
const CustomTextTrack = z.object({
  file: TextTrackFile,
  name: z.string(),
  language_code: z.string(),
  closed_captions: z.boolean().default(false),
  stored_track: z.custom((value) => typeof value === "object" && value && "id" in value).optional()
});
const UploadConfig = z.object({
  /**
   * Enable static renditions by setting this to 'standard'. Can be overwritten on a per-asset basis.
   * @see {@link https://docs.mux.com/guides/video/enable-static-mp4-renditions#why-enable-mp4-support}
   * @defaultValue 'none'
   */
  mp4_support: z.enum(["none", "standard"]).default("none"),
  /**
   * Max resolution tier can be used to control the maximum resolution_tier your asset is encoded, stored, and streamed at.
   * @see {@link https://docs.mux.com/guides/stream-videos-in-4k}
   * @defaultValue '1080p'
   */
  max_resolution_tier: z.enum(["2160p", "1440p", "1080p"]).default("1080p"),
  /**
   * The video quality informs the cost, quality, and available platform features for the asset.
   * @see {@link https://docs.mux.com/guides/use-video-quality-levels}
   * @defaultValue 'plus'
   */
  video_quality: z.enum(["basic", "plus"]).default("plus"),
  /**
   * Whether or not to use signed URLs, making the asset private
   * @see {@link https://docs.mux.com/guides/use-encoding-tiers}
   * @defaultValue 'false'
   */
  signed: z.boolean().default(false),
  autogenerated_captions_languages: z.array(
    z.object({
      code: z.enum(SUPPORTED_MUX_LANGUAGES_VALUES),
      isSourceLanguage: z.boolean().default(false)
    })
  ).optional(),
  custom_text_tracks: z.array(CustomTextTrack).optional(),
  upload_type: z.enum(["file", "url"]).default("file")
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
const UploadData = z.object({ title: z.string().min(1) }).and(
  z.discriminatedUnion("upload_type", [
    z.object({ upload_type: z.literal("file"), file: z.custom((value) => value instanceof File) }),
    z.object({ upload_type: z.literal("url"), url: z.string().url() })
  ])
).and(UploadConfig);
z.object({ title: z.string().min(1) }).and(
  z.discriminatedUnion("upload_type", [
    z.object({ upload_type: z.literal("file") }),
    z.object({ upload_type: z.literal("url"), url: z.string().url() })
  ])
).and(UploadConfig);
const getTrad = (id) => `${PLUGIN_ID}.${id}`;
const usePluginIntl = () => {
  const intl = useIntl();
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
  return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Field.Root, { name: name2, error, children: [
    /* @__PURE__ */ jsx(Field.Label, { "aria-required": true, children: label }),
    /* @__PURE__ */ jsx(Field.Input, { type: "file", onChange: handleOnChange }),
    /* @__PURE__ */ jsx(Field.Error, {})
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
  const [editable, setEditable] = React.useState(track.stored_track?.id ? false : true);
  const { formatMessage } = useIntl();
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
  return /* @__PURE__ */ jsx(Card, { width: "100%", children: /* @__PURE__ */ jsx(CardBody, { children: /* @__PURE__ */ jsx(CardContent, { width: "100%", children: /* @__PURE__ */ jsxs(Grid.Root, { width: "100%", gap: 4, children: [
    /* @__PURE__ */ jsxs(Grid.Item, { col: 12, s: 12, children: [
      /* @__PURE__ */ jsx(Box, { grow: 1, children: /* @__PURE__ */ jsxs(
        Field.Root,
        {
          hint: formatMessage({
            id: getTranslation("CustomTextTrackForm.language"),
            defaultMessage: "Language"
          }),
          children: [
            /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
              id: getTranslation("CustomTextTrackForm.language"),
              defaultMessage: "Language"
            }) }),
            /* @__PURE__ */ jsx(
              Combobox,
              {
                value: track.language_code,
                onChange: (newValue) => {
                  modifyTrack({ language_code: newValue, name: LanguagesList.getNativeName(newValue) });
                },
                required: true,
                disabled: !editable,
                children: LanguagesList.getAllCodes().map((code) => /* @__PURE__ */ jsx(ComboboxOption, { value: code, children: LanguagesList.getNativeName(code) }, code))
              }
            ),
            /* @__PURE__ */ jsx(Field.Error, {})
          ]
        }
      ) }),
      track.stored_track?.id && muxAsset?.playback_id && /* @__PURE__ */ jsx(Box, { marginLeft: 4, children: /* @__PURE__ */ jsxs(Field.Root, { children: [
        /* @__PURE__ */ jsx(Field.Label, { children: " " }),
        /* @__PURE__ */ jsx(
          IconButton,
          {
            label: formatMessage({
              id: getTranslation("Common.download-button"),
              defaultMessage: "Download"
            }),
            withTooltip: false,
            onClick: downloadOnClick,
            children: /* @__PURE__ */ jsx(Download, {})
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Grid.Item, { col: 12, s: 12, children: [
      editable && /* @__PURE__ */ jsx(Box, { marginRight: 4, children: /* @__PURE__ */ jsx(
        FileInput,
        {
          name: "file",
          label: formatMessage({
            id: getTranslation("Common.file-label"),
            defaultMessage: "Subtitles file (.vtt or .srt)"
          }),
          required: true,
          onFiles: handleFiles,
          inputProps: {
            accept: ".vtt,.srt"
          }
        }
      ) }),
      /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsxs(Field.Root, { children: [
        /* @__PURE__ */ jsx(Field.Label, { children: editable ? " " : null }),
        /* @__PURE__ */ jsx(
          Checkbox,
          {
            value: track.closed_captions ? 1 : 0,
            onChange: (e) => {
              modifyTrack({ closed_captions: e.currentTarget.value === 1 ? true : false });
            },
            disabled: !editable,
            children: /* @__PURE__ */ jsx(Typography, { style: { whiteSpace: "nowrap" }, children: formatMessage({
              id: getTranslation("CustomTextTrackForm.closed-captions"),
              defaultMessage: "Closed captions"
            }) })
          }
        )
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs(Grid.Item, { children: [
      /* @__PURE__ */ jsx(Box, { marginRight: 4, children: /* @__PURE__ */ jsx(Button, { startIcon: /* @__PURE__ */ jsx(Trash, {}), onClick: deleteTrack, variant: "danger-light", children: formatMessage({
        id: getTranslation("Common.delete-button"),
        defaultMessage: "Delete"
      }) }) }),
      /* @__PURE__ */ jsx(Box, { marginRight: 4, children: !editable && /* @__PURE__ */ jsx(Button, { onClick: () => setEditable(true), startIcon: /* @__PURE__ */ jsx(Pencil, {}), children: formatMessage({
        id: getTranslation("Common.update-button"),
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
  const { formatMessage } = useIntl();
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
  function modifyTrack(index) {
    return (newValues) => {
      modifyCustomTextTracks(
        custom_text_tracks?.map((track, i) => {
          if (i === index) {
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
  function deleteTrack(index) {
    return () => {
      modifyCustomTextTracks(custom_text_tracks?.filter((_, i) => i !== index) || []);
    };
  }
  return /* @__PURE__ */ jsxs(Grid.Root, { gap: 2, children: [
    custom_text_tracks?.map((track, index) => /* @__PURE__ */ jsx(Grid.Item, { col: 12, s: 12, children: /* @__PURE__ */ jsx(
      TrackForm,
      {
        track,
        modifyTrack: modifyTrack(index),
        deleteTrack: deleteTrack(index),
        muxAsset
      },
      track.stored_track?.id || `${index}-${track.language_code}`
    ) }, index)),
    /* @__PURE__ */ jsx(Grid.Item, { col: 12, s: 12, children: /* @__PURE__ */ jsx(Button, { type: "button", startIcon: /* @__PURE__ */ jsx(Plus, {}), onClick: handleNew, style: { justifyContent: "center" }, children: formatMessage({
      id: getTranslation("CustomTextTrackForm.new-caption"),
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
  const { formatMessage } = useIntl();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Box, { paddingTop: 5, children: /* @__PURE__ */ jsx(Flex, { justifyContent: "center", children: /* @__PURE__ */ jsxs(Typography, { variant: "alpha", children: [
      formatMessage({
        id: getTranslation("UploadError.upload-error"),
        defaultMessage: "Upload Error"
      }),
      " ",
      /* @__PURE__ */ jsx(WarningCircle, { color: "danger600" })
    ] }) }) }),
    /* @__PURE__ */ jsx(Box, { paddingTop: 5, children: /* @__PURE__ */ jsxs(Typography, { variant: "omega", children: [
      formatMessage({
        id: getTranslation("UploadError.message"),
        defaultMessage: "An error occurred while uploading the file.  Submit an issue with the following error message"
      }),
      " - ",
      /* @__PURE__ */ jsx(Link, { isExternal: true, href: "https://github.com/muxinc/strapi-plugin-mux-video-uploader/issues", children: formatMessage({
        id: getTranslation("UploadError.issues"),
        defaultMessage: "File issue"
      }) })
    ] }) }),
    /* @__PURE__ */ jsx(Box, { paddingTop: 5, children: /* @__PURE__ */ jsx(Typography, { variant: "omega", textColor: "danger500", children: message }) })
  ] });
};
const Uploaded = () => {
  const { formatMessage } = useIntl();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Box, { paddingTop: 2, children: /* @__PURE__ */ jsx(Typography, { variant: "delta", children: formatMessage({
      id: getTranslation("Uploaded.upload-complete"),
      defaultMessage: "Video uploaded successfully"
    }) }) }),
    /* @__PURE__ */ jsx(Box, { paddingTop: 5, children: /* @__PURE__ */ jsx(Typography, { variant: "omega", children: formatMessage({
      id: getTranslation("Uploaded.message"),
      defaultMessage: "The file has been successfully uploaded to Mux and is now able to be referenced by other Content Types within Strapi."
    }) }) })
  ] });
};
const ProgressBarWrapper = styled.div`
  width: 60%;
`;
const ProgessBarUnleased = styled(ProgressBar)`
  width: 100%;
`;
const Uploading = (props) => {
  const { formatMessage } = useIntl();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Box, { paddingBottom: 5, children: /* @__PURE__ */ jsx(Flex, { justifyContent: "center", children: /* @__PURE__ */ jsx(Typography, { variant: "alpha", children: formatMessage({
      id: getTranslation("Uploading.uploading"),
      defaultMessage: "Uploading to Mux"
    }) }) }) }),
    /* @__PURE__ */ jsx(Box, { paddingBottom: 5, children: /* @__PURE__ */ jsx(Flex, { justifyContent: "center", children: /* @__PURE__ */ jsx(ProgressBarWrapper, { children: /* @__PURE__ */ jsx(ProgessBarUnleased, { value: props.percent }) }) }) })
  ] });
};
const ModalNewUpload = ({ isOpen, onToggle = () => {
} }) => {
  const [uploadPercent, setUploadPercent] = React.useState();
  const [isComplete, setIsComplete] = React.useState(false);
  const [uploadError, setUploadError] = React.useState();
  const uploadRef = React.useRef();
  const { post } = useFetchClient();
  const { formatMessage } = usePluginIntl();
  const uploadFile = (endpoint, file) => {
    setUploadPercent(0);
    uploadRef.current = createUpload({ endpoint, file });
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
    const url = `${PLUGIN_ID}/${uploadInfo.upload_type === "url" ? "remote-upload" : "direct-upload"}`;
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
      return /* @__PURE__ */ jsxs(Modal.Footer, { children: [
        /* @__PURE__ */ jsx(Button, { variant: "secondary", startIcon: /* @__PURE__ */ jsx(Plus, {}), onClick: handleOnReset, children: formatMessage("Uploaded.upload-another-button", "Upload another asset") }),
        /* @__PURE__ */ jsx(Button, { onClick: handleOnModalFinish, children: formatMessage("Common.finish-button", "Finish") })
      ] });
    }
    if (uploadPercent !== void 0) {
      return /* @__PURE__ */ jsx(Modal.Footer, { children: /* @__PURE__ */ jsx(Button, { onClick: handleOnAbort, variant: "tertiary", children: formatMessage("Common.cancel-button", "Cancel") }) });
    }
    return /* @__PURE__ */ jsxs(Modal.Footer, { children: [
      /* @__PURE__ */ jsx(Button, { onClick: () => handleOnModalClose(), variant: "tertiary", children: formatMessage("Common.cancel-button", "Cancel") }),
      /* @__PURE__ */ jsx(Button, { onClick: handleSubmit, children: formatMessage("Common.save-button", "Save") })
    ] });
  };
  const { values, errors, resetForm, setFieldValue, handleChange, handleSubmit } = useFormik({
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
  return /* @__PURE__ */ jsx("form", { children: /* @__PURE__ */ jsx(Modal.Root, { open: isOpen, onOpenChange: handleOnOpenChange, children: /* @__PURE__ */ jsxs(Modal.Content, { children: [
    /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsx(Modal.Title, { children: formatMessage("ModalNewUpload.header", "New upload") }) }),
    /* @__PURE__ */ jsx(Modal.Body, { children: /* @__PURE__ */ jsx(
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
  const { formatMessage } = useIntl();
  const handleAutogeneratedCaptionsLanguagesChange = (vals) => {
    const languages = [];
    vals.forEach((value) => {
      const language = SUPPORTED_MUX_LANGUAGES.find((lang) => lang.code === value);
      language && languages.push(language);
    });
    setFieldValue("autogenerated_captions_languages", languages);
  };
  if (props.uploadError) {
    return /* @__PURE__ */ jsx(UploadError, { message: props.uploadError });
  }
  if (props.isComplete) {
    return /* @__PURE__ */ jsx(Uploaded, {});
  }
  if (props.uploadPercent !== void 0) {
    return /* @__PURE__ */ jsx(Uploading, { percent: props.uploadPercent });
  }
  return /* @__PURE__ */ jsxs(Box, { padding: 1, background: "neutral0", children: [
    /* @__PURE__ */ jsx(FieldWrapper, { children: /* @__PURE__ */ jsxs(Field.Root, { error: errors.title, children: [
      /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
        id: getTranslation("Common.title-label"),
        defaultMessage: "Title"
      }) }),
      /* @__PURE__ */ jsx(
        TextInput,
        {
          name: "title",
          value: values.title,
          hasError: errors.title !== void 0,
          required: true,
          onChange: handleChange
        }
      ),
      /* @__PURE__ */ jsx(Field.Error, {}),
      /* @__PURE__ */ jsx(Field.Hint, {})
    ] }) }),
    /* @__PURE__ */ jsxs(Field.Root, { children: [
      /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
        id: getTranslation("Common.upload_type_label-label"),
        defaultMessage: "Upload via"
      }) }),
      /* @__PURE__ */ jsxs(Tabs.Root, { id: "upload_type", defaultValue: "file", variant: "simple", children: [
        /* @__PURE__ */ jsxs(Tabs.List, { "aria-label": "Manage your attribute", children: [
          /* @__PURE__ */ jsx(Tabs.Trigger, { value: "file", onClick: () => setFieldValue("upload_type", "file"), children: "File" }),
          /* @__PURE__ */ jsx(Tabs.Trigger, { value: "url", onClick: () => setFieldValue("upload_type", "url"), children: "URL" })
        ] }),
        /* @__PURE__ */ jsx(Tabs.Content, { value: "file", children: /* @__PURE__ */ jsx(FieldWrapper, { children: /* @__PURE__ */ jsx(
          FileInput,
          {
            name: "file",
            label: formatMessage({
              id: getTranslation("Common.file-label"),
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
        /* @__PURE__ */ jsx(Tabs.Content, { value: "url", children: /* @__PURE__ */ jsxs(FieldWrapper, { children: [
          /* @__PURE__ */ jsx(Field.Root, { children: /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
            id: getTranslation("Common.url-label"),
            defaultMessage: "Url"
          }) }) }),
          /* @__PURE__ */ jsx(
            TextInput,
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
    /* @__PURE__ */ jsxs(Accordion.Root, { children: [
      /* @__PURE__ */ jsxs(Accordion.Item, { value: "acc-01", children: [
        /* @__PURE__ */ jsx(Accordion.Header, { children: /* @__PURE__ */ jsx(Accordion.Trigger, { children: formatMessage({
          id: getTranslation("ModalNewUpload.section_encoding_settings-label"),
          defaultMessage: "Encoding settings"
        }) }) }),
        /* @__PURE__ */ jsx(Accordion.Content, { children: /* @__PURE__ */ jsxs(Grid.Root, { gap: 4, children: [
          /* @__PURE__ */ jsx(Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsx(Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxs(Field.Root, { children: [
            /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
              id: getTranslation("Common.video_quality-label"),
              defaultMessage: "Video quality"
            }) }),
            /* @__PURE__ */ jsxs(
              Radio.Group,
              {
                onValueChange: (value) => setFieldValue("video_quality", value),
                value: values.video_quality,
                children: [
                  /* @__PURE__ */ jsx(Radio.Item, { value: "basic", children: formatMessage({
                    id: getTranslation("Common.video_quality_basic-label"),
                    defaultMessage: "Basic"
                  }) }),
                  /* @__PURE__ */ jsx(Radio.Item, { value: "plus", children: formatMessage({
                    id: getTranslation("Common.video_quality_plus-label"),
                    defaultMessage: "Plus"
                  }) })
                ]
              }
            )
          ] }) }) }),
          /* @__PURE__ */ jsx(Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsx(Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxs(Field.Root, { children: [
            /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
              id: getTranslation("Common.max_resolution_tier-label"),
              defaultMessage: "Maximum stream resolution"
            }) }),
            /* @__PURE__ */ jsxs(
              Radio.Group,
              {
                "aria-labelledby": "max_resolution_tier_label",
                onValueChange: (value) => setFieldValue("max_resolution_tier", value),
                value: values.max_resolution_tier,
                style: { marginTop: "0.5rem" },
                disabled: values.video_quality === "basic",
                children: [
                  /* @__PURE__ */ jsx(Radio.Item, { value: "2160p", children: "2160p (4k)" }),
                  /* @__PURE__ */ jsx(Radio.Item, { value: "1440p", children: "1440p (2k)" }),
                  /* @__PURE__ */ jsx(Radio.Item, { value: "1080p", children: "1080p" })
                ]
              }
            )
          ] }) }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs(Accordion.Item, { value: "acc-02", children: [
        /* @__PURE__ */ jsx(Accordion.Header, { children: /* @__PURE__ */ jsx(Accordion.Trigger, { children: formatMessage({
          id: getTranslation("ModalNewUpload.section_delivery_settings-label"),
          defaultMessage: "Delivery settings"
        }) }) }),
        /* @__PURE__ */ jsx(Accordion.Content, { children: /* @__PURE__ */ jsxs(Grid.Root, { gap: 4, children: [
          /* @__PURE__ */ jsx(Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsx(Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxs(Field.Root, { children: [
            /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
              id: getTranslation("Common.signed-label"),
              defaultMessage: "Signed Playback URL"
            }) }),
            /* @__PURE__ */ jsx(
              Toggle,
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
          /* @__PURE__ */ jsx(Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsx(Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxs(Field.Root, { children: [
            /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
              id: getTranslation("Common.mp4_support-label"),
              defaultMessage: "Allow downloading via MP4"
            }) }),
            /* @__PURE__ */ jsx(
              Toggle,
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
      /* @__PURE__ */ jsxs(Accordion.Item, { value: "acc-03", children: [
        /* @__PURE__ */ jsx(Accordion.Header, { children: /* @__PURE__ */ jsx(Accordion.Trigger, { children: formatMessage({
          id: getTranslation("ModalNewUpload.section_additional_settings-label"),
          defaultMessage: "Additional settings"
        }) }) }),
        /* @__PURE__ */ jsx(Accordion.Content, { children: /* @__PURE__ */ jsx(Box, { padding: 4, width: "100%", children: /* @__PURE__ */ jsxs(Tabs.Root, { defaultValue: "autogenerated", children: [
          /* @__PURE__ */ jsxs(Tabs.List, { "aria-label": "Manage your attribute", children: [
            /* @__PURE__ */ jsx(Tabs.Trigger, { value: "autogenerated", children: /* @__PURE__ */ jsxs(Flex, { justifyContent: "center", children: [
              /* @__PURE__ */ jsx(Box, { children: formatMessage({
                id: getTranslation("ModalNewUpload.tab_captions_autogenerated-label"),
                defaultMessage: "Auto-generated"
              }) }),
              values.autogenerated_captions_languages && values.autogenerated_captions_languages.length > 0 && /* @__PURE__ */ jsx(Box, { marginLeft: 4, children: /* @__PURE__ */ jsx(Badge, { backgroundColor: "primary600", textColor: "neutral1000", children: values.autogenerated_captions_languages.length }) })
            ] }) }),
            /* @__PURE__ */ jsx(Tabs.Trigger, { value: "custom", children: /* @__PURE__ */ jsxs(Flex, { justifyContent: "center", children: [
              /* @__PURE__ */ jsx(Box, { children: formatMessage({
                id: getTranslation("ModalNewUpload.tab_captions_custom-label"),
                defaultMessage: "Custom"
              }) }),
              values.custom_text_tracks && values.custom_text_tracks.length > 0 && /* @__PURE__ */ jsx(Box, { marginLeft: 4, children: /* @__PURE__ */ jsx(Badge, { backgroundColor: "primary600", textColor: "neutral1000", children: values.custom_text_tracks.length }) })
            ] }) })
          ] }),
          /* @__PURE__ */ jsx(Tabs.Content, { value: "autogenerated", children: /* @__PURE__ */ jsx(Grid.Root, { gap: 4, children: /* @__PURE__ */ jsx(Grid.Item, { col: 12, direction: "column", alignItems: "start", children: /* @__PURE__ */ jsx(Box, { width: "100%", paddingTop: 4, children: /* @__PURE__ */ jsxs(Field.Root, { children: [
            /* @__PURE__ */ jsx(Field.Label, { children: formatMessage({
              id: getTranslation("ModalNewUpload.autogenerated_languages-label"),
              defaultMessage: "Languages"
            }) }),
            /* @__PURE__ */ jsx(
              MultiSelect,
              {
                name: "autogenerated_captions_languages",
                hasError: errors.autogenerated_captions_languages,
                value: values.autogenerated_captions_languages?.map((lang) => lang.code),
                onChange: handleAutogeneratedCaptionsLanguagesChange,
                withTags: true,
                children: SUPPORTED_MUX_LANGUAGES.map((language) => /* @__PURE__ */ jsx(MultiSelectOption, { value: language.code, children: language.label }, language.code))
              }
            )
          ] }) }) }) }) }),
          /* @__PURE__ */ jsx(Tabs.Content, { value: "custom", children: /* @__PURE__ */ jsx(Box, { width: "100%", paddingTop: 4, children: /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(Box, { paddingTop: 4, paddingBottom: 4, children: props.children });
}
const Header = (props) => {
  const { onUploadNewAssetModalClose = () => {
  } } = props;
  const [isNewUploadOpen, setIsNewUploadOpen] = React.useState(false);
  const permissions = React.useMemo(() => {
    return [pluginPermissions.mainCreate];
  }, []);
  const { formatMessage } = useIntl();
  const {
    allowedActions: { canCreate }
  } = useRBAC(permissions);
  const handleOnNewUploadClick = () => setIsNewUploadOpen(true);
  const handleOnNewUploadClose = (refresh) => {
    setIsNewUploadOpen(false);
    if (!refresh)
      return;
    onUploadNewAssetModalClose();
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      Layouts.Header,
      {
        title: formatMessage({
          id: getTranslation("HomePage.section-label"),
          defaultMessage: "Mux Video Uploader"
        }),
        primaryAction: /* @__PURE__ */ jsx(Button, { disabled: !canCreate, startIcon: /* @__PURE__ */ jsx(Plus, {}), onClick: handleOnNewUploadClick, children: formatMessage({
          id: getTranslation("HomePage.new-upload-button"),
          defaultMessage: "Upload new assets"
        }) })
      }
    ),
    /* @__PURE__ */ jsx(ModalNewUpload, { isOpen: isNewUploadOpen, onToggle: handleOnNewUploadClose })
  ] });
};
const name = "strapi-plugin-mux-video-uploader";
const version = "3.0.1";
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
const exports = {
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
  exports,
  files
};
const MuxPlayerStyled = styled(MuxPlayer)`
  width: 100%;
`;
const PreviewPlayer = (props) => {
  const { muxAsset } = props;
  const [videoToken, setVideoToken] = React.useState();
  const [posterUrl, setPosterUrl] = React.useState(
    // Empty pixel
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
  );
  const [storyboardUrl, setStoryboardUrl] = React.useState();
  const { video, thumbnail, storyboard } = useSignedTokens();
  const init = async (muxAsset2) => {
    const { playback_id } = muxAsset2;
    if (muxAsset2.playback_id !== null && muxAsset2.signed) {
      const videoToken2 = await video(muxAsset2);
      const thumbnailToken = await thumbnail(muxAsset2);
      const storyboardToken = await storyboard(muxAsset2);
      setVideoToken(videoToken2);
      setPosterUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}?token=${thumbnailToken}`);
      setStoryboardUrl(`/${PLUGIN_ID}/storyboard/${playback_id}?token=${storyboardToken}`);
    } else if (muxAsset2.playback_id !== null) {
      setPosterUrl(`/${PLUGIN_ID}/thumbnail/${playback_id}`);
    }
  };
  React.useEffect(() => {
    muxAsset && init(muxAsset);
  }, []);
  if (!muxAsset?.playback_id || muxAsset.signed && !videoToken)
    return null;
  return /* @__PURE__ */ jsx(
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
const TypographyWrapped = styled(Typography)`
  overflow-wrap: break-word;
`;
const Summary = (props) => {
  const { muxAsset } = props;
  const { formatMessage, formatDate, formatTime } = useIntl();
  if (muxAsset === void 0)
    return null;
  const created_date = formatDate(Date.parse(muxAsset.createdAt));
  const created_time = formatTime(Date.parse(muxAsset.createdAt));
  const updated_date = formatDate(Date.parse(muxAsset.updatedAt));
  const updated_time = formatTime(Date.parse(muxAsset.updatedAt));
  return /* @__PURE__ */ jsxs(Box, { padding: 4, background: "neutral100", hasRadius: true, children: [
    /* @__PURE__ */ jsxs(Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsx(Box, { paddingBottom: 1, children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: getTranslation("Common.isReady-label"),
        defaultMessage: "State"
      }) }) }),
      /* @__PURE__ */ jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.isReady ? /* @__PURE__ */ jsx(Badge, { active: true, children: formatMessage({
        id: getTranslation("Common.ready"),
        defaultMessage: "Ready"
      }) }) : /* @__PURE__ */ jsx(Badge, { children: formatMessage({
        id: getTranslation("Common.preparing"),
        defaultMessage: "Preparing"
      }) }) })
    ] }),
    /* @__PURE__ */ jsxs(Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsx(Box, { paddingBottom: 1, children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: getTranslation("Summary.assetId"),
        defaultMessage: "Asset Id"
      }) }) }),
      /* @__PURE__ */ jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.asset_id })
    ] }),
    /* @__PURE__ */ jsxs(Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsx(Box, { paddingBottom: 1, children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: getTranslation("Summary.uploadId"),
        defaultMessage: "Upload Id"
      }) }) }),
      /* @__PURE__ */ jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.upload_id })
    ] }),
    /* @__PURE__ */ jsxs(Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsx(Box, { paddingBottom: 1, children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: getTranslation("Summary.playbackId"),
        defaultMessage: "Playback Id"
      }) }) }),
      /* @__PURE__ */ jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.playback_id })
    ] }),
    /* @__PURE__ */ jsxs(Box, { paddingBottom: 4, children: [
      /* @__PURE__ */ jsx(Box, { paddingBottom: 1, children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
        id: getTranslation("Summary.playbackPolicy"),
        defaultMessage: "Playback Policy"
      }) }) }),
      /* @__PURE__ */ jsx(TypographyWrapped, { variant: "pi", textColor: "neutral700", children: muxAsset.signed ? "Signed" : "Public" })
    ] }),
    /* @__PURE__ */ jsx(Box, { children: /* @__PURE__ */ jsxs(Grid.Root, { gap: 4, children: [
      /* @__PURE__ */ jsx(Grid.Item, { col: 6, s: 12, children: /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Box, { paddingBottom: 1, children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
          id: getTranslation("Summary.created"),
          defaultMessage: "Created"
        }) }) }),
        /* @__PURE__ */ jsxs(Typography, { variant: "pi", textColor: "neutral700", children: [
          created_date,
          " ",
          created_time
        ] })
      ] }) }),
      /* @__PURE__ */ jsx(Grid.Item, { col: 6, s: 12, children: /* @__PURE__ */ jsxs(Box, { children: [
        /* @__PURE__ */ jsx(Box, { paddingBottom: 1, children: /* @__PURE__ */ jsx(Typography, { variant: "sigma", fontWeight: "bold", textColor: "neutral600", textTransform: "uppercase", children: formatMessage({
          id: getTranslation("Summary.updated"),
          defaultMessage: "Updated"
        }) }) }),
        /* @__PURE__ */ jsxs(Typography, { variant: "pi", textColor: "neutral700", children: [
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
  const { del, put } = useFetchClient();
  const { formatMessage } = usePluginIntl();
  const deleteButtonRef = React.useRef(null);
  const [touchedFields, setTouchedFields] = React.useState({});
  const [showDeleteWarning, setShowDeleteWarning] = React.useState(false);
  const [deletingState, setDeletingState] = React.useState("idle");
  const [codeSnippet, setCodeSnippet] = React.useState("");
  const { toggleNotification } = useNotification();
  React.useEffect(() => {
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
    copy(codeSnippet);
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
      await del(`${PLUGIN_ID}/mux-asset/${muxAsset.id}`, {
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
      await put(`${PLUGIN_ID}/mux-asset/${muxAsset?.id}`, data);
    }
    setSubmitting(false);
    onToggle(true);
  };
  const handleOnOpenChange = (open) => {
    if (open)
      return;
    onToggle(false);
  };
  const { errors, values, isSubmitting, handleChange, handleSubmit, setFieldValue } = useFormik({
    initialValues,
    validateOnChange: false,
    enableReinitialize: true,
    onSubmit: handleOnSubmit
  });
  if (!muxAsset)
    return null;
  const aspect_ratio = muxAsset.aspect_ratio || muxAsset.asset_data?.aspect_ratio;
  return /* @__PURE__ */ jsx("form", { children: /* @__PURE__ */ jsx(Modal.Root, { open: isOpen, onOpenChange: handleOnOpenChange, children: /* @__PURE__ */ jsxs(
    Modal.Content,
    {
      style: {
        width: "min(90vw, 100rem)",
        maxWidth: "unset"
      },
      children: [
        /* @__PURE__ */ jsx(Modal.Header, { children: /* @__PURE__ */ jsx(Modal.Title, { children: formatMessage("ModalDetails.header", "Video details") }) }),
        /* @__PURE__ */ jsx(Modal.Body, { style: { paddingInline: 20 }, children: deletingState === "deleting" ? /* @__PURE__ */ jsx(Flex, { justifyContent: "center", padding: 4, children: /* @__PURE__ */ jsx(Typography, { variant: "omega", textColor: "neutral700", children: formatMessage("ModalDetails.deleting", "Deleting...") }) }) : /* @__PURE__ */ jsxs(Grid.Root, { gap: 4, style: { alignItems: "flex-start" }, children: [
          /* @__PURE__ */ jsxs(Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: [
            /* @__PURE__ */ jsxs(
              Box,
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
                  /* @__PURE__ */ jsx(PreviewPlayer, { muxAsset }),
                  /* @__PURE__ */ jsxs(Dialog.Root, { open: showDeleteWarning, children: [
                    /* @__PURE__ */ jsx(Dialog.Trigger, { children: /* @__PURE__ */ jsx(
                      IconButton,
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
                        children: /* @__PURE__ */ jsx(Trash, {})
                      }
                    ) }),
                    /* @__PURE__ */ jsxs(Dialog.Content, { children: [
                      /* @__PURE__ */ jsx(Dialog.Header, { children: formatMessage(
                        "ModalDetails.delete-confirmation-prompt",
                        "Are you sure you want to delete this item?"
                      ) }),
                      /* @__PURE__ */ jsx(Dialog.Body, { children: /* @__PURE__ */ jsxs(Flex, { padding: 4, direction: "column", gap: 2, children: [
                        /* @__PURE__ */ jsx(Box, { textAlign: "center", children: /* @__PURE__ */ jsx(WarningCircle, {}) }),
                        /* @__PURE__ */ jsx(Flex, { justifyContent: "center", children: /* @__PURE__ */ jsx(Typography, { children: formatMessage(
                          "ModalDetails.delete-confirmation-prompt",
                          "Are you sure you want to delete this item?"
                        ) }) }),
                        /* @__PURE__ */ jsx(Flex, { justifyContent: "center", children: /* @__PURE__ */ jsx(Typography, { children: formatMessage(
                          "ModalDetails.delete-confirmation-callout",
                          "This will also delete the Asset from Mux."
                        ) }) })
                      ] }) }),
                      /* @__PURE__ */ jsxs(Dialog.Footer, { children: [
                        /* @__PURE__ */ jsx(Button, { onClickCapture: toggleDeleteWarning, variant: "tertiary", children: formatMessage("Common.cancel-button", "Cancel") }),
                        /* @__PURE__ */ jsx(Button, { variant: "danger-light", startIcon: /* @__PURE__ */ jsx(Trash, {}), onClickCapture: handleOnDeleteConfirm, children: formatMessage("Common.confirm-button", "Confirm") })
                      ] })
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsx(Box, { width: "100%", children: /* @__PURE__ */ jsxs(Field.Root, { children: [
              /* @__PURE__ */ jsx(Field.Label, { children: formatMessage("Captions.title", "Captions / subtitles") }),
              /* @__PURE__ */ jsx(
                CustomTextTrackForm,
                {
                  custom_text_tracks: values.custom_text_tracks || [],
                  modifyCustomTextTracks: (newTracks) => setFieldValue("custom_text_tracks", newTracks),
                  muxAsset
                }
              )
            ] }) })
          ] }),
          /* @__PURE__ */ jsxs(Grid.Item, { col: 6, s: 12, direction: "column", alignItems: "start", children: [
            muxAsset.error_message ? /* @__PURE__ */ jsx(Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsx(Status, { variant: "danger", children: /* @__PURE__ */ jsx(Typography, { children: muxAsset.error_message }) }) }) : null,
            /* @__PURE__ */ jsx(Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsxs(Field.Root, { id: "with_field", error: errors.title, children: [
              /* @__PURE__ */ jsx(Field.Label, { children: formatMessage("Common.title-label", "Title") }),
              /* @__PURE__ */ jsx(
                Field.Input,
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
              /* @__PURE__ */ jsx(Field.Error, {})
            ] }) }),
            /* @__PURE__ */ jsx(Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsx(Summary, { muxAsset }) }),
            /* @__PURE__ */ jsx(Box, { paddingBottom: 4, width: "100%", children: /* @__PURE__ */ jsxs(
              Field.Root,
              {
                hint: /* @__PURE__ */ jsxs(Fragment, { children: [
                  formatMessage("ModalDetails.powered-by-mux", "Powered by mux-player."),
                  " ",
                  /* @__PURE__ */ jsx(Link, { href: "https://docs.mux.com/guides/video/mux-player", isExternal: true, children: formatMessage("ModalDetails.read-more", "Read more about it") })
                ] }),
                children: [
                  /* @__PURE__ */ jsxs(Field.Label, { style: { alignItems: "center", justifyContent: "space-between" }, children: [
                    formatMessage("ModalDetails.code-snippet", "Code snippet"),
                    /* @__PURE__ */ jsx(
                      IconButton,
                      {
                        label: "More actions",
                        borderStyle: "none",
                        withTooltip: false,
                        onClick: handleCopyCodeSnippet,
                        children: /* @__PURE__ */ jsx(Duplicate, {})
                      }
                    )
                  ] }),
                  /* @__PURE__ */ jsx(Textarea, { name: "codeSnippet", value: codeSnippet, rows: 7, disabled: true }),
                  /* @__PURE__ */ jsx(Field.Hint, {})
                ]
              }
            ) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(Modal.Footer, { children: [
          /* @__PURE__ */ jsx(Modal.Close, { children: /* @__PURE__ */ jsx(Button, { variant: "tertiary", onClick: () => onToggle(false), disabled: deletingState === "deleting", children: formatMessage("Common.cancel-button", "Cancel") }) }),
          /* @__PURE__ */ jsx(Button, { variant: "success", disabled: deletingState === "deleting" || isSubmitting, onClick: handleSubmit, children: formatMessage("Common.finish-button", "Finish") })
        ] })
      ]
    }
  ) }) });
}
const ProtectedHomePage = () => /* @__PURE__ */ jsx(Page.Protect, { permissions: [pluginPermissions.mainRead], children: /* @__PURE__ */ jsx(HomePage, {}) });
const HomePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { get } = useFetchClient();
  const { formatMessage } = useIntl();
  const SEARCH_FIELDS = [
    {
      label: formatMessage({
        id: getTranslation("Common.title-search-field"),
        defaultMessage: "By Title"
      }),
      value: SearchField.BY_TITLE
    },
    {
      label: formatMessage({
        id: getTranslation("Common.assetId-search-field"),
        defaultMessage: "By Asset Id"
      }),
      value: SearchField.BY_ASSET_ID
    }
  ];
  const [isReady, setIsReady] = React.useState(false);
  const [muxAssets, setMuxAssets] = React.useState();
  const [selectedAsset, setSelectedAsset] = React.useState();
  const [searchField, setSearchField] = React.useState(SEARCH_FIELDS[0].value);
  const [searchValue, setSearchValue] = React.useState("");
  const [pageLimit] = React.useState(12);
  const [pages, setPages] = React.useState(1);
  const [page, setPage] = React.useState();
  const [isDetailsOpen, setIsDetailsOpen] = React.useState(false);
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
    const { data } = await get(`${PLUGIN_ID}/mux-asset?start=${start}${sort}&limit=${pageLimit}${search}`);
    const pages2 = Math.ceil(data.totalCount / pageLimit);
    setMuxAssets(data);
    setPages(pages2);
  };
  React.useEffect(() => {
    get(`${PLUGIN_ID}/mux-settings`).then((result) => {
      const { data } = result;
      setIsReady(data === true);
    });
  }, []);
  React.useEffect(() => {
    const { page: page2, field, value } = Object.fromEntries(new URLSearchParams(location.search));
    setSearchField(field || SearchField.BY_TITLE);
    setSearchValue(value);
    if (value && value !== searchValue || field && field !== searchField) {
      setPage(1);
    } else {
      setPage(parseInt(page2) || 1);
    }
  }, [location]);
  React.useEffect(() => {
    loadMuxAssets();
  }, [page, searchField, searchValue, pageLimit]);
  const permissions = React.useMemo(() => {
    return [pluginPermissions.mainCreate, pluginPermissions.mainUpdate, pluginPermissions.mainDelete];
  }, []);
  React.useEffect(() => {
    if (!selectedAsset)
      return;
    setIsDetailsOpen(true);
  }, [selectedAsset]);
  const {
    isLoading: isLoadingForPermissions,
    allowedActions: { canCreate, canUpdate, canDelete }
  } = useRBAC(permissions);
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
  return /* @__PURE__ */ jsx(SignedTokensProvider, { children: /* @__PURE__ */ jsxs(Layouts.Root, { children: [
    /* @__PURE__ */ jsxs(Page.Main, { children: [
      /* @__PURE__ */ jsx(Header, { onUploadNewAssetModalClose: handleOnUploadNewAssetModalClose }),
      /* @__PURE__ */ jsx(
        Layouts.Action,
        {
          startActions: /* @__PURE__ */ jsxs(Grid.Root, { gap: 4, children: [
            /* @__PURE__ */ jsx(Grid.Item, { col: 2, xs: 12, s: 12, children: /* @__PURE__ */ jsx(
              SingleSelect,
              {
                "aria-label": formatMessage({
                  id: getTranslation("HomePage.search-label"),
                  defaultMessage: "Choose the field to search"
                }),
                placeholder: formatMessage({
                  id: getTranslation("HomePage.search-placeholder"),
                  defaultMessage: "Search field"
                }),
                value: searchField,
                onChange: (value) => handleOnSearchFieldChange(value.toString()),
                children: SEARCH_FIELDS.map((searchField2) => /* @__PURE__ */ jsx(SingleSelectOption, { value: searchField2.value, children: searchField2.label }, searchField2.value))
              }
            ) }),
            /* @__PURE__ */ jsx(Grid.Item, { col: 8, xs: 12, s: 12, children: /* @__PURE__ */ jsx(Box, { width: "100%", children: /* @__PURE__ */ jsx(
              Searchbar,
              {
                name: "searchbar",
                onClear: () => setSearchValue(""),
                value: searchValue,
                onChange: handleOnSearchValueChange,
                clearLabel: formatMessage({
                  id: getTranslation("HomePage.clear-label"),
                  defaultMessage: "Clear search"
                }),
                children: formatMessage({
                  id: getTranslation("HomePage.searching"),
                  defaultMessage: "Searching for Mux assets"
                })
              }
            ) }) })
          ] })
        }
      ),
      /* @__PURE__ */ jsxs(Layouts.Content, { children: [
        /* @__PURE__ */ jsx(AssetGrid, { muxAssets: muxAssets?.items, onMuxAssetClick: handleOnMuxAssetClick }),
        /* @__PURE__ */ jsx(ListPagination, { page, pages })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(ProtectedHomePage, {}) }),
    /* @__PURE__ */ jsx(Route, { path: "*", element: /* @__PURE__ */ jsx(Page.Error, {}) })
  ] });
};
export {
  App as default
};
//# sourceMappingURL=App-C2JzbO7Y.mjs.map
