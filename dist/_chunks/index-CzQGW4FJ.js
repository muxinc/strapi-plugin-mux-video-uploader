"use strict";
const React = require("react");
const jsxRuntime = require("react/jsx-runtime");
const _interopDefault = (e) => e && e.__esModule ? e : { default: e };
const React__default = /* @__PURE__ */ _interopDefault(React);
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
  const ref = React__default.default.useRef(setPlugin);
  React__default.default.useEffect(() => {
    ref.current(PLUGIN_ID);
  }, []);
  return null;
};
const Logo = () => /* @__PURE__ */ jsxRuntime.jsx("svg", { width: "16", height: "16", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: /* @__PURE__ */ jsxRuntime.jsx(
  "path",
  {
    d: "M14.62.153a1.972 1.972 0 0 0-2.16.433L7.92 5.173 3.38.586A1.96 1.96 0 0 0 1.22.153 1.996 1.996 0 0 0 0 1.999v12c0 1.106.887 2 1.98 2s1.98-.894 1.98-2V6.826l2.56 2.586c.773.78 2.026.78 2.8 0l2.56-2.586v7.173c0 1.106.886 2 1.98 2 1.092 0 1.979-.894 1.979-2v-12a1.985 1.985 0 0 0-1.22-1.846Z",
    fill: "#C0C0CF"
  }
) });
const PluginIcon = () => /* @__PURE__ */ jsxRuntime.jsx(Logo, {});
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
      Component: () => Promise.resolve().then(() => require("./App-3tEDouI4.js"))
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
        return __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./translations/ar.json": () => Promise.resolve().then(() => require("./ar-C_tQu1XS.js")), "./translations/cs.json": () => Promise.resolve().then(() => require("./cs-CPKIUWLp.js")), "./translations/de.json": () => Promise.resolve().then(() => require("./de-K6IYQk2d.js")), "./translations/en.json": () => Promise.resolve().then(() => require("./en-RGzI6oie.js")), "./translations/es.json": () => Promise.resolve().then(() => require("./es-Cb6O-nM6.js")), "./translations/fr.json": () => Promise.resolve().then(() => require("./fr-C8Qw4iPZ.js")), "./translations/it.json": () => Promise.resolve().then(() => require("./it-DYpuAHa5.js")), "./translations/ko.json": () => Promise.resolve().then(() => require("./ko-Bgn4ZG2R.js")), "./translations/ms.json": () => Promise.resolve().then(() => require("./ms-BGlHkuJz.js")), "./translations/nl.json": () => Promise.resolve().then(() => require("./nl-BuofSsmb.js")), "./translations/pl.json": () => Promise.resolve().then(() => require("./pl-waX2XGLw.js")), "./translations/pt-BR.json": () => Promise.resolve().then(() => require("./pt-BR-B_ii8U63.js")), "./translations/pt.json": () => Promise.resolve().then(() => require("./pt-Cuc1TzHc.js")), "./translations/ru.json": () => Promise.resolve().then(() => require("./ru-Dc-rSPqb.js")), "./translations/sk.json": () => Promise.resolve().then(() => require("./sk-Cnpb4YOK.js")), "./translations/tr.json": () => Promise.resolve().then(() => require("./tr-CD23MFJ6.js")), "./translations/uk.json": () => Promise.resolve().then(() => require("./uk-CxIePjBD.js")), "./translations/vi.json": () => Promise.resolve().then(() => require("./vi-B4uqmjm6.js")), "./translations/zh-Hans.json": () => Promise.resolve().then(() => require("./zh-Hans-JcohXWfl.js")), "./translations/zh.json": () => Promise.resolve().then(() => require("./zh-BjcJQUQC.js")) }), `./translations/${locale}.json`).then(({ default: data }) => {
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
exports.PLUGIN_ID = PLUGIN_ID;
exports.getTranslation = getTranslation;
exports.index = index;
exports.pluginPermissions = pluginPermissions;
//# sourceMappingURL=index-CzQGW4FJ.js.map
