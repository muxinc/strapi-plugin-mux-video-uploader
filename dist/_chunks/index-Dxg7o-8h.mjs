import React from "react";
import { jsx } from "react/jsx-runtime";
const __variableDynamicImportRuntimeHelper = (glob, path) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(reject.bind(null, new Error("Unknown variable dynamic import: " + path)));
  });
};
const PLUGIN_ID = "mux-video-uploader";
const getTranslation = (id) => `${PLUGIN_ID}.${id}`;
const Initializer = ({ setPlugin }) => {
  const ref = React.useRef(setPlugin);
  React.useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);
  return null;
};
const Logo = () => /* @__PURE__ */ jsx("svg", { width: "16", height: "16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsx(
  "path",
  {
    d: "M14.62.153a1.972 1.972 0 0 0-2.16.433L7.92 5.173 3.38.586A1.96 1.96 0 0 0 1.22.153 1.996 1.996 0 0 0 0 1.999v12c0 1.106.887 2 1.98 2s1.98-.894 1.98-2V6.826l2.56 2.586c.773.78 2.026.78 2.8 0l2.56-2.586v7.173c0 1.106.886 2 1.98 2 1.092 0 1.979-.894 1.979-2v-12a1.985 1.985 0 0 0-1.22-1.846Z",
    fill: "#C0C0CF"
  }
) });
const PluginIcon = () => /* @__PURE__ */ jsx(Logo, {});
const settingsRead = { action: `plugin::${PLUGIN_ID}.settings.read`, subject: null };
const settingsUpdate = { action: `plugin::${PLUGIN_ID}.settings.update`, subject: null };
const mainRead = { action: `plugin::${PLUGIN_ID}.read`, subject: null };
const mainCreate = { action: `plugin::${PLUGIN_ID}.create`, subject: null };
const mainUpdate = { action: `plugin::${PLUGIN_ID}.update`, subject: null };
const mainDelete = { action: `plugin::${PLUGIN_ID}.delete`, subject: null };
const pluginPermissions = {
  // This permission regards the main component (App) and is used to tell
  // If the plugin link should be displayed in the menu
  // And also if the plugin is accessible. This use case is found when a user types the url of the
  // plugin directly in the browser
  settingsRoles: new Array().concat(settingsRead, settingsUpdate),
  settingsRead,
  settingsUpdate,
  mainRead,
  mainCreate,
  mainUpdate,
  mainDelete
};
const index = {
  register(app) {
    app.addMenuLink({
      to: `plugins/${PLUGIN_ID}`,
      icon: PluginIcon,
      intlLabel: {
        id: getTranslation("Common.plugin-title"),
        defaultMessage: "Mux Video Uploader"
      },
      permissions: [pluginPermissions.mainRead],
      Component: () => import("./App-C2q3pJPm.mjs")
    });
    app.registerPlugin({
      id: PLUGIN_ID,
      initializer: Initializer,
      isReady: false,
      name: PLUGIN_ID
    });
  },
  async registerTrads(app) {
    const { locales } = app;
    const importedTranslations = await Promise.all(
      locales.map((locale) => {
        return __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./translations/ar.json": () => import("./ar-Bf9XlLLo.mjs"), "./translations/cs.json": () => import("./cs-B0QZJTah.mjs"), "./translations/de.json": () => import("./de-B9kiAC-s.mjs"), "./translations/en.json": () => import("./en-DHhhnSpu.mjs"), "./translations/es.json": () => import("./es-DlGQb34u.mjs"), "./translations/fr.json": () => import("./fr-hkSxFuzl.mjs"), "./translations/it.json": () => import("./it-C7z82V3g.mjs"), "./translations/ko.json": () => import("./ko-DVvHHUIT.mjs"), "./translations/ms.json": () => import("./ms-C1wNkEQw.mjs"), "./translations/nl.json": () => import("./nl-C79CwB4e.mjs"), "./translations/pl.json": () => import("./pl-_4ZTFbpK.mjs"), "./translations/pt-BR.json": () => import("./pt-BR-DjINUWGk.mjs"), "./translations/pt.json": () => import("./pt-BLr8DxNP.mjs"), "./translations/ru.json": () => import("./ru-C_7wBr9e.mjs"), "./translations/sk.json": () => import("./sk-i1gQKUBN.mjs"), "./translations/tr.json": () => import("./tr-BWNc97X3.mjs"), "./translations/uk.json": () => import("./uk-C_1qrLRM.mjs"), "./translations/vi.json": () => import("./vi-BfZkgFxI.mjs"), "./translations/zh-Hans.json": () => import("./zh-Hans-CXCr6QLu.mjs"), "./translations/zh.json": () => import("./zh-DucIAhMc.mjs") }), `./translations/${locale}.json`).then(({ default: data }) => {
          return {
            data: getTranslation(data),
            locale
          };
        }).catch(() => {
          return {
            data: {},
            locale
          };
        });
      })
    );
    return importedTranslations;
  }
};
export {
  PLUGIN_ID as P,
  getTranslation as g,
  index as i,
  pluginPermissions as p
};
//# sourceMappingURL=index-Dxg7o-8h.mjs.map
