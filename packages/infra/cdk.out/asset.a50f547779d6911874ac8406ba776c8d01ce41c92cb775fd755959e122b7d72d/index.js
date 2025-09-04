"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod2) => function __require() {
  return mod2 || (0, cb[__getOwnPropNames(cb)[0]])((mod2 = { exports: {} }).exports, mod2), mod2.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod2, isNodeMode, target) => (target = mod2 != null ? __create(__getProtoOf(mod2)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod2 || !mod2.__esModule ? __defProp(target, "default", { value: mod2, enumerable: true }) : target,
  mod2
));
var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);

// asset-input/packages/worker/node_modules/ms/index.js
var require_ms = __commonJS({
  "asset-input/packages/worker/node_modules/ms/index.js"(exports2, module2) {
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module2.exports = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === "string" && val.length > 0) {
        return parse(val);
      } else if (type === "number" && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
      );
    };
    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || "ms").toLowerCase();
      switch (type) {
        case "years":
        case "year":
        case "yrs":
        case "yr":
        case "y":
          return n * y;
        case "weeks":
        case "week":
        case "w":
          return n * w;
        case "days":
        case "day":
        case "d":
          return n * d;
        case "hours":
        case "hour":
        case "hrs":
        case "hr":
        case "h":
          return n * h;
        case "minutes":
        case "minute":
        case "mins":
        case "min":
        case "m":
          return n * m;
        case "seconds":
        case "second":
        case "secs":
        case "sec":
        case "s":
          return n * s;
        case "milliseconds":
        case "millisecond":
        case "msecs":
        case "msec":
        case "ms":
          return n;
        default:
          return void 0;
      }
    }
    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + "d";
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + "h";
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + "m";
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + "s";
      }
      return ms + "ms";
    }
    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, "day");
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, "hour");
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, "minute");
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, "second");
      }
      return ms + " ms";
    }
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
  }
});

// asset-input/packages/worker/node_modules/debug/src/common.js
var require_common = __commonJS({
  "asset-input/packages/worker/node_modules/debug/src/common.js"(exports2, module2) {
    function setup(env) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env).forEach((key) => {
        createDebug[key] = env[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash = (hash << 5) - hash + namespace.charCodeAt(i);
          hash |= 0;
        }
        return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
      }
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug(...args) {
          if (!debug.enabled) {
            return;
          }
          const self = debug;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self.diff = ms;
          self.prev = prevTime;
          self.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self, args);
          const logFn = self.log || createDebug.log;
          logFn.apply(self, args);
        }
        debug.namespace = namespace;
        debug.useColors = createDebug.useColors();
        debug.color = createDebug.selectColor(namespace);
        debug.extend = extend;
        debug.destroy = createDebug.destroy;
        Object.defineProperty(debug, "enabled", {
          enumerable: true,
          configurable: false,
          get: () => {
            if (enableOverride !== null) {
              return enableOverride;
            }
            if (namespacesCache !== createDebug.namespaces) {
              namespacesCache = createDebug.namespaces;
              enabledCache = createDebug.enabled(namespace);
            }
            return enabledCache;
          },
          set: (v) => {
            enableOverride = v;
          }
        });
        if (typeof createDebug.init === "function") {
          createDebug.init(debug);
        }
        return debug;
      }
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      function matchesTemplate(search, template) {
        let searchIndex = 0;
        let templateIndex = 0;
        let starIndex = -1;
        let matchIndex = 0;
        while (searchIndex < search.length) {
          if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
            if (template[templateIndex] === "*") {
              starIndex = templateIndex;
              matchIndex = searchIndex;
              templateIndex++;
            } else {
              searchIndex++;
              templateIndex++;
            }
          } else if (starIndex !== -1) {
            templateIndex = starIndex + 1;
            matchIndex++;
            searchIndex = matchIndex;
          } else {
            return false;
          }
        }
        while (templateIndex < template.length && template[templateIndex] === "*") {
          templateIndex++;
        }
        return templateIndex === template.length;
      }
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      function enabled(name) {
        for (const skip of createDebug.skips) {
          if (matchesTemplate(name, skip)) {
            return false;
          }
        }
        for (const ns of createDebug.names) {
          if (matchesTemplate(name, ns)) {
            return true;
          }
        }
        return false;
      }
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    module2.exports = setup;
  }
});

// asset-input/packages/worker/node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "asset-input/packages/worker/node_modules/debug/src/browser.js"(exports2, module2) {
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = /* @__PURE__ */ (() => {
      let warned2 = false;
      return () => {
        if (!warned2) {
          warned2 = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports2.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module2.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug") || exports2.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  }
});

// asset-input/packages/worker/node_modules/has-flag/index.js
var require_has_flag = __commonJS({
  "asset-input/packages/worker/node_modules/has-flag/index.js"(exports2, module2) {
    "use strict";
    module2.exports = (flag, argv = process.argv) => {
      const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
      const position = argv.indexOf(prefix + flag);
      const terminatorPosition = argv.indexOf("--");
      return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
    };
  }
});

// asset-input/packages/worker/node_modules/supports-color/index.js
var require_supports_color = __commonJS({
  "asset-input/packages/worker/node_modules/supports-color/index.js"(exports2, module2) {
    "use strict";
    var os = require("os");
    var tty = require("tty");
    var hasFlag = require_has_flag();
    var { env } = process;
    var forceColor;
    if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
      forceColor = 0;
    } else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
      forceColor = 1;
    }
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        forceColor = 1;
      } else if (env.FORCE_COLOR === "false") {
        forceColor = 0;
      } else {
        forceColor = env.FORCE_COLOR.length === 0 ? 1 : Math.min(parseInt(env.FORCE_COLOR, 10), 3);
      }
    }
    function translateLevel(level) {
      if (level === 0) {
        return false;
      }
      return {
        level,
        hasBasic: true,
        has256: level >= 2,
        has16m: level >= 3
      };
    }
    function supportsColor(haveStream, streamIsTTY) {
      if (forceColor === 0) {
        return 0;
      }
      if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
        return 3;
      }
      if (hasFlag("color=256")) {
        return 2;
      }
      if (haveStream && !streamIsTTY && forceColor === void 0) {
        return 0;
      }
      const min = forceColor || 0;
      if (env.TERM === "dumb") {
        return min;
      }
      if (process.platform === "win32") {
        const osRelease = os.release().split(".");
        if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
          return Number(osRelease[2]) >= 14931 ? 3 : 2;
        }
        return 1;
      }
      if ("CI" in env) {
        if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
          return 1;
        }
        return min;
      }
      if ("TEAMCITY_VERSION" in env) {
        return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
      }
      if (env.COLORTERM === "truecolor") {
        return 3;
      }
      if ("TERM_PROGRAM" in env) {
        const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
        switch (env.TERM_PROGRAM) {
          case "iTerm.app":
            return version >= 3 ? 3 : 2;
          case "Apple_Terminal":
            return 2;
        }
      }
      if (/-256(color)?$/i.test(env.TERM)) {
        return 2;
      }
      if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
        return 1;
      }
      if ("COLORTERM" in env) {
        return 1;
      }
      return min;
    }
    function getSupportLevel(stream) {
      const level = supportsColor(stream, stream && stream.isTTY);
      return translateLevel(level);
    }
    module2.exports = {
      supportsColor: getSupportLevel,
      stdout: translateLevel(supportsColor(true, tty.isatty(1))),
      stderr: translateLevel(supportsColor(true, tty.isatty(2)))
    };
  }
});

// asset-input/packages/worker/node_modules/debug/src/node.js
var require_node = __commonJS({
  "asset-input/packages/worker/node_modules/debug/src/node.js"(exports2, module2) {
    var tty = require("tty");
    var util = require("util");
    exports2.init = init;
    exports2.log = log;
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.destroy = util.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports2.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = require_supports_color();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports2.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error) {
    }
    exports2.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports2.inspectOpts ? Boolean(exports2.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module2.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports2.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util.formatWithOptions(exports2.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug) {
      debug.inspectOpts = {};
      const keys = Object.keys(exports2.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug.inspectOpts[keys[i]] = exports2.inspectOpts[keys[i]];
      }
    }
    module2.exports = require_common()(exports2);
    var { formatters } = module2.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util.inspect(v, this.inspectOpts);
    };
  }
});

// asset-input/packages/worker/node_modules/debug/src/index.js
var require_src = __commonJS({
  "asset-input/packages/worker/node_modules/debug/src/index.js"(exports2, module2) {
    if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
      module2.exports = require_browser();
    } else {
      module2.exports = require_node();
    }
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/errors.js
var require_errors = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/errors.js"(exports2, module2) {
    "use strict";
    var OpenSearchClientError = class extends Error {
      constructor(message) {
        super(message);
        this.name = "OpenSearchClientError";
      }
    };
    var TimeoutError = class _TimeoutError extends OpenSearchClientError {
      constructor(message, meta) {
        super(message);
        Error.captureStackTrace(this, _TimeoutError);
        this.name = "TimeoutError";
        this.message = message || "Timeout Error";
        this.meta = meta;
      }
    };
    var ConnectionError = class _ConnectionError extends OpenSearchClientError {
      constructor(message, meta) {
        super(message);
        Error.captureStackTrace(this, _ConnectionError);
        this.name = "ConnectionError";
        this.message = message || "Connection Error";
        this.meta = meta;
      }
    };
    var NoLivingConnectionsError = class _NoLivingConnectionsError extends OpenSearchClientError {
      constructor(message, meta) {
        super(message);
        Error.captureStackTrace(this, _NoLivingConnectionsError);
        this.name = "NoLivingConnectionsError";
        this.message = message || "Given the configuration, the ConnectionPool was not able to find a usable Connection for this request.";
        this.meta = meta;
      }
    };
    var SerializationError = class _SerializationError extends OpenSearchClientError {
      constructor(message, data) {
        super(message);
        Error.captureStackTrace(this, _SerializationError);
        this.name = "SerializationError";
        this.message = message || "Serialization Error";
        this.data = data;
      }
    };
    var DeserializationError = class _DeserializationError extends OpenSearchClientError {
      constructor(message, data) {
        super(message);
        Error.captureStackTrace(this, _DeserializationError);
        this.name = "DeserializationError";
        this.message = message || "Deserialization Error";
        this.data = data;
      }
    };
    var ConfigurationError = class _ConfigurationError extends OpenSearchClientError {
      constructor(message) {
        super(message);
        Error.captureStackTrace(this, _ConfigurationError);
        this.name = "ConfigurationError";
        this.message = message || "Configuration Error";
      }
    };
    var ResponseError = class _ResponseError extends OpenSearchClientError {
      constructor(meta) {
        super("Response Error");
        Error.captureStackTrace(this, _ResponseError);
        this.name = "ResponseError";
        if (meta.body && meta.body.error && meta.body.error.type) {
          if (Array.isArray(meta.body.error.root_cause)) {
            this.message = meta.body.error.type + ": ";
            this.message += meta.body.error.root_cause.map((entry) => `[${entry.type}] Reason: ${entry.reason}`).join("; ");
          } else {
            this.message = meta.body.error.type;
          }
        } else {
          this.message = "Response Error";
        }
        this.meta = meta;
      }
      get body() {
        return this.meta.body;
      }
      get statusCode() {
        if (this.meta.body && typeof this.meta.body.status === "number") {
          return this.meta.body.status;
        }
        return this.meta.statusCode;
      }
      get headers() {
        return this.meta.headers;
      }
      toString() {
        return JSON.stringify(this.meta.body);
      }
    };
    var RequestAbortedError = class _RequestAbortedError extends OpenSearchClientError {
      constructor(message, meta) {
        super(message);
        Error.captureStackTrace(this, _RequestAbortedError);
        this.name = "RequestAbortedError";
        this.message = message || "Request aborted";
        this.meta = meta;
      }
    };
    var NotCompatibleError = class _NotCompatibleError extends OpenSearchClientError {
      constructor(meta) {
        super("Not Compatible Error");
        Error.captureStackTrace(this, _NotCompatibleError);
        this.name = "NotCompatibleError";
        this.message = "The client noticed that the server is not a supported distribution";
        this.meta = meta;
      }
    };
    module2.exports = {
      OpenSearchClientError,
      TimeoutError,
      ConnectionError,
      NoLivingConnectionsError,
      SerializationError,
      DeserializationError,
      ConfigurationError,
      ResponseError,
      RequestAbortedError,
      NotCompatibleError
    };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/package.json
var require_package = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/package.json"(exports2, module2) {
    module2.exports = {
      name: "@opensearch-project/opensearch",
      description: "The official OpenSearch client for Node.js",
      main: "index.js",
      types: "index.d.ts",
      exports: {
        ".": {
          require: "./index.js",
          types: "./index.d.ts",
          import: "./index.mjs"
        },
        "./aws": "./lib/aws/index.js",
        "./aws-v3": "./lib/aws/index-v3.js",
        "./*": "./*"
      },
      typesVersions: {
        "*": {
          ".": [
            "index.d.ts"
          ],
          aws: [
            "./lib/aws/index.d.ts"
          ],
          "aws-v3": [
            "./lib/aws/index-v3.d.ts"
          ]
        }
      },
      files: [
        "api/",
        "lib/",
        "index.d.ts",
        "index.js",
        "index.mjs",
        "README.md",
        "LICENSE.txt"
      ],
      homepage: "https://www.opensearch.org/",
      version: "3.5.1",
      versionCanary: "7.10.0-canary.6",
      keywords: [
        "opensearch",
        "opensearchDashboards",
        "mapping",
        "REST",
        "search",
        "client",
        "index"
      ],
      scripts: {
        test: "npm run lint && tap test/{unit,acceptance}/{*,**/*,**/**/*}.test.js && npm run test:types",
        "test:unit": "tap test/unit/{*,**/*,**/**/*}.test.js",
        "test:acceptance": "tap test/acceptance/*.test.js",
        "test:integration": "node test/integration/index.js",
        "test:integration:helpers": "tap test/integration/helpers/*.test.js",
        "test:integration:helpers-secure": "tap test/integration/helpers-secure/*.test.js",
        "test:types": "tsd",
        "test:coverage-90": 'tap test/{unit,acceptance}/{*,**/*,**/**/*}.test.js --coverage --branches=90 --functions=90 --lines=90 --statements=90 --nyc-arg="--exclude=api"',
        "test:coverage-report": 'tap test/{unit,acceptance}/{*,**/*,**/**/*}.test.js --coverage --branches=90 --functions=90 --lines=90 --statements=90 --nyc-arg="--exclude=api" && nyc report --reporter=text-lcov > coverage.lcov',
        "test:coverage-ui": 'tap test/{unit,acceptance}/{*,**/*,**/**/*}.test.js --coverage --coverage-report=html --nyc-arg="--exclude=api"',
        lint: "eslint .",
        "lint:fix": "eslint . --fix",
        "license-checker": "license-checker --production --onlyAllow='MIT;Apache-2.0;Apache1.1;0BSD;ISC;BSD-3-Clause;BSD-2-Clause'",
        "build-esm": "npx gen-esm-wrapper . index.mjs && eslint --fix index.mjs"
      },
      author: "opensearch-project",
      "original-author": {
        name: "Spencer Alger",
        company: "Elasticsearch BV"
      },
      devDependencies: {
        "@aws-sdk/types": "^3.160.0",
        "@babel/eslint-parser": "^7.19.1",
        "@sinonjs/fake-timers": "github:sinonjs/fake-timers#0bfffc1",
        "@types/node": "^22.0.0",
        "convert-hrtime": "^5.0.0",
        "cross-zip": "^4.0.0",
        dedent: "^1.1.0",
        deepmerge: "^4.2.2",
        dezalgo: "^1.0.3",
        eslint: "^8.30.0",
        "eslint-config-prettier": "^9.0.0",
        "eslint-plugin-prettier": "^5.0.0",
        faker: "^5.5.3",
        "fast-deep-equal": "^3.1.3",
        "into-stream": "^6.0.0",
        "js-yaml": "^4.1.0",
        jsdoc: "^4.0.0",
        "license-checker": "^25.0.1",
        minimist: "^1.2.5",
        "node-fetch": "^3.2.10",
        ora: "^8.0.1",
        prettier: "^3.0.1",
        "pretty-hrtime": "^1.0.3",
        proxy: "^1.0.2",
        rimraf: "^6.0.1",
        semver: "^7.3.5",
        "simple-git": "^3.15.0",
        "simple-statistics": "^7.7.0",
        split2: "^4.1.0",
        stoppable: "^1.1.0",
        tap: "^16.3.0",
        tsd: "^0.27.0",
        workq: "^3.0.0",
        xmlbuilder2: "^3.0.2"
      },
      dependencies: {
        aws4: "^1.11.0",
        debug: "^4.3.1",
        hpagent: "^1.2.0",
        json11: "^2.0.0",
        ms: "^2.1.3",
        "secure-json-parse": "^2.4.0"
      },
      resolutions: {
        "**/strip-ansi": "^6.0.1"
      },
      license: "Apache-2.0",
      repository: {
        type: "git",
        url: "https://github.com/opensearch-project/opensearch-js.git"
      },
      bugs: {
        url: "https://github.com/opensearch-project/opensearch-js/issues"
      },
      engines: {
        node: ">=14",
        yarn: "^1.22.10"
      },
      tsd: {
        directory: "test/types"
      },
      tap: {
        ts: false,
        jsx: false,
        flow: false,
        coverage: false,
        "jobs-auto": true
      }
    };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Transport.js
var require_Transport = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Transport.js"(exports2, module2) {
    "use strict";
    var debug = require_src()("opensearch");
    var os = require("os");
    var { gzip, unzip, createGzip } = require("zlib");
    var buffer = require("buffer");
    var ms = require_ms();
    var { EventEmitter } = require("events");
    var {
      ConnectionError,
      RequestAbortedError,
      NoLivingConnectionsError,
      ResponseError,
      ConfigurationError
    } = require_errors();
    var noop = () => {
    };
    var compatibleCheckEmitter = new EventEmitter();
    var clientVersion = require_package().version;
    var userAgent = `opensearch-js/${clientVersion} (${os.platform()} ${os.release()}-${os.arch()}; Node.js ${process.version})`;
    var MAX_BUFFER_LENGTH = buffer.constants.MAX_LENGTH;
    var MAX_STRING_LENGTH = buffer.constants.MAX_STRING_LENGTH;
    var HEAP_SIZE_LIMIT = require("v8").getHeapStatistics().heap_size_limit;
    var kCompatibleCheck = Symbol("compatible check");
    var kApiVersioning = Symbol("api versioning");
    var Transport2 = class _Transport {
      constructor(opts) {
        if (typeof opts.compression === "string" && opts.compression !== "gzip") {
          throw new ConfigurationError(`Invalid compression: '${opts.compression}'`);
        }
        this.emit = opts.emit;
        this.connectionPool = opts.connectionPool;
        this.serializer = opts.serializer;
        this.maxRetries = opts.maxRetries;
        this.requestTimeout = toMs(opts.requestTimeout);
        this.suggestCompression = opts.suggestCompression === true;
        this.compression = opts.compression || false;
        this.context = opts.context || null;
        this.headers = Object.assign(
          {},
          { "user-agent": userAgent },
          opts.suggestCompression === true ? { "accept-encoding": "gzip,deflate" } : null,
          lowerCaseHeaders(opts.headers)
        );
        this.sniffInterval = opts.sniffInterval;
        this.sniffOnConnectionFault = opts.sniffOnConnectionFault;
        this.sniffEndpoint = opts.sniffEndpoint;
        this.generateRequestId = opts.generateRequestId || generateRequestId();
        this.name = opts.name;
        this.opaqueIdPrefix = opts.opaqueIdPrefix;
        this[kCompatibleCheck] = 0;
        this[kApiVersioning] = process.env.OPENSEARCH_CLIENT_APIVERSIONING === "true";
        this.memoryCircuitBreaker = opts.memoryCircuitBreaker;
        this.nodeFilter = opts.nodeFilter || defaultNodeFilter;
        if (typeof opts.nodeSelector === "function") {
          this.nodeSelector = opts.nodeSelector;
        } else if (opts.nodeSelector === "round-robin") {
          this.nodeSelector = roundRobinSelector();
        } else if (opts.nodeSelector === "random") {
          this.nodeSelector = randomSelector;
        } else {
          this.nodeSelector = roundRobinSelector();
        }
        this._sniffEnabled = typeof this.sniffInterval === "number";
        this._nextSniff = this._sniffEnabled ? Date.now() + this.sniffInterval : 0;
        this._isSniffing = false;
        this._auth = opts.auth;
        if (opts.sniffOnStart === true) {
          setTimeout(() => {
            this.sniff({ reason: _Transport.sniffReasons.SNIFF_ON_START });
          }, 10);
        }
      }
      /**
       * @param {Object} params
       * @param {string} params.method - HTTP Method (e.g. HEAD, GET, POST...)
       * @param {string} params.path - Relative URL path
       * @param {Object | string} [params.body] - Body of a standard request.
       * @param {Object[] | string} [params.bulkBody] - Body of a bulk request.
       * @param {Object[] | string} [params.querystring] - Querystring params.
       *
       * @param {Object} options
       * @param {number} [options.id] - Request ID
       * @param {Object} [options.context] - Object used for observability
       * @param {number} [options.maxRetries] - Max number of retries
       * @param {false | 'gzip'} [options.compression] - Request body compression, if any
       * @param {boolean} [options.asStream] - Whether to emit the response as stream
       * @param {number[]} [options.ignore] - Response's Error Status Codes to ignore
       * @param {Object} [options.headers] - Request headers
       * @param {Object | string} [options.querystring] - Request's query string
       * @param {number} [options.requestTimeout] - Max request timeout in milliseconds
       *
       * @param {function} callback - Callback that handles errors and response
       */
      request(params, options, callback) {
        options = options || {};
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        let p = null;
        if (callback === void 0) {
          let onFulfilled = null;
          let onRejected = null;
          p = new Promise((resolve, reject) => {
            onFulfilled = resolve;
            onRejected = reject;
          });
          callback = function callback2(err, result2) {
            err ? onRejected(err) : onFulfilled(result2);
          };
        }
        const meta = {
          context: null,
          request: {
            params: null,
            options: null,
            id: options.id || this.generateRequestId(params, options)
          },
          name: this.name,
          connection: null,
          attempts: 0,
          aborted: false
        };
        if (this.context != null && options.context != null) {
          meta.context = Object.assign({}, this.context, options.context);
        } else if (this.context != null) {
          meta.context = this.context;
        } else if (options.context != null) {
          meta.context = options.context;
        }
        const result = {
          body: null,
          statusCode: null,
          headers: null,
          meta
        };
        Object.defineProperty(result, "warnings", {
          get() {
            return this.headers && this.headers.warning ? this.headers.warning.split(/(?!\B"[^"]*),(?![^"]*"\B)/) : null;
          }
        });
        const maxRetries = isStream(params.body) || isStream(params.bulkBody) ? 0 : typeof options.maxRetries === "number" ? options.maxRetries : this.maxRetries;
        const compression = options.compression !== void 0 ? options.compression : this.compression;
        let request = { abort: noop };
        const transportReturn = {
          then(onFulfilled, onRejected) {
            if (p != null) {
              return p.then(onFulfilled, onRejected);
            }
          },
          catch(onRejected) {
            if (p != null) {
              return p.catch(onRejected);
            }
          },
          abort() {
            meta.aborted = true;
            request.abort();
            debug("Aborting request", params);
            return this;
          },
          finally(onFinally) {
            if (p != null) {
              return p.finally(onFinally);
            }
          }
        };
        const makeRequest = () => {
          if (meta.aborted === true) {
            return process.nextTick(callback, new RequestAbortedError(), result);
          }
          meta.connection = this.getConnection({ requestId: meta.request.id });
          if (meta.connection == null) {
            return process.nextTick(callback, new NoLivingConnectionsError(), result);
          }
          this.emit("request", null, result);
          request = meta.connection.request(params, onResponse);
        };
        const onConnectionError = (err) => {
          if (err.name !== "RequestAbortedError") {
            this.connectionPool.markDead(meta.connection);
            if (this.sniffOnConnectionFault === true) {
              this.sniff({
                reason: _Transport.sniffReasons.SNIFF_ON_CONNECTION_FAULT,
                requestId: meta.request.id
              });
            }
            if (meta.attempts < maxRetries) {
              meta.attempts++;
              debug(`Retrying request, there are still ${maxRetries - meta.attempts} attempts`, params);
              makeRequest();
              return;
            }
          }
          err.meta = result;
          this.emit("response", err, result);
          return callback(err, result);
        };
        const onResponse = (err, response) => {
          if (err !== null) {
            return onConnectionError(err);
          }
          result.statusCode = response.statusCode;
          result.headers = response.headers;
          if (options.asStream === true) {
            result.body = response;
            this.emit("response", null, result);
            callback(null, result);
            return;
          }
          const contentEncoding = (result.headers["content-encoding"] || "").toLowerCase();
          const isCompressed = contentEncoding.indexOf("gzip") > -1 || contentEncoding.indexOf("deflate") > -1;
          if (result.headers["content-length"] !== void 0) {
            const contentLength = Number(result.headers["content-length"]);
            if (isCompressed && contentLength > MAX_BUFFER_LENGTH) {
              response.destroy();
              return onConnectionError(
                new RequestAbortedError(
                  `The content length (${contentLength}) is bigger than the maximum allowed buffer (${MAX_BUFFER_LENGTH})`,
                  result
                )
              );
            } else if (contentLength > MAX_STRING_LENGTH) {
              response.destroy();
              return onConnectionError(
                new RequestAbortedError(
                  `The content length (${contentLength}) is bigger than the maximum allowed string (${MAX_STRING_LENGTH})`,
                  result
                )
              );
            } else if (shouldApplyCircuitBreaker(contentLength)) {
              response.destroy();
              return onConnectionError(
                new RequestAbortedError(
                  `The content length (${contentLength}) is bigger than the maximum allowed heap memory limit.`,
                  result
                )
              );
            }
          }
          let payload = isCompressed ? [] : "";
          const onData = isCompressed ? (chunk) => {
            payload.push(chunk);
          } : (chunk) => {
            payload += chunk;
          };
          const onEnd = (err2) => {
            response.removeListener("data", onData);
            response.removeListener("end", onEnd);
            response.removeListener("error", onEnd);
            response.removeListener("aborted", onAbort);
            if (err2) {
              return onConnectionError(new ConnectionError(err2.message));
            }
            if (isCompressed) {
              unzip(Buffer.concat(payload), onBody);
            } else {
              onBody(null, payload);
            }
          };
          const onAbort = () => {
            response.destroy();
            onEnd(new Error("Response aborted while reading the body"));
          };
          if (!isCompressed) {
            response.setEncoding("utf8");
          }
          this.emit("deserialization", null, result);
          response.on("data", onData);
          response.on("error", onEnd);
          response.on("end", onEnd);
          response.on("aborted", onAbort);
        };
        const shouldApplyCircuitBreaker = (contentLength) => {
          if (!this.memoryCircuitBreaker || !this.memoryCircuitBreaker.enabled) return false;
          const maxPercentage = validateMemoryPercentage(this.memoryCircuitBreaker.maxPercentage);
          const heapUsed = process.memoryUsage().heapUsed;
          return contentLength + heapUsed > HEAP_SIZE_LIMIT * maxPercentage;
        };
        const onBody = (err, payload) => {
          if (err) {
            this.emit("response", err, result);
            return callback(err, result);
          }
          if (Buffer.isBuffer(payload)) {
            payload = payload.toString();
          }
          const isHead = params.method === "HEAD";
          if (result.headers["content-type"] !== void 0 && (result.headers["content-type"].indexOf("application/json") > -1 || result.headers["content-type"].indexOf("application/vnd.opensearch+json") > -1) && isHead === false && payload !== "") {
            try {
              result.body = this.serializer.deserialize(payload);
            } catch (err2) {
              this.emit("response", err2, result);
              return callback(err2, result);
            }
          } else {
            result.body = isHead === true && result.statusCode < 400 ? true : payload;
          }
          const ignoreStatusCode = Array.isArray(options.ignore) && options.ignore.indexOf(result.statusCode) > -1 || isHead === true && result.statusCode === 404;
          if (ignoreStatusCode === false && (result.statusCode === 502 || result.statusCode === 503 || result.statusCode === 504)) {
            this.connectionPool.markDead(meta.connection);
            if (meta.attempts < maxRetries && result.statusCode !== 429) {
              meta.attempts++;
              debug(`Retrying request, there are still ${maxRetries - meta.attempts} attempts`, params);
              makeRequest();
              return;
            }
          } else {
            this.connectionPool.markAlive(meta.connection);
          }
          if (ignoreStatusCode === false && result.statusCode >= 400) {
            const error = new ResponseError(result);
            this.emit("response", error, result);
            callback(error, result);
          } else {
            if (isHead === true && result.statusCode === 404) {
              result.body = false;
            }
            this.emit("response", null, result);
            callback(null, result);
          }
        };
        const prepareRequest = () => {
          this.emit("serialization", null, result);
          const headers = Object.assign({}, this.headers, lowerCaseHeaders(options.headers));
          if (options.opaqueId !== void 0) {
            headers["x-opaque-id"] = this.opaqueIdPrefix !== null ? this.opaqueIdPrefix + options.opaqueId : options.opaqueId;
          }
          if (params.body != null) {
            if (shouldSerialize(params.body) === true) {
              try {
                params.body = this.serializer.serialize(params.body);
              } catch (err) {
                this.emit("request", err, result);
                process.nextTick(callback, err, result);
                return transportReturn;
              }
            }
            if (params.body !== "") {
              headers["content-type"] = headers["content-type"] || (this[kApiVersioning] ? "application/vnd.opensearch+json; compatible-with=7" : "application/json");
            }
          } else if (params.bulkBody != null) {
            if (shouldSerialize(params.bulkBody) === true) {
              try {
                params.body = this.serializer.ndserialize(params.bulkBody);
              } catch (err) {
                this.emit("request", err, result);
                process.nextTick(callback, err, result);
                return transportReturn;
              }
            } else {
              params.body = params.bulkBody;
            }
            if (params.body !== "") {
              headers["content-type"] = headers["content-type"] || (this[kApiVersioning] ? "application/vnd.opensearch+x-ndjson; compatible-with=7" : "application/x-ndjson");
            }
          }
          params.headers = headers;
          if (options.querystring == null) {
            params.querystring = this.serializer.qserialize(params.querystring);
          } else {
            params.querystring = this.serializer.qserialize(
              Object.assign({}, params.querystring, options.querystring)
            );
          }
          if (this._auth !== null && typeof this._auth === "object" && "credentials" in this._auth) {
            params.auth = this._auth;
          }
          params.timeout = toMs(options.requestTimeout || this.requestTimeout);
          if (options.asStream === true) params.asStream = true;
          meta.request.params = params;
          meta.request.options = options;
          if (params.body !== "" && params.body != null) {
            if (isStream(params.body) === true) {
              if (compression === "gzip") {
                params.headers["content-encoding"] = compression;
                params.body = params.body.pipe(createGzip());
              }
              makeRequest();
            } else if (compression === "gzip") {
              gzip(params.body, (err, buffer2) => {
                if (err) {
                  this.emit("request", err, result);
                  return callback(err, result);
                }
                params.headers["content-encoding"] = compression;
                params.headers["content-length"] = "" + Buffer.byteLength(buffer2);
                params.body = buffer2;
                makeRequest();
              });
            } else {
              params.headers["content-length"] = "" + Buffer.byteLength(params.body);
              makeRequest();
            }
          } else {
            makeRequest();
          }
        };
        prepareRequest();
        return transportReturn;
      }
      getConnection(opts) {
        const now = Date.now();
        if (this._sniffEnabled === true && now > this._nextSniff) {
          this.sniff({ reason: _Transport.sniffReasons.SNIFF_INTERVAL, requestId: opts.requestId });
        }
        return this.connectionPool.getConnection({
          filter: this.nodeFilter,
          selector: this.nodeSelector,
          requestId: opts.requestId,
          name: this.name,
          now
        });
      }
      sniff(opts, callback = noop) {
        if (this._isSniffing === true) return;
        this._isSniffing = true;
        debug("Started sniffing request");
        if (typeof opts === "function") {
          callback = opts;
          opts = { reason: _Transport.sniffReasons.DEFAULT };
        }
        const { reason } = opts;
        const request = {
          method: "GET",
          path: this.sniffEndpoint
        };
        this.request(request, { id: opts.requestId }, (err, result) => {
          this._isSniffing = false;
          if (this._sniffEnabled === true) {
            this._nextSniff = Date.now() + this.sniffInterval;
          }
          if (err != null) {
            debug("Sniffing errored", err);
            result.meta.sniff = { hosts: [], reason };
            this.emit("sniff", err, result);
            return callback(err);
          }
          debug("Sniffing ended successfully", result.body);
          const protocol = result.meta.connection.url.protocol || /* istanbul ignore next */
          "http:";
          const hosts = this.connectionPool.nodesToHost(result.body.nodes, protocol);
          this.connectionPool.update(hosts);
          result.meta.sniff = { hosts, reason };
          this.emit("sniff", null, result);
          callback(null, hosts);
        });
      }
      // checkCompatibleInfo validates whether the informations are compatible
      checkCompatibleInfo() {
        debug("Start compatible check");
        this[kCompatibleCheck] = 1;
        this.request(
          {
            method: "GET",
            path: "/"
          },
          (err, result) => {
            this[kCompatibleCheck] = 3;
            if (err) {
              debug("compatible check failed", err);
              if (err.statusCode === 401 || err.statusCode === 403) {
                this[kCompatibleCheck] = 2;
                process.emitWarning(
                  "The client is unable to verify the distribution due to security privileges on the server side. Some functionality may not be compatible if the server is running an unsupported product."
                );
                compatibleCheckEmitter.emit("compatible-check", true);
              } else {
                this[kCompatibleCheck] = 0;
                compatibleCheckEmitter.emit("compatible-check", false);
              }
            } else {
              debug("Checking OpenSearch version", result.body, result.headers);
              if (result.body.version == null || typeof result.body.version.number !== "string") {
                debug("Can't access OpenSearch version");
                return compatibleCheckEmitter.emit("compatible-check", false);
              }
              const distribution = result.body.version.distribution;
              const version = result.body.version.number.split(".");
              const major = Number(version[0]);
              if (distribution === "opensearch") {
                debug("Valid OpenSearch distribution");
                this[kCompatibleCheck] = 2;
                return compatibleCheckEmitter.emit("compatible-check", true);
              }
              if (major !== 7) {
                debug("Invalid distribution");
                return compatibleCheckEmitter.emit("compatible-check", false);
              }
              debug("Valid OpenSearch distribution");
              this[kCompatibleCheck] = 2;
              compatibleCheckEmitter.emit("compatible-check", true);
            }
          }
        );
      }
    };
    Transport2.sniffReasons = {
      SNIFF_ON_START: "sniff-on-start",
      SNIFF_INTERVAL: "sniff-interval",
      SNIFF_ON_CONNECTION_FAULT: "sniff-on-connection-fault",
      // TODO: find a better name
      DEFAULT: "default"
    };
    function toMs(time) {
      if (typeof time === "string") {
        return ms(time);
      }
      return time;
    }
    function shouldSerialize(obj) {
      return typeof obj !== "string" && typeof obj.pipe !== "function" && Buffer.isBuffer(obj) === false;
    }
    function isStream(obj) {
      return obj != null && typeof obj.pipe === "function";
    }
    function defaultNodeFilter(node) {
      if ((node.roles.cluster_manager === true || node.roles.master === true) && node.roles.data === false && node.roles.ingest === false) {
        return false;
      }
      return true;
    }
    function roundRobinSelector() {
      let current = -1;
      return function _roundRobinSelector(connections) {
        if (++current >= connections.length) {
          current = 0;
        }
        return connections[current];
      };
    }
    function randomSelector(connections) {
      const index = Math.floor(Math.random() * connections.length);
      return connections[index];
    }
    function generateRequestId() {
      const maxInt = 2147483647;
      let nextReqId = 0;
      return function genReqId() {
        return nextReqId = nextReqId + 1 & maxInt;
      };
    }
    function lowerCaseHeaders(oldHeaders) {
      if (oldHeaders == null) return oldHeaders;
      const newHeaders = {};
      for (const header in oldHeaders) {
        newHeaders[header.toLowerCase()] = oldHeaders[header];
      }
      return newHeaders;
    }
    function validateMemoryPercentage(percentage) {
      if (percentage < 0 || percentage > 1) return 1;
      return percentage;
    }
    module2.exports = Transport2;
    module2.exports.internals = {
      defaultNodeFilter,
      roundRobinSelector,
      randomSelector,
      generateRequestId,
      lowerCaseHeaders,
      toMs
    };
  }
});

// asset-input/packages/worker/node_modules/hpagent/index.js
var require_hpagent = __commonJS({
  "asset-input/packages/worker/node_modules/hpagent/index.js"(exports2, module2) {
    "use strict";
    var https = require("https");
    var http = require("http");
    var { URL } = require("url");
    var HttpProxyAgent = class extends http.Agent {
      constructor(options) {
        const { proxy, proxyRequestOptions, ...opts } = options;
        super(opts);
        this.proxy = typeof proxy === "string" ? new URL(proxy) : proxy;
        this.proxyRequestOptions = proxyRequestOptions || {};
      }
      createConnection(options, callback) {
        const requestOptions = {
          ...this.proxyRequestOptions,
          method: "CONNECT",
          host: this.proxy.hostname,
          port: this.proxy.port,
          path: `${options.host}:${options.port}`,
          setHost: false,
          headers: { ...this.proxyRequestOptions.headers, connection: this.keepAlive ? "keep-alive" : "close", host: `${options.host}:${options.port}` },
          agent: false,
          timeout: options.timeout || 0
        };
        if (this.proxy.username || this.proxy.password) {
          const base64 = Buffer.from(`${decodeURIComponent(this.proxy.username || "")}:${decodeURIComponent(this.proxy.password || "")}`).toString("base64");
          requestOptions.headers["proxy-authorization"] = `Basic ${base64}`;
        }
        if (this.proxy.protocol === "https:") {
          requestOptions.servername = this.proxy.hostname;
        }
        const request = (this.proxy.protocol === "http:" ? http : https).request(requestOptions);
        request.once("connect", (response, socket, head) => {
          request.removeAllListeners();
          socket.removeAllListeners();
          if (response.statusCode === 200) {
            callback(null, socket);
          } else {
            socket.destroy();
            callback(new Error(`Bad response: ${response.statusCode}`), null);
          }
        });
        request.once("timeout", () => {
          request.destroy(new Error("Proxy timeout"));
        });
        request.once("error", (err) => {
          request.removeAllListeners();
          callback(err, null);
        });
        request.end();
      }
    };
    var HttpsProxyAgent = class extends https.Agent {
      constructor(options) {
        const { proxy, proxyRequestOptions, ...opts } = options;
        super(opts);
        this.proxy = typeof proxy === "string" ? new URL(proxy) : proxy;
        this.proxyRequestOptions = proxyRequestOptions || {};
      }
      createConnection(options, callback) {
        const requestOptions = {
          ...this.proxyRequestOptions,
          method: "CONNECT",
          host: this.proxy.hostname,
          port: this.proxy.port,
          path: `${options.host}:${options.port}`,
          setHost: false,
          headers: { ...this.proxyRequestOptions.headers, connection: this.keepAlive ? "keep-alive" : "close", host: `${options.host}:${options.port}` },
          agent: false,
          timeout: options.timeout || 0
        };
        if (this.proxy.username || this.proxy.password) {
          const base64 = Buffer.from(`${decodeURIComponent(this.proxy.username || "")}:${decodeURIComponent(this.proxy.password || "")}`).toString("base64");
          requestOptions.headers["proxy-authorization"] = `Basic ${base64}`;
        }
        if (this.proxy.protocol === "https:") {
          requestOptions.servername = this.proxy.hostname;
        }
        const request = (this.proxy.protocol === "http:" ? http : https).request(requestOptions);
        request.once("connect", (response, socket, head) => {
          request.removeAllListeners();
          socket.removeAllListeners();
          if (response.statusCode === 200) {
            const secureSocket = super.createConnection({ ...options, socket });
            callback(null, secureSocket);
          } else {
            socket.destroy();
            callback(new Error(`Bad response: ${response.statusCode}`), null);
          }
        });
        request.once("timeout", () => {
          request.destroy(new Error("Proxy timeout"));
        });
        request.once("error", (err) => {
          request.removeAllListeners();
          callback(err, null);
        });
        request.end();
      }
    };
    module2.exports = {
      HttpProxyAgent,
      HttpsProxyAgent
    };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Connection.js
var require_Connection = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Connection.js"(exports2, module2) {
    "use strict";
    var assert = require("assert");
    var { inspect } = require("util");
    var hpagent = require_hpagent();
    var http = require("http");
    var https = require("https");
    var debug = require_src()("opensearch");
    var { pipeline } = require("stream");
    var INVALID_PATH_REGEX = /[^\u0021-\u00ff]/;
    var {
      ConnectionError,
      RequestAbortedError,
      TimeoutError,
      ConfigurationError
    } = require_errors();
    var Connection2 = class _Connection {
      constructor(opts) {
        this.url = opts.url;
        this.ssl = opts.ssl || null;
        this.id = opts.id || stripAuth(opts.url.href);
        this.headers = prepareHeaders(opts.headers, opts.auth);
        this.deadCount = 0;
        this.resurrectTimeout = 0;
        this._openRequests = 0;
        this._status = opts.status || _Connection.statuses.ALIVE;
        this.roles = Object.assign({}, defaultRoles, opts.roles);
        if (!["http:", "https:"].includes(this.url.protocol)) {
          throw new ConfigurationError(`Invalid protocol: '${this.url.protocol}'`);
        }
        if (typeof opts.agent === "function") {
          this.agent = opts.agent(opts);
        } else if (opts.agent === false) {
          this.agent = void 0;
        } else {
          const agentOptions = Object.assign(
            {},
            {
              keepAlive: true,
              keepAliveMsecs: 1e3,
              maxSockets: 256,
              maxFreeSockets: 256,
              scheduling: "lifo"
            },
            opts.agent
          );
          if (opts.proxy) {
            agentOptions.proxy = opts.proxy;
            this.agent = this.url.protocol === "http:" ? new hpagent.HttpProxyAgent(agentOptions) : new hpagent.HttpsProxyAgent(Object.assign({}, agentOptions, this.ssl));
          } else {
            this.agent = this.url.protocol === "http:" ? new http.Agent(agentOptions) : new https.Agent(Object.assign({}, agentOptions, this.ssl));
          }
        }
        this.makeRequest = this.url.protocol === "http:" ? http.request : https.request;
      }
      request(params, callback) {
        this._openRequests++;
        let cleanedListeners = false;
        const requestParams = this.buildRequestObject(params);
        if (INVALID_PATH_REGEX.test(requestParams.path) === true) {
          callback(new TypeError(`ERR_UNESCAPED_CHARACTERS: ${requestParams.path}`), null);
          return { abort: () => {
          } };
        }
        debug("Starting a new request", params);
        const request = this.makeRequest(requestParams);
        const onResponse = (response) => {
          cleanListeners();
          this._openRequests--;
          callback(null, response);
        };
        const onTimeout = () => {
          cleanListeners();
          this._openRequests--;
          request.once("error", () => {
          });
          request.abort();
          callback(new TimeoutError("Request timed out", params), null);
        };
        const onError = (err) => {
          cleanListeners();
          this._openRequests--;
          callback(new ConnectionError(err.message), null);
        };
        const onAbort = () => {
          cleanListeners();
          request.once("error", () => {
          });
          debug("Request aborted", params);
          this._openRequests--;
          callback(new RequestAbortedError("Request aborted"), null);
        };
        request.on("response", onResponse);
        request.on("timeout", onTimeout);
        request.on("error", onError);
        request.on("abort", onAbort);
        request.setNoDelay(true);
        if (isStream(params.body) === true) {
          pipeline(params.body, request, (err) => {
            if (err != null && cleanedListeners === false) {
              cleanListeners();
              this._openRequests--;
              callback(err, null);
            }
          });
        } else {
          request.end(params.body);
        }
        return request;
        function cleanListeners() {
          request.removeListener("response", onResponse);
          request.removeListener("timeout", onTimeout);
          request.removeListener("error", onError);
          request.removeListener("abort", onAbort);
          cleanedListeners = true;
        }
      }
      // TODO: write a better closing logic
      close(callback = () => {
      }) {
        debug("Closing connection", this.id);
        if (this._openRequests > 0) {
          setTimeout(() => this.close(callback), 1e3);
        } else {
          if (this.agent !== void 0) {
            this.agent.destroy();
          }
          callback();
        }
      }
      setRole(role, enabled) {
        if (validRoles.indexOf(role) === -1) {
          throw new ConfigurationError(`Unsupported role: '${role}'`);
        }
        if (typeof enabled !== "boolean") {
          throw new ConfigurationError("enabled should be a boolean");
        }
        this.roles[role] = enabled;
        return this;
      }
      get status() {
        return this._status;
      }
      set status(status) {
        assert(~validStatuses.indexOf(status), `Unsupported status: '${status}'`);
        this._status = status;
      }
      buildRequestObject(params) {
        const url = this.url;
        const request = {
          protocol: url.protocol,
          hostname: url.hostname[0] === "[" ? url.hostname.slice(1, -1) : url.hostname,
          hash: url.hash,
          search: url.search,
          pathname: url.pathname,
          path: "",
          href: url.href,
          origin: url.origin,
          // https://github.com/elastic/elasticsearch-js/issues/843
          port: url.port !== "" ? url.port : void 0,
          headers: Object.assign({}, this.headers),
          agent: this.agent
        };
        const paramsKeys = Object.keys(params);
        for (let i = 0, len = paramsKeys.length; i < len; i++) {
          const key = paramsKeys[i];
          if (key === "path") {
            request.pathname = resolve(request.pathname, params[key]);
          } else if (key === "querystring" && !!params[key] === true) {
            if (request.search === "") {
              request.search = "?" + params[key];
            } else {
              request.search += "&" + params[key];
            }
          } else if (key === "headers") {
            request.headers = Object.assign({}, request.headers, params.headers);
          } else {
            request[key] = params[key];
          }
        }
        request.path = request.pathname + request.search;
        return request;
      }
      // Handles console.log and utils.inspect invocations.
      // We want to hide `auth`, `agent` and `ssl` since they made
      // the logs very hard to read. The user can still
      // access them with `instance.agent` and `instance.ssl`.
      [inspect.custom]() {
        const { authorization, ...headers } = this.headers;
        return {
          url: stripAuth(this.url.toString()),
          id: this.id,
          headers,
          deadCount: this.deadCount,
          resurrectTimeout: this.resurrectTimeout,
          _openRequests: this._openRequests,
          status: this.status,
          roles: this.roles
        };
      }
      toJSON() {
        const { authorization, ...headers } = this.headers;
        return {
          url: stripAuth(this.url.toString()),
          id: this.id,
          headers,
          deadCount: this.deadCount,
          resurrectTimeout: this.resurrectTimeout,
          _openRequests: this._openRequests,
          status: this.status,
          roles: this.roles
        };
      }
    };
    Connection2.statuses = {
      ALIVE: "alive",
      DEAD: "dead"
    };
    Connection2.roles = {
      CLUSTER_MANAGER: "cluster_manager",
      /**
       * @deprecated use CLUSTER_MANAGER instead
       */
      MASTER: "master",
      DATA: "data",
      INGEST: "ingest"
    };
    var defaultRoles = {
      [Connection2.roles.DATA]: true,
      [Connection2.roles.INGEST]: true
    };
    var validStatuses = Object.keys(Connection2.statuses).map((k) => Connection2.statuses[k]);
    var validRoles = Object.keys(Connection2.roles).map((k) => Connection2.roles[k]);
    function stripAuth(url) {
      if (url.indexOf("@") === -1) return url;
      return url.slice(0, url.indexOf("//") + 2) + url.slice(url.indexOf("@") + 1);
    }
    function isStream(obj) {
      return obj != null && typeof obj.pipe === "function";
    }
    function resolve(host, path) {
      const hostEndWithSlash = host[host.length - 1] === "/";
      const pathStartsWithSlash = path[0] === "/";
      if (hostEndWithSlash === true && pathStartsWithSlash === true) {
        return host + path.slice(1);
      } else if (hostEndWithSlash !== pathStartsWithSlash) {
        return host + path;
      } else {
        return host + "/" + path;
      }
    }
    function prepareHeaders(headers = {}, auth) {
      if (auth != null && headers.authorization == null) {
        if (auth.username && auth.password) {
          headers.authorization = "Basic " + Buffer.from(`${auth.username}:${auth.password}`).toString("base64");
        }
      }
      return headers;
    }
    module2.exports = Connection2;
    module2.exports.internals = { prepareHeaders };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/BaseConnectionPool.js
var require_BaseConnectionPool = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/BaseConnectionPool.js"(exports2, module2) {
    "use strict";
    var { URL } = require("url");
    var debug = require_src()("opensearch");
    var Connection2 = require_Connection();
    var { ConfigurationError } = require_errors();
    var noop = () => {
    };
    var BaseConnectionPool = class {
      constructor(opts) {
        this.connections = [];
        this.size = this.connections.length;
        this.Connection = opts.Connection;
        this.emit = opts.emit || noop;
        this.auth = opts.auth || null;
        this._ssl = opts.ssl;
        this._agent = opts.agent;
        this._proxy = opts.proxy || null;
      }
      getConnection() {
        throw new Error("getConnection must be implemented");
      }
      markAlive() {
        return this;
      }
      markDead() {
        return this;
      }
      /**
       * Creates a new connection instance.
       */
      createConnection(opts) {
        if (opts instanceof Connection2) {
          throw new ConfigurationError("The argument provided is already a Connection instance.");
        }
        if (typeof opts === "string") {
          opts = this.urlToHost(opts);
        }
        if (this.auth !== null) {
          opts.auth = this.auth;
        } else if (opts.url.username !== "" && opts.url.password !== "") {
          opts.auth = {
            username: decodeURIComponent(opts.url.username),
            password: decodeURIComponent(opts.url.password)
          };
        }
        if (opts.ssl == null) opts.ssl = this._ssl;
        if (opts.agent == null) opts.agent = this._agent;
        if (opts.proxy == null) opts.proxy = this._proxy;
        const connection = new this.Connection(opts);
        for (const conn of this.connections) {
          if (conn.id === connection.id) {
            throw new Error(`Connection with id '${connection.id}' is already present`);
          }
        }
        return connection;
      }
      /**
       * Adds a new connection to the pool.
       *
       * @param {object|string} host
       * @returns {ConnectionPool}
       */
      addConnection(opts) {
        if (Array.isArray(opts)) {
          opts.forEach((o) => this.addConnection(o));
          return;
        }
        if (typeof opts === "string") {
          opts = this.urlToHost(opts);
        }
        const connectionId = opts.id;
        const connectionUrl = opts.url.href;
        if (connectionId || connectionUrl) {
          const connectionById = this.connections.find((c) => c.id === connectionId);
          const connectionByUrl = this.connections.find((c) => c.id === connectionUrl);
          if (connectionById || connectionByUrl) {
            throw new ConfigurationError(
              `Connection with id '${connectionId || connectionUrl}' is already present`
            );
          }
        }
        this.update([...this.connections, opts]);
        return this.connections[this.size - 1];
      }
      /**
       * Removes a new connection to the pool.
       *
       * @param {object} connection
       * @returns {ConnectionPool}
       */
      removeConnection(connection) {
        debug("Removing connection", connection);
        return this.update(this.connections.filter((c) => c.id !== connection.id));
      }
      /**
       * Empties the connection pool.
       */
      empty(callback = noop) {
        debug("Emptying the connection pool");
        let openConnections = this.size;
        this.connections.forEach((connection) => {
          connection.close(() => {
            if (--openConnections === 0) {
              this.connections = [];
              this.size = this.connections.length;
              callback();
            }
          });
        });
      }
      /**
       * Update the ConnectionPool with new connections.
       *
       * @param {array} array of connections
       * @returns {ConnectionPool}
       */
      update(nodes) {
        debug("Updating the connection pool");
        const newConnections = [];
        const oldConnections = [];
        for (const node of nodes) {
          const connectionById = this.connections.find((c) => c.id === node.id);
          const connectionByUrl = this.connections.find((c) => c.id === node.url.href);
          if (connectionById) {
            debug(`The connection with id '${node.id}' is already present`);
            this.markAlive(connectionById);
            newConnections.push(connectionById);
          } else if (connectionByUrl) {
            connectionByUrl.id = node.id;
            this.markAlive(connectionByUrl);
            newConnections.push(connectionByUrl);
          } else {
            newConnections.push(this.createConnection(node));
          }
        }
        const ids = nodes.map((c) => c.id);
        for (const connection of this.connections) {
          if (ids.indexOf(connection.id) === -1) {
            oldConnections.push(connection);
          }
        }
        oldConnections.forEach((connection) => connection.close());
        this.connections = newConnections;
        this.size = this.connections.length;
        return this;
      }
      /**
       * Transforms the nodes objects to a host object.
       *
       * @param {object} nodes
       * @returns {array} hosts
       */
      nodesToHost(nodes, protocol) {
        const ids = Object.keys(nodes);
        const hosts = [];
        for (let i = 0, len = ids.length; i < len; i++) {
          const node = nodes[ids[i]];
          if (node.http === void 0) {
            continue;
          }
          let address = node.http.publish_address;
          const parts = address.split("/");
          if (parts.length > 1) {
            const hostname = parts[0];
            const port = parts[1].match(/((?::))(?:[0-9]+)$/g)[0].slice(1);
            address = `${hostname}:${port}`;
          }
          address = address.slice(0, 4) === "http" ? (
            /* istanbul ignore next */
            address
          ) : `${protocol}//${address}`;
          const roles = node.roles.reduce((acc, role) => {
            acc[role] = true;
            return acc;
          }, {});
          hosts.push({
            url: new URL(address),
            id: ids[i],
            roles: Object.assign(
              {
                [Connection2.roles.DATA]: false,
                [Connection2.roles.INGEST]: false
              },
              roles
            )
          });
        }
        return hosts;
      }
      /**
       * Transforms an url string to a host object
       *
       * @param {string} url
       * @returns {object} host
       */
      urlToHost(url) {
        return {
          url: new URL(url)
        };
      }
    };
    module2.exports = BaseConnectionPool;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/ConnectionPool.js
var require_ConnectionPool = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/ConnectionPool.js"(exports2, module2) {
    "use strict";
    var BaseConnectionPool = require_BaseConnectionPool();
    var assert = require("assert");
    var debug = require_src()("opensearch");
    var Connection2 = require_Connection();
    var noop = () => {
    };
    var ConnectionPool2 = class _ConnectionPool extends BaseConnectionPool {
      constructor(opts) {
        super(opts);
        this.dead = [];
        this.resurrectTimeout = 1e3 * 60;
        this.resurrectTimeoutCutoff = 5;
        this.pingTimeout = opts.pingTimeout;
        this._sniffEnabled = opts.sniffEnabled || false;
        const resurrectStrategy = opts.resurrectStrategy || "ping";
        this.resurrectStrategy = _ConnectionPool.resurrectStrategies[resurrectStrategy];
        assert(this.resurrectStrategy != null, `Invalid resurrection strategy: '${resurrectStrategy}'`);
      }
      /**
       * Marks a connection as 'alive'.
       * If needed removes the connection from the dead list
       * and then resets the `deadCount`.
       *
       * @param {object} connection
       */
      markAlive(connection) {
        const { id } = connection;
        debug(`Marking as 'alive' connection '${id}'`);
        const index = this.dead.indexOf(id);
        if (index > -1) this.dead.splice(index, 1);
        connection.status = Connection2.statuses.ALIVE;
        connection.deadCount = 0;
        connection.resurrectTimeout = 0;
        return this;
      }
      /**
       * Marks a connection as 'dead'.
       * If needed, adds the connection to the dead list
       * and then increments the `deadCount`.
       *
       * @param {object} connection
       */
      markDead(connection) {
        const { id } = connection;
        debug(`Marking as 'dead' connection '${id}'`);
        if (this.dead.indexOf(id) === -1) {
          for (let i = 0; i < this.size; i++) {
            if (this.connections[i].id === id) {
              this.dead.push(id);
              break;
            }
          }
        }
        connection.status = Connection2.statuses.DEAD;
        connection.deadCount++;
        connection.resurrectTimeout = Date.now() + this.resurrectTimeout * Math.pow(2, Math.min(connection.deadCount - 1, this.resurrectTimeoutCutoff));
        this.dead.sort((a, b) => {
          const conn1 = this.connections.find((c) => c.id === a);
          const conn2 = this.connections.find((c) => c.id === b);
          return conn1.resurrectTimeout - conn2.resurrectTimeout;
        });
        return this;
      }
      /**
       * If enabled, tries to resurrect a connection with the given
       * resurrect strategy ('ping', 'optimistic', 'none').
       *
       * @param {object} { now, requestId }
       * @param {function} callback (isAlive, connection)
       */
      resurrect(opts, callback = noop) {
        if (this.resurrectStrategy === 0 || this.dead.length === 0) {
          debug("Nothing to resurrect");
          callback(null, null);
          return;
        }
        const connection = this.connections.find((c) => c.id === this.dead[0]);
        if ((opts.now || Date.now()) < connection.resurrectTimeout) {
          debug("Nothing to resurrect");
          callback(null, null);
          return;
        }
        const { id } = connection;
        if (this.resurrectStrategy === 1) {
          connection.request(
            {
              method: "HEAD",
              path: "/",
              timeout: this.pingTimeout
            },
            (err, response) => {
              let isAlive = true;
              const statusCode = response !== null ? response.statusCode : 0;
              if (err != null || statusCode === 502 || statusCode === 503 || statusCode === 504) {
                debug(`Resurrect: connection '${id}' is still dead`);
                this.markDead(connection);
                isAlive = false;
              } else {
                debug(`Resurrect: connection '${id}' is now alive`);
                this.markAlive(connection);
              }
              this.emit("resurrect", null, {
                strategy: "ping",
                name: opts.name,
                request: { id: opts.requestId },
                isAlive,
                connection
              });
              callback(isAlive, connection);
            }
          );
        } else {
          debug(`Resurrect: optimistic resurrection for connection '${id}'`);
          this.dead.splice(this.dead.indexOf(id), 1);
          connection.status = Connection2.statuses.ALIVE;
          this.emit("resurrect", null, {
            strategy: "optimistic",
            name: opts.name,
            request: { id: opts.requestId },
            isAlive: true,
            connection
          });
          callback(true, connection);
        }
      }
      /**
       * Returns an alive connection if present,
       * otherwise returns a dead connection.
       * By default it filters the `cluster_manager` or `master` only nodes.
       * It uses the selector to choose which
       * connection return.
       *
       * @param {object} options (filter and selector)
       * @returns {object|null} connection
       */
      getConnection(opts = {}) {
        const filter = opts.filter || (() => true);
        const selector = opts.selector || ((c) => c[0]);
        this.resurrect({
          now: opts.now,
          requestId: opts.requestId,
          name: opts.name
        });
        const noAliveConnections = this.size === this.dead.length;
        const connections = [];
        for (let i = 0; i < this.size; i++) {
          const connection = this.connections[i];
          if (noAliveConnections || connection.status === Connection2.statuses.ALIVE) {
            if (filter(connection) === true) {
              connections.push(connection);
            }
          }
        }
        if (connections.length === 0) return null;
        return selector(connections);
      }
      /**
       * Empties the connection pool.
       *
       * @returns {ConnectionPool}
       */
      empty(callback = noop) {
        super.empty(() => {
          this.dead = [];
          callback();
        });
      }
      /**
       * Update the ConnectionPool with new connections.
       *
       * @param {array} array of connections
       * @returns {ConnectionPool}
       */
      update(connections) {
        super.update(connections);
        this.dead = [];
        return this;
      }
    };
    ConnectionPool2.resurrectStrategies = {
      none: 0,
      ping: 1,
      optimistic: 2
    };
    module2.exports = ConnectionPool2;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/CloudConnectionPool.js
var require_CloudConnectionPool = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/CloudConnectionPool.js"(exports2, module2) {
    "use strict";
    var BaseConnectionPool = require_BaseConnectionPool();
    var noop = () => {
    };
    var CloudConnectionPool = class extends BaseConnectionPool {
      constructor(opts) {
        super(opts);
        this.cloudConnection = null;
      }
      /**
       * Returns the only cloud connection.
       *
       * @returns {object} connection
       */
      getConnection() {
        return this.cloudConnection;
      }
      /**
       * Empties the connection pool.
       *
       */
      empty(callback = noop) {
        super.empty(() => {
          this.cloudConnection = null;
          callback();
        });
      }
      /**
       * Update the ConnectionPool with new connections.
       *
       * @param {array} array of connections
       * @returns {ConnectionPool}
       */
      update(connections) {
        super.update(connections);
        this.cloudConnection = this.connections[0];
        return this;
      }
    };
    module2.exports = CloudConnectionPool;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/index.js
var require_pool = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/pool/index.js"(exports2, module2) {
    "use strict";
    var BaseConnectionPool = require_BaseConnectionPool();
    var ConnectionPool2 = require_ConnectionPool();
    var CloudConnectionPool = require_CloudConnectionPool();
    module2.exports = {
      BaseConnectionPool,
      ConnectionPool: ConnectionPool2,
      CloudConnectionPool
    };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Helpers.js
var require_Helpers = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Helpers.js"(exports2, module2) {
    "use strict";
    var { Readable } = require("stream");
    var { promisify } = require("util");
    var { ResponseError, ConfigurationError } = require_errors();
    var pImmediate = promisify(setImmediate);
    var sleep = promisify(setTimeout);
    var kClient = Symbol("opensearch-client");
    var kMetaHeader = Symbol("meta header");
    var noop = () => {
    };
    var Helpers = class {
      constructor(opts) {
        this[kClient] = opts.client;
        this[kMetaHeader] = opts.metaHeader;
        this.maxRetries = opts.maxRetries;
      }
      /**
       * Runs a search operation. The only difference between client.search and this utility,
       * is that we are only returning the hits to the user and not the full OpenSearch response.
       * This helper automatically adds `filter_path=hits.hits._source` to the querystring,
       * as it will only need the documents source.
       * @param {object} params - The OpenSearch's search parameters.
       * @param {object} options - The client optional configuration for this request.
       * @return {array} The documents that matched the request.
       */
      async search(params, options) {
        appendFilterPath("hits.hits._source", params, true);
        const { body } = await this[kClient].search(params, options);
        if (body.hits && body.hits.hits) {
          return body.hits.hits.map((d) => d._source);
        }
        return [];
      }
      /**
       * Runs a scroll search operation. This function returns an async iterator, allowing
       * the user to use a for await loop to get all the results of a given search.
       * ```js
       * for await (const result of client.helpers.scrollSearch({ params })) {
       *   console.log(result)
       * }
       * ```
       * Each result represents the entire body of a single scroll search request,
       * if you just need to scroll the results, use scrollDocuments.
       * This function handles automatically retries on 429 status code.
       * @param {object} params - The OpenSearch's search parameters.
       * @param {object} options - The client optional configuration for this request.
       * @return {iterator} the async iterator
       */
      async *scrollSearch(params, options = {}) {
        if (this[kMetaHeader] !== null) {
          options.headers = options.headers || {};
        }
        const wait = options.wait || 5e3;
        const maxRetries = options.maxRetries || this.maxRetries;
        if (Array.isArray(options.ignore)) {
          options.ignore.push(429);
        } else {
          options.ignore = [429];
        }
        params.scroll = params.scroll || "1m";
        appendFilterPath("_scroll_id", params, false);
        let response = null;
        for (let i = 0; i <= maxRetries; i++) {
          response = await this[kClient].search(params, options);
          if (response.statusCode !== 429) break;
          await sleep(wait);
        }
        if (response.statusCode === 429) {
          throw new ResponseError(response);
        }
        let scroll_id = response.body._scroll_id;
        let stop = false;
        const clear = async () => {
          stop = true;
          await this[kClient].clearScroll({ body: { scroll_id } }, { ignore: [400], ...options });
        };
        while (response.body.hits && response.body.hits.hits.length > 0) {
          scroll_id = response.body._scroll_id;
          response.clear = clear;
          addDocumentsGetter(response);
          yield response;
          if (stop === true) {
            break;
          }
          for (let i = 0; i <= maxRetries; i++) {
            response = await this[kClient].scroll(
              {
                scroll: params.scroll,
                rest_total_hits_as_int: params.rest_total_hits_as_int || params.restTotalHitsAsInt,
                body: { scroll_id }
              },
              options
            );
            if (response.statusCode !== 429) break;
            await sleep(wait);
          }
          if (response.statusCode === 429) {
            throw new ResponseError(response);
          }
        }
        if (stop === false) {
          await clear();
        }
      }
      /**
       * Runs a scroll search operation. This function returns an async iterator, allowing
       * the user to use a for await loop to get all the documents of a given search.
       * ```js
       * for await (const document of client.helpers.scrollSearch({ params })) {
       *   console.log(document)
       * }
       * ```
       * Each document is what you will find by running a scrollSearch and iterating on the hits array.
       * This helper automatically adds `filter_path=hits.hits._source` to the querystring,
       * as it will only need the documents source.
       * @param {object} params - The OpenSearch's search parameters.
       * @param {object} options - The client optional configuration for this request.
       * @return {iterator} the async iterator
       */
      async *scrollDocuments(params, options) {
        appendFilterPath("hits.hits._source", params, true);
        for await (const { documents } of this.scrollSearch(params, options)) {
          for (const document2 of documents) {
            yield document2;
          }
        }
      }
      /**
       * Creates a msearch helper instance. Once you configure it, you can use the provided
       * `search` method to add new searches in the queue.
       * @param {object} options - The configuration of the msearch operations.
       * @param {object} reqOptions - The client optional configuration for this request.
       * @return {object} The possible operations to run.
       */
      msearch(options = {}, reqOptions = {}) {
        const client = this[kClient];
        const {
          operations = 5,
          concurrency = 5,
          flushInterval = 500,
          retries = this.maxRetries,
          wait = 5e3,
          ...msearchOptions
        } = options;
        let stopReading = false;
        let stopError = null;
        let timeoutRef = null;
        const operationsStream = new Readable({
          objectMode: true,
          read() {
          }
        });
        const p = iterate();
        const helper = {
          then(onFulfilled, onRejected) {
            return p.then(onFulfilled, onRejected);
          },
          catch(onRejected) {
            return p.catch(onRejected);
          },
          stop(error = null) {
            if (stopReading === true) return;
            stopReading = true;
            stopError = error;
            operationsStream.push(null);
          },
          // TODO: support abort a single search?
          // NOTE: the validation checks are synchronous and the callback/promise will
          //       be resolved in the same tick. We might want to fix this in the future.
          search(header, body, callback) {
            if (stopReading === true) {
              const error = stopError === null ? new ConfigurationError("The msearch processor has been stopped") : stopError;
              return callback ? callback(error, {}) : Promise.reject(error);
            }
            if (!(typeof header === "object" && header !== null && !Array.isArray(header))) {
              const error = new ConfigurationError("The header should be an object");
              return callback ? callback(error, {}) : Promise.reject(error);
            }
            if (!(typeof body === "object" && body !== null && !Array.isArray(body))) {
              const error = new ConfigurationError("The body should be an object");
              return callback ? callback(error, {}) : Promise.reject(error);
            }
            let promise = null;
            if (callback === void 0) {
              let onFulfilled = null;
              let onRejected = null;
              promise = new Promise((resolve, reject) => {
                onFulfilled = resolve;
                onRejected = reject;
              });
              callback = function callback2(err, result) {
                err ? onRejected(err) : onFulfilled(result);
              };
            }
            operationsStream.push([header, body, callback]);
            if (promise !== null) {
              return promise;
            }
          }
        };
        return helper;
        async function iterate() {
          const { semaphore, finish } = buildSemaphore();
          const msearchBody = [];
          const callbacks = [];
          let loadedOperations = 0;
          timeoutRef = setTimeout(onFlushTimeout, flushInterval);
          for await (const operation of operationsStream) {
            timeoutRef.refresh();
            loadedOperations += 1;
            msearchBody.push(operation[0], operation[1]);
            callbacks.push(operation[2]);
            if (loadedOperations >= operations) {
              const send = await semaphore();
              send(msearchBody.slice(), callbacks.slice());
              msearchBody.length = 0;
              callbacks.length = 0;
              loadedOperations = 0;
            }
          }
          clearTimeout(timeoutRef);
          if (loadedOperations > 0) {
            const send = await semaphore();
            send(msearchBody, callbacks);
          }
          await finish();
          if (stopError !== null) {
            throw stopError;
          }
          async function onFlushTimeout() {
            if (loadedOperations === 0) return;
            const msearchBodyCopy = msearchBody.slice();
            const callbacksCopy = callbacks.slice();
            msearchBody.length = 0;
            callbacks.length = 0;
            loadedOperations = 0;
            try {
              const send = await semaphore();
              send(msearchBodyCopy, callbacksCopy);
            } catch (err) {
              helper.stop(err);
            }
          }
        }
        function buildSemaphore() {
          let resolveSemaphore = null;
          let resolveFinish = null;
          let running = 0;
          return { semaphore, finish };
          function finish() {
            return new Promise((resolve) => {
              if (running === 0) {
                resolve();
              } else {
                resolveFinish = resolve;
              }
            });
          }
          function semaphore() {
            if (running < concurrency) {
              running += 1;
              return pImmediate(send);
            } else {
              return new Promise((resolve) => {
                resolveSemaphore = resolve;
              });
            }
          }
          function send(msearchBody, callbacks) {
            if (running > concurrency) {
              throw new Error("Max concurrency reached");
            }
            msearchOperation(msearchBody, callbacks, () => {
              running -= 1;
              if (resolveSemaphore) {
                running += 1;
                resolveSemaphore(send);
                resolveSemaphore = null;
              } else if (resolveFinish && running === 0) {
                resolveFinish();
              }
            });
          }
        }
        function msearchOperation(msearchBody, callbacks, done) {
          let retryCount = retries;
          tryMsearch(msearchBody, callbacks, retrySearch);
          function retrySearch(msearchBody2, callbacks2) {
            if (msearchBody2.length > 0 && retryCount > 0) {
              retryCount -= 1;
              setTimeout(tryMsearch, wait, msearchBody2, callbacks2, retrySearch);
              return;
            }
            done();
          }
          function tryMsearch(msearchBody2, callbacks2, done2) {
            client.msearch(
              Object.assign({}, msearchOptions, { body: msearchBody2 }),
              reqOptions,
              (err, results) => {
                const retryBody = [];
                const retryCallbacks = [];
                if (err) {
                  addDocumentsGetter(results);
                  for (const callback of callbacks2) {
                    callback(err, results);
                  }
                  return done2(retryBody, retryCallbacks);
                }
                const { responses } = results.body;
                for (let i = 0, len = responses.length; i < len; i++) {
                  const response = responses[i];
                  if (response.status === 429 && retryCount > 0) {
                    retryBody.push(msearchBody2[i * 2]);
                    retryBody.push(msearchBody2[i * 2 + 1]);
                    retryCallbacks.push(callbacks2[i]);
                    continue;
                  }
                  const result = { ...results, body: response };
                  addDocumentsGetter(result);
                  if (response.status >= 400) {
                    callbacks2[i](new ResponseError(result), result);
                  } else {
                    callbacks2[i](null, result);
                  }
                }
                done2(retryBody, retryCallbacks);
              }
            );
          }
        }
      }
      /**
       * Creates a bulk helper instance. Once you configure it, you can pick which operation
       * to execute with the given dataset, index, create, update, and delete.
       * @param {object} options - The configuration of the bulk operation.
       * @param {object} reqOptions - The client optional configuration for this request.
       * @return {object} The possible operations to run with the datasource.
       */
      bulk(options, reqOptions = {}) {
        const client = this[kClient];
        const { serializer } = client;
        if (this[kMetaHeader] !== null) {
          reqOptions.headers = reqOptions.headers || {};
        }
        const {
          datasource,
          onDocument,
          flushBytes = 5e6,
          flushInterval = 3e4,
          concurrency = 5,
          retries = this.maxRetries,
          wait = 5e3,
          onDrop = noop,
          refreshOnCompletion = false,
          ...bulkOptions
        } = options;
        if (datasource === void 0) {
          return Promise.reject(new ConfigurationError("bulk helper: the datasource is required"));
        }
        if (!(Array.isArray(datasource) || Buffer.isBuffer(datasource) || typeof datasource.pipe === "function" || datasource[Symbol.asyncIterator])) {
          return Promise.reject(
            new ConfigurationError(
              "bulk helper: the datasource must be an array or a buffer or a readable stream or an async generator"
            )
          );
        }
        if (onDocument === void 0) {
          return Promise.reject(
            new ConfigurationError("bulk helper: the onDocument callback is required")
          );
        }
        let shouldAbort = false;
        let timeoutRef = null;
        const stats = {
          total: 0,
          failed: 0,
          retry: 0,
          successful: 0,
          noop: 0,
          time: 0,
          bytes: 0,
          aborted: false
        };
        const p = iterate();
        const helper = {
          get stats() {
            return stats;
          },
          then(onFulfilled, onRejected) {
            return p.then(onFulfilled, onRejected);
          },
          catch(onRejected) {
            return p.catch(onRejected);
          },
          abort() {
            clearTimeout(timeoutRef);
            shouldAbort = true;
            stats.aborted = true;
            return this;
          }
        };
        return helper;
        async function iterate() {
          const { semaphore, finish } = buildSemaphore();
          const startTime = Date.now();
          const bulkBody = [];
          let actionBody = "";
          let payloadBody = "";
          let chunkBytes = 0;
          timeoutRef = setTimeout(onFlushTimeout, flushInterval);
          for await (const chunk of datasource) {
            if (shouldAbort === true) break;
            timeoutRef.refresh();
            const result = onDocument(chunk);
            const [action, payload] = Array.isArray(result) ? result : [result, chunk];
            const operation = Object.keys(action)[0];
            if (operation === "index" || operation === "create") {
              actionBody = serializer.serialize(action);
              payloadBody = typeof payload === "string" ? payload : serializer.serialize(payload);
              chunkBytes += Buffer.byteLength(actionBody) + Buffer.byteLength(payloadBody);
              bulkBody.push(actionBody, payloadBody);
            } else if (operation === "update") {
              actionBody = serializer.serialize(action);
              payloadBody = typeof chunk === "string" ? `{"doc":${chunk}}` : serializer.serialize({ doc: chunk, ...payload });
              chunkBytes += Buffer.byteLength(actionBody) + Buffer.byteLength(payloadBody);
              bulkBody.push(actionBody, payloadBody);
            } else if (operation === "delete") {
              actionBody = serializer.serialize(action);
              chunkBytes += Buffer.byteLength(actionBody);
              bulkBody.push(actionBody);
            } else {
              clearTimeout(timeoutRef);
              throw new ConfigurationError(`Bulk helper invalid action: '${operation}'`);
            }
            if (chunkBytes >= flushBytes) {
              stats.bytes += chunkBytes;
              const send = await semaphore();
              send(bulkBody.slice());
              bulkBody.length = 0;
              chunkBytes = 0;
            }
          }
          clearTimeout(timeoutRef);
          if (shouldAbort === false && chunkBytes > 0) {
            const send = await semaphore();
            stats.bytes += chunkBytes;
            send(bulkBody);
          }
          await finish();
          if (refreshOnCompletion) {
            await client.indices.refresh(
              {
                index: typeof refreshOnCompletion === "string" ? refreshOnCompletion : "_all"
              },
              reqOptions
            );
          }
          stats.time = Date.now() - startTime;
          stats.total = stats.successful + stats.failed;
          return stats;
          async function onFlushTimeout() {
            if (chunkBytes === 0) return;
            stats.bytes += chunkBytes;
            const bulkBodyCopy = bulkBody.slice();
            bulkBody.length = 0;
            chunkBytes = 0;
            try {
              const send = await semaphore();
              send(bulkBodyCopy);
            } catch (err) {
              helper.abort();
            }
          }
        }
        function buildSemaphore() {
          let resolveSemaphore = null;
          let resolveFinish = null;
          let rejectFinish = null;
          let error = null;
          let running = 0;
          return { semaphore, finish };
          function finish() {
            return new Promise((resolve, reject) => {
              if (running === 0) {
                if (error) {
                  reject(error);
                } else {
                  resolve();
                }
              } else {
                resolveFinish = resolve;
                rejectFinish = reject;
              }
            });
          }
          function semaphore() {
            if (running < concurrency) {
              running += 1;
              return pImmediate(send);
            } else {
              return new Promise((resolve) => {
                resolveSemaphore = resolve;
              });
            }
          }
          function send(bulkBody) {
            if (running > concurrency) {
              throw new Error("Max concurrency reached");
            }
            bulkOperation(bulkBody, (err) => {
              running -= 1;
              if (err) {
                shouldAbort = true;
                error = err;
              }
              if (resolveSemaphore) {
                running += 1;
                resolveSemaphore(send);
                resolveSemaphore = null;
              } else if (resolveFinish && running === 0) {
                if (error) {
                  rejectFinish(error);
                } else {
                  resolveFinish();
                }
              }
            });
          }
        }
        function bulkOperation(bulkBody, callback) {
          let retryCount = retries;
          let isRetrying = false;
          tryBulk(bulkBody, retryDocuments);
          function retryDocuments(err, bulkBody2) {
            if (err) return callback(err);
            if (shouldAbort === true) return callback();
            if (bulkBody2.length > 0) {
              if (retryCount > 0) {
                isRetrying = true;
                retryCount -= 1;
                stats.retry += bulkBody2.length;
                setTimeout(tryBulk, wait, bulkBody2, retryDocuments);
                return;
              }
              for (let i = 0, len = bulkBody2.length; i < len; i = i + 2) {
                const operation = Object.keys(serializer.deserialize(bulkBody2[i]))[0];
                onDrop({
                  status: 429,
                  error: null,
                  operation: serializer.deserialize(bulkBody2[i]),
                  document: operation !== "delete" ? serializer.deserialize(bulkBody2[i + 1]) : (
                    /* istanbul ignore next */
                    null
                  ),
                  retried: isRetrying
                });
                stats.failed += 1;
              }
            }
            callback();
          }
          function tryBulk(bulkBody2, callback2) {
            if (shouldAbort === true) return callback2(null, []);
            client.bulk(
              Object.assign({}, bulkOptions, { body: bulkBody2 }),
              reqOptions,
              (err, { body }) => {
                if (err) return callback2(err, null);
                if (body.errors === false) {
                  stats.successful += body.items.length;
                  for (const item of body.items) {
                    if (item.update && item.update.result === "noop") {
                      stats.noop++;
                    }
                  }
                  return callback2(null, []);
                }
                const retry = [];
                const { items } = body;
                for (let i = 0, len = items.length; i < len; i++) {
                  const action = items[i];
                  const operation = Object.keys(action)[0];
                  const { status } = action[operation];
                  const indexSlice = operation !== "delete" ? i * 2 : i;
                  if (status >= 400) {
                    if (status === 429) {
                      retry.push(bulkBody2[indexSlice]);
                      if (operation !== "delete") {
                        retry.push(bulkBody2[indexSlice + 1]);
                      }
                    } else {
                      onDrop({
                        status,
                        error: action[operation].error,
                        operation: serializer.deserialize(bulkBody2[indexSlice]),
                        document: operation !== "delete" ? serializer.deserialize(bulkBody2[indexSlice + 1]) : null,
                        retried: isRetrying
                      });
                      stats.failed += 1;
                    }
                  } else {
                    stats.successful += 1;
                  }
                }
                callback2(null, retry);
              }
            );
          }
        }
      }
    };
    function addDocumentsGetter(result) {
      Object.defineProperty(result, "documents", {
        get() {
          if (this.body.hits && this.body.hits.hits) {
            return this.body.hits.hits.map((d) => d._source);
          }
          return [];
        }
      });
    }
    function appendFilterPath(filter, params, force) {
      if (params.filter_path !== void 0) {
        params.filter_path += "," + filter;
      } else if (force === true) {
        params.filter_path = filter;
      }
    }
    module2.exports = Helpers;
  }
});

// asset-input/packages/worker/node_modules/secure-json-parse/index.js
var require_secure_json_parse = __commonJS({
  "asset-input/packages/worker/node_modules/secure-json-parse/index.js"(exports2, module2) {
    "use strict";
    var hasBuffer = typeof Buffer !== "undefined";
    var suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
    var suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
    function _parse(text, reviver, options) {
      if (options == null) {
        if (reviver !== null && typeof reviver === "object") {
          options = reviver;
          reviver = void 0;
        }
      }
      if (hasBuffer && Buffer.isBuffer(text)) {
        text = text.toString();
      }
      if (text && text.charCodeAt(0) === 65279) {
        text = text.slice(1);
      }
      const obj = JSON.parse(text, reviver);
      if (obj === null || typeof obj !== "object") {
        return obj;
      }
      const protoAction = options && options.protoAction || "error";
      const constructorAction = options && options.constructorAction || "error";
      if (protoAction === "ignore" && constructorAction === "ignore") {
        return obj;
      }
      if (protoAction !== "ignore" && constructorAction !== "ignore") {
        if (suspectProtoRx.test(text) === false && suspectConstructorRx.test(text) === false) {
          return obj;
        }
      } else if (protoAction !== "ignore" && constructorAction === "ignore") {
        if (suspectProtoRx.test(text) === false) {
          return obj;
        }
      } else {
        if (suspectConstructorRx.test(text) === false) {
          return obj;
        }
      }
      return filter(obj, { protoAction, constructorAction, safe: options && options.safe });
    }
    function filter(obj, { protoAction = "error", constructorAction = "error", safe } = {}) {
      let next = [obj];
      while (next.length) {
        const nodes = next;
        next = [];
        for (const node of nodes) {
          if (protoAction !== "ignore" && Object.prototype.hasOwnProperty.call(node, "__proto__")) {
            if (safe === true) {
              return null;
            } else if (protoAction === "error") {
              throw new SyntaxError("Object contains forbidden prototype property");
            }
            delete node.__proto__;
          }
          if (constructorAction !== "ignore" && Object.prototype.hasOwnProperty.call(node, "constructor") && Object.prototype.hasOwnProperty.call(node.constructor, "prototype")) {
            if (safe === true) {
              return null;
            } else if (constructorAction === "error") {
              throw new SyntaxError("Object contains forbidden prototype property");
            }
            delete node.constructor;
          }
          for (const key in node) {
            const value = node[key];
            if (value && typeof value === "object") {
              next.push(value);
            }
          }
        }
      }
      return obj;
    }
    function parse(text, reviver, options) {
      const stackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = 0;
      try {
        return _parse(text, reviver, options);
      } finally {
        Error.stackTraceLimit = stackTraceLimit;
      }
    }
    function safeParse(text, reviver) {
      const stackTraceLimit = Error.stackTraceLimit;
      Error.stackTraceLimit = 0;
      try {
        return _parse(text, reviver, { safe: true });
      } catch (_e) {
        return null;
      } finally {
        Error.stackTraceLimit = stackTraceLimit;
      }
    }
    module2.exports = parse;
    module2.exports.default = parse;
    module2.exports.parse = parse;
    module2.exports.safeParse = safeParse;
    module2.exports.scan = filter;
  }
});

// asset-input/packages/worker/node_modules/json11/dist/cjs/index.cjs
var require_cjs = __commonJS({
  "asset-input/packages/worker/node_modules/json11/dist/cjs/index.cjs"(exports2) {
    "use strict";
    Object.defineProperty(exports2, Symbol.toStringTag, { value: "Module" });
    var Space_Separator = /[\u1680\u2000-\u200A\u202F\u205F\u3000]/;
    var ID_Start = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF19]|\uD806[\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;
    var ID_Continue = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08E1\u08E3-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0AF9-\u0AFF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1C80-\u1C88\u1CD0-\u1CD2\u1CD4-\u1CF9\u1D00-\u1DF9\u1DFB-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312E\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEA\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA7AE\uA7B0-\uA7B7\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA8FD\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDCA-\uDDCC\uDDD0-\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC00-\uDC4A\uDC50-\uDC59\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDDD8-\uDDDD\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9\uDF00-\uDF19\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDCA0-\uDCE9\uDCFF\uDE00-\uDE3E\uDE47\uDE50-\uDE83\uDE86-\uDE99\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC40\uDC50-\uDC59\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFEC]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6\uDD00-\uDD4A\uDD50-\uDD59]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/;
    var unicode = { Space_Separator, ID_Start, ID_Continue };
    var isSpaceSeparator = (c) => {
      return typeof c === "string" && unicode.Space_Separator.test(c);
    };
    var isIdStartChar = (c) => {
      return typeof c === "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c === "$" || c === "_" || unicode.ID_Start.test(c));
    };
    var isIdContinueChar = (c) => {
      return typeof c === "string" && (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c === "$" || c === "_" || c === "\u200C" || c === "\u200D" || unicode.ID_Continue.test(c));
    };
    var isDigit = (c) => {
      return typeof c === "string" && /[0-9]/.test(c);
    };
    var isInteger = (s) => {
      return typeof s === "string" && !/[^0-9]/.test(s);
    };
    var isHex = (s) => {
      return typeof s === "string" && /0x[0-9a-f]+$/i.test(s);
    };
    var isHexDigit = (c) => {
      return typeof c === "string" && /[0-9a-f]/i.test(c);
    };
    function parse(text, reviver, options) {
      let source = String(text);
      let parseState = "start";
      let stack = [];
      let pos = 0;
      let line = 1;
      let column = 0;
      let token;
      let key;
      let root;
      let lexState;
      let buffer;
      let doubleQuote;
      let sign;
      let c;
      const lexStates = {
        default() {
          switch (c) {
            case "	":
            case "\v":
            case "\f":
            case " ":
            case "\xA0":
            case "\uFEFF":
            case "\n":
            case "\r":
            case "\u2028":
            case "\u2029":
              read();
              return;
            case "/":
              read();
              lexState = "comment";
              return;
            case void 0:
              read();
              return newToken("eof");
          }
          if (isSpaceSeparator(c)) {
            read();
            return;
          }
          return lexStates[parseState]();
        },
        comment() {
          switch (c) {
            case "*":
              read();
              lexState = "multiLineComment";
              return;
            case "/":
              read();
              lexState = "singleLineComment";
              return;
          }
          throw invalidChar(read());
        },
        multiLineComment() {
          switch (c) {
            case "*":
              read();
              lexState = "multiLineCommentAsterisk";
              return;
            case void 0:
              throw invalidChar(read());
          }
          read();
        },
        multiLineCommentAsterisk() {
          switch (c) {
            case "*":
              read();
              return;
            case "/":
              read();
              lexState = "default";
              return;
            case void 0:
              throw invalidChar(read());
          }
          read();
          lexState = "multiLineComment";
        },
        singleLineComment() {
          switch (c) {
            case "\n":
            case "\r":
            case "\u2028":
            case "\u2029":
              read();
              lexState = "default";
              return;
            case void 0:
              read();
              return newToken("eof");
          }
          read();
        },
        value() {
          switch (c) {
            case "{":
            case "[":
              return newToken("punctuator", read());
            case "n":
              read();
              literal("ull");
              return newToken("null", null);
            case "t":
              read();
              literal("rue");
              return newToken("boolean", true);
            case "f":
              read();
              literal("alse");
              return newToken("boolean", false);
            case "-":
            case "+":
              if (read() === "-") {
                sign = -1;
              }
              lexState = "sign";
              return;
            case ".":
              buffer = read();
              lexState = "decimalPointLeading";
              return;
            case "0":
              buffer = read();
              lexState = "zero";
              return;
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
              buffer = read();
              lexState = "decimalInteger";
              return;
            case "I":
              read();
              literal("nfinity");
              return newToken("numeric", Infinity);
            case "N":
              read();
              literal("aN");
              return newToken("numeric", NaN);
            case '"':
            case "'":
              doubleQuote = read() === '"';
              buffer = "";
              lexState = "string";
              return;
          }
          throw invalidChar(read());
        },
        identifierNameStartEscape() {
          if (c !== "u") {
            throw invalidChar(read());
          }
          read();
          const u = unicodeEscape();
          switch (u) {
            case "$":
            case "_":
              break;
            default:
              if (!isIdStartChar(u)) {
                throw invalidIdentifier();
              }
              break;
          }
          buffer += u;
          lexState = "identifierName";
        },
        identifierName() {
          switch (c) {
            case "$":
            case "_":
            case "\u200C":
            case "\u200D":
              buffer += read();
              return;
            case "\\":
              read();
              lexState = "identifierNameEscape";
              return;
          }
          if (isIdContinueChar(c)) {
            buffer += read();
            return;
          }
          return newToken("identifier", buffer);
        },
        identifierNameEscape() {
          if (c !== "u") {
            throw invalidChar(read());
          }
          read();
          const u = unicodeEscape();
          switch (u) {
            case "$":
            case "_":
            case "\u200C":
            case "\u200D":
              break;
            default:
              if (!isIdContinueChar(u)) {
                throw invalidIdentifier();
              }
              break;
          }
          buffer += u;
          lexState = "identifierName";
        },
        sign() {
          switch (c) {
            case ".":
              buffer = read();
              lexState = "decimalPointLeading";
              return;
            case "0":
              buffer = read();
              lexState = "zero";
              return;
            case "1":
            case "2":
            case "3":
            case "4":
            case "5":
            case "6":
            case "7":
            case "8":
            case "9":
              buffer = read();
              lexState = "decimalInteger";
              return;
            case "I":
              read();
              literal("nfinity");
              return newToken("numeric", sign * Infinity);
            case "N":
              read();
              literal("aN");
              return newToken("numeric", NaN);
          }
          throw invalidChar(read());
        },
        zero() {
          switch (c) {
            case ".":
              buffer += read();
              lexState = "decimalPoint";
              return;
            case "e":
            case "E":
              buffer += read();
              lexState = "decimalExponent";
              return;
            case "x":
            case "X":
              buffer += read();
              lexState = "hexadecimal";
              return;
            case "n":
              lexState = "bigInt";
              return;
          }
          return newToken("numeric", sign * 0);
        },
        decimalInteger() {
          switch (c) {
            case ".":
              buffer += read();
              lexState = "decimalPoint";
              return;
            case "e":
            case "E":
              buffer += read();
              lexState = "decimalExponent";
              return;
            case "n":
              lexState = "bigInt";
              return;
          }
          if (isDigit(c)) {
            buffer += read();
            return;
          }
          return newNumericToken(sign, buffer);
        },
        decimalPointLeading() {
          if (isDigit(c)) {
            buffer += read();
            lexState = "decimalFraction";
            return;
          }
          throw invalidChar(read());
        },
        decimalPoint() {
          switch (c) {
            case "e":
            case "E":
              buffer += read();
              lexState = "decimalExponent";
              return;
          }
          if (isDigit(c)) {
            buffer += read();
            lexState = "decimalFraction";
            return;
          }
          return newNumericToken(sign, buffer);
        },
        decimalFraction() {
          switch (c) {
            case "e":
            case "E":
              buffer += read();
              lexState = "decimalExponent";
              return;
          }
          if (isDigit(c)) {
            buffer += read();
            return;
          }
          return newNumericToken(sign, buffer);
        },
        decimalExponent() {
          switch (c) {
            case "+":
            case "-":
              buffer += read();
              lexState = "decimalExponentSign";
              return;
          }
          if (isDigit(c)) {
            buffer += read();
            lexState = "decimalExponentInteger";
            return;
          }
          throw invalidChar(read());
        },
        decimalExponentSign() {
          if (isDigit(c)) {
            buffer += read();
            lexState = "decimalExponentInteger";
            return;
          }
          throw invalidChar(read());
        },
        decimalExponentInteger() {
          if (isDigit(c)) {
            buffer += read();
            return;
          }
          return newNumericToken(sign, buffer);
        },
        bigInt() {
          if ((buffer == null ? void 0 : buffer.length) && (isInteger(buffer) || isHex(buffer))) {
            read();
            return newToken("bigint", BigInt(sign) * BigInt(buffer));
          }
          throw invalidChar(read());
        },
        hexadecimal() {
          if (isHexDigit(c)) {
            buffer += read();
            lexState = "hexadecimalInteger";
            return;
          }
          throw invalidChar(read());
        },
        hexadecimalInteger() {
          if (isHexDigit(c)) {
            buffer += read();
            return;
          }
          if (c === "n") {
            lexState = "bigInt";
            return;
          }
          return newNumericToken(sign, buffer);
        },
        string() {
          switch (c) {
            case "\\":
              read();
              buffer += escape();
              return;
            case '"':
              if (doubleQuote) {
                read();
                return newToken("string", buffer);
              }
              buffer += read();
              return;
            case "'":
              if (!doubleQuote) {
                read();
                return newToken("string", buffer);
              }
              buffer += read();
              return;
            case "\n":
            case "\r":
              throw invalidChar(read());
            case "\u2028":
            case "\u2029":
              separatorChar(c);
              break;
            case void 0:
              throw invalidChar(read());
          }
          buffer += read();
        },
        start() {
          switch (c) {
            case "{":
            case "[":
              return newToken("punctuator", read());
            case void 0:
              return newToken("eof");
          }
          lexState = "value";
        },
        beforePropertyName() {
          switch (c) {
            case "$":
            case "_":
              buffer = read();
              lexState = "identifierName";
              return;
            case "\\":
              read();
              lexState = "identifierNameStartEscape";
              return;
            case "}":
              return newToken("punctuator", read());
            case '"':
            case "'":
              doubleQuote = read() === '"';
              lexState = "string";
              return;
          }
          if (isIdStartChar(c)) {
            buffer += read();
            lexState = "identifierName";
            return;
          }
          throw invalidChar(read());
        },
        afterPropertyName() {
          if (c === ":") {
            return newToken("punctuator", read());
          }
          throw invalidChar(read());
        },
        beforePropertyValue() {
          lexState = "value";
        },
        afterPropertyValue() {
          switch (c) {
            case ",":
            case "}":
              return newToken("punctuator", read());
          }
          throw invalidChar(read());
        },
        beforeArrayValue() {
          if (c === "]") {
            return newToken("punctuator", read());
          }
          lexState = "value";
        },
        afterArrayValue() {
          switch (c) {
            case ",":
            case "]":
              return newToken("punctuator", read());
          }
          throw invalidChar(read());
        },
        end() {
          throw invalidChar(read());
        }
      };
      const parseStates = {
        start() {
          if (token.type === "eof") {
            throw invalidEOF();
          }
          push();
        },
        beforePropertyName() {
          switch (token.type) {
            case "identifier":
            case "string":
              key = token.value;
              parseState = "afterPropertyName";
              return;
            case "punctuator":
              pop();
              return;
            case "eof":
              throw invalidEOF();
          }
        },
        afterPropertyName() {
          if (token.type === "eof") {
            throw invalidEOF();
          }
          parseState = "beforePropertyValue";
        },
        beforePropertyValue() {
          if (token.type === "eof") {
            throw invalidEOF();
          }
          push();
        },
        beforeArrayValue() {
          if (token.type === "eof") {
            throw invalidEOF();
          }
          if (token.type === "punctuator" && token.value === "]") {
            pop();
            return;
          }
          push();
        },
        afterPropertyValue() {
          if (token.type === "eof") {
            throw invalidEOF();
          }
          switch (token.value) {
            case ",":
              parseState = "beforePropertyName";
              return;
            case "}":
              pop();
          }
        },
        afterArrayValue() {
          if (token.type === "eof") {
            throw invalidEOF();
          }
          switch (token.value) {
            case ",":
              parseState = "beforeArrayValue";
              return;
            case "]":
              pop();
          }
        },
        end() {
        }
      };
      do {
        token = lex();
        parseStates[parseState]();
      } while (token.type !== "eof");
      if (typeof reviver === "function") {
        return internalize({ "": root }, "", reviver);
      }
      return root;
      function internalize(holder, name, reviver2) {
        const value = holder[name];
        if (value != null && typeof value === "object") {
          if (Array.isArray(value)) {
            for (let i = 0; i < value.length; i++) {
              const key2 = String(i);
              const replacement = internalize(value, key2, reviver2);
              Object.defineProperty(value, key2, {
                value: replacement,
                writable: true,
                enumerable: true,
                configurable: true
              });
            }
          } else {
            for (const key2 in value) {
              const replacement = internalize(value, key2, reviver2);
              if (replacement === void 0) {
                delete value[key2];
              } else {
                Object.defineProperty(value, key2, {
                  value: replacement,
                  writable: true,
                  enumerable: true,
                  configurable: true
                });
              }
            }
          }
        }
        return reviver2.call(holder, name, value);
      }
      function lex() {
        lexState = "default";
        buffer = "";
        doubleQuote = false;
        sign = 1;
        for (; ; ) {
          c = peek();
          const token2 = lexStates[lexState]();
          if (token2) {
            return token2;
          }
        }
      }
      function peek() {
        if (source[pos]) {
          return String.fromCodePoint(source.codePointAt(pos));
        }
      }
      function read() {
        const c2 = peek();
        if (c2 === "\n") {
          line++;
          column = 0;
        } else if (c2) {
          column += c2.length;
        } else {
          column++;
        }
        if (c2) {
          pos += c2.length;
        }
        return c2;
      }
      function newToken(type, value) {
        return {
          type,
          value,
          line,
          column
        };
      }
      function newNumericToken(sign2, buffer2) {
        const num = sign2 * Number(buffer2);
        if (options == null ? void 0 : options.withLongNumerals) {
          if (num > Number.MAX_SAFE_INTEGER || num < Number.MIN_SAFE_INTEGER) {
            try {
              return newToken("bigint", BigInt(sign2) * BigInt(buffer2));
            } catch (ex) {
              console.warn(ex);
            }
          }
        }
        return newToken("numeric", num);
      }
      function literal(s) {
        for (const c2 of s) {
          const p = peek();
          if (p !== c2) {
            throw invalidChar(read());
          }
          read();
        }
      }
      function escape() {
        const c2 = peek();
        switch (c2) {
          case "b":
            read();
            return "\b";
          case "f":
            read();
            return "\f";
          case "n":
            read();
            return "\n";
          case "r":
            read();
            return "\r";
          case "t":
            read();
            return "	";
          case "v":
            read();
            return "\v";
          case "0":
            read();
            if (isDigit(peek())) {
              throw invalidChar(read());
            }
            return "\0";
          case "x":
            read();
            return hexEscape();
          case "u":
            read();
            return unicodeEscape();
          case "\n":
          case "\u2028":
          case "\u2029":
            read();
            return "";
          case "\r":
            read();
            if (peek() === "\n") {
              read();
            }
            return "";
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
            throw invalidChar(read());
          case void 0:
            throw invalidChar(read());
        }
        return read();
      }
      function hexEscape() {
        let buffer2 = "";
        let c2 = peek();
        if (!isHexDigit(c2)) {
          throw invalidChar(read());
        }
        buffer2 += read();
        c2 = peek();
        if (!isHexDigit(c2)) {
          throw invalidChar(read());
        }
        buffer2 += read();
        return String.fromCodePoint(parseInt(buffer2, 16));
      }
      function unicodeEscape() {
        let buffer2 = "";
        let count = 4;
        while (count-- > 0) {
          const c2 = peek();
          if (!isHexDigit(c2)) {
            throw invalidChar(read());
          }
          buffer2 += read();
        }
        return String.fromCodePoint(parseInt(buffer2, 16));
      }
      function push() {
        let value;
        switch (token.type) {
          case "punctuator":
            switch (token.value) {
              case "{":
                value = {};
                break;
              case "[":
                value = [];
                break;
            }
            break;
          case "null":
          case "boolean":
          case "numeric":
          case "string":
          case "bigint":
            value = token.value;
            break;
        }
        if (root === void 0) {
          root = value;
        } else {
          const parent = stack[stack.length - 1];
          if (Array.isArray(parent)) {
            parent.push(value);
          } else {
            Object.defineProperty(parent, key, {
              value,
              writable: true,
              enumerable: true,
              configurable: true
            });
          }
        }
        if (value !== null && typeof value === "object") {
          stack.push(value);
          if (Array.isArray(value)) {
            parseState = "beforeArrayValue";
          } else {
            parseState = "beforePropertyName";
          }
        } else {
          const current = stack[stack.length - 1];
          if (current == null) {
            parseState = "end";
          } else if (Array.isArray(current)) {
            parseState = "afterArrayValue";
          } else {
            parseState = "afterPropertyValue";
          }
        }
      }
      function pop() {
        stack.pop();
        const current = stack[stack.length - 1];
        if (current == null) {
          parseState = "end";
        } else if (Array.isArray(current)) {
          parseState = "afterArrayValue";
        } else {
          parseState = "afterPropertyValue";
        }
      }
      function invalidChar(c2) {
        if (c2 === void 0) {
          return syntaxError(`JSON11: invalid end of input at ${line}:${column}`);
        }
        return syntaxError(`JSON11: invalid character '${formatChar(c2)}' at ${line}:${column}`);
      }
      function invalidEOF() {
        return syntaxError(`JSON11: invalid end of input at ${line}:${column}`);
      }
      function invalidIdentifier() {
        column -= 5;
        return syntaxError(`JSON11: invalid identifier character at ${line}:${column}`);
      }
      function separatorChar(c2) {
        console.warn(`JSON11: '${formatChar(c2)}' in strings is not valid ECMAScript; consider escaping`);
      }
      function formatChar(c2) {
        const replacements = {
          "'": "\\'",
          '"': '\\"',
          "\\": "\\\\",
          "\b": "\\b",
          "\f": "\\f",
          "\n": "\\n",
          "\r": "\\r",
          "	": "\\t",
          "\v": "\\v",
          "\0": "\\0",
          "\u2028": "\\u2028",
          "\u2029": "\\u2029"
        };
        if (replacements[c2]) {
          return replacements[c2];
        }
        if (c2 < " ") {
          const hexString = c2.charCodeAt(0).toString(16);
          return "\\x" + ("00" + hexString).substring(hexString.length);
        }
        return c2;
      }
      function syntaxError(message) {
        const err = new SyntaxError(message);
        Object.defineProperty(err, "lineNumber", {
          value: line,
          writable: true,
          enumerable: true,
          configurable: true
        });
        Object.defineProperty(err, "columnNumber", {
          value: column,
          writable: true,
          enumerable: true,
          configurable: true
        });
        return err;
      }
    }
    function stringify(value, replacerOrAllowListOrOptions, space, options) {
      var _a, _b, _c, _d, _e;
      const stack = [];
      let indent = "";
      let propertyList;
      let replacer;
      let gap = "";
      let quote;
      let withBigInt;
      let withLegacyEscapes;
      let nameSerializer = serializeKey;
      let trailingComma = "";
      const quoteWeights = {
        "'": 0.1,
        '"': 0.2
      };
      if (
        // replacerOrAllowListOrOptions is StringifyOptions
        replacerOrAllowListOrOptions != null && typeof replacerOrAllowListOrOptions === "object" && !Array.isArray(replacerOrAllowListOrOptions)
      ) {
        gap = getGap(replacerOrAllowListOrOptions.space);
        if (replacerOrAllowListOrOptions.trailingComma) {
          trailingComma = ",";
        }
        quote = (_b = (_a = replacerOrAllowListOrOptions.quote) == null ? void 0 : _a.trim) == null ? void 0 : _b.call(_a);
        if (replacerOrAllowListOrOptions.quoteNames === true) {
          nameSerializer = quoteString;
        }
        if (typeof replacerOrAllowListOrOptions.replacer === "function") {
          replacer = replacerOrAllowListOrOptions.replacer;
        }
        withBigInt = replacerOrAllowListOrOptions.withBigInt;
        withLegacyEscapes = replacerOrAllowListOrOptions.withLegacyEscapes === true;
      } else {
        if (
          // replacerOrAllowListOrOptions is Replacer
          typeof replacerOrAllowListOrOptions === "function"
        ) {
          replacer = replacerOrAllowListOrOptions;
        } else if (
          // replacerOrAllowListOrOptions is AllowList
          Array.isArray(replacerOrAllowListOrOptions)
        ) {
          propertyList = [];
          const propertySet = /* @__PURE__ */ new Set();
          for (const v of replacerOrAllowListOrOptions) {
            const key = (_c = v == null ? void 0 : v.toString) == null ? void 0 : _c.call(v);
            if (key !== void 0) propertySet.add(key);
          }
          propertyList = [...propertySet];
        }
        gap = getGap(space);
        quote = (_e = (_d = options == null ? void 0 : options.quote) == null ? void 0 : _d.trim) == null ? void 0 : _e.call(_d);
        if ((options == null ? void 0 : options.quoteNames) === true) {
          nameSerializer = quoteString;
        }
        withBigInt = options == null ? void 0 : options.withBigInt;
        withLegacyEscapes = (options == null ? void 0 : options.withLegacyEscapes) === true;
        if (options == null ? void 0 : options.trailingComma) {
          trailingComma = ",";
        }
      }
      const quoteReplacements = {
        "'": "\\'",
        '"': '\\"',
        "\\": "\\\\",
        "\b": "\\b",
        "\f": "\\f",
        "\n": "\\n",
        "\r": "\\r",
        "	": "\\t",
        "\v": withLegacyEscapes ? "\\v" : "\\u000b",
        "\0": withLegacyEscapes ? "\\0" : "\\u0000",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029"
      };
      const quoteReplacementForNulFollowedByDigit = withLegacyEscapes ? "\\x00" : "\\u0000";
      return serializeProperty("", { "": value });
      function getGap(space2) {
        if (typeof space2 === "number" || space2 instanceof Number) {
          const num = Number(space2);
          if (isFinite(num) && num > 0) {
            return " ".repeat(Math.min(10, Math.floor(num)));
          }
        } else if (typeof space2 === "string" || space2 instanceof String) {
          return space2.substring(0, 10);
        }
        return "";
      }
      function serializeProperty(key, holder) {
        let value2 = holder[key];
        if (value2 != null) {
          if (typeof value2.toJSON11 === "function") {
            value2 = value2.toJSON11(key);
          } else if (typeof value2.toJSON5 === "function") {
            value2 = value2.toJSON5(key);
          } else if (typeof value2.toJSON === "function") {
            value2 = value2.toJSON(key);
          }
        }
        if (replacer) {
          value2 = replacer.call(holder, key, value2);
        }
        if (value2 instanceof Number) {
          value2 = Number(value2);
        } else if (value2 instanceof String) {
          value2 = String(value2);
        } else if (value2 instanceof Boolean) {
          value2 = value2.valueOf();
        }
        switch (value2) {
          case null:
            return "null";
          case true:
            return "true";
          case false:
            return "false";
        }
        if (typeof value2 === "string") {
          return quoteString(value2);
        }
        if (typeof value2 === "number") {
          return String(value2);
        }
        if (typeof value2 === "bigint") {
          return value2.toString() + (withBigInt === false ? "" : "n");
        }
        if (typeof value2 === "object") {
          return Array.isArray(value2) ? serializeArray(value2) : serializeObject(value2);
        }
        return void 0;
      }
      function quoteString(value2) {
        let product = "";
        for (let i = 0; i < value2.length; i++) {
          const c = value2[i];
          switch (c) {
            case "'":
            case '"':
              quoteWeights[c]++;
              product += c;
              continue;
            case "\0":
              if (isDigit(value2[i + 1])) {
                product += quoteReplacementForNulFollowedByDigit;
                continue;
              }
          }
          if (quoteReplacements[c]) {
            product += quoteReplacements[c];
            continue;
          }
          if (c < " ") {
            let hexString = c.charCodeAt(0).toString(16);
            product += withLegacyEscapes ? "\\x" + ("00" + hexString).substring(hexString.length) : "\\u" + hexString.padStart(4, "0");
            continue;
          }
          product += c;
        }
        const quoteChar = quote || Object.keys(quoteWeights).reduce((a, b) => quoteWeights[a] < quoteWeights[b] ? a : b);
        product = product.replace(new RegExp(quoteChar, "g"), quoteReplacements[quoteChar]);
        return quoteChar + product + quoteChar;
      }
      function serializeObject(value2) {
        if (stack.includes(value2)) {
          throw TypeError("Converting circular structure to JSON11");
        }
        stack.push(value2);
        let stepback = indent;
        indent = indent + gap;
        let keys = propertyList || Object.keys(value2);
        let partial = [];
        for (const key of keys) {
          const propertyString = serializeProperty(key, value2);
          if (propertyString !== void 0) {
            let member = nameSerializer(key) + ":";
            if (gap !== "") {
              member += " ";
            }
            member += propertyString;
            partial.push(member);
          }
        }
        let final;
        if (partial.length === 0) {
          final = "{}";
        } else {
          let properties;
          if (gap === "") {
            properties = partial.join(",");
            final = "{" + properties + "}";
          } else {
            properties = partial.join(",\n" + indent);
            final = "{\n" + indent + properties + trailingComma + "\n" + stepback + "}";
          }
        }
        stack.pop();
        indent = stepback;
        return final;
      }
      function serializeKey(key) {
        if (key.length === 0) {
          return quoteString(key);
        }
        const firstChar = String.fromCodePoint(key.codePointAt(0));
        if (!isIdStartChar(firstChar)) {
          return quoteString(key);
        }
        for (let i = firstChar.length; i < key.length; i++) {
          if (!isIdContinueChar(String.fromCodePoint(key.codePointAt(i)))) {
            return quoteString(key);
          }
        }
        return key;
      }
      function serializeArray(value2) {
        if (stack.includes(value2)) {
          throw TypeError("Converting circular structure to JSON11");
        }
        stack.push(value2);
        let stepback = indent;
        indent = indent + gap;
        let partial = [];
        for (let i = 0; i < value2.length; i++) {
          const propertyString = serializeProperty(String(i), value2);
          partial.push(propertyString !== void 0 ? propertyString : "null");
        }
        let final;
        if (partial.length === 0) {
          final = "[]";
        } else {
          if (gap === "") {
            let properties = partial.join(",");
            final = "[" + properties + "]";
          } else {
            let properties = partial.join(",\n" + indent);
            final = "[\n" + indent + properties + trailingComma + "\n" + stepback + "]";
          }
        }
        stack.pop();
        indent = stepback;
        return final;
      }
    }
    exports2.parse = parse;
    exports2.stringify = stringify;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Serializer.js
var require_Serializer = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Serializer.js"(exports2, module2) {
    "use strict";
    var { stringify } = require("querystring");
    var debug = require_src()("opensearch");
    var sjson = require_secure_json_parse();
    var { SerializationError, DeserializationError } = require_errors();
    var kJsonOptions = Symbol("secure json parse options");
    var JSON11 = require_cjs();
    var isBigIntSupported = typeof BigInt !== "undefined";
    var Serializer2 = class {
      constructor(opts = {}) {
        const disable = opts.disablePrototypePoisoningProtection;
        this[kJsonOptions] = {
          protoAction: disable === true || disable === "proto" ? "ignore" : "error",
          constructorAction: disable === true || disable === "constructor" ? "ignore" : "error",
          enableLongNumeralSupport: opts.enableLongNumeralSupport === true
        };
      }
      serialize(object) {
        debug("Serializing", object);
        let json;
        let numeralsAreNumbers = true;
        const checkForBigInts = (key, val) => {
          if (typeof val === "bigint") {
            numeralsAreNumbers = false;
            return Number(val);
          }
          return val;
        };
        const shouldHandleLongNumerals = isBigIntSupported && this[kJsonOptions].enableLongNumeralSupport;
        try {
          json = JSON.stringify(object, shouldHandleLongNumerals ? checkForBigInts : null);
          if (shouldHandleLongNumerals && !numeralsAreNumbers) {
            try {
              const temp = JSON11.stringify(object, {
                withBigInt: false,
                quote: '"',
                quoteNames: true
              });
              if (temp) json = temp;
            } catch (ex) {
            }
          }
        } catch (err) {
          throw new SerializationError(err.message, object);
        }
        return json;
      }
      deserialize(json) {
        debug("Deserializing", json);
        let object;
        let numeralsAreNumbers = true;
        const checkForLargeNumerals = (key, val) => {
          if (numeralsAreNumbers && typeof val === "number" && (val < Number.MIN_SAFE_INTEGER || val > Number.MAX_SAFE_INTEGER)) {
            numeralsAreNumbers = false;
          }
          return val;
        };
        const shouldHandleLongNumerals = isBigIntSupported && this[kJsonOptions].enableLongNumeralSupport;
        try {
          object = sjson.parse(
            json,
            shouldHandleLongNumerals ? checkForLargeNumerals : null,
            this[kJsonOptions]
          );
          if (shouldHandleLongNumerals && !numeralsAreNumbers) {
            try {
              const temp = JSON11.parse(json, null, { withLongNumerals: true });
              if (temp) {
                object = temp;
              }
            } catch (ex) {
            }
          }
        } catch (err) {
          throw new DeserializationError(err.message, json);
        }
        return object;
      }
      ndserialize(array) {
        debug("ndserialize", array);
        if (Array.isArray(array) === false) {
          throw new SerializationError("The argument provided is not an array", array);
        }
        let ndjson = "";
        for (let i = 0, len = array.length; i < len; i++) {
          if (typeof array[i] === "string") {
            ndjson += array[i] + "\n";
          } else {
            ndjson += this.serialize(array[i]) + "\n";
          }
        }
        return ndjson;
      }
      qserialize(object) {
        debug("qserialize", object);
        if (object == null) return "";
        if (typeof object === "string") return object;
        const keys = Object.keys(object);
        for (let i = 0, len = keys.length; i < len; i++) {
          const key = keys[i];
          if (object[key] === void 0) {
            delete object[key];
          } else if (Array.isArray(object[key]) === true) {
            object[key] = object[key].join(",");
          }
        }
        return stringify(object);
      }
    };
    module2.exports = Serializer2;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/utils.js
var require_utils = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/utils.js"(exports2, module2) {
    "use strict";
    var result = { body: null, statusCode: null, headers: null, warnings: null };
    var kConfigErr = Symbol("configuration error");
    function noop() {
    }
    function parsePathParam(param) {
      if (param == null || param === "") return null;
      return encodeURIComponent(param);
    }
    function handleMissingParam(param, apiModule, callback) {
      const err = new apiModule[kConfigErr]("Missing required parameter: " + param);
      if (callback) {
        process.nextTick(callback, err, result);
        return { then: noop, catch: noop, abort: noop };
      }
      return Promise.reject(err);
    }
    function normalizeArguments(params, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      if (typeof params === "function" || params == null) {
        callback = params;
        params = {};
        options = {};
      }
      return [params, options, callback];
    }
    function logMemoryUsage(context = "") {
      const memoryUsage = process.memoryUsage();
      console.log(`Memory usage: ${context}
    RSS: ${Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100} MB
    Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100} MB
    Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100} MB
    External: ${Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100} MB`);
    }
    module2.exports = {
      handleMissingParam,
      parsePathParam,
      normalizeArguments,
      noop,
      kConfigErr,
      logMemoryUsage
    };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/delete.js
var require_delete = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_asynchronous_search/" + id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/get.js
var require_get = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_asynchronous_search/" + id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/search.js
var require_search = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/search.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_asynchronous_search";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/stats.js
var require_stats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/stats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function statsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_asynchronous_search/stats";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/_api.js
var require_api = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/asynchronousSearch/_api.js"(exports2, module2) {
    "use strict";
    function AsynchronousSearchApi(bindObj) {
      this.delete = require_delete().bind(bindObj);
      this.get = require_get().bind(bindObj);
      this.search = require_search().bind(bindObj);
      this.stats = require_stats().bind(bindObj);
    }
    module2.exports = AsynchronousSearchApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/aliases.js
var require_aliases = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/aliases.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function aliasesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_cat/aliases", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = aliasesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/allocation.js
var require_allocation = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/allocation.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function allocationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, ...querystring } = params;
      node_id = parsePathParam(node_id);
      const path = ["/_cat/allocation", node_id].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = allocationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/allPitSegments.js
var require_allPitSegments = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/allPitSegments.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function allPitSegmentsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/pit_segments/_all";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = allPitSegmentsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/clusterManager.js
var require_clusterManager = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/clusterManager.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function clusterManagerFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/cluster_manager";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = clusterManagerFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/count.js
var require_count = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/count.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function countFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_cat/count", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = countFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/fielddata.js
var require_fielddata = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/fielddata.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function fielddataFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, fields, ...querystring } = params;
      fields = parsePathParam(fields);
      const path = ["/_cat/fielddata", fields].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = fielddataFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/health.js
var require_health = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/health.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function healthFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/health";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = healthFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/help.js
var require_help = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/help.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function helpFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = helpFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/indices.js
var require_indices = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/indices.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function indicesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_cat/indices", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = indicesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/master.js
var require_master = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/master.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function masterFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/master";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = masterFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/nodeattrs.js
var require_nodeattrs = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/nodeattrs.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function nodeattrsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/nodeattrs";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = nodeattrsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/nodes.js
var require_nodes = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/nodes.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function nodesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/nodes";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = nodesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/pendingTasks.js
var require_pendingTasks = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/pendingTasks.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function pendingTasksFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/pending_tasks";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = pendingTasksFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/pitSegments.js
var require_pitSegments = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/pitSegments.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function pitSegmentsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/pit_segments";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = pitSegmentsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/plugins.js
var require_plugins = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/plugins.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function pluginsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/plugins";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = pluginsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/recovery.js
var require_recovery = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/recovery.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function recoveryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_cat/recovery", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = recoveryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/repositories.js
var require_repositories = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/repositories.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function repositoriesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/repositories";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = repositoriesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/segmentReplication.js
var require_segmentReplication = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/segmentReplication.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function segmentReplicationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_cat/segment_replication", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = segmentReplicationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/segments.js
var require_segments = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/segments.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function segmentsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_cat/segments", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = segmentsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/shards.js
var require_shards = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/shards.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function shardsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_cat/shards", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = shardsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/snapshots.js
var require_snapshots = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/snapshots.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function snapshotsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, repository, ...querystring } = params;
      repository = parsePathParam(repository);
      const path = ["/_cat/snapshots", repository].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = snapshotsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/tasks.js
var require_tasks = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/tasks.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function tasksFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cat/tasks";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = tasksFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/templates.js
var require_templates = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/templates.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function templatesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_cat/templates", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = templatesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/threadPool.js
var require_threadPool = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/threadPool.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function threadPoolFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, thread_pool_patterns, ...querystring } = params;
      thread_pool_patterns = parsePathParam(thread_pool_patterns);
      const path = ["/_cat/thread_pool", thread_pool_patterns].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = threadPoolFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/_api.js
var require_api2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cat/_api.js"(exports2, module2) {
    "use strict";
    function CatApi(bindObj) {
      this.aliases = require_aliases().bind(bindObj);
      this.allocation = require_allocation().bind(bindObj);
      this.allPitSegments = require_allPitSegments().bind(bindObj);
      this.clusterManager = require_clusterManager().bind(bindObj);
      this.count = require_count().bind(bindObj);
      this.fielddata = require_fielddata().bind(bindObj);
      this.health = require_health().bind(bindObj);
      this.help = require_help().bind(bindObj);
      this.indices = require_indices().bind(bindObj);
      this.master = require_master().bind(bindObj);
      this.nodeattrs = require_nodeattrs().bind(bindObj);
      this.nodes = require_nodes().bind(bindObj);
      this.pendingTasks = require_pendingTasks().bind(bindObj);
      this.pitSegments = require_pitSegments().bind(bindObj);
      this.plugins = require_plugins().bind(bindObj);
      this.recovery = require_recovery().bind(bindObj);
      this.repositories = require_repositories().bind(bindObj);
      this.segmentReplication = require_segmentReplication().bind(bindObj);
      this.segments = require_segments().bind(bindObj);
      this.shards = require_shards().bind(bindObj);
      this.snapshots = require_snapshots().bind(bindObj);
      this.tasks = require_tasks().bind(bindObj);
      this.templates = require_templates().bind(bindObj);
      this.threadPool = require_threadPool().bind(bindObj);
      this.all_pit_segments = require_allPitSegments().bind(bindObj);
      this.cluster_manager = require_clusterManager().bind(bindObj);
      this.pending_tasks = require_pendingTasks().bind(bindObj);
      this.pit_segments = require_pitSegments().bind(bindObj);
      this.segment_replication = require_segmentReplication().bind(bindObj);
      this.thread_pool = require_threadPool().bind(bindObj);
    }
    module2.exports = CatApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/allocationExplain.js
var require_allocationExplain = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/allocationExplain.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function allocationExplainFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/allocation/explain";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = allocationExplainFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteComponentTemplate.js
var require_deleteComponentTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteComponentTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteComponentTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_component_template/" + name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteComponentTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteDecommissionAwareness.js
var require_deleteDecommissionAwareness = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteDecommissionAwareness.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function deleteDecommissionAwarenessFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/decommission/awareness";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteDecommissionAwarenessFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteVotingConfigExclusions.js
var require_deleteVotingConfigExclusions = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteVotingConfigExclusions.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function deleteVotingConfigExclusionsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/voting_config_exclusions";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteVotingConfigExclusionsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteWeightedRouting.js
var require_deleteWeightedRouting = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/deleteWeightedRouting.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function deleteWeightedRoutingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/routing/awareness/weights";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteWeightedRoutingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/existsComponentTemplate.js
var require_existsComponentTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/existsComponentTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsComponentTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_component_template/" + name;
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsComponentTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getComponentTemplate.js
var require_getComponentTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getComponentTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getComponentTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_component_template", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getComponentTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getDecommissionAwareness.js
var require_getDecommissionAwareness = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getDecommissionAwareness.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getDecommissionAwarenessFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.awareness_attribute_name == null) return handleMissingParam("awareness_attribute_name", this, callback);
      let { body, awareness_attribute_name, ...querystring } = params;
      awareness_attribute_name = parsePathParam(awareness_attribute_name);
      const path = "/_cluster/decommission/awareness/" + awareness_attribute_name + "/_status";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getDecommissionAwarenessFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getSettings.js
var require_getSettings = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getSettings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getSettingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/settings";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getSettingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getWeightedRouting.js
var require_getWeightedRouting = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/getWeightedRouting.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getWeightedRoutingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.attribute == null) return handleMissingParam("attribute", this, callback);
      let { body, attribute, ...querystring } = params;
      attribute = parsePathParam(attribute);
      const path = "/_cluster/routing/awareness/" + attribute + "/weights";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getWeightedRoutingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/health.js
var require_health2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/health.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function healthFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_cluster/health", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = healthFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/pendingTasks.js
var require_pendingTasks2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/pendingTasks.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function pendingTasksFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/pending_tasks";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = pendingTasksFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/postVotingConfigExclusions.js
var require_postVotingConfigExclusions = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/postVotingConfigExclusions.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function postVotingConfigExclusionsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/voting_config_exclusions";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = postVotingConfigExclusionsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putComponentTemplate.js
var require_putComponentTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putComponentTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putComponentTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_component_template/" + name;
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putComponentTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putDecommissionAwareness.js
var require_putDecommissionAwareness = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putDecommissionAwareness.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putDecommissionAwarenessFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.awareness_attribute_name == null) return handleMissingParam("awareness_attribute_name", this, callback);
      if (params.awareness_attribute_value == null) return handleMissingParam("awareness_attribute_value", this, callback);
      let { body, awareness_attribute_name, awareness_attribute_value, ...querystring } = params;
      awareness_attribute_name = parsePathParam(awareness_attribute_name);
      awareness_attribute_value = parsePathParam(awareness_attribute_value);
      const path = "/_cluster/decommission/awareness/" + awareness_attribute_name + "/" + awareness_attribute_value;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putDecommissionAwarenessFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putSettings.js
var require_putSettings = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putSettings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function putSettingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/settings";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putSettingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putWeightedRouting.js
var require_putWeightedRouting = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/putWeightedRouting.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putWeightedRoutingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.attribute == null) return handleMissingParam("attribute", this, callback);
      let { body, attribute, ...querystring } = params;
      attribute = parsePathParam(attribute);
      const path = "/_cluster/routing/awareness/" + attribute + "/weights";
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putWeightedRoutingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/remoteInfo.js
var require_remoteInfo = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/remoteInfo.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function remoteInfoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_remote/info";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = remoteInfoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/reroute.js
var require_reroute = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/reroute.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function rerouteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_cluster/reroute";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = rerouteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/state.js
var require_state = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/state.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function stateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, metric, index, ...querystring } = params;
      metric = parsePathParam(metric);
      index = parsePathParam(index);
      const path = ["/_cluster/state", metric, index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = stateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/stats.js
var require_stats2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/stats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function statsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index_metric, metric, node_id, ...querystring } = params;
      index_metric = parsePathParam(index_metric);
      metric = parsePathParam(metric);
      node_id = parsePathParam(node_id);
      let path;
      if (metric != null && index_metric != null && node_id != null) {
        path = "/_cluster/stats/" + metric + "/" + index_metric + "/nodes/" + node_id;
      } else if (metric != null && node_id != null) {
        path = "/_cluster/stats/" + metric + "/nodes/" + node_id;
      } else if (node_id != null) {
        path = "/_cluster/stats/nodes/" + node_id;
      } else {
        path = "/_cluster/stats";
      }
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/_api.js
var require_api3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/cluster/_api.js"(exports2, module2) {
    "use strict";
    function ClusterApi(bindObj) {
      this.allocationExplain = require_allocationExplain().bind(bindObj);
      this.deleteComponentTemplate = require_deleteComponentTemplate().bind(bindObj);
      this.deleteDecommissionAwareness = require_deleteDecommissionAwareness().bind(bindObj);
      this.deleteVotingConfigExclusions = require_deleteVotingConfigExclusions().bind(bindObj);
      this.deleteWeightedRouting = require_deleteWeightedRouting().bind(bindObj);
      this.existsComponentTemplate = require_existsComponentTemplate().bind(bindObj);
      this.getComponentTemplate = require_getComponentTemplate().bind(bindObj);
      this.getDecommissionAwareness = require_getDecommissionAwareness().bind(bindObj);
      this.getSettings = require_getSettings().bind(bindObj);
      this.getWeightedRouting = require_getWeightedRouting().bind(bindObj);
      this.health = require_health2().bind(bindObj);
      this.pendingTasks = require_pendingTasks2().bind(bindObj);
      this.postVotingConfigExclusions = require_postVotingConfigExclusions().bind(bindObj);
      this.putComponentTemplate = require_putComponentTemplate().bind(bindObj);
      this.putDecommissionAwareness = require_putDecommissionAwareness().bind(bindObj);
      this.putSettings = require_putSettings().bind(bindObj);
      this.putWeightedRouting = require_putWeightedRouting().bind(bindObj);
      this.remoteInfo = require_remoteInfo().bind(bindObj);
      this.reroute = require_reroute().bind(bindObj);
      this.state = require_state().bind(bindObj);
      this.stats = require_stats2().bind(bindObj);
      this.allocation_explain = require_allocationExplain().bind(bindObj);
      this.delete_component_template = require_deleteComponentTemplate().bind(bindObj);
      this.delete_decommission_awareness = require_deleteDecommissionAwareness().bind(bindObj);
      this.delete_voting_config_exclusions = require_deleteVotingConfigExclusions().bind(bindObj);
      this.delete_weighted_routing = require_deleteWeightedRouting().bind(bindObj);
      this.exists_component_template = require_existsComponentTemplate().bind(bindObj);
      this.get_component_template = require_getComponentTemplate().bind(bindObj);
      this.get_decommission_awareness = require_getDecommissionAwareness().bind(bindObj);
      this.get_settings = require_getSettings().bind(bindObj);
      this.get_weighted_routing = require_getWeightedRouting().bind(bindObj);
      this.pending_tasks = require_pendingTasks2().bind(bindObj);
      this.post_voting_config_exclusions = require_postVotingConfigExclusions().bind(bindObj);
      this.put_component_template = require_putComponentTemplate().bind(bindObj);
      this.put_decommission_awareness = require_putDecommissionAwareness().bind(bindObj);
      this.put_settings = require_putSettings().bind(bindObj);
      this.put_weighted_routing = require_putWeightedRouting().bind(bindObj);
      this.remote_info = require_remoteInfo().bind(bindObj);
    }
    module2.exports = ClusterApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/deleteDanglingIndex.js
var require_deleteDanglingIndex = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/deleteDanglingIndex.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteDanglingIndexFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.accept_data_loss == null) return handleMissingParam("accept_data_loss", this, callback);
      if (params.index_uuid == null) return handleMissingParam("index_uuid", this, callback);
      let { body, index_uuid, ...querystring } = params;
      index_uuid = parsePathParam(index_uuid);
      const path = "/_dangling/" + index_uuid;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteDanglingIndexFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/importDanglingIndex.js
var require_importDanglingIndex = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/importDanglingIndex.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function importDanglingIndexFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.accept_data_loss == null) return handleMissingParam("accept_data_loss", this, callback);
      if (params.index_uuid == null) return handleMissingParam("index_uuid", this, callback);
      let { body, index_uuid, ...querystring } = params;
      index_uuid = parsePathParam(index_uuid);
      const path = "/_dangling/" + index_uuid;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = importDanglingIndexFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/listDanglingIndices.js
var require_listDanglingIndices = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/listDanglingIndices.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function listDanglingIndicesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_dangling";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = listDanglingIndicesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/_api.js
var require_api4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/danglingIndices/_api.js"(exports2, module2) {
    "use strict";
    function DanglingIndicesApi(bindObj) {
      this.deleteDanglingIndex = require_deleteDanglingIndex().bind(bindObj);
      this.importDanglingIndex = require_importDanglingIndex().bind(bindObj);
      this.listDanglingIndices = require_listDanglingIndices().bind(bindObj);
      this.delete_dangling_index = require_deleteDanglingIndex().bind(bindObj);
      this.import_dangling_index = require_importDanglingIndex().bind(bindObj);
      this.list_dangling_indices = require_listDanglingIndices().bind(bindObj);
    }
    module2.exports = DanglingIndicesApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/create.js
var require_create = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/create.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function createFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_flow_framework/workflow";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/delete.js
var require_delete2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.workflow_id == null) return handleMissingParam("workflow_id", this, callback);
      let { body, workflow_id, ...querystring } = params;
      workflow_id = parsePathParam(workflow_id);
      const path = "/_plugins/_flow_framework/workflow/" + workflow_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/deprovision.js
var require_deprovision = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/deprovision.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deprovisionFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.workflow_id == null) return handleMissingParam("workflow_id", this, callback);
      let { body, workflow_id, ...querystring } = params;
      workflow_id = parsePathParam(workflow_id);
      const path = "/_plugins/_flow_framework/workflow/" + workflow_id + "/_deprovision";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deprovisionFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/get.js
var require_get2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.workflow_id == null) return handleMissingParam("workflow_id", this, callback);
      let { body, workflow_id, ...querystring } = params;
      workflow_id = parsePathParam(workflow_id);
      const path = "/_plugins/_flow_framework/workflow/" + workflow_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/getStatus.js
var require_getStatus = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/getStatus.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getStatusFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.workflow_id == null) return handleMissingParam("workflow_id", this, callback);
      let { body, workflow_id, ...querystring } = params;
      workflow_id = parsePathParam(workflow_id);
      const path = "/_plugins/_flow_framework/workflow/" + workflow_id + "/_status";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getStatusFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/getSteps.js
var require_getSteps = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/getSteps.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getStepsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_flow_framework/workflow/_steps";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getStepsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/provision.js
var require_provision = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/provision.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function provisionFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.workflow_id == null) return handleMissingParam("workflow_id", this, callback);
      let { body, workflow_id, ...querystring } = params;
      workflow_id = parsePathParam(workflow_id);
      const path = "/_plugins/_flow_framework/workflow/" + workflow_id + "/_provision";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = provisionFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/search.js
var require_search2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/search.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function searchFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_flow_framework/workflow/_search";
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/searchState.js
var require_searchState = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/searchState.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function searchStateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_flow_framework/workflow/state/_search";
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchStateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/update.js
var require_update = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/update.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.workflow_id == null) return handleMissingParam("workflow_id", this, callback);
      let { body, workflow_id, ...querystring } = params;
      workflow_id = parsePathParam(workflow_id);
      const path = "/_plugins/_flow_framework/workflow/" + workflow_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/_api.js
var require_api5 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/flowFramework/_api.js"(exports2, module2) {
    "use strict";
    function FlowFrameworkApi(bindObj) {
      this.create = require_create().bind(bindObj);
      this.delete = require_delete2().bind(bindObj);
      this.deprovision = require_deprovision().bind(bindObj);
      this.get = require_get2().bind(bindObj);
      this.getStatus = require_getStatus().bind(bindObj);
      this.getSteps = require_getSteps().bind(bindObj);
      this.provision = require_provision().bind(bindObj);
      this.search = require_search2().bind(bindObj);
      this.searchState = require_searchState().bind(bindObj);
      this.update = require_update().bind(bindObj);
      this.get_status = require_getStatus().bind(bindObj);
      this.get_steps = require_getSteps().bind(bindObj);
      this.search_state = require_searchState().bind(bindObj);
    }
    module2.exports = FlowFrameworkApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/connect.js
var require_connect = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/connect.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function connectFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "CONNECT" }, options, callback);
    }
    module2.exports = connectFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/delete.js
var require_delete3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "DELETE" }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/get.js
var require_get3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "GET" }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/head.js
var require_head = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/head.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function headFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "HEAD" }, options, callback);
    }
    module2.exports = headFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/options.js
var require_options = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/options.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function optionsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "OPTIONS" }, options, callback);
    }
    module2.exports = optionsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/patch.js
var require_patch = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/patch.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "PATCH" }, options, callback);
    }
    module2.exports = patchFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/post.js
var require_post = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/post.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function postFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "POST" }, options, callback);
    }
    module2.exports = postFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/put.js
var require_put = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/put.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function putFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "PUT" }, options, callback);
    }
    module2.exports = putFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/trace.js
var require_trace = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/trace.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function traceFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.path == null) return handleMissingParam("path", this, callback);
      if (Array.isArray(params.body)) {
        const { path, querystring, headers, body } = params;
        params = { path, querystring, headers, bulkBody: body };
      }
      options = options || {};
      options.headers = params.headers || options.headers;
      return this.transport.request({ ...params, method: "TRACE" }, options, callback);
    }
    module2.exports = traceFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/_api.js
var require_api6 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/http/_api.js"(exports2, module2) {
    "use strict";
    function HttpApi(bindObj) {
      this.connect = require_connect().bind(bindObj);
      this.delete = require_delete3().bind(bindObj);
      this.get = require_get3().bind(bindObj);
      this.head = require_head().bind(bindObj);
      this.options = require_options().bind(bindObj);
      this.patch = require_patch().bind(bindObj);
      this.post = require_post().bind(bindObj);
      this.put = require_put().bind(bindObj);
      this.trace = require_trace().bind(bindObj);
    }
    module2.exports = HttpApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/addBlock.js
var require_addBlock = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/addBlock.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function addBlockFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.block == null) return handleMissingParam("block", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, block, index, ...querystring } = params;
      block = parsePathParam(block);
      index = parsePathParam(index);
      const path = "/" + index + "/_block/" + block;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = addBlockFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/analyze.js
var require_analyze = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/analyze.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function analyzeFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_analyze"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = analyzeFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/clearCache.js
var require_clearCache = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/clearCache.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function clearCacheFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_cache/clear"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = clearCacheFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/clone.js
var require_clone = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/clone.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function cloneFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.target == null) return handleMissingParam("target", this, callback);
      let { body, index, target, ...querystring } = params;
      index = parsePathParam(index);
      target = parsePathParam(target);
      const path = "/" + index + "/_clone/" + target;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = cloneFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/close.js
var require_close = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/close.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function closeFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index + "/_close";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = closeFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/create.js
var require_create2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/create.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/createDataStream.js
var require_createDataStream = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/createDataStream.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createDataStreamFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_data_stream/" + name;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createDataStreamFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/dataStreamsStats.js
var require_dataStreamsStats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/dataStreamsStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function dataStreamsStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_data_stream", name, "_stats"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = dataStreamsStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/delete.js
var require_delete4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteAlias.js
var require_deleteAlias = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteAlias.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteAliasFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, index, name, ...querystring } = params;
      index = parsePathParam(index);
      name = parsePathParam(name);
      const path = "/" + index + "/_alias/" + name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteAliasFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteDataStream.js
var require_deleteDataStream = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteDataStream.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteDataStreamFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_data_stream/" + name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteDataStreamFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteIndexTemplate.js
var require_deleteIndexTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteIndexTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteIndexTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_index_template/" + name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteIndexTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteTemplate.js
var require_deleteTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/deleteTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_template/" + name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/exists.js
var require_exists = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/exists.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index;
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/existsAlias.js
var require_existsAlias = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/existsAlias.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsAliasFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, index, ...querystring } = params;
      name = parsePathParam(name);
      index = parsePathParam(index);
      const path = ["", index, "_alias", name].filter((c) => c != null).join("/");
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsAliasFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/existsIndexTemplate.js
var require_existsIndexTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/existsIndexTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsIndexTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_index_template/" + name;
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsIndexTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/existsTemplate.js
var require_existsTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/existsTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_template/" + name;
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/flush.js
var require_flush = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/flush.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function flushFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_flush"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = flushFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/forcemerge.js
var require_forcemerge = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/forcemerge.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function forcemergeFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_forcemerge"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = forcemergeFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/get.js
var require_get4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getAlias.js
var require_getAlias = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getAlias.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getAliasFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, index, ...querystring } = params;
      name = parsePathParam(name);
      index = parsePathParam(index);
      const path = ["", index, "_alias", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAliasFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getDataStream.js
var require_getDataStream = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getDataStream.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getDataStreamFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_data_stream", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getDataStreamFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getFieldMapping.js
var require_getFieldMapping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getFieldMapping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFieldMappingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.fields == null) return handleMissingParam("fields", this, callback);
      let { body, fields, index, ...querystring } = params;
      fields = parsePathParam(fields);
      index = parsePathParam(index);
      const path = ["", index, "_mapping/field", fields].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFieldMappingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getIndexTemplate.js
var require_getIndexTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getIndexTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getIndexTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_index_template", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getIndexTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getMapping.js
var require_getMapping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getMapping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getMappingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_mapping"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getMappingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getSettings.js
var require_getSettings2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getSettings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getSettingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, index, ...querystring } = params;
      name = parsePathParam(name);
      index = parsePathParam(index);
      const path = ["", index, "_settings", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getSettingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getTemplate.js
var require_getTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_template", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getUpgrade.js
var require_getUpgrade = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/getUpgrade.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getUpgradeFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_upgrade"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getUpgradeFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/open.js
var require_open = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/open.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function openFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index + "/_open";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = openFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putAlias.js
var require_putAlias = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putAlias.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function putAliasFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, index, ...querystring } = params;
      name = parsePathParam(name);
      index = parsePathParam(index);
      const path = ["", index, "_alias", name].filter((c) => c != null).join("/");
      const method = name == null ? "POST" : "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putAliasFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putIndexTemplate.js
var require_putIndexTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putIndexTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putIndexTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_index_template/" + name;
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putIndexTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putMapping.js
var require_putMapping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putMapping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putMappingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index + "/_mapping";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putMappingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putSettings.js
var require_putSettings2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putSettings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putSettingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_settings"].filter((c) => c != null).join("/");
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putSettingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putTemplate.js
var require_putTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/putTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_template/" + name;
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/recovery.js
var require_recovery2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/recovery.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function recoveryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_recovery"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = recoveryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/refresh.js
var require_refresh = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/refresh.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function refreshFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_refresh"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = refreshFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/resolveIndex.js
var require_resolveIndex = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/resolveIndex.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function resolveIndexFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_resolve/index/" + name;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = resolveIndexFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/rollover.js
var require_rollover = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/rollover.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function rolloverFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.alias == null) return handleMissingParam("alias", this, callback);
      let { body, alias, new_index, ...querystring } = params;
      alias = parsePathParam(alias);
      new_index = parsePathParam(new_index);
      const path = ["", alias, "_rollover", new_index].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = rolloverFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/segments.js
var require_segments2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/segments.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function segmentsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_segments"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = segmentsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/shardStores.js
var require_shardStores = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/shardStores.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function shardStoresFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_shard_stores"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = shardStoresFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/shrink.js
var require_shrink = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/shrink.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function shrinkFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.target == null) return handleMissingParam("target", this, callback);
      let { body, index, target, ...querystring } = params;
      index = parsePathParam(index);
      target = parsePathParam(target);
      const path = "/" + index + "/_shrink/" + target;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = shrinkFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/simulateIndexTemplate.js
var require_simulateIndexTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/simulateIndexTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function simulateIndexTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_index_template/_simulate_index/" + name;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = simulateIndexTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/simulateTemplate.js
var require_simulateTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/simulateTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function simulateTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_index_template/_simulate", name].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = simulateTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/split.js
var require_split = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/split.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function splitFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.target == null) return handleMissingParam("target", this, callback);
      let { body, index, target, ...querystring } = params;
      index = parsePathParam(index);
      target = parsePathParam(target);
      const path = "/" + index + "/_split/" + target;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = splitFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/stats.js
var require_stats3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/stats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function statsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, metric, index, ...querystring } = params;
      metric = parsePathParam(metric);
      index = parsePathParam(index);
      const path = ["", index, "_stats", metric].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/updateAliases.js
var require_updateAliases = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/updateAliases.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function updateAliasesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_aliases";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateAliasesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/upgrade.js
var require_upgrade = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/upgrade.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function upgradeFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_upgrade"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = upgradeFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/validateQuery.js
var require_validateQuery = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/validateQuery.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function validateQueryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_validate/query"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = validateQueryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/_api.js
var require_api7 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/indices/_api.js"(exports2, module2) {
    "use strict";
    function IndicesApi(bindObj) {
      this.addBlock = require_addBlock().bind(bindObj);
      this.analyze = require_analyze().bind(bindObj);
      this.clearCache = require_clearCache().bind(bindObj);
      this.clone = require_clone().bind(bindObj);
      this.close = require_close().bind(bindObj);
      this.create = require_create2().bind(bindObj);
      this.createDataStream = require_createDataStream().bind(bindObj);
      this.dataStreamsStats = require_dataStreamsStats().bind(bindObj);
      this.delete = require_delete4().bind(bindObj);
      this.deleteAlias = require_deleteAlias().bind(bindObj);
      this.deleteDataStream = require_deleteDataStream().bind(bindObj);
      this.deleteIndexTemplate = require_deleteIndexTemplate().bind(bindObj);
      this.deleteTemplate = require_deleteTemplate().bind(bindObj);
      this.exists = require_exists().bind(bindObj);
      this.existsAlias = require_existsAlias().bind(bindObj);
      this.existsIndexTemplate = require_existsIndexTemplate().bind(bindObj);
      this.existsTemplate = require_existsTemplate().bind(bindObj);
      this.flush = require_flush().bind(bindObj);
      this.forcemerge = require_forcemerge().bind(bindObj);
      this.get = require_get4().bind(bindObj);
      this.getAlias = require_getAlias().bind(bindObj);
      this.getDataStream = require_getDataStream().bind(bindObj);
      this.getFieldMapping = require_getFieldMapping().bind(bindObj);
      this.getIndexTemplate = require_getIndexTemplate().bind(bindObj);
      this.getMapping = require_getMapping().bind(bindObj);
      this.getSettings = require_getSettings2().bind(bindObj);
      this.getTemplate = require_getTemplate().bind(bindObj);
      this.getUpgrade = require_getUpgrade().bind(bindObj);
      this.open = require_open().bind(bindObj);
      this.putAlias = require_putAlias().bind(bindObj);
      this.putIndexTemplate = require_putIndexTemplate().bind(bindObj);
      this.putMapping = require_putMapping().bind(bindObj);
      this.putSettings = require_putSettings2().bind(bindObj);
      this.putTemplate = require_putTemplate().bind(bindObj);
      this.recovery = require_recovery2().bind(bindObj);
      this.refresh = require_refresh().bind(bindObj);
      this.resolveIndex = require_resolveIndex().bind(bindObj);
      this.rollover = require_rollover().bind(bindObj);
      this.segments = require_segments2().bind(bindObj);
      this.shardStores = require_shardStores().bind(bindObj);
      this.shrink = require_shrink().bind(bindObj);
      this.simulateIndexTemplate = require_simulateIndexTemplate().bind(bindObj);
      this.simulateTemplate = require_simulateTemplate().bind(bindObj);
      this.split = require_split().bind(bindObj);
      this.stats = require_stats3().bind(bindObj);
      this.updateAliases = require_updateAliases().bind(bindObj);
      this.upgrade = require_upgrade().bind(bindObj);
      this.validateQuery = require_validateQuery().bind(bindObj);
      this.add_block = require_addBlock().bind(bindObj);
      this.clear_cache = require_clearCache().bind(bindObj);
      this.create_data_stream = require_createDataStream().bind(bindObj);
      this.data_streams_stats = require_dataStreamsStats().bind(bindObj);
      this.delete_alias = require_deleteAlias().bind(bindObj);
      this.delete_data_stream = require_deleteDataStream().bind(bindObj);
      this.delete_index_template = require_deleteIndexTemplate().bind(bindObj);
      this.delete_template = require_deleteTemplate().bind(bindObj);
      this.exists_alias = require_existsAlias().bind(bindObj);
      this.exists_index_template = require_existsIndexTemplate().bind(bindObj);
      this.exists_template = require_existsTemplate().bind(bindObj);
      this.get_alias = require_getAlias().bind(bindObj);
      this.get_data_stream = require_getDataStream().bind(bindObj);
      this.get_field_mapping = require_getFieldMapping().bind(bindObj);
      this.get_index_template = require_getIndexTemplate().bind(bindObj);
      this.get_mapping = require_getMapping().bind(bindObj);
      this.get_settings = require_getSettings2().bind(bindObj);
      this.get_template = require_getTemplate().bind(bindObj);
      this.get_upgrade = require_getUpgrade().bind(bindObj);
      this.put_alias = require_putAlias().bind(bindObj);
      this.put_index_template = require_putIndexTemplate().bind(bindObj);
      this.put_mapping = require_putMapping().bind(bindObj);
      this.put_settings = require_putSettings2().bind(bindObj);
      this.put_template = require_putTemplate().bind(bindObj);
      this.resolve_index = require_resolveIndex().bind(bindObj);
      this.shard_stores = require_shardStores().bind(bindObj);
      this.simulate_index_template = require_simulateIndexTemplate().bind(bindObj);
      this.simulate_template = require_simulateTemplate().bind(bindObj);
      this.update_aliases = require_updateAliases().bind(bindObj);
      this.validate_query = require_validateQuery().bind(bindObj);
    }
    module2.exports = IndicesApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/deletePipeline.js
var require_deletePipeline = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/deletePipeline.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deletePipelineFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_ingest/pipeline/" + id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deletePipelineFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/getPipeline.js
var require_getPipeline = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/getPipeline.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getPipelineFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = ["/_ingest/pipeline", id].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getPipelineFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/processorGrok.js
var require_processorGrok = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/processorGrok.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function processorGrokFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_ingest/processor/grok";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = processorGrokFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/putPipeline.js
var require_putPipeline = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/putPipeline.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putPipelineFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_ingest/pipeline/" + id;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putPipelineFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/simulate.js
var require_simulate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/simulate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function simulateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = ["/_ingest/pipeline", id, "_simulate"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = simulateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/_api.js
var require_api8 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ingest/_api.js"(exports2, module2) {
    "use strict";
    function IngestApi(bindObj) {
      this.deletePipeline = require_deletePipeline().bind(bindObj);
      this.getPipeline = require_getPipeline().bind(bindObj);
      this.processorGrok = require_processorGrok().bind(bindObj);
      this.putPipeline = require_putPipeline().bind(bindObj);
      this.simulate = require_simulate().bind(bindObj);
      this.delete_pipeline = require_deletePipeline().bind(bindObj);
      this.get_pipeline = require_getPipeline().bind(bindObj);
      this.processor_grok = require_processorGrok().bind(bindObj);
      this.put_pipeline = require_putPipeline().bind(bindObj);
    }
    module2.exports = IngestApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/insights/topQueries.js
var require_topQueries = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/insights/topQueries.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function topQueriesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.type == null) return handleMissingParam("type", this, callback);
      let { body, ...querystring } = params;
      const path = "/_insights/top_queries";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = topQueriesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/insights/_api.js
var require_api9 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/insights/_api.js"(exports2, module2) {
    "use strict";
    function InsightsApi(bindObj) {
      this.topQueries = require_topQueries().bind(bindObj);
      this.top_queries = require_topQueries().bind(bindObj);
    }
    module2.exports = InsightsApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/addPolicy.js
var require_addPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/addPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function addPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_plugins/_ism/add", index].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = addPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/changePolicy.js
var require_changePolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/changePolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function changePolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_plugins/_ism/change_policy", index].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = changePolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/deletePolicy.js
var require_deletePolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/deletePolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deletePolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_id == null) return handleMissingParam("policy_id", this, callback);
      let { body, policy_id, ...querystring } = params;
      policy_id = parsePathParam(policy_id);
      const path = "/_plugins/_ism/policies/" + policy_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deletePolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/existsPolicy.js
var require_existsPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/existsPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_id == null) return handleMissingParam("policy_id", this, callback);
      let { body, policy_id, ...querystring } = params;
      policy_id = parsePathParam(policy_id);
      const path = "/_plugins/_ism/policies/" + policy_id;
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/explainPolicy.js
var require_explainPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/explainPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function explainPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_plugins/_ism/explain", index].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = explainPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/getPolicies.js
var require_getPolicies = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/getPolicies.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getPoliciesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ism/policies";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getPoliciesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/getPolicy.js
var require_getPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/getPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_id == null) return handleMissingParam("policy_id", this, callback);
      let { body, policy_id, ...querystring } = params;
      policy_id = parsePathParam(policy_id);
      const path = "/_plugins/_ism/policies/" + policy_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/putPolicies.js
var require_putPolicies = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/putPolicies.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function putPoliciesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policyID == null) return handleMissingParam("policyID", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ism/policies";
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putPoliciesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/putPolicy.js
var require_putPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/putPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_id == null) return handleMissingParam("policy_id", this, callback);
      let { body, policy_id, ...querystring } = params;
      policy_id = parsePathParam(policy_id);
      const path = "/_plugins/_ism/policies/" + policy_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/refreshSearchAnalyzers.js
var require_refreshSearchAnalyzers = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/refreshSearchAnalyzers.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function refreshSearchAnalyzersFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_refresh_search_analyzers/" + index;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = refreshSearchAnalyzersFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/removePolicy.js
var require_removePolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/removePolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function removePolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_plugins/_ism/remove", index].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = removePolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/retryIndex.js
var require_retryIndex = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/retryIndex.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function retryIndexFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_plugins/_ism/retry", index].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = retryIndexFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/_api.js
var require_api10 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ism/_api.js"(exports2, module2) {
    "use strict";
    function IsmApi(bindObj) {
      this.addPolicy = require_addPolicy().bind(bindObj);
      this.changePolicy = require_changePolicy().bind(bindObj);
      this.deletePolicy = require_deletePolicy().bind(bindObj);
      this.existsPolicy = require_existsPolicy().bind(bindObj);
      this.explainPolicy = require_explainPolicy().bind(bindObj);
      this.getPolicies = require_getPolicies().bind(bindObj);
      this.getPolicy = require_getPolicy().bind(bindObj);
      this.putPolicies = require_putPolicies().bind(bindObj);
      this.putPolicy = require_putPolicy().bind(bindObj);
      this.refreshSearchAnalyzers = require_refreshSearchAnalyzers().bind(bindObj);
      this.removePolicy = require_removePolicy().bind(bindObj);
      this.retryIndex = require_retryIndex().bind(bindObj);
      this.add_policy = require_addPolicy().bind(bindObj);
      this.change_policy = require_changePolicy().bind(bindObj);
      this.delete_policy = require_deletePolicy().bind(bindObj);
      this.exists_policy = require_existsPolicy().bind(bindObj);
      this.explain_policy = require_explainPolicy().bind(bindObj);
      this.get_policies = require_getPolicies().bind(bindObj);
      this.get_policy = require_getPolicy().bind(bindObj);
      this.put_policies = require_putPolicies().bind(bindObj);
      this.put_policy = require_putPolicy().bind(bindObj);
      this.refresh_search_analyzers = require_refreshSearchAnalyzers().bind(bindObj);
      this.remove_policy = require_removePolicy().bind(bindObj);
      this.retry_index = require_retryIndex().bind(bindObj);
    }
    module2.exports = IsmApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/deleteModel.js
var require_deleteModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/deleteModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_knn/models/" + model_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/getModel.js
var require_getModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/getModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_knn/models/" + model_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/searchModels.js
var require_searchModels = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/searchModels.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchModelsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_knn/models/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchModelsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/stats.js
var require_stats4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/stats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function statsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, stat, ...querystring } = params;
      node_id = parsePathParam(node_id);
      stat = parsePathParam(stat);
      const path = ["/_plugins/_knn", node_id, "stats", stat].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/trainModel.js
var require_trainModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/trainModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function trainModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = ["/_plugins/_knn/models", model_id, "_train"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = trainModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/warmup.js
var require_warmup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/warmup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function warmupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_knn/warmup/" + index;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = warmupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/_api.js
var require_api11 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/knn/_api.js"(exports2, module2) {
    "use strict";
    function KnnApi(bindObj) {
      this.deleteModel = require_deleteModel().bind(bindObj);
      this.getModel = require_getModel().bind(bindObj);
      this.searchModels = require_searchModels().bind(bindObj);
      this.stats = require_stats4().bind(bindObj);
      this.trainModel = require_trainModel().bind(bindObj);
      this.warmup = require_warmup().bind(bindObj);
      this.delete_model = require_deleteModel().bind(bindObj);
      this.get_model = require_getModel().bind(bindObj);
      this.search_models = require_searchModels().bind(bindObj);
      this.train_model = require_trainModel().bind(bindObj);
    }
    module2.exports = KnnApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/help.js
var require_help2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/help.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function helpFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_list";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = helpFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/indices.js
var require_indices2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/indices.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function indicesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_list/indices", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = indicesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/shards.js
var require_shards2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/shards.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function shardsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["/_list/shards", index].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = shardsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/_api.js
var require_api12 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/list/_api.js"(exports2, module2) {
    "use strict";
    function ListApi(bindObj) {
      this.help = require_help2().bind(bindObj);
      this.indices = require_indices2().bind(bindObj);
      this.shards = require_shards2().bind(bindObj);
    }
    module2.exports = ListApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ltr/stats.js
var require_stats5 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ltr/stats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function statsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, stat, ...querystring } = params;
      node_id = parsePathParam(node_id);
      stat = parsePathParam(stat);
      const path = ["/_plugins/_ltr", node_id, "stats", stat].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ltr/_api.js
var require_api13 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ltr/_api.js"(exports2, module2) {
    "use strict";
    function LtrApi(bindObj) {
      this.stats = require_stats5().bind(bindObj);
    }
    module2.exports = LtrApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/chunkModel.js
var require_chunkModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/chunkModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function chunkModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.chunk_number == null) return handleMissingParam("chunk_number", this, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, chunk_number, model_id, ...querystring } = params;
      chunk_number = parsePathParam(chunk_number);
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id + "/chunk/" + chunk_number;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = chunkModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createConnector.js
var require_createConnector = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createConnector.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function createConnectorFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/connectors/_create";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createConnectorFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createController.js
var require_createController = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createController.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createControllerFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/controllers/" + model_id;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createControllerFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createMemory.js
var require_createMemory = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createMemory.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function createMemoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/memory";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createMemoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createMessage.js
var require_createMessage = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createMessage.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createMessageFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.memory_id == null) return handleMissingParam("memory_id", this, callback);
      let { body, memory_id, ...querystring } = params;
      memory_id = parsePathParam(memory_id);
      const path = "/_plugins/_ml/memory/" + memory_id + "/messages";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createMessageFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createModelMeta.js
var require_createModelMeta = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/createModelMeta.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function createModelMetaFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/models/meta";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createModelMetaFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteAgent.js
var require_deleteAgent = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteAgent.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteAgentFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.agent_id == null) return handleMissingParam("agent_id", this, callback);
      let { body, agent_id, ...querystring } = params;
      agent_id = parsePathParam(agent_id);
      const path = "/_plugins/_ml/agents/" + agent_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteAgentFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteConnector.js
var require_deleteConnector = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteConnector.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteConnectorFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.connector_id == null) return handleMissingParam("connector_id", this, callback);
      let { body, connector_id, ...querystring } = params;
      connector_id = parsePathParam(connector_id);
      const path = "/_plugins/_ml/connectors/" + connector_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteConnectorFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteController.js
var require_deleteController = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteController.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteControllerFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/controllers/" + model_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteControllerFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteMemory.js
var require_deleteMemory = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteMemory.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteMemoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.memory_id == null) return handleMissingParam("memory_id", this, callback);
      let { body, memory_id, ...querystring } = params;
      memory_id = parsePathParam(memory_id);
      const path = "/_plugins/_ml/memory/" + memory_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteMemoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteModel.js
var require_deleteModel2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteModelGroup.js
var require_deleteModelGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteModelGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteModelGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_group_id == null) return handleMissingParam("model_group_id", this, callback);
      let { body, model_group_id, ...querystring } = params;
      model_group_id = parsePathParam(model_group_id);
      const path = "/_plugins/_ml/model_groups/" + model_group_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteModelGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteTask.js
var require_deleteTask = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deleteTask.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteTaskFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.task_id == null) return handleMissingParam("task_id", this, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = "/_plugins/_ml/tasks/" + task_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteTaskFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deployModel.js
var require_deployModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/deployModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deployModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id + "/_deploy";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deployModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/executeAgent.js
var require_executeAgent = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/executeAgent.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function executeAgentFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.agent_id == null) return handleMissingParam("agent_id", this, callback);
      let { body, agent_id, ...querystring } = params;
      agent_id = parsePathParam(agent_id);
      const path = "/_plugins/_ml/agents/" + agent_id + "/_execute";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = executeAgentFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/executeAlgorithm.js
var require_executeAlgorithm = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/executeAlgorithm.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function executeAlgorithmFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.algorithm_name == null) return handleMissingParam("algorithm_name", this, callback);
      let { body, algorithm_name, ...querystring } = params;
      algorithm_name = parsePathParam(algorithm_name);
      const path = "/_plugins/_ml/_execute/" + algorithm_name;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = executeAlgorithmFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAgent.js
var require_getAgent = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAgent.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getAgentFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.agent_id == null) return handleMissingParam("agent_id", this, callback);
      let { body, agent_id, ...querystring } = params;
      agent_id = parsePathParam(agent_id);
      const path = "/_plugins/_ml/agents/" + agent_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAgentFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAllMemories.js
var require_getAllMemories = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAllMemories.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getAllMemoriesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/memory";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAllMemoriesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAllMessages.js
var require_getAllMessages = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAllMessages.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getAllMessagesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.memory_id == null) return handleMissingParam("memory_id", this, callback);
      let { body, memory_id, ...querystring } = params;
      memory_id = parsePathParam(memory_id);
      const path = "/_plugins/_ml/memory/" + memory_id + "/messages";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAllMessagesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAllTools.js
var require_getAllTools = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getAllTools.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getAllToolsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/tools";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAllToolsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getConnector.js
var require_getConnector = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getConnector.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getConnectorFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.connector_id == null) return handleMissingParam("connector_id", this, callback);
      let { body, connector_id, ...querystring } = params;
      connector_id = parsePathParam(connector_id);
      const path = "/_plugins/_ml/connectors/" + connector_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getConnectorFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getController.js
var require_getController = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getController.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getControllerFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/controllers/" + model_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getControllerFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getMemory.js
var require_getMemory = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getMemory.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getMemoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.memory_id == null) return handleMissingParam("memory_id", this, callback);
      let { body, memory_id, ...querystring } = params;
      memory_id = parsePathParam(memory_id);
      const path = "/_plugins/_ml/memory/" + memory_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getMemoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getMessage.js
var require_getMessage = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getMessage.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getMessageFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.message_id == null) return handleMissingParam("message_id", this, callback);
      let { body, message_id, ...querystring } = params;
      message_id = parsePathParam(message_id);
      const path = "/_plugins/_ml/memory/message/" + message_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getMessageFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getMessageTraces.js
var require_getMessageTraces = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getMessageTraces.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getMessageTracesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.message_id == null) return handleMissingParam("message_id", this, callback);
      let { body, message_id, ...querystring } = params;
      message_id = parsePathParam(message_id);
      const path = "/_plugins/_ml/memory/message/" + message_id + "/traces";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getMessageTracesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getModel.js
var require_getModel2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getModelGroup.js
var require_getModelGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getModelGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getModelGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_group_id == null) return handleMissingParam("model_group_id", this, callback);
      let { body, model_group_id, ...querystring } = params;
      model_group_id = parsePathParam(model_group_id);
      const path = "/_plugins/_ml/model_groups/" + model_group_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getModelGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getProfile.js
var require_getProfile = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getProfile.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getProfileFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/profile";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getProfileFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getProfileModels.js
var require_getProfileModels = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getProfileModels.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getProfileModelsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = ["/_plugins/_ml/profile/models", model_id].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getProfileModelsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getProfileTasks.js
var require_getProfileTasks = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getProfileTasks.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getProfileTasksFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = ["/_plugins/_ml/profile/tasks", task_id].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getProfileTasksFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getStats.js
var require_getStats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, stat, ...querystring } = params;
      node_id = parsePathParam(node_id);
      stat = parsePathParam(stat);
      const path = ["/_plugins/_ml", node_id, "stats", stat].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getTask.js
var require_getTask = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getTask.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getTaskFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.task_id == null) return handleMissingParam("task_id", this, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = "/_plugins/_ml/tasks/" + task_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getTaskFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getTool.js
var require_getTool = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/getTool.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getToolFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.tool_name == null) return handleMissingParam("tool_name", this, callback);
      let { body, tool_name, ...querystring } = params;
      tool_name = parsePathParam(tool_name);
      const path = "/_plugins/_ml/tools/" + tool_name;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getToolFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/loadModel.js
var require_loadModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/loadModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function loadModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id + "/_load";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = loadModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/predict.js
var require_predict = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/predict.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function predictFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.algorithm_name == null) return handleMissingParam("algorithm_name", this, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, algorithm_name, model_id, ...querystring } = params;
      algorithm_name = parsePathParam(algorithm_name);
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/_predict/" + algorithm_name + "/" + model_id;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = predictFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/predictModel.js
var require_predictModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/predictModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function predictModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id + "/_predict";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = predictModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerAgents.js
var require_registerAgents = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerAgents.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function registerAgentsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/agents/_register";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = registerAgentsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerModel.js
var require_registerModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function registerModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/models/_register";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = registerModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerModelGroup.js
var require_registerModelGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerModelGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function registerModelGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/model_groups/_register";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = registerModelGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerModelMeta.js
var require_registerModelMeta = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/registerModelMeta.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function registerModelMetaFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/models/_register_meta";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = registerModelMetaFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchAgents.js
var require_searchAgents = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchAgents.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchAgentsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/agents/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchAgentsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchConnectors.js
var require_searchConnectors = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchConnectors.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchConnectorsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/connectors/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchConnectorsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchMemory.js
var require_searchMemory = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchMemory.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchMemoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/memory/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchMemoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchMessage.js
var require_searchMessage = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchMessage.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function searchMessageFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.memory_id == null) return handleMissingParam("memory_id", this, callback);
      let { body, memory_id, ...querystring } = params;
      memory_id = parsePathParam(memory_id);
      const path = "/_plugins/_ml/memory/" + memory_id + "/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchMessageFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchModelGroup.js
var require_searchModelGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchModelGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchModelGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/model_groups/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchModelGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchModels.js
var require_searchModels2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchModels.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchModelsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/models/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchModelsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchTasks.js
var require_searchTasks = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/searchTasks.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchTasksFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/tasks/_search";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchTasksFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/train.js
var require_train = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/train.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function trainFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.algorithm_name == null) return handleMissingParam("algorithm_name", this, callback);
      let { body, algorithm_name, ...querystring } = params;
      algorithm_name = parsePathParam(algorithm_name);
      const path = "/_plugins/_ml/_train/" + algorithm_name;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = trainFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/trainPredict.js
var require_trainPredict = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/trainPredict.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function trainPredictFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.algorithm_name == null) return handleMissingParam("algorithm_name", this, callback);
      let { body, algorithm_name, ...querystring } = params;
      algorithm_name = parsePathParam(algorithm_name);
      const path = "/_plugins/_ml/_train_predict/" + algorithm_name;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = trainPredictFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/undeployModel.js
var require_undeployModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/undeployModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function undeployModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = ["/_plugins/_ml/models", model_id, "_undeploy"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = undeployModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/unloadModel.js
var require_unloadModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/unloadModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function unloadModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = ["/_plugins/_ml/models", model_id, "_unload"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = unloadModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateConnector.js
var require_updateConnector = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateConnector.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateConnectorFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.connector_id == null) return handleMissingParam("connector_id", this, callback);
      let { body, connector_id, ...querystring } = params;
      connector_id = parsePathParam(connector_id);
      const path = "/_plugins/_ml/connectors/" + connector_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateConnectorFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateController.js
var require_updateController = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateController.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateControllerFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/controllers/" + model_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateControllerFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateMemory.js
var require_updateMemory = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateMemory.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateMemoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.memory_id == null) return handleMissingParam("memory_id", this, callback);
      let { body, memory_id, ...querystring } = params;
      memory_id = parsePathParam(memory_id);
      const path = "/_plugins/_ml/memory/" + memory_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateMemoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateMessage.js
var require_updateMessage = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateMessage.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateMessageFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.message_id == null) return handleMissingParam("message_id", this, callback);
      let { body, message_id, ...querystring } = params;
      message_id = parsePathParam(message_id);
      const path = "/_plugins/_ml/memory/message/" + message_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateMessageFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateModel.js
var require_updateModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, model_id, ...querystring } = params;
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateModelGroup.js
var require_updateModelGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/updateModelGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateModelGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.model_group_id == null) return handleMissingParam("model_group_id", this, callback);
      let { body, model_group_id, ...querystring } = params;
      model_group_id = parsePathParam(model_group_id);
      const path = "/_plugins/_ml/model_groups/" + model_group_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateModelGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/uploadChunk.js
var require_uploadChunk = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/uploadChunk.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function uploadChunkFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.chunk_number == null) return handleMissingParam("chunk_number", this, callback);
      if (params.model_id == null) return handleMissingParam("model_id", this, callback);
      let { body, chunk_number, model_id, ...querystring } = params;
      chunk_number = parsePathParam(chunk_number);
      model_id = parsePathParam(model_id);
      const path = "/_plugins/_ml/models/" + model_id + "/upload_chunk/" + chunk_number;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = uploadChunkFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/uploadModel.js
var require_uploadModel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/uploadModel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function uploadModelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ml/models/_upload";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = uploadModelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/_api.js
var require_api14 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ml/_api.js"(exports2, module2) {
    "use strict";
    function MlApi(bindObj) {
      this.chunkModel = require_chunkModel().bind(bindObj);
      this.createConnector = require_createConnector().bind(bindObj);
      this.createController = require_createController().bind(bindObj);
      this.createMemory = require_createMemory().bind(bindObj);
      this.createMessage = require_createMessage().bind(bindObj);
      this.createModelMeta = require_createModelMeta().bind(bindObj);
      this.deleteAgent = require_deleteAgent().bind(bindObj);
      this.deleteConnector = require_deleteConnector().bind(bindObj);
      this.deleteController = require_deleteController().bind(bindObj);
      this.deleteMemory = require_deleteMemory().bind(bindObj);
      this.deleteModel = require_deleteModel2().bind(bindObj);
      this.deleteModelGroup = require_deleteModelGroup().bind(bindObj);
      this.deleteTask = require_deleteTask().bind(bindObj);
      this.deployModel = require_deployModel().bind(bindObj);
      this.executeAgent = require_executeAgent().bind(bindObj);
      this.executeAlgorithm = require_executeAlgorithm().bind(bindObj);
      this.getAgent = require_getAgent().bind(bindObj);
      this.getAllMemories = require_getAllMemories().bind(bindObj);
      this.getAllMessages = require_getAllMessages().bind(bindObj);
      this.getAllTools = require_getAllTools().bind(bindObj);
      this.getConnector = require_getConnector().bind(bindObj);
      this.getController = require_getController().bind(bindObj);
      this.getMemory = require_getMemory().bind(bindObj);
      this.getMessage = require_getMessage().bind(bindObj);
      this.getMessageTraces = require_getMessageTraces().bind(bindObj);
      this.getModel = require_getModel2().bind(bindObj);
      this.getModelGroup = require_getModelGroup().bind(bindObj);
      this.getProfile = require_getProfile().bind(bindObj);
      this.getProfileModels = require_getProfileModels().bind(bindObj);
      this.getProfileTasks = require_getProfileTasks().bind(bindObj);
      this.getStats = require_getStats().bind(bindObj);
      this.getTask = require_getTask().bind(bindObj);
      this.getTool = require_getTool().bind(bindObj);
      this.loadModel = require_loadModel().bind(bindObj);
      this.predict = require_predict().bind(bindObj);
      this.predictModel = require_predictModel().bind(bindObj);
      this.registerAgents = require_registerAgents().bind(bindObj);
      this.registerModel = require_registerModel().bind(bindObj);
      this.registerModelGroup = require_registerModelGroup().bind(bindObj);
      this.registerModelMeta = require_registerModelMeta().bind(bindObj);
      this.searchAgents = require_searchAgents().bind(bindObj);
      this.searchConnectors = require_searchConnectors().bind(bindObj);
      this.searchMemory = require_searchMemory().bind(bindObj);
      this.searchMessage = require_searchMessage().bind(bindObj);
      this.searchModelGroup = require_searchModelGroup().bind(bindObj);
      this.searchModels = require_searchModels2().bind(bindObj);
      this.searchTasks = require_searchTasks().bind(bindObj);
      this.train = require_train().bind(bindObj);
      this.trainPredict = require_trainPredict().bind(bindObj);
      this.undeployModel = require_undeployModel().bind(bindObj);
      this.unloadModel = require_unloadModel().bind(bindObj);
      this.updateConnector = require_updateConnector().bind(bindObj);
      this.updateController = require_updateController().bind(bindObj);
      this.updateMemory = require_updateMemory().bind(bindObj);
      this.updateMessage = require_updateMessage().bind(bindObj);
      this.updateModel = require_updateModel().bind(bindObj);
      this.updateModelGroup = require_updateModelGroup().bind(bindObj);
      this.uploadChunk = require_uploadChunk().bind(bindObj);
      this.uploadModel = require_uploadModel().bind(bindObj);
      this.chunk_model = require_chunkModel().bind(bindObj);
      this.create_connector = require_createConnector().bind(bindObj);
      this.create_controller = require_createController().bind(bindObj);
      this.create_memory = require_createMemory().bind(bindObj);
      this.create_message = require_createMessage().bind(bindObj);
      this.create_model_meta = require_createModelMeta().bind(bindObj);
      this.delete_agent = require_deleteAgent().bind(bindObj);
      this.delete_connector = require_deleteConnector().bind(bindObj);
      this.delete_controller = require_deleteController().bind(bindObj);
      this.delete_memory = require_deleteMemory().bind(bindObj);
      this.delete_model = require_deleteModel2().bind(bindObj);
      this.delete_model_group = require_deleteModelGroup().bind(bindObj);
      this.delete_task = require_deleteTask().bind(bindObj);
      this.deploy_model = require_deployModel().bind(bindObj);
      this.execute_agent = require_executeAgent().bind(bindObj);
      this.execute_algorithm = require_executeAlgorithm().bind(bindObj);
      this.get_agent = require_getAgent().bind(bindObj);
      this.get_all_memories = require_getAllMemories().bind(bindObj);
      this.get_all_messages = require_getAllMessages().bind(bindObj);
      this.get_all_tools = require_getAllTools().bind(bindObj);
      this.get_connector = require_getConnector().bind(bindObj);
      this.get_controller = require_getController().bind(bindObj);
      this.get_memory = require_getMemory().bind(bindObj);
      this.get_message = require_getMessage().bind(bindObj);
      this.get_message_traces = require_getMessageTraces().bind(bindObj);
      this.get_model = require_getModel2().bind(bindObj);
      this.get_model_group = require_getModelGroup().bind(bindObj);
      this.get_profile = require_getProfile().bind(bindObj);
      this.get_profile_models = require_getProfileModels().bind(bindObj);
      this.get_profile_tasks = require_getProfileTasks().bind(bindObj);
      this.get_stats = require_getStats().bind(bindObj);
      this.get_task = require_getTask().bind(bindObj);
      this.get_tool = require_getTool().bind(bindObj);
      this.load_model = require_loadModel().bind(bindObj);
      this.predict_model = require_predictModel().bind(bindObj);
      this.register_agents = require_registerAgents().bind(bindObj);
      this.register_model = require_registerModel().bind(bindObj);
      this.register_model_group = require_registerModelGroup().bind(bindObj);
      this.register_model_meta = require_registerModelMeta().bind(bindObj);
      this.search_agents = require_searchAgents().bind(bindObj);
      this.search_connectors = require_searchConnectors().bind(bindObj);
      this.search_memory = require_searchMemory().bind(bindObj);
      this.search_message = require_searchMessage().bind(bindObj);
      this.search_model_group = require_searchModelGroup().bind(bindObj);
      this.search_models = require_searchModels2().bind(bindObj);
      this.search_tasks = require_searchTasks().bind(bindObj);
      this.train_predict = require_trainPredict().bind(bindObj);
      this.undeploy_model = require_undeployModel().bind(bindObj);
      this.unload_model = require_unloadModel().bind(bindObj);
      this.update_connector = require_updateConnector().bind(bindObj);
      this.update_controller = require_updateController().bind(bindObj);
      this.update_memory = require_updateMemory().bind(bindObj);
      this.update_message = require_updateMessage().bind(bindObj);
      this.update_model = require_updateModel().bind(bindObj);
      this.update_model_group = require_updateModelGroup().bind(bindObj);
      this.upload_chunk = require_uploadChunk().bind(bindObj);
      this.upload_model = require_uploadModel().bind(bindObj);
    }
    module2.exports = MlApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/hotThreads.js
var require_hotThreads = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/hotThreads.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function hotThreadsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, ...querystring } = params;
      node_id = parsePathParam(node_id);
      const path = ["/_nodes", node_id, "hot_threads"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = hotThreadsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/info.js
var require_info = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/info.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function infoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, metric, node_id, ...querystring } = params;
      metric = parsePathParam(metric);
      node_id = parsePathParam(node_id);
      const path = ["/_nodes", node_id, metric].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = infoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/reloadSecureSettings.js
var require_reloadSecureSettings = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/reloadSecureSettings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function reloadSecureSettingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, ...querystring } = params;
      node_id = parsePathParam(node_id);
      const path = ["/_nodes", node_id, "reload_secure_settings"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = reloadSecureSettingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/stats.js
var require_stats6 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/stats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function statsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, metric, index_metric, ...querystring } = params;
      node_id = parsePathParam(node_id);
      metric = parsePathParam(metric);
      index_metric = parsePathParam(index_metric);
      const path = ["/_nodes", node_id, "stats", metric, index_metric].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/usage.js
var require_usage = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/usage.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function usageFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, node_id, metric, ...querystring } = params;
      node_id = parsePathParam(node_id);
      metric = parsePathParam(metric);
      const path = ["/_nodes", node_id, "usage", metric].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = usageFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/_api.js
var require_api15 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/nodes/_api.js"(exports2, module2) {
    "use strict";
    function NodesApi(bindObj) {
      this.hotThreads = require_hotThreads().bind(bindObj);
      this.info = require_info().bind(bindObj);
      this.reloadSecureSettings = require_reloadSecureSettings().bind(bindObj);
      this.stats = require_stats6().bind(bindObj);
      this.usage = require_usage().bind(bindObj);
      this.hot_threads = require_hotThreads().bind(bindObj);
      this.reload_secure_settings = require_reloadSecureSettings().bind(bindObj);
    }
    module2.exports = NodesApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/createConfig.js
var require_createConfig = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/createConfig.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function createConfigFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_notifications/configs";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createConfigFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/deleteConfig.js
var require_deleteConfig = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/deleteConfig.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteConfigFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.config_id == null) return handleMissingParam("config_id", this, callback);
      let { body, config_id, ...querystring } = params;
      config_id = parsePathParam(config_id);
      const path = "/_plugins/_notifications/configs/" + config_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteConfigFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/deleteConfigs.js
var require_deleteConfigs = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/deleteConfigs.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function deleteConfigsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.config_id == null) return handleMissingParam("config_id", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_notifications/configs";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteConfigsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/getConfig.js
var require_getConfig = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/getConfig.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getConfigFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.config_id == null) return handleMissingParam("config_id", this, callback);
      let { body, config_id, ...querystring } = params;
      config_id = parsePathParam(config_id);
      const path = "/_plugins/_notifications/configs/" + config_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getConfigFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/getConfigs.js
var require_getConfigs = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/getConfigs.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getConfigsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_notifications/configs";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getConfigsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/listChannels.js
var require_listChannels = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/listChannels.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function listChannelsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_notifications/channels";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = listChannelsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/listFeatures.js
var require_listFeatures = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/listFeatures.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function listFeaturesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_notifications/features";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = listFeaturesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/sendTest.js
var require_sendTest = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/sendTest.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function sendTestFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.config_id == null) return handleMissingParam("config_id", this, callback);
      let { body, config_id, ...querystring } = params;
      config_id = parsePathParam(config_id);
      const path = "/_plugins/_notifications/feature/test/" + config_id;
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = sendTestFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/updateConfig.js
var require_updateConfig = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/updateConfig.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateConfigFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.config_id == null) return handleMissingParam("config_id", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, config_id, ...querystring } = params;
      config_id = parsePathParam(config_id);
      const path = "/_plugins/_notifications/configs/" + config_id;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateConfigFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/_api.js
var require_api16 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/notifications/_api.js"(exports2, module2) {
    "use strict";
    function NotificationsApi(bindObj) {
      this.createConfig = require_createConfig().bind(bindObj);
      this.deleteConfig = require_deleteConfig().bind(bindObj);
      this.deleteConfigs = require_deleteConfigs().bind(bindObj);
      this.getConfig = require_getConfig().bind(bindObj);
      this.getConfigs = require_getConfigs().bind(bindObj);
      this.listChannels = require_listChannels().bind(bindObj);
      this.listFeatures = require_listFeatures().bind(bindObj);
      this.sendTest = require_sendTest().bind(bindObj);
      this.updateConfig = require_updateConfig().bind(bindObj);
      this.create_config = require_createConfig().bind(bindObj);
      this.delete_config = require_deleteConfig().bind(bindObj);
      this.delete_configs = require_deleteConfigs().bind(bindObj);
      this.get_config = require_getConfig().bind(bindObj);
      this.get_configs = require_getConfigs().bind(bindObj);
      this.list_channels = require_listChannels().bind(bindObj);
      this.list_features = require_listFeatures().bind(bindObj);
      this.send_test = require_sendTest().bind(bindObj);
      this.update_config = require_updateConfig().bind(bindObj);
    }
    module2.exports = NotificationsApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/createObject.js
var require_createObject = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/createObject.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function createObjectFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_observability/object";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createObjectFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/deleteObject.js
var require_deleteObject = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/deleteObject.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteObjectFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.object_id == null) return handleMissingParam("object_id", this, callback);
      let { body, object_id, ...querystring } = params;
      object_id = parsePathParam(object_id);
      const path = "/_plugins/_observability/object/" + object_id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteObjectFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/deleteObjects.js
var require_deleteObjects = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/deleteObjects.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function deleteObjectsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_observability/object";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteObjectsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/getLocalstats.js
var require_getLocalstats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/getLocalstats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getLocalstatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_observability/_local/stats";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getLocalstatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/getObject.js
var require_getObject = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/getObject.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getObjectFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.object_id == null) return handleMissingParam("object_id", this, callback);
      let { body, object_id, ...querystring } = params;
      object_id = parsePathParam(object_id);
      const path = "/_plugins/_observability/object/" + object_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getObjectFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/listObjects.js
var require_listObjects = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/listObjects.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function listObjectsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_observability/object";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = listObjectsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/updateObject.js
var require_updateObject = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/updateObject.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateObjectFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.object_id == null) return handleMissingParam("object_id", this, callback);
      let { body, object_id, ...querystring } = params;
      object_id = parsePathParam(object_id);
      const path = "/_plugins/_observability/object/" + object_id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateObjectFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/_api.js
var require_api17 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/observability/_api.js"(exports2, module2) {
    "use strict";
    function ObservabilityApi(bindObj) {
      this.createObject = require_createObject().bind(bindObj);
      this.deleteObject = require_deleteObject().bind(bindObj);
      this.deleteObjects = require_deleteObjects().bind(bindObj);
      this.getLocalstats = require_getLocalstats().bind(bindObj);
      this.getObject = require_getObject().bind(bindObj);
      this.listObjects = require_listObjects().bind(bindObj);
      this.updateObject = require_updateObject().bind(bindObj);
      this.create_object = require_createObject().bind(bindObj);
      this.delete_object = require_deleteObject().bind(bindObj);
      this.delete_objects = require_deleteObjects().bind(bindObj);
      this.get_localstats = require_getLocalstats().bind(bindObj);
      this.get_object = require_getObject().bind(bindObj);
      this.list_objects = require_listObjects().bind(bindObj);
      this.update_object = require_updateObject().bind(bindObj);
    }
    module2.exports = ObservabilityApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/explain.js
var require_explain = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/explain.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function explainFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ppl/_explain";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = explainFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/getStats.js
var require_getStats2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/getStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ppl/stats";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/postStats.js
var require_postStats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/postStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function postStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ppl/stats";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = postStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/query.js
var require_query = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/query.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function queryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_ppl";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = queryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/_api.js
var require_api18 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/ppl/_api.js"(exports2, module2) {
    "use strict";
    function PplApi(bindObj) {
      this.explain = require_explain().bind(bindObj);
      this.getStats = require_getStats2().bind(bindObj);
      this.postStats = require_postStats().bind(bindObj);
      this.query = require_query().bind(bindObj);
      this.get_stats = require_getStats2().bind(bindObj);
      this.post_stats = require_postStats().bind(bindObj);
    }
    module2.exports = PplApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourceDelete.js
var require_datasourceDelete = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourceDelete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function datasourceDeleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.datasource_name == null) return handleMissingParam("datasource_name", this, callback);
      let { body, datasource_name, ...querystring } = params;
      datasource_name = parsePathParam(datasource_name);
      const path = "/_plugins/_query/_datasources/" + datasource_name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = datasourceDeleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourceRetrieve.js
var require_datasourceRetrieve = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourceRetrieve.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function datasourceRetrieveFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.datasource_name == null) return handleMissingParam("datasource_name", this, callback);
      let { body, datasource_name, ...querystring } = params;
      datasource_name = parsePathParam(datasource_name);
      const path = "/_plugins/_query/_datasources/" + datasource_name;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = datasourceRetrieveFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourcesCreate.js
var require_datasourcesCreate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourcesCreate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function datasourcesCreateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_query/_datasources";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = datasourcesCreateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourcesList.js
var require_datasourcesList = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourcesList.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function datasourcesListFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_query/_datasources";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = datasourcesListFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourcesUpdate.js
var require_datasourcesUpdate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/datasourcesUpdate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function datasourcesUpdateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_query/_datasources";
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = datasourcesUpdateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/_api.js
var require_api19 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/query/_api.js"(exports2, module2) {
    "use strict";
    function QueryApi(bindObj) {
      this.datasourceDelete = require_datasourceDelete().bind(bindObj);
      this.datasourceRetrieve = require_datasourceRetrieve().bind(bindObj);
      this.datasourcesCreate = require_datasourcesCreate().bind(bindObj);
      this.datasourcesList = require_datasourcesList().bind(bindObj);
      this.datasourcesUpdate = require_datasourcesUpdate().bind(bindObj);
      this.datasource_delete = require_datasourceDelete().bind(bindObj);
      this.datasource_retrieve = require_datasourceRetrieve().bind(bindObj);
      this.datasources_create = require_datasourcesCreate().bind(bindObj);
      this.datasources_list = require_datasourcesList().bind(bindObj);
      this.datasources_update = require_datasourcesUpdate().bind(bindObj);
    }
    module2.exports = QueryApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/remoteStore/restore.js
var require_restore = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/remoteStore/restore.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function restoreFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_remotestore/_restore";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = restoreFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/remoteStore/_api.js
var require_api20 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/remoteStore/_api.js"(exports2, module2) {
    "use strict";
    function RemoteStoreApi(bindObj) {
      this.restore = require_restore().bind(bindObj);
    }
    module2.exports = RemoteStoreApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/autofollowStats.js
var require_autofollowStats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/autofollowStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function autofollowStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_replication/autofollow_stats";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = autofollowStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/createReplicationRule.js
var require_createReplicationRule = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/createReplicationRule.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function createReplicationRuleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_replication/_autofollow";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createReplicationRuleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/deleteReplicationRule.js
var require_deleteReplicationRule = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/deleteReplicationRule.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function deleteReplicationRuleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_replication/_autofollow";
      const method = "DELETE";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteReplicationRuleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/followerStats.js
var require_followerStats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/followerStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function followerStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_replication/follower_stats";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = followerStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/leaderStats.js
var require_leaderStats = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/leaderStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function leaderStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_replication/leader_stats";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = leaderStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/pause.js
var require_pause = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/pause.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function pauseFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_replication/" + index + "/_pause";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = pauseFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/resume.js
var require_resume = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/resume.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function resumeFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_replication/" + index + "/_resume";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = resumeFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/start.js
var require_start = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/start.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function startFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_replication/" + index + "/_start";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = startFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/status.js
var require_status = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/status.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function statusFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_replication/" + index + "/_status";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statusFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/stop.js
var require_stop = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/stop.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function stopFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_replication/" + index + "/_stop";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = stopFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/updateSettings.js
var require_updateSettings = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/updateSettings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateSettingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/_plugins/_replication/" + index + "/_update";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateSettingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/_api.js
var require_api21 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/replication/_api.js"(exports2, module2) {
    "use strict";
    function ReplicationApi(bindObj) {
      this.autofollowStats = require_autofollowStats().bind(bindObj);
      this.createReplicationRule = require_createReplicationRule().bind(bindObj);
      this.deleteReplicationRule = require_deleteReplicationRule().bind(bindObj);
      this.followerStats = require_followerStats().bind(bindObj);
      this.leaderStats = require_leaderStats().bind(bindObj);
      this.pause = require_pause().bind(bindObj);
      this.resume = require_resume().bind(bindObj);
      this.start = require_start().bind(bindObj);
      this.status = require_status().bind(bindObj);
      this.stop = require_stop().bind(bindObj);
      this.updateSettings = require_updateSettings().bind(bindObj);
      this.autofollow_stats = require_autofollowStats().bind(bindObj);
      this.create_replication_rule = require_createReplicationRule().bind(bindObj);
      this.delete_replication_rule = require_deleteReplicationRule().bind(bindObj);
      this.follower_stats = require_followerStats().bind(bindObj);
      this.leader_stats = require_leaderStats().bind(bindObj);
      this.update_settings = require_updateSettings().bind(bindObj);
    }
    module2.exports = ReplicationApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/delete.js
var require_delete5 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_rollup/jobs/" + id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/explain.js
var require_explain2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/explain.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function explainFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_rollup/jobs/" + id + "/_explain";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = explainFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/get.js
var require_get5 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_rollup/jobs/" + id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/put.js
var require_put2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/put.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_rollup/jobs/" + id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/start.js
var require_start2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/start.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function startFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_rollup/jobs/" + id + "/_start";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = startFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/stop.js
var require_stop2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/stop.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function stopFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_rollup/jobs/" + id + "/_stop";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = stopFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/_api.js
var require_api22 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/rollups/_api.js"(exports2, module2) {
    "use strict";
    function RollupsApi(bindObj) {
      this.delete = require_delete5().bind(bindObj);
      this.explain = require_explain2().bind(bindObj);
      this.get = require_get5().bind(bindObj);
      this.put = require_put2().bind(bindObj);
      this.start = require_start2().bind(bindObj);
      this.stop = require_stop2().bind(bindObj);
    }
    module2.exports = RollupsApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/delete.js
var require_delete6 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_search/pipeline/" + id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/get.js
var require_get6 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = ["/_search/pipeline", id].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/put.js
var require_put3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/put.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_search/pipeline/" + id;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/_api.js
var require_api23 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/searchPipeline/_api.js"(exports2, module2) {
    "use strict";
    function SearchPipelineApi(bindObj) {
      this.delete = require_delete6().bind(bindObj);
      this.get = require_get6().bind(bindObj);
      this.put = require_put3().bind(bindObj);
    }
    module2.exports = SearchPipelineApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/authinfo.js
var require_authinfo = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/authinfo.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function authinfoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/authinfo";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = authinfoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/authtoken.js
var require_authtoken = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/authtoken.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function authtokenFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/authtoken";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = authtokenFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/changePassword.js
var require_changePassword = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/changePassword.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function changePasswordFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/account";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = changePasswordFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/configUpgradeCheck.js
var require_configUpgradeCheck = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/configUpgradeCheck.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function configUpgradeCheckFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/_upgrade_check";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = configUpgradeCheckFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/configUpgradePerform.js
var require_configUpgradePerform = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/configUpgradePerform.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function configUpgradePerformFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/_upgrade_perform";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = configUpgradePerformFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createActionGroup.js
var require_createActionGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createActionGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createActionGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.action_group == null) return handleMissingParam("action_group", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, action_group, ...querystring } = params;
      action_group = parsePathParam(action_group);
      const path = "/_plugins/_security/api/actiongroups/" + action_group;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createActionGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createAllowlist.js
var require_createAllowlist = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createAllowlist.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function createAllowlistFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/allowlist";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createAllowlistFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createRole.js
var require_createRole = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createRole.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createRoleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/roles/" + role;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createRoleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createRoleMapping.js
var require_createRoleMapping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createRoleMapping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createRoleMappingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/rolesmapping/" + role;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createRoleMappingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createTenant.js
var require_createTenant = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createTenant.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createTenantFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.tenant == null) return handleMissingParam("tenant", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, tenant, ...querystring } = params;
      tenant = parsePathParam(tenant);
      const path = "/_plugins/_security/api/tenants/" + tenant;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createTenantFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createUpdateTenancyConfig.js
var require_createUpdateTenancyConfig = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createUpdateTenancyConfig.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function createUpdateTenancyConfigFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/tenancy/config";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createUpdateTenancyConfigFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createUser.js
var require_createUser = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createUser.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createUserFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/internalusers/" + username;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createUserFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createUserLegacy.js
var require_createUserLegacy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/createUserLegacy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createUserLegacyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/user/" + username;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createUserLegacyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteActionGroup.js
var require_deleteActionGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteActionGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteActionGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.action_group == null) return handleMissingParam("action_group", this, callback);
      let { body, action_group, ...querystring } = params;
      action_group = parsePathParam(action_group);
      const path = "/_plugins/_security/api/actiongroups/" + action_group;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteActionGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteDistinguishedName.js
var require_deleteDistinguishedName = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteDistinguishedName.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteDistinguishedNameFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.cluster_name == null) return handleMissingParam("cluster_name", this, callback);
      let { body, cluster_name, ...querystring } = params;
      cluster_name = parsePathParam(cluster_name);
      const path = "/_plugins/_security/api/nodesdn/" + cluster_name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteDistinguishedNameFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteRole.js
var require_deleteRole = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteRole.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteRoleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/roles/" + role;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteRoleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteRoleMapping.js
var require_deleteRoleMapping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteRoleMapping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteRoleMappingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/rolesmapping/" + role;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteRoleMappingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteTenant.js
var require_deleteTenant = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteTenant.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteTenantFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.tenant == null) return handleMissingParam("tenant", this, callback);
      let { body, tenant, ...querystring } = params;
      tenant = parsePathParam(tenant);
      const path = "/_plugins/_security/api/tenants/" + tenant;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteTenantFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteUser.js
var require_deleteUser = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteUser.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteUserFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/internalusers/" + username;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteUserFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteUserLegacy.js
var require_deleteUserLegacy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/deleteUserLegacy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteUserLegacyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/user/" + username;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteUserLegacyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/flushCache.js
var require_flushCache = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/flushCache.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function flushCacheFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/cache";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = flushCacheFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/generateOboToken.js
var require_generateOboToken = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/generateOboToken.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function generateOboTokenFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/generateonbehalfoftoken";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = generateOboTokenFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/generateUserToken.js
var require_generateUserToken = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/generateUserToken.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function generateUserTokenFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/internalusers/" + username + "/authtoken";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = generateUserTokenFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/generateUserTokenLegacy.js
var require_generateUserTokenLegacy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/generateUserTokenLegacy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function generateUserTokenLegacyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/user/" + username + "/authtoken";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = generateUserTokenLegacyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAccountDetails.js
var require_getAccountDetails = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAccountDetails.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getAccountDetailsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/account";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAccountDetailsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getActionGroup.js
var require_getActionGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getActionGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getActionGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.action_group == null) return handleMissingParam("action_group", this, callback);
      let { body, action_group, ...querystring } = params;
      action_group = parsePathParam(action_group);
      const path = "/_plugins/_security/api/actiongroups/" + action_group;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getActionGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getActionGroups.js
var require_getActionGroups = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getActionGroups.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getActionGroupsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/actiongroups";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getActionGroupsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAllCertificates.js
var require_getAllCertificates = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAllCertificates.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getAllCertificatesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/certificates";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAllCertificatesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAllowlist.js
var require_getAllowlist = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAllowlist.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getAllowlistFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/allowlist";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAllowlistFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAuditConfiguration.js
var require_getAuditConfiguration = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getAuditConfiguration.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getAuditConfigurationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/audit";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAuditConfigurationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getCertificates.js
var require_getCertificates = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getCertificates.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getCertificatesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/ssl/certs";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getCertificatesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getConfiguration.js
var require_getConfiguration = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getConfiguration.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getConfigurationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/securityconfig";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getConfigurationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getDashboardsInfo.js
var require_getDashboardsInfo = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getDashboardsInfo.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getDashboardsInfoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/dashboardsinfo";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getDashboardsInfoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getDistinguishedName.js
var require_getDistinguishedName = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getDistinguishedName.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getDistinguishedNameFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.cluster_name == null) return handleMissingParam("cluster_name", this, callback);
      let { body, cluster_name, ...querystring } = params;
      cluster_name = parsePathParam(cluster_name);
      const path = "/_plugins/_security/api/nodesdn/" + cluster_name;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getDistinguishedNameFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getDistinguishedNames.js
var require_getDistinguishedNames = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getDistinguishedNames.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getDistinguishedNamesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/nodesdn";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getDistinguishedNamesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getNodeCertificates.js
var require_getNodeCertificates = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getNodeCertificates.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getNodeCertificatesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.node_id == null) return handleMissingParam("node_id", this, callback);
      let { body, node_id, ...querystring } = params;
      node_id = parsePathParam(node_id);
      const path = "/_plugins/_security/api/certificates/" + node_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getNodeCertificatesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getPermissionsInfo.js
var require_getPermissionsInfo = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getPermissionsInfo.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getPermissionsInfoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/permissionsinfo";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getPermissionsInfoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRole.js
var require_getRole = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRole.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getRoleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/roles/" + role;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getRoleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRoleMapping.js
var require_getRoleMapping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRoleMapping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getRoleMappingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/rolesmapping/" + role;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getRoleMappingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRoleMappings.js
var require_getRoleMappings = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRoleMappings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getRoleMappingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/rolesmapping";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getRoleMappingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRoles.js
var require_getRoles = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getRoles.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getRolesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/roles";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getRolesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getSslinfo.js
var require_getSslinfo = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getSslinfo.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getSslinfoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_opendistro/_security/sslinfo";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getSslinfoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getTenancyConfig.js
var require_getTenancyConfig = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getTenancyConfig.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getTenancyConfigFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/tenancy/config";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getTenancyConfigFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getTenant.js
var require_getTenant = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getTenant.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getTenantFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.tenant == null) return handleMissingParam("tenant", this, callback);
      let { body, tenant, ...querystring } = params;
      tenant = parsePathParam(tenant);
      const path = "/_plugins/_security/api/tenants/" + tenant;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getTenantFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getTenants.js
var require_getTenants = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getTenants.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getTenantsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/tenants";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getTenantsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUser.js
var require_getUser = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUser.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getUserFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/internalusers/" + username;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getUserFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUserLegacy.js
var require_getUserLegacy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUserLegacy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getUserLegacyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/user/" + username;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getUserLegacyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUsers.js
var require_getUsers = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUsers.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getUsersFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/internalusers";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getUsersFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUsersLegacy.js
var require_getUsersLegacy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/getUsersLegacy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getUsersLegacyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/user";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getUsersLegacyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/health.js
var require_health3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/health.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function healthFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/health";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = healthFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/migrate.js
var require_migrate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/migrate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function migrateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/migrate";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = migrateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchActionGroup.js
var require_patchActionGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchActionGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function patchActionGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.action_group == null) return handleMissingParam("action_group", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, action_group, ...querystring } = params;
      action_group = parsePathParam(action_group);
      const path = "/_plugins/_security/api/actiongroups/" + action_group;
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchActionGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchActionGroups.js
var require_patchActionGroups = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchActionGroups.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchActionGroupsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/actiongroups";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchActionGroupsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchAllowlist.js
var require_patchAllowlist = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchAllowlist.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchAllowlistFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/allowlist";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchAllowlistFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchAuditConfiguration.js
var require_patchAuditConfiguration = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchAuditConfiguration.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchAuditConfigurationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/audit";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchAuditConfigurationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchConfiguration.js
var require_patchConfiguration = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchConfiguration.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchConfigurationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/securityconfig";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchConfigurationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchDistinguishedName.js
var require_patchDistinguishedName = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchDistinguishedName.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function patchDistinguishedNameFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.cluster_name == null) return handleMissingParam("cluster_name", this, callback);
      let { body, cluster_name, ...querystring } = params;
      cluster_name = parsePathParam(cluster_name);
      const path = "/_plugins/_security/api/nodesdn/" + cluster_name;
      const method = "PATCH";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchDistinguishedNameFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchDistinguishedNames.js
var require_patchDistinguishedNames = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchDistinguishedNames.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchDistinguishedNamesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/nodesdn";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchDistinguishedNamesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRole.js
var require_patchRole = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRole.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function patchRoleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/roles/" + role;
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchRoleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRoleMapping.js
var require_patchRoleMapping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRoleMapping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function patchRoleMappingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.role == null) return handleMissingParam("role", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, role, ...querystring } = params;
      role = parsePathParam(role);
      const path = "/_plugins/_security/api/rolesmapping/" + role;
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchRoleMappingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRoleMappings.js
var require_patchRoleMappings = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRoleMappings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchRoleMappingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/rolesmapping";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchRoleMappingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRoles.js
var require_patchRoles = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchRoles.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchRolesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/roles";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchRolesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchTenant.js
var require_patchTenant = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchTenant.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function patchTenantFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.tenant == null) return handleMissingParam("tenant", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, tenant, ...querystring } = params;
      tenant = parsePathParam(tenant);
      const path = "/_plugins/_security/api/tenants/" + tenant;
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchTenantFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchTenants.js
var require_patchTenants = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchTenants.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchTenantsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/tenants";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchTenantsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchUser.js
var require_patchUser = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchUser.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function patchUserFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.username == null) return handleMissingParam("username", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, username, ...querystring } = params;
      username = parsePathParam(username);
      const path = "/_plugins/_security/api/internalusers/" + username;
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchUserFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchUsers.js
var require_patchUsers = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/patchUsers.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function patchUsersFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/internalusers";
      const method = "PATCH";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = patchUsersFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/postDashboardsInfo.js
var require_postDashboardsInfo = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/postDashboardsInfo.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function postDashboardsInfoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/dashboardsinfo";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = postDashboardsInfoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/reloadHttpCertificates.js
var require_reloadHttpCertificates = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/reloadHttpCertificates.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function reloadHttpCertificatesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/ssl/http/reloadcerts";
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = reloadHttpCertificatesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/reloadTransportCertificates.js
var require_reloadTransportCertificates = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/reloadTransportCertificates.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function reloadTransportCertificatesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/ssl/transport/reloadcerts";
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = reloadTransportCertificatesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/tenantInfo.js
var require_tenantInfo = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/tenantInfo.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function tenantInfoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/tenantinfo";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = tenantInfoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/updateAuditConfiguration.js
var require_updateAuditConfiguration = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/updateAuditConfiguration.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function updateAuditConfigurationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/audit/config";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateAuditConfigurationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/updateConfiguration.js
var require_updateConfiguration = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/updateConfiguration.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function updateConfigurationFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/securityconfig/config";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateConfigurationFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/updateDistinguishedName.js
var require_updateDistinguishedName = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/updateDistinguishedName.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateDistinguishedNameFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.cluster_name == null) return handleMissingParam("cluster_name", this, callback);
      let { body, cluster_name, ...querystring } = params;
      cluster_name = parsePathParam(cluster_name);
      const path = "/_plugins/_security/api/nodesdn/" + cluster_name;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateDistinguishedNameFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/validate.js
var require_validate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/validate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function validateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/api/validate";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = validateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/whoAmI.js
var require_whoAmI = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/whoAmI.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function whoAmIFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/whoami";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = whoAmIFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/whoAmIProtected.js
var require_whoAmIProtected = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/whoAmIProtected.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function whoAmIProtectedFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_security/whoamiprotected";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = whoAmIProtectedFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/_api.js
var require_api24 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/security/_api.js"(exports2, module2) {
    "use strict";
    function SecurityApi(bindObj) {
      this.authinfo = require_authinfo().bind(bindObj);
      this.authtoken = require_authtoken().bind(bindObj);
      this.changePassword = require_changePassword().bind(bindObj);
      this.configUpgradeCheck = require_configUpgradeCheck().bind(bindObj);
      this.configUpgradePerform = require_configUpgradePerform().bind(bindObj);
      this.createActionGroup = require_createActionGroup().bind(bindObj);
      this.createAllowlist = require_createAllowlist().bind(bindObj);
      this.createRole = require_createRole().bind(bindObj);
      this.createRoleMapping = require_createRoleMapping().bind(bindObj);
      this.createTenant = require_createTenant().bind(bindObj);
      this.createUpdateTenancyConfig = require_createUpdateTenancyConfig().bind(bindObj);
      this.createUser = require_createUser().bind(bindObj);
      this.createUserLegacy = require_createUserLegacy().bind(bindObj);
      this.deleteActionGroup = require_deleteActionGroup().bind(bindObj);
      this.deleteDistinguishedName = require_deleteDistinguishedName().bind(bindObj);
      this.deleteRole = require_deleteRole().bind(bindObj);
      this.deleteRoleMapping = require_deleteRoleMapping().bind(bindObj);
      this.deleteTenant = require_deleteTenant().bind(bindObj);
      this.deleteUser = require_deleteUser().bind(bindObj);
      this.deleteUserLegacy = require_deleteUserLegacy().bind(bindObj);
      this.flushCache = require_flushCache().bind(bindObj);
      this.generateOboToken = require_generateOboToken().bind(bindObj);
      this.generateUserToken = require_generateUserToken().bind(bindObj);
      this.generateUserTokenLegacy = require_generateUserTokenLegacy().bind(bindObj);
      this.getAccountDetails = require_getAccountDetails().bind(bindObj);
      this.getActionGroup = require_getActionGroup().bind(bindObj);
      this.getActionGroups = require_getActionGroups().bind(bindObj);
      this.getAllCertificates = require_getAllCertificates().bind(bindObj);
      this.getAllowlist = require_getAllowlist().bind(bindObj);
      this.getAuditConfiguration = require_getAuditConfiguration().bind(bindObj);
      this.getCertificates = require_getCertificates().bind(bindObj);
      this.getConfiguration = require_getConfiguration().bind(bindObj);
      this.getDashboardsInfo = require_getDashboardsInfo().bind(bindObj);
      this.getDistinguishedName = require_getDistinguishedName().bind(bindObj);
      this.getDistinguishedNames = require_getDistinguishedNames().bind(bindObj);
      this.getNodeCertificates = require_getNodeCertificates().bind(bindObj);
      this.getPermissionsInfo = require_getPermissionsInfo().bind(bindObj);
      this.getRole = require_getRole().bind(bindObj);
      this.getRoleMapping = require_getRoleMapping().bind(bindObj);
      this.getRoleMappings = require_getRoleMappings().bind(bindObj);
      this.getRoles = require_getRoles().bind(bindObj);
      this.getSslinfo = require_getSslinfo().bind(bindObj);
      this.getTenancyConfig = require_getTenancyConfig().bind(bindObj);
      this.getTenant = require_getTenant().bind(bindObj);
      this.getTenants = require_getTenants().bind(bindObj);
      this.getUser = require_getUser().bind(bindObj);
      this.getUserLegacy = require_getUserLegacy().bind(bindObj);
      this.getUsers = require_getUsers().bind(bindObj);
      this.getUsersLegacy = require_getUsersLegacy().bind(bindObj);
      this.health = require_health3().bind(bindObj);
      this.migrate = require_migrate().bind(bindObj);
      this.patchActionGroup = require_patchActionGroup().bind(bindObj);
      this.patchActionGroups = require_patchActionGroups().bind(bindObj);
      this.patchAllowlist = require_patchAllowlist().bind(bindObj);
      this.patchAuditConfiguration = require_patchAuditConfiguration().bind(bindObj);
      this.patchConfiguration = require_patchConfiguration().bind(bindObj);
      this.patchDistinguishedName = require_patchDistinguishedName().bind(bindObj);
      this.patchDistinguishedNames = require_patchDistinguishedNames().bind(bindObj);
      this.patchRole = require_patchRole().bind(bindObj);
      this.patchRoleMapping = require_patchRoleMapping().bind(bindObj);
      this.patchRoleMappings = require_patchRoleMappings().bind(bindObj);
      this.patchRoles = require_patchRoles().bind(bindObj);
      this.patchTenant = require_patchTenant().bind(bindObj);
      this.patchTenants = require_patchTenants().bind(bindObj);
      this.patchUser = require_patchUser().bind(bindObj);
      this.patchUsers = require_patchUsers().bind(bindObj);
      this.postDashboardsInfo = require_postDashboardsInfo().bind(bindObj);
      this.reloadHttpCertificates = require_reloadHttpCertificates().bind(bindObj);
      this.reloadTransportCertificates = require_reloadTransportCertificates().bind(bindObj);
      this.tenantInfo = require_tenantInfo().bind(bindObj);
      this.updateAuditConfiguration = require_updateAuditConfiguration().bind(bindObj);
      this.updateConfiguration = require_updateConfiguration().bind(bindObj);
      this.updateDistinguishedName = require_updateDistinguishedName().bind(bindObj);
      this.validate = require_validate().bind(bindObj);
      this.whoAmI = require_whoAmI().bind(bindObj);
      this.whoAmIProtected = require_whoAmIProtected().bind(bindObj);
      this.change_password = require_changePassword().bind(bindObj);
      this.config_upgrade_check = require_configUpgradeCheck().bind(bindObj);
      this.config_upgrade_perform = require_configUpgradePerform().bind(bindObj);
      this.create_action_group = require_createActionGroup().bind(bindObj);
      this.create_allowlist = require_createAllowlist().bind(bindObj);
      this.create_role = require_createRole().bind(bindObj);
      this.create_role_mapping = require_createRoleMapping().bind(bindObj);
      this.create_tenant = require_createTenant().bind(bindObj);
      this.create_update_tenancy_config = require_createUpdateTenancyConfig().bind(bindObj);
      this.create_user = require_createUser().bind(bindObj);
      this.create_user_legacy = require_createUserLegacy().bind(bindObj);
      this.delete_action_group = require_deleteActionGroup().bind(bindObj);
      this.delete_distinguished_name = require_deleteDistinguishedName().bind(bindObj);
      this.delete_role = require_deleteRole().bind(bindObj);
      this.delete_role_mapping = require_deleteRoleMapping().bind(bindObj);
      this.delete_tenant = require_deleteTenant().bind(bindObj);
      this.delete_user = require_deleteUser().bind(bindObj);
      this.delete_user_legacy = require_deleteUserLegacy().bind(bindObj);
      this.flush_cache = require_flushCache().bind(bindObj);
      this.generate_obo_token = require_generateOboToken().bind(bindObj);
      this.generate_user_token = require_generateUserToken().bind(bindObj);
      this.generate_user_token_legacy = require_generateUserTokenLegacy().bind(bindObj);
      this.get_account_details = require_getAccountDetails().bind(bindObj);
      this.get_action_group = require_getActionGroup().bind(bindObj);
      this.get_action_groups = require_getActionGroups().bind(bindObj);
      this.get_all_certificates = require_getAllCertificates().bind(bindObj);
      this.get_allowlist = require_getAllowlist().bind(bindObj);
      this.get_audit_configuration = require_getAuditConfiguration().bind(bindObj);
      this.get_certificates = require_getCertificates().bind(bindObj);
      this.get_configuration = require_getConfiguration().bind(bindObj);
      this.get_dashboards_info = require_getDashboardsInfo().bind(bindObj);
      this.get_distinguished_name = require_getDistinguishedName().bind(bindObj);
      this.get_distinguished_names = require_getDistinguishedNames().bind(bindObj);
      this.get_node_certificates = require_getNodeCertificates().bind(bindObj);
      this.get_permissions_info = require_getPermissionsInfo().bind(bindObj);
      this.get_role = require_getRole().bind(bindObj);
      this.get_role_mapping = require_getRoleMapping().bind(bindObj);
      this.get_role_mappings = require_getRoleMappings().bind(bindObj);
      this.get_roles = require_getRoles().bind(bindObj);
      this.get_sslinfo = require_getSslinfo().bind(bindObj);
      this.get_tenancy_config = require_getTenancyConfig().bind(bindObj);
      this.get_tenant = require_getTenant().bind(bindObj);
      this.get_tenants = require_getTenants().bind(bindObj);
      this.get_user = require_getUser().bind(bindObj);
      this.get_user_legacy = require_getUserLegacy().bind(bindObj);
      this.get_users = require_getUsers().bind(bindObj);
      this.get_users_legacy = require_getUsersLegacy().bind(bindObj);
      this.patch_action_group = require_patchActionGroup().bind(bindObj);
      this.patch_action_groups = require_patchActionGroups().bind(bindObj);
      this.patch_allowlist = require_patchAllowlist().bind(bindObj);
      this.patch_audit_configuration = require_patchAuditConfiguration().bind(bindObj);
      this.patch_configuration = require_patchConfiguration().bind(bindObj);
      this.patch_distinguished_name = require_patchDistinguishedName().bind(bindObj);
      this.patch_distinguished_names = require_patchDistinguishedNames().bind(bindObj);
      this.patch_role = require_patchRole().bind(bindObj);
      this.patch_role_mapping = require_patchRoleMapping().bind(bindObj);
      this.patch_role_mappings = require_patchRoleMappings().bind(bindObj);
      this.patch_roles = require_patchRoles().bind(bindObj);
      this.patch_tenant = require_patchTenant().bind(bindObj);
      this.patch_tenants = require_patchTenants().bind(bindObj);
      this.patch_user = require_patchUser().bind(bindObj);
      this.patch_users = require_patchUsers().bind(bindObj);
      this.post_dashboards_info = require_postDashboardsInfo().bind(bindObj);
      this.reload_http_certificates = require_reloadHttpCertificates().bind(bindObj);
      this.reload_transport_certificates = require_reloadTransportCertificates().bind(bindObj);
      this.tenant_info = require_tenantInfo().bind(bindObj);
      this.update_audit_configuration = require_updateAuditConfiguration().bind(bindObj);
      this.update_configuration = require_updateConfiguration().bind(bindObj);
      this.update_distinguished_name = require_updateDistinguishedName().bind(bindObj);
      this.who_am_i = require_whoAmI().bind(bindObj);
      this.who_am_i_protected = require_whoAmIProtected().bind(bindObj);
    }
    module2.exports = SecurityApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/createPolicy.js
var require_createPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/createPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_name == null) return handleMissingParam("policy_name", this, callback);
      let { body, policy_name, ...querystring } = params;
      policy_name = parsePathParam(policy_name);
      const path = "/_plugins/_sm/policies/" + policy_name;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/deletePolicy.js
var require_deletePolicy2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/deletePolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deletePolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_name == null) return handleMissingParam("policy_name", this, callback);
      let { body, policy_name, ...querystring } = params;
      policy_name = parsePathParam(policy_name);
      const path = "/_plugins/_sm/policies/" + policy_name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deletePolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/explainPolicy.js
var require_explainPolicy2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/explainPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function explainPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_name == null) return handleMissingParam("policy_name", this, callback);
      let { body, policy_name, ...querystring } = params;
      policy_name = parsePathParam(policy_name);
      const path = "/_plugins/_sm/policies/" + policy_name + "/_explain";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = explainPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/getPolicies.js
var require_getPolicies2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/getPolicies.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getPoliciesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_sm/policies";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getPoliciesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/getPolicy.js
var require_getPolicy2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/getPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_name == null) return handleMissingParam("policy_name", this, callback);
      let { body, policy_name, ...querystring } = params;
      policy_name = parsePathParam(policy_name);
      const path = "/_plugins/_sm/policies/" + policy_name;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/startPolicy.js
var require_startPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/startPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function startPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_name == null) return handleMissingParam("policy_name", this, callback);
      let { body, policy_name, ...querystring } = params;
      policy_name = parsePathParam(policy_name);
      const path = "/_plugins/_sm/policies/" + policy_name + "/_start";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = startPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/stopPolicy.js
var require_stopPolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/stopPolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function stopPolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.policy_name == null) return handleMissingParam("policy_name", this, callback);
      let { body, policy_name, ...querystring } = params;
      policy_name = parsePathParam(policy_name);
      const path = "/_plugins/_sm/policies/" + policy_name + "/_stop";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = stopPolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/updatePolicy.js
var require_updatePolicy = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/updatePolicy.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updatePolicyFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.if_primary_term == null) return handleMissingParam("if_primary_term", this, callback);
      if (params.if_seq_no == null) return handleMissingParam("if_seq_no", this, callback);
      if (params.policy_name == null) return handleMissingParam("policy_name", this, callback);
      let { body, policy_name, ...querystring } = params;
      policy_name = parsePathParam(policy_name);
      const path = "/_plugins/_sm/policies/" + policy_name;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updatePolicyFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/_api.js
var require_api25 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sm/_api.js"(exports2, module2) {
    "use strict";
    function SmApi(bindObj) {
      this.createPolicy = require_createPolicy().bind(bindObj);
      this.deletePolicy = require_deletePolicy2().bind(bindObj);
      this.explainPolicy = require_explainPolicy2().bind(bindObj);
      this.getPolicies = require_getPolicies2().bind(bindObj);
      this.getPolicy = require_getPolicy2().bind(bindObj);
      this.startPolicy = require_startPolicy().bind(bindObj);
      this.stopPolicy = require_stopPolicy().bind(bindObj);
      this.updatePolicy = require_updatePolicy().bind(bindObj);
      this.create_policy = require_createPolicy().bind(bindObj);
      this.delete_policy = require_deletePolicy2().bind(bindObj);
      this.explain_policy = require_explainPolicy2().bind(bindObj);
      this.get_policies = require_getPolicies2().bind(bindObj);
      this.get_policy = require_getPolicy2().bind(bindObj);
      this.start_policy = require_startPolicy().bind(bindObj);
      this.stop_policy = require_stopPolicy().bind(bindObj);
      this.update_policy = require_updatePolicy().bind(bindObj);
    }
    module2.exports = SmApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/cleanupRepository.js
var require_cleanupRepository = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/cleanupRepository.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function cleanupRepositoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      let { body, repository, ...querystring } = params;
      repository = parsePathParam(repository);
      const path = "/_snapshot/" + repository + "/_cleanup";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = cleanupRepositoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/clone.js
var require_clone2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/clone.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function cloneFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      if (params.snapshot == null) return handleMissingParam("snapshot", this, callback);
      if (params.target_snapshot == null) return handleMissingParam("target_snapshot", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, repository, snapshot, target_snapshot, ...querystring } = params;
      repository = parsePathParam(repository);
      snapshot = parsePathParam(snapshot);
      target_snapshot = parsePathParam(target_snapshot);
      const path = "/_snapshot/" + repository + "/" + snapshot + "/_clone/" + target_snapshot;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = cloneFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/create.js
var require_create3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/create.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      if (params.snapshot == null) return handleMissingParam("snapshot", this, callback);
      let { body, repository, snapshot, ...querystring } = params;
      repository = parsePathParam(repository);
      snapshot = parsePathParam(snapshot);
      const path = "/_snapshot/" + repository + "/" + snapshot;
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/createRepository.js
var require_createRepository = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/createRepository.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createRepositoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, repository, ...querystring } = params;
      repository = parsePathParam(repository);
      const path = "/_snapshot/" + repository;
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createRepositoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/delete.js
var require_delete7 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      if (params.snapshot == null) return handleMissingParam("snapshot", this, callback);
      let { body, repository, snapshot, ...querystring } = params;
      repository = parsePathParam(repository);
      snapshot = parsePathParam(snapshot);
      const path = "/_snapshot/" + repository + "/" + snapshot;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/deleteRepository.js
var require_deleteRepository = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/deleteRepository.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteRepositoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      let { body, repository, ...querystring } = params;
      repository = parsePathParam(repository);
      const path = "/_snapshot/" + repository;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteRepositoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/get.js
var require_get7 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      if (params.snapshot == null) return handleMissingParam("snapshot", this, callback);
      let { body, repository, snapshot, ...querystring } = params;
      repository = parsePathParam(repository);
      snapshot = parsePathParam(snapshot);
      const path = "/_snapshot/" + repository + "/" + snapshot;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/getRepository.js
var require_getRepository = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/getRepository.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getRepositoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, repository, ...querystring } = params;
      repository = parsePathParam(repository);
      const path = ["/_snapshot", repository].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getRepositoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/restore.js
var require_restore2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/restore.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function restoreFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      if (params.snapshot == null) return handleMissingParam("snapshot", this, callback);
      let { body, repository, snapshot, ...querystring } = params;
      repository = parsePathParam(repository);
      snapshot = parsePathParam(snapshot);
      const path = "/_snapshot/" + repository + "/" + snapshot + "/_restore";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = restoreFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/status.js
var require_status2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/status.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function statusFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, repository, snapshot, ...querystring } = params;
      repository = parsePathParam(repository);
      snapshot = parsePathParam(snapshot);
      const path = ["/_snapshot", repository, snapshot, "_status"].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = statusFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/verifyRepository.js
var require_verifyRepository = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/verifyRepository.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function verifyRepositoryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.repository == null) return handleMissingParam("repository", this, callback);
      let { body, repository, ...querystring } = params;
      repository = parsePathParam(repository);
      const path = "/_snapshot/" + repository + "/_verify";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = verifyRepositoryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/_api.js
var require_api26 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/snapshot/_api.js"(exports2, module2) {
    "use strict";
    function SnapshotApi(bindObj) {
      this.cleanupRepository = require_cleanupRepository().bind(bindObj);
      this.clone = require_clone2().bind(bindObj);
      this.create = require_create3().bind(bindObj);
      this.createRepository = require_createRepository().bind(bindObj);
      this.delete = require_delete7().bind(bindObj);
      this.deleteRepository = require_deleteRepository().bind(bindObj);
      this.get = require_get7().bind(bindObj);
      this.getRepository = require_getRepository().bind(bindObj);
      this.restore = require_restore2().bind(bindObj);
      this.status = require_status2().bind(bindObj);
      this.verifyRepository = require_verifyRepository().bind(bindObj);
      this.cleanup_repository = require_cleanupRepository().bind(bindObj);
      this.create_repository = require_createRepository().bind(bindObj);
      this.delete_repository = require_deleteRepository().bind(bindObj);
      this.get_repository = require_getRepository().bind(bindObj);
      this.verify_repository = require_verifyRepository().bind(bindObj);
    }
    module2.exports = SnapshotApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/close.js
var require_close2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/close.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function closeFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_sql/close";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = closeFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/explain.js
var require_explain3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/explain.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function explainFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_sql/_explain";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = explainFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/getStats.js
var require_getStats3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/getStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_sql/stats";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/postStats.js
var require_postStats2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/postStats.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function postStatsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_sql/stats";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = postStatsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/query.js
var require_query2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/query.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function queryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_sql";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = queryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/settings.js
var require_settings = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/settings.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function settingsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_query/settings";
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = settingsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/_api.js
var require_api27 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/sql/_api.js"(exports2, module2) {
    "use strict";
    function SqlApi(bindObj) {
      this.close = require_close2().bind(bindObj);
      this.explain = require_explain3().bind(bindObj);
      this.getStats = require_getStats3().bind(bindObj);
      this.postStats = require_postStats2().bind(bindObj);
      this.query = require_query2().bind(bindObj);
      this.settings = require_settings().bind(bindObj);
      this.get_stats = require_getStats3().bind(bindObj);
      this.post_stats = require_postStats2().bind(bindObj);
    }
    module2.exports = SqlApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/cancel.js
var require_cancel = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/cancel.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function cancelFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = ["/_tasks", task_id, "_cancel"].filter((c) => c != null).join("/");
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = cancelFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/get.js
var require_get8 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.task_id == null) return handleMissingParam("task_id", this, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = "/_tasks/" + task_id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/list.js
var require_list = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/list.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function listFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_tasks";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = listFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/_api.js
var require_api28 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/tasks/_api.js"(exports2, module2) {
    "use strict";
    function TasksApi(bindObj) {
      this.cancel = require_cancel().bind(bindObj);
      this.get = require_get8().bind(bindObj);
      this.list = require_list().bind(bindObj);
    }
    module2.exports = TasksApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/delete.js
var require_delete8 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_transform/" + id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/explain.js
var require_explain4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/explain.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function explainFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_transform/" + id + "/_explain";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = explainFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/get.js
var require_get9 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_transform/" + id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/preview.js
var require_preview = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/preview.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function previewFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_transform/_preview";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = previewFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/put.js
var require_put4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/put.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_transform/" + id;
      const method = "PUT";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/search.js
var require_search3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/search.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function searchFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_plugins/_transform";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/start.js
var require_start3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/start.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function startFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_transform/" + id + "/_start";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = startFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/stop.js
var require_stop3 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/stop.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function stopFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_plugins/_transform/" + id + "/_stop";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = stopFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/_api.js
var require_api29 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/transforms/_api.js"(exports2, module2) {
    "use strict";
    function TransformsApi(bindObj) {
      this.delete = require_delete8().bind(bindObj);
      this.explain = require_explain4().bind(bindObj);
      this.get = require_get9().bind(bindObj);
      this.preview = require_preview().bind(bindObj);
      this.put = require_put4().bind(bindObj);
      this.search = require_search3().bind(bindObj);
      this.start = require_start3().bind(bindObj);
      this.stop = require_stop3().bind(bindObj);
    }
    module2.exports = TransformsApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/createQueryGroup.js
var require_createQueryGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/createQueryGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function createQueryGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_wlm/query_group";
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createQueryGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/deleteQueryGroup.js
var require_deleteQueryGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/deleteQueryGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteQueryGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_wlm/query_group/" + name;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteQueryGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/getQueryGroup.js
var require_getQueryGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/getQueryGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function getQueryGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = ["/_wlm/query_group", name].filter((c) => c != null).join("/");
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getQueryGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/updateQueryGroup.js
var require_updateQueryGroup = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/updateQueryGroup.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateQueryGroupFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.name == null) return handleMissingParam("name", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, name, ...querystring } = params;
      name = parsePathParam(name);
      const path = "/_wlm/query_group/" + name;
      const method = "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateQueryGroupFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/_api.js
var require_api30 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/wlm/_api.js"(exports2, module2) {
    "use strict";
    function WlmApi(bindObj) {
      this.createQueryGroup = require_createQueryGroup().bind(bindObj);
      this.deleteQueryGroup = require_deleteQueryGroup().bind(bindObj);
      this.getQueryGroup = require_getQueryGroup().bind(bindObj);
      this.updateQueryGroup = require_updateQueryGroup().bind(bindObj);
      this.create_query_group = require_createQueryGroup().bind(bindObj);
      this.delete_query_group = require_deleteQueryGroup().bind(bindObj);
      this.get_query_group = require_getQueryGroup().bind(bindObj);
      this.update_query_group = require_updateQueryGroup().bind(bindObj);
    }
    module2.exports = WlmApi;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/bulk.js
var require_bulk = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/bulk.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function bulkFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_bulk"].filter((c) => c != null).join("/");
      const method = index == null ? "POST" : "PUT";
      return this.transport.request({ method, path, querystring, bulkBody: body }, options, callback);
    }
    module2.exports = bulkFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/bulkStream.js
var require_bulkStream = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/bulkStream.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function bulkStreamFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_bulk/stream"].filter((c) => c != null).join("/");
      const method = index == null ? "POST" : "PUT";
      return this.transport.request({ method, path, querystring, bulkBody: body }, options, callback);
    }
    module2.exports = bulkStreamFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/clearScroll.js
var require_clearScroll = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/clearScroll.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function clearScrollFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, scroll_id, ...querystring } = params;
      scroll_id = parsePathParam(scroll_id);
      const path = ["/_search/scroll", scroll_id].filter((c) => c != null).join("/");
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = clearScrollFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/count.js
var require_count2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/count.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function countFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_count"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = countFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/create.js
var require_create4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/create.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_create/" + id;
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/createPit.js
var require_createPit = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/createPit.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function createPitFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index + "/_search/point_in_time";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = createPitFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/delete.js
var require_delete9 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/delete.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_doc/" + id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteAllPits.js
var require_deleteAllPits = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteAllPits.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function deleteAllPitsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_search/point_in_time/_all";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteAllPitsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteByQuery.js
var require_deleteByQuery = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteByQuery.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteByQueryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index + "/_delete_by_query";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteByQueryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteByQueryRethrottle.js
var require_deleteByQueryRethrottle = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteByQueryRethrottle.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteByQueryRethrottleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.task_id == null) return handleMissingParam("task_id", this, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = "/_delete_by_query/" + task_id + "/_rethrottle";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteByQueryRethrottleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deletePit.js
var require_deletePit = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deletePit.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function deletePitFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_search/point_in_time";
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deletePitFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteScript.js
var require_deleteScript = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/deleteScript.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function deleteScriptFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_scripts/" + id;
      const method = "DELETE";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = deleteScriptFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/exists.js
var require_exists2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/exists.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_doc/" + id;
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/existsSource.js
var require_existsSource = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/existsSource.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function existsSourceFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_source/" + id;
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = existsSourceFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/explain.js
var require_explain5 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/explain.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function explainFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_explain/" + id;
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = explainFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/fieldCaps.js
var require_fieldCaps = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/fieldCaps.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function fieldCapsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_field_caps"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = fieldCapsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/get.js
var require_get10 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/get.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_doc/" + id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getAllPits.js
var require_getAllPits = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getAllPits.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getAllPitsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_search/point_in_time/_all";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getAllPitsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getScript.js
var require_getScript = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getScript.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getScriptFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = "/_scripts/" + id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getScriptFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getScriptContext.js
var require_getScriptContext = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getScriptContext.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getScriptContextFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_script_context";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getScriptContextFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getScriptLanguages.js
var require_getScriptLanguages = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getScriptLanguages.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function getScriptLanguagesFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_script_language";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getScriptLanguagesFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getSource.js
var require_getSource = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/getSource.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function getSourceFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_source/" + id;
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = getSourceFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/index.js
var require_core = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/index.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function indexFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, id, ...querystring } = params;
      index = parsePathParam(index);
      id = parsePathParam(id);
      const path = ["", index, "_doc", id].filter((c) => c != null).join("/");
      const method = id == null ? "POST" : "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = indexFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/info.js
var require_info2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/info.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function infoFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/";
      const method = "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = infoFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/mget.js
var require_mget = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/mget.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function mgetFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_mget"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = mgetFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/msearch.js
var require_msearch = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/msearch.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function msearchFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_msearch"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, bulkBody: body }, options, callback);
    }
    module2.exports = msearchFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/msearchTemplate.js
var require_msearchTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/msearchTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function msearchTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_msearch/template"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, bulkBody: body }, options, callback);
    }
    module2.exports = msearchTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/mtermvectors.js
var require_mtermvectors = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/mtermvectors.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function mtermvectorsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_mtermvectors"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = mtermvectorsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/ping.js
var require_ping = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/ping.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function pingFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/";
      const method = "HEAD";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = pingFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/putScript.js
var require_putScript = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/putScript.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function putScriptFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, id, context, ...querystring } = params;
      id = parsePathParam(id);
      context = parsePathParam(context);
      const path = ["/_scripts", id, context].filter((c) => c != null).join("/");
      const method = context == null ? "POST" : "PUT";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = putScriptFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/rankEval.js
var require_rankEval = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/rankEval.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function rankEvalFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_rank_eval"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = rankEvalFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/reindex.js
var require_reindex = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/reindex.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, handleMissingParam } = require_utils();
    function reindexFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, ...querystring } = params;
      const path = "/_reindex";
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = reindexFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/reindexRethrottle.js
var require_reindexRethrottle = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/reindexRethrottle.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function reindexRethrottleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.task_id == null) return handleMissingParam("task_id", this, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = "/_reindex/" + task_id + "/_rethrottle";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = reindexRethrottleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/renderSearchTemplate.js
var require_renderSearchTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/renderSearchTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function renderSearchTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, id, ...querystring } = params;
      id = parsePathParam(id);
      const path = ["/_render/template", id].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = renderSearchTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/scriptsPainlessExecute.js
var require_scriptsPainlessExecute = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/scriptsPainlessExecute.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments } = require_utils();
    function scriptsPainlessExecuteFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, ...querystring } = params;
      const path = "/_scripts/painless/_execute";
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = scriptsPainlessExecuteFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/scroll.js
var require_scroll = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/scroll.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function scrollFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, scroll_id, ...querystring } = params;
      scroll_id = parsePathParam(scroll_id);
      const path = ["/_search/scroll", scroll_id].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = scrollFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/search.js
var require_search4 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/search.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function searchFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_search"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/searchShards.js
var require_searchShards = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/searchShards.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam } = require_utils();
    function searchShardsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_search_shards"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchShardsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/searchTemplate.js
var require_searchTemplate = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/searchTemplate.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function searchTemplateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = ["", index, "_search/template"].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = searchTemplateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/termvectors.js
var require_termvectors = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/termvectors.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function termvectorsFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, id, ...querystring } = params;
      index = parsePathParam(index);
      id = parsePathParam(id);
      const path = ["", index, "_termvectors", id].filter((c) => c != null).join("/");
      const method = body ? "POST" : "GET";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = termvectorsFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/update.js
var require_update2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/update.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.id == null) return handleMissingParam("id", this, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      if (params.body == null) return handleMissingParam("body", this, callback);
      let { body, id, index, ...querystring } = params;
      id = parsePathParam(id);
      index = parsePathParam(index);
      const path = "/" + index + "/_update/" + id;
      const method = "POST";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/updateByQuery.js
var require_updateByQuery = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/updateByQuery.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateByQueryFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.index == null) return handleMissingParam("index", this, callback);
      let { body, index, ...querystring } = params;
      index = parsePathParam(index);
      const path = "/" + index + "/_update_by_query";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateByQueryFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/updateByQueryRethrottle.js
var require_updateByQueryRethrottle = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/_core/updateByQueryRethrottle.js"(exports2, module2) {
    "use strict";
    var { normalizeArguments, parsePathParam, handleMissingParam } = require_utils();
    function updateByQueryRethrottleFunc(params, options, callback) {
      [params, options, callback] = normalizeArguments(params, options, callback);
      if (params.task_id == null) return handleMissingParam("task_id", this, callback);
      let { body, task_id, ...querystring } = params;
      task_id = parsePathParam(task_id);
      const path = "/_update_by_query/" + task_id + "/_rethrottle";
      const method = "POST";
      body = body || "";
      return this.transport.request({ method, path, querystring, body }, options, callback);
    }
    module2.exports = updateByQueryRethrottleFunc;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/OpenSearchApi.js
var require_OpenSearchApi = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/api/OpenSearchApi.js"(exports2, module2) {
    "use strict";
    var { kConfigErr } = require_utils();
    var kApiModules = Symbol("api modules");
    var OpenSearchAPI = class {
      constructor(opts) {
        this[kConfigErr] = opts.ConfigurationError;
        this[kApiModules] = {
          asynchronousSearch: new (require_api())(this),
          cat: new (require_api2())(this),
          cluster: new (require_api3())(this),
          danglingIndices: new (require_api4())(this),
          flowFramework: new (require_api5())(this),
          http: new (require_api6())(this),
          indices: new (require_api7())(this),
          ingest: new (require_api8())(this),
          insights: new (require_api9())(this),
          ism: new (require_api10())(this),
          knn: new (require_api11())(this),
          list: new (require_api12())(this),
          ltr: new (require_api13())(this),
          ml: new (require_api14())(this),
          nodes: new (require_api15())(this),
          notifications: new (require_api16())(this),
          observability: new (require_api17())(this),
          ppl: new (require_api18())(this),
          query: new (require_api19())(this),
          remoteStore: new (require_api20())(this),
          replication: new (require_api21())(this),
          rollups: new (require_api22())(this),
          searchPipeline: new (require_api23())(this),
          security: new (require_api24())(this),
          sm: new (require_api25())(this),
          snapshot: new (require_api26())(this),
          sql: new (require_api27())(this),
          tasks: new (require_api28())(this),
          transforms: new (require_api29())(this),
          wlm: new (require_api30())(this)
        };
        this.bulk = require_bulk().bind(this);
        this.bulkStream = require_bulkStream().bind(this);
        this.clearScroll = require_clearScroll().bind(this);
        this.count = require_count2().bind(this);
        this.create = require_create4().bind(this);
        this.createPit = require_createPit().bind(this);
        this.delete = require_delete9().bind(this);
        this.deleteAllPits = require_deleteAllPits().bind(this);
        this.deleteByQuery = require_deleteByQuery().bind(this);
        this.deleteByQueryRethrottle = require_deleteByQueryRethrottle().bind(this);
        this.deletePit = require_deletePit().bind(this);
        this.deleteScript = require_deleteScript().bind(this);
        this.exists = require_exists2().bind(this);
        this.existsSource = require_existsSource().bind(this);
        this.explain = require_explain5().bind(this);
        this.fieldCaps = require_fieldCaps().bind(this);
        this.get = require_get10().bind(this);
        this.getAllPits = require_getAllPits().bind(this);
        this.getScript = require_getScript().bind(this);
        this.getScriptContext = require_getScriptContext().bind(this);
        this.getScriptLanguages = require_getScriptLanguages().bind(this);
        this.getSource = require_getSource().bind(this);
        this.index = require_core().bind(this);
        this.info = require_info2().bind(this);
        this.mget = require_mget().bind(this);
        this.msearch = require_msearch().bind(this);
        this.msearchTemplate = require_msearchTemplate().bind(this);
        this.mtermvectors = require_mtermvectors().bind(this);
        this.ping = require_ping().bind(this);
        this.putScript = require_putScript().bind(this);
        this.rankEval = require_rankEval().bind(this);
        this.reindex = require_reindex().bind(this);
        this.reindexRethrottle = require_reindexRethrottle().bind(this);
        this.renderSearchTemplate = require_renderSearchTemplate().bind(this);
        this.scriptsPainlessExecute = require_scriptsPainlessExecute().bind(this);
        this.scroll = require_scroll().bind(this);
        this.search = require_search4().bind(this);
        this.searchShards = require_searchShards().bind(this);
        this.searchTemplate = require_searchTemplate().bind(this);
        this.termvectors = require_termvectors().bind(this);
        this.update = require_update2().bind(this);
        this.updateByQuery = require_updateByQuery().bind(this);
        this.updateByQueryRethrottle = require_updateByQueryRethrottle().bind(this);
        this.bulk_stream = require_bulkStream().bind(this);
        this.clear_scroll = require_clearScroll().bind(this);
        this.create_pit = require_createPit().bind(this);
        this.delete_all_pits = require_deleteAllPits().bind(this);
        this.delete_by_query = require_deleteByQuery().bind(this);
        this.delete_by_query_rethrottle = require_deleteByQueryRethrottle().bind(this);
        this.delete_pit = require_deletePit().bind(this);
        this.delete_script = require_deleteScript().bind(this);
        this.exists_source = require_existsSource().bind(this);
        this.field_caps = require_fieldCaps().bind(this);
        this.get_all_pits = require_getAllPits().bind(this);
        this.get_script = require_getScript().bind(this);
        this.get_script_context = require_getScriptContext().bind(this);
        this.get_script_languages = require_getScriptLanguages().bind(this);
        this.get_source = require_getSource().bind(this);
        this.msearch_template = require_msearchTemplate().bind(this);
        this.put_script = require_putScript().bind(this);
        this.rank_eval = require_rankEval().bind(this);
        this.reindex_rethrottle = require_reindexRethrottle().bind(this);
        this.render_search_template = require_renderSearchTemplate().bind(this);
        this.scripts_painless_execute = require_scriptsPainlessExecute().bind(this);
        this.search_shards = require_searchShards().bind(this);
        this.search_template = require_searchTemplate().bind(this);
        this.update_by_query = require_updateByQuery().bind(this);
        this.update_by_query_rethrottle = require_updateByQueryRethrottle().bind(this);
        Object.defineProperties(this, {
          asynchronousSearch: { get() {
            return this[kApiModules].asynchronousSearch;
          } },
          cat: { get() {
            return this[kApiModules].cat;
          } },
          cluster: { get() {
            return this[kApiModules].cluster;
          } },
          danglingIndices: { get() {
            return this[kApiModules].danglingIndices;
          } },
          flowFramework: { get() {
            return this[kApiModules].flowFramework;
          } },
          http: { get() {
            return this[kApiModules].http;
          } },
          indices: { get() {
            return this[kApiModules].indices;
          } },
          ingest: { get() {
            return this[kApiModules].ingest;
          } },
          insights: { get() {
            return this[kApiModules].insights;
          } },
          ism: { get() {
            return this[kApiModules].ism;
          } },
          knn: { get() {
            return this[kApiModules].knn;
          } },
          list: { get() {
            return this[kApiModules].list;
          } },
          ltr: { get() {
            return this[kApiModules].ltr;
          } },
          ml: { get() {
            return this[kApiModules].ml;
          } },
          nodes: { get() {
            return this[kApiModules].nodes;
          } },
          notifications: { get() {
            return this[kApiModules].notifications;
          } },
          observability: { get() {
            return this[kApiModules].observability;
          } },
          ppl: { get() {
            return this[kApiModules].ppl;
          } },
          query: { get() {
            return this[kApiModules].query;
          } },
          remoteStore: { get() {
            return this[kApiModules].remoteStore;
          } },
          replication: { get() {
            return this[kApiModules].replication;
          } },
          rollups: { get() {
            return this[kApiModules].rollups;
          } },
          searchPipeline: { get() {
            return this[kApiModules].searchPipeline;
          } },
          security: { get() {
            return this[kApiModules].security;
          } },
          sm: { get() {
            return this[kApiModules].sm;
          } },
          snapshot: { get() {
            return this[kApiModules].snapshot;
          } },
          sql: { get() {
            return this[kApiModules].sql;
          } },
          tasks: { get() {
            return this[kApiModules].tasks;
          } },
          transforms: { get() {
            return this[kApiModules].transforms;
          } },
          wlm: { get() {
            return this[kApiModules].wlm;
          } },
          // Deprecated: Use asynchronousSearch instead.
          asynchronous_search: { get() {
            return this[kApiModules].asynchronousSearch;
          } },
          // Deprecated: Use danglingIndices instead.
          dangling_indices: { get() {
            return this[kApiModules].danglingIndices;
          } },
          // Deprecated: Use flowFramework instead.
          flow_framework: { get() {
            return this[kApiModules].flowFramework;
          } },
          // Deprecated: Use remoteStore instead.
          remote_store: { get() {
            return this[kApiModules].remoteStore;
          } },
          // Deprecated: Use searchPipeline instead.
          search_pipeline: { get() {
            return this[kApiModules].searchPipeline;
          } }
        });
      }
    };
    module2.exports = OpenSearchAPI;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Client.js
var require_Client = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/Client.js"(exports2, module2) {
    "use strict";
    var { EventEmitter } = require("events");
    var { URL } = require("url");
    var debug = require_src()("opensearch");
    var Transport2 = require_Transport();
    var Connection2 = require_Connection();
    var { ConnectionPool: ConnectionPool2, CloudConnectionPool } = require_pool();
    var Helpers = require_Helpers();
    var Serializer2 = require_Serializer();
    var errors2 = require_errors();
    var { ConfigurationError } = errors2;
    var { prepareHeaders } = Connection2.internals;
    var kInitialOptions = Symbol("opensearchjs-initial-options");
    var kChild = Symbol("opensearchjs-child");
    var kExtensions = Symbol("opensearchjs-extensions");
    var kEventEmitter = Symbol("opensearchjs-event-emitter");
    var OpenSearchAPI = require_OpenSearchApi();
    var Client2 = class _Client extends OpenSearchAPI {
      constructor(opts = {}) {
        super({ ConfigurationError });
        if (opts.cloud && opts[kChild] === void 0) {
          const { id, username, password } = opts.cloud;
          const cloudUrls = Buffer.from(id.split(":")[1], "base64").toString().split("$");
          if (username && password) {
            opts.auth = Object.assign({}, opts.auth, { username, password });
          }
          opts.node = `https://${cloudUrls[1]}.${cloudUrls[0]}`;
          if (opts.compression == null) opts.compression = "gzip";
          if (opts.suggestCompression == null) opts.suggestCompression = true;
          if (opts.ssl == null || opts.ssl && opts.ssl.secureProtocol == null) {
            opts.ssl = opts.ssl || {};
            opts.ssl.secureProtocol = "TLSv1_2_method";
          }
        }
        if (!opts.node && !opts.nodes) {
          throw new ConfigurationError("Missing node(s) option");
        }
        if (opts[kChild] === void 0) {
          const checkAuth = getAuth(opts.node || opts.nodes);
          if (checkAuth && checkAuth.username && checkAuth.password) {
            opts.auth = Object.assign({}, opts.auth, {
              username: checkAuth.username,
              password: checkAuth.password
            });
          }
        }
        const options = opts[kChild] !== void 0 ? opts[kChild].initialOptions : Object.assign(
          {},
          {
            Connection: Connection2,
            Transport: Transport2,
            Serializer: Serializer2,
            ConnectionPool: opts.cloud ? CloudConnectionPool : ConnectionPool2,
            maxRetries: 3,
            requestTimeout: 3e4,
            pingTimeout: 3e3,
            sniffInterval: false,
            sniffOnStart: false,
            sniffEndpoint: "_nodes/_all/http",
            sniffOnConnectionFault: false,
            resurrectStrategy: "ping",
            suggestCompression: false,
            compression: false,
            ssl: null,
            agent: null,
            headers: {},
            nodeFilter: null,
            nodeSelector: "round-robin",
            generateRequestId: null,
            name: "opensearch-js",
            auth: null,
            opaqueIdPrefix: null,
            context: null,
            proxy: null,
            enableMetaHeader: true,
            disablePrototypePoisoningProtection: false,
            enableLongNumeralSupport: false
          },
          opts
        );
        if (process.env.OPENSEARCH_CLIENT_APIVERSIONING === "true") {
          options.headers = Object.assign(
            { accept: "application/vnd.opensearch+json; compatible-with=7" },
            options.headers
          );
        }
        this[kInitialOptions] = options;
        this[kExtensions] = [];
        this.name = options.name;
        if (opts[kChild] !== void 0) {
          this.serializer = options[kChild].serializer;
          this.connectionPool = options[kChild].connectionPool;
          this[kEventEmitter] = options[kChild].eventEmitter;
        } else {
          this[kEventEmitter] = new EventEmitter();
          this.serializer = new options.Serializer({
            disablePrototypePoisoningProtection: options.disablePrototypePoisoningProtection,
            enableLongNumeralSupport: options.enableLongNumeralSupport
          });
          this.connectionPool = new options.ConnectionPool({
            pingTimeout: options.pingTimeout,
            resurrectStrategy: options.resurrectStrategy,
            ssl: options.ssl,
            agent: options.agent,
            proxy: options.proxy,
            Connection: options.Connection,
            auth: options.auth,
            emit: this[kEventEmitter].emit.bind(this[kEventEmitter]),
            sniffEnabled: options.sniffInterval !== false || options.sniffOnStart !== false || options.sniffOnConnectionFault !== false
          });
          this.connectionPool.addConnection(options.node || options.nodes);
        }
        this.transport = new options.Transport({
          emit: this[kEventEmitter].emit.bind(this[kEventEmitter]),
          connectionPool: this.connectionPool,
          serializer: this.serializer,
          maxRetries: options.maxRetries,
          requestTimeout: options.requestTimeout,
          sniffInterval: options.sniffInterval,
          sniffOnStart: options.sniffOnStart,
          sniffOnConnectionFault: options.sniffOnConnectionFault,
          sniffEndpoint: options.sniffEndpoint,
          suggestCompression: options.suggestCompression,
          compression: options.compression,
          headers: options.headers,
          nodeFilter: options.nodeFilter,
          nodeSelector: options.nodeSelector,
          generateRequestId: options.generateRequestId,
          name: options.name,
          opaqueIdPrefix: options.opaqueIdPrefix,
          context: options.context,
          memoryCircuitBreaker: options.memoryCircuitBreaker,
          auth: options.auth
        });
        this.helpers = new Helpers({
          client: this,
          maxRetries: options.maxRetries
        });
      }
      get emit() {
        return this[kEventEmitter].emit.bind(this[kEventEmitter]);
      }
      get on() {
        return this[kEventEmitter].on.bind(this[kEventEmitter]);
      }
      get once() {
        return this[kEventEmitter].once.bind(this[kEventEmitter]);
      }
      get off() {
        return this[kEventEmitter].off.bind(this[kEventEmitter]);
      }
      extend(name, opts, fn) {
        if (typeof opts === "function") {
          fn = opts;
          opts = {};
        }
        let [namespace, method] = name.split(".");
        if (method == null) {
          method = namespace;
          namespace = null;
        }
        if (namespace != null) {
          if (this[namespace] != null && this[namespace][method] != null && opts.force !== true) {
            throw new Error(`The method "${method}" already exists on namespace "${namespace}"`);
          }
          if (this[namespace] == null) this[namespace] = {};
          this[namespace][method] = fn({
            makeRequest: this.transport.request.bind(this.transport),
            result: { body: null, statusCode: null, headers: null, warnings: null },
            ConfigurationError
          });
        } else {
          if (this[method] != null && opts.force !== true) {
            throw new Error(`The method "${method}" already exists`);
          }
          this[method] = fn({
            makeRequest: this.transport.request.bind(this.transport),
            result: { body: null, statusCode: null, headers: null, warnings: null },
            ConfigurationError
          });
        }
        this[kExtensions].push({ name, opts, fn });
      }
      child(opts) {
        const options = Object.assign({}, this[kInitialOptions], opts);
        options[kChild] = {
          connectionPool: this.connectionPool,
          serializer: this.serializer,
          eventEmitter: this[kEventEmitter],
          initialOptions: options
        };
        if (options.auth !== void 0) {
          options.headers = prepareHeaders(options.headers, options.auth);
        }
        const client = new _Client(options);
        const tSymbol = Object.getOwnPropertySymbols(this.transport).filter(
          (symbol) => symbol.description === "compatible check"
        )[0];
        client.transport[tSymbol] = this.transport[tSymbol];
        if (this[kExtensions].length > 0) {
          this[kExtensions].forEach(({ name, opts: opts2, fn }) => {
            client.extend(name, opts2, fn);
          });
        }
        return client;
      }
      close(callback) {
        if (callback == null) {
          return new Promise((resolve) => {
            this.close(resolve);
          });
        }
        debug("Closing the client");
        this.connectionPool.empty(callback);
      }
    };
    function getAuth(node) {
      if (Array.isArray(node)) {
        for (const url of node) {
          const auth2 = getUsernameAndPassword(url);
          if (auth2.username !== "" && auth2.password !== "") {
            return auth2;
          }
        }
        return null;
      }
      const auth = getUsernameAndPassword(node);
      if (auth.username !== "" && auth.password !== "") {
        return auth;
      }
      return null;
      function getUsernameAndPassword(node2) {
        if (typeof node2 === "string") {
          const { username, password } = new URL(node2);
          return {
            username: decodeURIComponent(username),
            password: decodeURIComponent(password)
          };
        } else if (node2.url instanceof URL) {
          return {
            username: decodeURIComponent(node2.url.username),
            password: decodeURIComponent(node2.url.password)
          };
        }
      }
    }
    module2.exports = { Client: Client2 };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/index.js
var require_opensearch = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/index.js"(exports2, module2) {
    "use strict";
    var { Client: Client2 } = require_Client();
    var Transport2 = require_Transport();
    var { ConnectionPool: ConnectionPool2 } = require_pool();
    var Connection2 = require_Connection();
    var Serializer2 = require_Serializer();
    var errors2 = require_errors();
    var events2 = {
      RESPONSE: "response",
      REQUEST: "request",
      SNIFF: "sniff",
      RESURRECT: "resurrect",
      SERIALIZATION: "serialization",
      DESERIALIZATION: "deserialization"
    };
    module2.exports = {
      Client: Client2,
      Transport: Transport2,
      ConnectionPool: ConnectionPool2,
      Connection: Connection2,
      Serializer: Serializer2,
      errors: errors2,
      events: events2
    };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/errors.js
var require_errors2 = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/errors.js"(exports2, module2) {
    "use strict";
    var { OpenSearchClientError } = require_errors();
    var AwsSigv4SignerError = class _AwsSigv4SignerError extends OpenSearchClientError {
      constructor(message, data) {
        super(message, data);
        Error.captureStackTrace(this, _AwsSigv4SignerError);
        this.name = "AwsSigv4SignerError";
        this.message = message || "AwsSigv4Signer Error";
        this.data = data;
      }
    };
    module2.exports = AwsSigv4SignerError;
  }
});

// asset-input/packages/worker/node_modules/aws4/lru.js
var require_lru = __commonJS({
  "asset-input/packages/worker/node_modules/aws4/lru.js"(exports2, module2) {
    module2.exports = function(size) {
      return new LruCache(size);
    };
    function LruCache(size) {
      this.capacity = size | 0;
      this.map = /* @__PURE__ */ Object.create(null);
      this.list = new DoublyLinkedList();
    }
    LruCache.prototype.get = function(key) {
      var node = this.map[key];
      if (node == null) return void 0;
      this.used(node);
      return node.val;
    };
    LruCache.prototype.set = function(key, val) {
      var node = this.map[key];
      if (node != null) {
        node.val = val;
      } else {
        if (!this.capacity) this.prune();
        if (!this.capacity) return false;
        node = new DoublyLinkedNode(key, val);
        this.map[key] = node;
        this.capacity--;
      }
      this.used(node);
      return true;
    };
    LruCache.prototype.used = function(node) {
      this.list.moveToFront(node);
    };
    LruCache.prototype.prune = function() {
      var node = this.list.pop();
      if (node != null) {
        delete this.map[node.key];
        this.capacity++;
      }
    };
    function DoublyLinkedList() {
      this.firstNode = null;
      this.lastNode = null;
    }
    DoublyLinkedList.prototype.moveToFront = function(node) {
      if (this.firstNode == node) return;
      this.remove(node);
      if (this.firstNode == null) {
        this.firstNode = node;
        this.lastNode = node;
        node.prev = null;
        node.next = null;
      } else {
        node.prev = null;
        node.next = this.firstNode;
        node.next.prev = node;
        this.firstNode = node;
      }
    };
    DoublyLinkedList.prototype.pop = function() {
      var lastNode = this.lastNode;
      if (lastNode != null) {
        this.remove(lastNode);
      }
      return lastNode;
    };
    DoublyLinkedList.prototype.remove = function(node) {
      if (this.firstNode == node) {
        this.firstNode = node.next;
      } else if (node.prev != null) {
        node.prev.next = node.next;
      }
      if (this.lastNode == node) {
        this.lastNode = node.prev;
      } else if (node.next != null) {
        node.next.prev = node.prev;
      }
    };
    function DoublyLinkedNode(key, val) {
      this.key = key;
      this.val = val;
      this.prev = null;
      this.next = null;
    }
  }
});

// asset-input/packages/worker/node_modules/aws4/aws4.js
var require_aws4 = __commonJS({
  "asset-input/packages/worker/node_modules/aws4/aws4.js"(exports2) {
    var aws4 = exports2;
    var url = require("url");
    var querystring = require("querystring");
    var crypto2 = require("crypto");
    var lru = require_lru();
    var credentialsCache = lru(1e3);
    function hmac(key, string, encoding) {
      return crypto2.createHmac("sha256", key).update(string, "utf8").digest(encoding);
    }
    function hash(string, encoding) {
      return crypto2.createHash("sha256").update(string, "utf8").digest(encoding);
    }
    function encodeRfc3986(urlEncodedString) {
      return urlEncodedString.replace(/[!'()*]/g, function(c) {
        return "%" + c.charCodeAt(0).toString(16).toUpperCase();
      });
    }
    function encodeRfc3986Full(str) {
      return encodeRfc3986(encodeURIComponent(str));
    }
    var HEADERS_TO_IGNORE = {
      "authorization": true,
      "connection": true,
      "x-amzn-trace-id": true,
      "user-agent": true,
      "expect": true,
      "presigned-expires": true,
      "range": true
    };
    function RequestSigner(request, credentials) {
      if (typeof request === "string") request = url.parse(request);
      var headers = request.headers = Object.assign({}, request.headers || {}), hostParts = (!this.service || !this.region) && this.matchHost(request.hostname || request.host || headers.Host || headers.host);
      this.request = request;
      this.credentials = credentials || this.defaultCredentials();
      this.service = request.service || hostParts[0] || "";
      this.region = request.region || hostParts[1] || "us-east-1";
      if (this.service === "email") this.service = "ses";
      if (!request.method && request.body)
        request.method = "POST";
      if (!headers.Host && !headers.host) {
        headers.Host = request.hostname || request.host || this.createHost();
        if (request.port)
          headers.Host += ":" + request.port;
      }
      if (!request.hostname && !request.host)
        request.hostname = headers.Host || headers.host;
      this.isCodeCommitGit = this.service === "codecommit" && request.method === "GIT";
      this.extraHeadersToIgnore = request.extraHeadersToIgnore || /* @__PURE__ */ Object.create(null);
      this.extraHeadersToInclude = request.extraHeadersToInclude || /* @__PURE__ */ Object.create(null);
    }
    RequestSigner.prototype.matchHost = function(host) {
      var match = (host || "").match(/([^\.]{1,63})\.(?:([^\.]{0,63})\.)?amazonaws\.com(\.cn)?$/);
      var hostParts = (match || []).slice(1, 3);
      if (hostParts[1] === "es" || hostParts[1] === "aoss")
        hostParts = hostParts.reverse();
      if (hostParts[1] == "s3") {
        hostParts[0] = "s3";
        hostParts[1] = "us-east-1";
      } else {
        for (var i = 0; i < 2; i++) {
          if (/^s3-/.test(hostParts[i])) {
            hostParts[1] = hostParts[i].slice(3);
            hostParts[0] = "s3";
            break;
          }
        }
      }
      return hostParts;
    };
    RequestSigner.prototype.isSingleRegion = function() {
      if (["s3", "sdb"].indexOf(this.service) >= 0 && this.region === "us-east-1") return true;
      return ["cloudfront", "ls", "route53", "iam", "importexport", "sts"].indexOf(this.service) >= 0;
    };
    RequestSigner.prototype.createHost = function() {
      var region = this.isSingleRegion() ? "" : "." + this.region, subdomain = this.service === "ses" ? "email" : this.service;
      return subdomain + region + ".amazonaws.com";
    };
    RequestSigner.prototype.prepareRequest = function() {
      this.parsePath();
      var request = this.request, headers = request.headers, query;
      if (request.signQuery) {
        this.parsedPath.query = query = this.parsedPath.query || {};
        if (this.credentials.sessionToken)
          query["X-Amz-Security-Token"] = this.credentials.sessionToken;
        if (this.service === "s3" && !query["X-Amz-Expires"])
          query["X-Amz-Expires"] = 86400;
        if (query["X-Amz-Date"])
          this.datetime = query["X-Amz-Date"];
        else
          query["X-Amz-Date"] = this.getDateTime();
        query["X-Amz-Algorithm"] = "AWS4-HMAC-SHA256";
        query["X-Amz-Credential"] = this.credentials.accessKeyId + "/" + this.credentialString();
        query["X-Amz-SignedHeaders"] = this.signedHeaders();
      } else {
        if (!request.doNotModifyHeaders && !this.isCodeCommitGit) {
          if (request.body && !headers["Content-Type"] && !headers["content-type"])
            headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
          if (request.body && !headers["Content-Length"] && !headers["content-length"])
            headers["Content-Length"] = Buffer.byteLength(request.body);
          if (this.credentials.sessionToken && !headers["X-Amz-Security-Token"] && !headers["x-amz-security-token"])
            headers["X-Amz-Security-Token"] = this.credentials.sessionToken;
          if (this.service === "s3" && !headers["X-Amz-Content-Sha256"] && !headers["x-amz-content-sha256"])
            headers["X-Amz-Content-Sha256"] = hash(this.request.body || "", "hex");
          if (headers["X-Amz-Date"] || headers["x-amz-date"])
            this.datetime = headers["X-Amz-Date"] || headers["x-amz-date"];
          else
            headers["X-Amz-Date"] = this.getDateTime();
        }
        delete headers.Authorization;
        delete headers.authorization;
      }
    };
    RequestSigner.prototype.sign = function() {
      if (!this.parsedPath) this.prepareRequest();
      if (this.request.signQuery) {
        this.parsedPath.query["X-Amz-Signature"] = this.signature();
      } else {
        this.request.headers.Authorization = this.authHeader();
      }
      this.request.path = this.formatPath();
      return this.request;
    };
    RequestSigner.prototype.getDateTime = function() {
      if (!this.datetime) {
        var headers = this.request.headers, date = new Date(headers.Date || headers.date || /* @__PURE__ */ new Date());
        this.datetime = date.toISOString().replace(/[:\-]|\.\d{3}/g, "");
        if (this.isCodeCommitGit) this.datetime = this.datetime.slice(0, -1);
      }
      return this.datetime;
    };
    RequestSigner.prototype.getDate = function() {
      return this.getDateTime().substr(0, 8);
    };
    RequestSigner.prototype.authHeader = function() {
      return [
        "AWS4-HMAC-SHA256 Credential=" + this.credentials.accessKeyId + "/" + this.credentialString(),
        "SignedHeaders=" + this.signedHeaders(),
        "Signature=" + this.signature()
      ].join(", ");
    };
    RequestSigner.prototype.signature = function() {
      var date = this.getDate(), cacheKey = [this.credentials.secretAccessKey, date, this.region, this.service].join(), kDate, kRegion, kService, kCredentials = credentialsCache.get(cacheKey);
      if (!kCredentials) {
        kDate = hmac("AWS4" + this.credentials.secretAccessKey, date);
        kRegion = hmac(kDate, this.region);
        kService = hmac(kRegion, this.service);
        kCredentials = hmac(kService, "aws4_request");
        credentialsCache.set(cacheKey, kCredentials);
      }
      return hmac(kCredentials, this.stringToSign(), "hex");
    };
    RequestSigner.prototype.stringToSign = function() {
      return [
        "AWS4-HMAC-SHA256",
        this.getDateTime(),
        this.credentialString(),
        hash(this.canonicalString(), "hex")
      ].join("\n");
    };
    RequestSigner.prototype.canonicalString = function() {
      if (!this.parsedPath) this.prepareRequest();
      var pathStr = this.parsedPath.path, query = this.parsedPath.query, headers = this.request.headers, queryStr = "", normalizePath = this.service !== "s3", decodePath = this.service === "s3" || this.request.doNotEncodePath, decodeSlashesInPath = this.service === "s3", firstValOnly = this.service === "s3", bodyHash;
      if (this.service === "s3" && this.request.signQuery) {
        bodyHash = "UNSIGNED-PAYLOAD";
      } else if (this.isCodeCommitGit) {
        bodyHash = "";
      } else {
        bodyHash = headers["X-Amz-Content-Sha256"] || headers["x-amz-content-sha256"] || hash(this.request.body || "", "hex");
      }
      if (query) {
        var reducedQuery = Object.keys(query).reduce(function(obj, key) {
          if (!key) return obj;
          obj[encodeRfc3986Full(key)] = !Array.isArray(query[key]) ? query[key] : firstValOnly ? query[key][0] : query[key];
          return obj;
        }, {});
        var encodedQueryPieces = [];
        Object.keys(reducedQuery).sort().forEach(function(key) {
          if (!Array.isArray(reducedQuery[key])) {
            encodedQueryPieces.push(key + "=" + encodeRfc3986Full(reducedQuery[key]));
          } else {
            reducedQuery[key].map(encodeRfc3986Full).sort().forEach(function(val) {
              encodedQueryPieces.push(key + "=" + val);
            });
          }
        });
        queryStr = encodedQueryPieces.join("&");
      }
      if (pathStr !== "/") {
        if (normalizePath) pathStr = pathStr.replace(/\/{2,}/g, "/");
        pathStr = pathStr.split("/").reduce(function(path, piece) {
          if (normalizePath && piece === "..") {
            path.pop();
          } else if (!normalizePath || piece !== ".") {
            if (decodePath) piece = decodeURIComponent(piece.replace(/\+/g, " "));
            path.push(encodeRfc3986Full(piece));
          }
          return path;
        }, []).join("/");
        if (pathStr[0] !== "/") pathStr = "/" + pathStr;
        if (decodeSlashesInPath) pathStr = pathStr.replace(/%2F/g, "/");
      }
      return [
        this.request.method || "GET",
        pathStr,
        queryStr,
        this.canonicalHeaders() + "\n",
        this.signedHeaders(),
        bodyHash
      ].join("\n");
    };
    RequestSigner.prototype.filterHeaders = function() {
      var headers = this.request.headers, extraHeadersToInclude = this.extraHeadersToInclude, extraHeadersToIgnore = this.extraHeadersToIgnore;
      this.filteredHeaders = Object.keys(headers).map(function(key) {
        return [key.toLowerCase(), headers[key]];
      }).filter(function(entry) {
        return extraHeadersToInclude[entry[0]] || HEADERS_TO_IGNORE[entry[0]] == null && !extraHeadersToIgnore[entry[0]];
      }).sort(function(a, b) {
        return a[0] < b[0] ? -1 : 1;
      });
    };
    RequestSigner.prototype.canonicalHeaders = function() {
      if (!this.filteredHeaders) this.filterHeaders();
      return this.filteredHeaders.map(function(entry) {
        return entry[0] + ":" + entry[1].toString().trim().replace(/\s+/g, " ");
      }).join("\n");
    };
    RequestSigner.prototype.signedHeaders = function() {
      if (!this.filteredHeaders) this.filterHeaders();
      return this.filteredHeaders.map(function(entry) {
        return entry[0];
      }).join(";");
    };
    RequestSigner.prototype.credentialString = function() {
      return [
        this.getDate(),
        this.region,
        this.service,
        "aws4_request"
      ].join("/");
    };
    RequestSigner.prototype.defaultCredentials = function() {
      var env = process.env;
      return {
        accessKeyId: env.AWS_ACCESS_KEY_ID || env.AWS_ACCESS_KEY,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || env.AWS_SECRET_KEY,
        sessionToken: env.AWS_SESSION_TOKEN
      };
    };
    RequestSigner.prototype.parsePath = function() {
      var path = this.request.path || "/";
      if (/[^0-9A-Za-z;,/?:@&=+$\-_.!~*'()#%]/.test(path)) {
        path = encodeURI(decodeURI(path));
      }
      var queryIx = path.indexOf("?"), query = null;
      if (queryIx >= 0) {
        query = querystring.parse(path.slice(queryIx + 1));
        path = path.slice(0, queryIx);
      }
      this.parsedPath = {
        path,
        query
      };
    };
    RequestSigner.prototype.formatPath = function() {
      var path = this.parsedPath.path, query = this.parsedPath.query;
      if (!query) return path;
      if (query[""] != null) delete query[""];
      return path + "?" + encodeRfc3986(querystring.stringify(query));
    };
    aws4.RequestSigner = RequestSigner;
    aws4.sign = function(request, credentials) {
      return new RequestSigner(request, credentials).sign();
    };
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/shared.js
var require_shared = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/shared.js"(exports2, module2) {
    "use strict";
    var Connection2 = require_Connection();
    var Transport2 = require_Transport();
    var aws4 = require_aws4();
    var AwsSigv4SignerError = require_errors2();
    var { RequestAbortedError } = require_errors();
    var crypto2 = require("crypto");
    var { toMs } = Transport2.internals;
    var noop = () => {
    };
    function giveAwsCredentialProviderLoader(getAwsSDKCredentialsProvider) {
      return function loadAwsCredentialProvider() {
        return new Promise((resolve, reject) => {
          getAwsSDKCredentialsProvider().then((provider) => {
            provider().then(resolve).catch(reject);
          }).catch((err) => {
            reject(err);
          });
        });
      };
    }
    function giveAwsV4Signer(awsDefaultCredentialsProvider) {
      return function AwsSigv4Signer2(opts = {}) {
        const credentialsState = {
          credentials: null
        };
        if (!opts.region) {
          throw new AwsSigv4SignerError("Region cannot be empty");
        }
        if (!opts.service) {
          opts.service = "es";
        }
        if (typeof opts.getCredentials !== "function") {
          opts.getCredentials = awsDefaultCredentialsProvider;
        }
        function buildSignedRequestObject(request = {}) {
          request.service = opts.service;
          request.region = opts.region;
          request.headers = request.headers || {};
          request.headers["host"] = request.hostname;
          if (request["auth"]) {
            const awssigv4Cred = request["auth"];
            credentialsState.credentials = {
              accessKeyId: awssigv4Cred.credentials.accessKeyId,
              secretAccessKey: awssigv4Cred.credentials.secretAccessKey,
              sessionToken: awssigv4Cred.credentials.sessionToken
            };
            request.region = awssigv4Cred.region;
            request.service = awssigv4Cred.service;
            delete request["auth"];
          }
          const signed = aws4.sign(request, credentialsState.credentials);
          signed.headers["x-amz-content-sha256"] = crypto2.createHash("sha256").update(request.body || "", "utf8").digest("hex");
          return signed;
        }
        class AwsSigv4SignerConnection extends Connection2 {
          buildRequestObject(params) {
            const request = super.buildRequestObject(params);
            return buildSignedRequestObject(request);
          }
        }
        class AwsSigv4SignerTransport extends Transport2 {
          request(params, options = {}, callback = void 0) {
            if (typeof options === "function") {
              callback = options;
              options = {};
            }
            const currentCredentials = credentialsState.credentials;
            const expiryBufferMs = toMs(options.requestTimeout || this.requestTimeout);
            let expired = false;
            if (!currentCredentials) {
              expired = true;
            } else if (typeof currentCredentials.needsRefresh === "function") {
              expired = currentCredentials.needsRefresh();
            } else if (currentCredentials.expired === true) {
              expired = true;
            } else if (currentCredentials.expireTime && currentCredentials.expireTime < /* @__PURE__ */ new Date()) {
              expired = true;
            } else if (currentCredentials.expiration && currentCredentials.expiration.getTime() - Date.now() < expiryBufferMs) {
              expired = true;
            }
            if (!expired) {
              if (callback === void 0) {
                return super.request(params, options);
              } else {
                return super.request(params, options, callback);
              }
            }
            let p = null;
            if (callback === void 0) {
              let onFulfilled = null;
              let onRejected = null;
              p = new Promise((resolve, reject) => {
                onFulfilled = resolve;
                onRejected = reject;
              });
              callback = function callback2(err, result) {
                err ? onRejected(err) : onFulfilled(result);
              };
            }
            const meta = {
              aborted: false
            };
            let request = { abort: noop };
            const transportReturn = {
              then(onFulfilled, onRejected) {
                if (p != null) {
                  return p.then(onFulfilled, onRejected);
                }
              },
              catch(onRejected) {
                if (p != null) {
                  return p.catch(onRejected);
                }
              },
              abort() {
                meta.aborted = true;
                request.abort();
                return this;
              },
              finally(onFinally) {
                if (p != null) {
                  return p.finally(onFinally);
                }
              }
            };
            const makeRequest = () => {
              if (currentCredentials && typeof currentCredentials.refreshPromise === "function") {
                currentCredentials.refreshPromise().then(() => {
                  if (meta.aborted) {
                    return callback(new RequestAbortedError());
                  }
                  request = super.request(params, options, callback);
                }).catch(callback);
              } else {
                opts.getCredentials().then((credentials) => {
                  if (meta.aborted) {
                    return callback(new RequestAbortedError());
                  }
                  credentialsState.credentials = credentials;
                  request = super.request(params, options, callback);
                }).catch(callback);
              }
            };
            makeRequest();
            return transportReturn;
          }
        }
        return {
          Transport: AwsSigv4SignerTransport,
          Connection: AwsSigv4SignerConnection,
          buildSignedRequestObject
        };
      };
    }
    module2.exports.giveAwsCredentialProviderLoader = giveAwsCredentialProviderLoader;
    module2.exports.giveAwsV4Signer = giveAwsV4Signer;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/AwsSigv4Signer.js
var require_AwsSigv4Signer = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/AwsSigv4Signer.js"(exports2, module2) {
    "use strict";
    var AwsSigv4SignerError = require_errors2();
    var { giveAwsV4Signer, giveAwsCredentialProviderLoader } = require_shared();
    var getAwsSDKCredentialsProvider = async () => {
      try {
        const awsV3 = await import("@aws-sdk/credential-provider-node");
        if (typeof awsV3.defaultProvider === "function") {
          return awsV3.defaultProvider();
        }
      } catch (err) {
      }
      try {
        const awsV2 = await import("aws-sdk");
        if (awsV2.default && typeof awsV2.default.config.getCredentials === "function") {
          return () => new Promise((resolve, reject) => {
            awsV2.default.config.getCredentials((err, credentials) => {
              if (err) {
                reject(err);
              } else {
                resolve(credentials);
              }
            });
          });
        }
      } catch (err) {
      }
      throw new AwsSigv4SignerError(
        "Unable to find a valid AWS SDK, please provide a valid getCredentials function to AwsSigv4Signer options."
      );
    };
    var AwsSigv4Signer2 = giveAwsV4Signer(
      giveAwsCredentialProviderLoader(getAwsSDKCredentialsProvider)
    );
    module2.exports = AwsSigv4Signer2;
  }
});

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/index.js
var require_aws = __commonJS({
  "asset-input/packages/worker/node_modules/@opensearch-project/opensearch/lib/aws/index.js"(exports2, module2) {
    "use strict";
    var AwsSigv4Signer2 = require_AwsSigv4Signer();
    var AwsSigv4SignerError = require_errors2();
    module2.exports = {
      AwsSigv4Signer: AwsSigv4Signer2,
      AwsSigv4SignerError
    };
  }
});

// asset-input/packages/worker/node_modules/opossum/lib/status.js
var require_status3 = __commonJS({
  "asset-input/packages/worker/node_modules/opossum/lib/status.js"(exports2, module2) {
    "use strict";
    var WINDOW = Symbol("window");
    var BUCKETS = Symbol("buckets");
    var TIMEOUT = Symbol("timeout");
    var PERCENTILES = Symbol("percentiles");
    var BUCKET_INTERVAL = Symbol("bucket-interval");
    var SNAPSHOT_INTERVAL = Symbol("snapshot-interval");
    var ROTATE_EVENT_NAME = Symbol("rotate-event-name");
    var EventEmitter = require("events").EventEmitter;
    var Status = class extends EventEmitter {
      constructor(options) {
        super();
        this[BUCKETS] = options.rollingCountBuckets || 10;
        this[TIMEOUT] = options.rollingCountTimeout || 1e4;
        this[WINDOW] = new Array(this[BUCKETS]);
        this[PERCENTILES] = [0, 0.25, 0.5, 0.75, 0.9, 0.95, 0.99, 0.995, 1];
        this[ROTATE_EVENT_NAME] = "rotate";
        this.rollingPercentilesEnabled = options.rollingPercentilesEnabled !== false;
        this.enableSnapshots = options.enableSnapshots !== false;
        this.rotateBucketController = options.rotateBucketController;
        this.rotateBucket = nextBucket(this[WINDOW]);
        for (let i = 0; i < this[BUCKETS]; i++) this[WINDOW][i] = bucket();
        const bucketInterval = Math.floor(this[TIMEOUT] / this[BUCKETS]);
        if (this.rotateBucketController) {
          this.startListeneningForRotateEvent();
        } else {
          this[BUCKET_INTERVAL] = setInterval(this.rotateBucket, bucketInterval);
          if (typeof this[BUCKET_INTERVAL].unref === "function") {
            this[BUCKET_INTERVAL].unref();
          }
        }
        if (this.enableSnapshots) {
          this[SNAPSHOT_INTERVAL] = setInterval(
            (_) => this.emit("snapshot", this.stats),
            bucketInterval
          );
          if (typeof this[SNAPSHOT_INTERVAL].unref === "function") {
            this[SNAPSHOT_INTERVAL].unref();
          }
        }
        if (options.stats) {
          this[WINDOW][0] = { ...bucket(), ...options.stats };
        }
      }
      /**
       * Get the cumulative stats for the current window
       * @type {Object}
       */
      get stats() {
        const totals = this[WINDOW].reduce((acc, val) => {
          if (!val) {
            return acc;
          }
          Object.keys(acc).forEach((key) => {
            if (key !== "latencyTimes" && key !== "percentiles") {
              acc[key] += val[key] || 0;
            }
          });
          if (this.rollingPercentilesEnabled) {
            if (val.latencyTimes) {
              acc.latencyTimes = acc.latencyTimes.concat(val.latencyTimes);
            }
          }
          return acc;
        }, bucket());
        if (this.rollingPercentilesEnabled) {
          totals.latencyTimes.sort((a, b) => a - b);
          if (totals.latencyTimes.length) {
            totals.latencyMean = totals.latencyTimes.reduce((a, b) => a + b, 0) / totals.latencyTimes.length;
          } else {
            totals.latencyMean = 0;
          }
          this[PERCENTILES].forEach((percentile) => {
            totals.percentiles[percentile] = calculatePercentile(percentile, totals.latencyTimes);
          });
        } else {
          totals.latencyMean = -1;
          this[PERCENTILES].forEach((percentile) => {
            totals.percentiles[percentile] = -1;
          });
        }
        return totals;
      }
      /**
       * Gets the stats window as an array of time-sliced objects.
       * @type {Array}
       */
      get window() {
        return this[WINDOW].slice();
      }
      increment(property, latencyRunTime) {
        this[WINDOW][0][property]++;
        if (property === "successes" || property === "failures" || property === "timeouts") {
          this[WINDOW][0].latencyTimes.push(latencyRunTime || 0);
        }
      }
      open() {
        this[WINDOW][0].isCircuitBreakerOpen = true;
      }
      close() {
        this[WINDOW][0].isCircuitBreakerOpen = false;
      }
      shutdown() {
        this.removeAllListeners();
        if (this.rotateBucketController === void 0) {
          clearInterval(this[BUCKET_INTERVAL]);
        } else {
          this.removeRotateBucketControllerListener();
        }
        if (this.enableSnapshots) {
          clearInterval(this[SNAPSHOT_INTERVAL]);
        }
      }
      removeRotateBucketControllerListener() {
        if (this.rotateBucketController) {
          this.rotateBucketController.removeListener(
            this[ROTATE_EVENT_NAME],
            this.rotateBucket
          );
        }
      }
      startListeneningForRotateEvent() {
        if (this.rotateBucketController && this.rotateBucketController.listenerCount(
          this[ROTATE_EVENT_NAME],
          this.rotateBucket
        ) === 0) {
          this.rotateBucketController.on(
            this[ROTATE_EVENT_NAME],
            this.rotateBucket
          );
        }
      }
    };
    var nextBucket = (window2) => (_) => {
      window2.pop();
      window2.unshift(bucket());
    };
    var bucket = (_) => ({
      failures: 0,
      fallbacks: 0,
      successes: 0,
      rejects: 0,
      fires: 0,
      timeouts: 0,
      cacheHits: 0,
      cacheMisses: 0,
      coalesceCacheHits: 0,
      coalesceCacheMisses: 0,
      semaphoreRejections: 0,
      percentiles: {},
      latencyTimes: []
    });
    function calculatePercentile(percentile, arr) {
      if (percentile === 0) {
        return arr[0] || 0;
      }
      const idx = Math.ceil(percentile * arr.length);
      return arr[idx - 1] || 0;
    }
    module2.exports = exports2 = Status;
  }
});

// asset-input/packages/worker/node_modules/opossum/lib/semaphore.js
var require_semaphore = __commonJS({
  "asset-input/packages/worker/node_modules/opossum/lib/semaphore.js"(exports2, module2) {
    "use strict";
    module2.exports = exports2 = semaphore;
    function semaphore(count) {
      const resolvers = [];
      let counter = count;
      const sem = {
        take,
        release,
        test
      };
      Object.defineProperty(sem, "count", {
        get: (_) => counter,
        enumerable: true
      });
      return sem;
      function take(timeout) {
        if (counter > 0) {
          --counter;
          return Promise.resolve(release);
        }
        return new Promise((resolve, reject) => {
          resolvers.push((_) => {
            --counter;
            resolve(release);
          });
          if (timeout) {
            setTimeout((_) => {
              resolvers.shift();
              const err = new Error(`Timed out after ${timeout}ms`);
              err.code = "ETIMEDOUT";
              reject(err);
            }, timeout);
          }
        });
      }
      function release() {
        counter++;
        if (resolvers.length > 0) {
          resolvers.shift()();
        }
      }
      function test() {
        if (counter < 1) return false;
        return take() && true;
      }
    }
  }
});

// asset-input/packages/worker/node_modules/opossum/lib/cache.js
var require_cache = __commonJS({
  "asset-input/packages/worker/node_modules/opossum/lib/cache.js"(exports2, module2) {
    var MemoryCache = class {
      constructor(maxEntries) {
        this.cache = /* @__PURE__ */ new Map();
        this.maxEntries = maxEntries ?? 2 ** 24 - 1;
      }
      /**
       * Get cache value by key
       * @param {string} key Cache key
       * @return {any} Response from cache
       */
      get(key) {
        const cached = this.cache.get(key);
        if (cached) {
          if (cached.expiresAt > Date.now() || cached.expiresAt === 0) {
            return cached.value;
          }
          this.cache.delete(key);
        }
        return void 0;
      }
      /**
       * Set cache key with value and ttl
       * @param {string} key Cache key
       * @param {any} value Value to cache
       * @param {number} ttl Time to live in milliseconds
       * @return {void}
       */
      set(key, value, ttl) {
        if (this.cache.size === this.maxEntries && this.get(key) === void 0) {
          this.cache.delete(this.cache.keys().next().value);
        }
        this.cache.set(key, {
          expiresAt: ttl,
          value
        });
      }
      /**
       * Delete cache key
       * @param {string} key Cache key
       * @return {void}
       */
      delete(key) {
        this.cache.delete(key);
      }
      /**
       * Clear cache
       * @returns {void}
       */
      flush() {
        this.cache.clear();
      }
    };
    module2.exports = exports2 = MemoryCache;
  }
});

// asset-input/packages/worker/node_modules/opossum/lib/circuit.js
var require_circuit = __commonJS({
  "asset-input/packages/worker/node_modules/opossum/lib/circuit.js"(exports2, module2) {
    "use strict";
    var EventEmitter = require("events");
    var Status = require_status3();
    var Semaphore = require_semaphore();
    var MemoryCache = require_cache();
    var STATE = Symbol("state");
    var OPEN = Symbol("open");
    var CLOSED = Symbol("closed");
    var HALF_OPEN = Symbol("half-open");
    var PENDING_CLOSE = Symbol("pending-close");
    var SHUTDOWN = Symbol("shutdown");
    var FALLBACK_FUNCTION = Symbol("fallback");
    var STATUS = Symbol("status");
    var NAME = Symbol("name");
    var GROUP = Symbol("group");
    var ENABLED = Symbol("Enabled");
    var WARMING_UP = Symbol("warming-up");
    var VOLUME_THRESHOLD = Symbol("volume-threshold");
    var OUR_ERROR = Symbol("our-error");
    var RESET_TIMEOUT = Symbol("reset-timeout");
    var WARMUP_TIMEOUT = Symbol("warmup-timeout");
    var LAST_TIMER_AT = Symbol("last-timer-at");
    var deprecation = `options.maxFailures is deprecated. Please use options.errorThresholdPercentage`;
    var CircuitBreaker2 = class _CircuitBreaker extends EventEmitter {
      /**
       * Returns true if the provided error was generated here. It will be false
       * if the error came from the action itself.
       * @param {Error} error The Error to check.
       * @returns {Boolean} true if the error was generated here
       */
      static isOurError(error) {
        return !!error[OUR_ERROR];
      }
      /**
      * Create a new Status object,
      * helpful when you need to prime a breaker with stats
      * @param {Object} options -
      * @param {Number} options.rollingCountBuckets number of buckets in the window
      * @param {Number} options.rollingCountTimeout the duration of the window
      * @param {Boolean} options.rollingPercentilesEnabled whether to calculate
      * @param {Object} options.stats user supplied stats
      * @returns {Status} a new {@link Status} object
      */
      static newStatus(options) {
        return new Status(options);
      }
      constructor(action, options = {}) {
        super();
        this.options = options;
        this.options.timeout = options.timeout ?? 1e4;
        this.options.resetTimeout = options.resetTimeout ?? 3e4;
        this.options.errorThresholdPercentage = options.errorThresholdPercentage ?? 50;
        this.options.rollingCountTimeout = options.rollingCountTimeout ?? 1e4;
        this.options.rollingCountBuckets = options.rollingCountBuckets ?? 10;
        this.options.rollingPercentilesEnabled = options.rollingPercentilesEnabled !== false;
        this.options.capacity = Number.isInteger(options.capacity) ? options.capacity : Number.MAX_SAFE_INTEGER;
        this.options.errorFilter = options.errorFilter || ((_) => false);
        this.options.cacheTTL = options.cacheTTL ?? 0;
        this.options.cacheGetKey = options.cacheGetKey ?? ((...args) => JSON.stringify(args));
        this.options.enableSnapshots = options.enableSnapshots !== false;
        this.options.rotateBucketController = options.rotateBucketController;
        this.options.coalesce = !!options.coalesce;
        this.options.coalesceTTL = options.coalesceTTL ?? this.options.timeout;
        this.options.coalesceResetOn = options.coalesceResetOn?.filter((o) => ["error", "success", "timeout"].includes(o)) || [];
        if (this.options.cache) {
          if (this.options.cacheTransport === void 0) {
            this.options.cacheTransport = new MemoryCache(options.cacheSize);
          } else if (typeof this.options.cacheTransport !== "object" || !this.options.cacheTransport.get || !this.options.cacheTransport.set || !this.options.cacheTransport.flush) {
            throw new TypeError(
              "options.cacheTransport should be an object with `get`, `set` and `flush` methods"
            );
          }
        }
        if (this.options.coalesce) {
          this.options.coalesceCache = new MemoryCache(options.coalesceSize);
        }
        this.semaphore = new Semaphore(this.options.capacity);
        if (!action) {
          throw new TypeError(
            "No action provided. Cannot construct a CircuitBreaker without an invocable action."
          );
        }
        if (options.autoRenewAbortController && !options.abortController) {
          options.abortController = new AbortController();
        }
        if (options.abortController && typeof options.abortController.abort !== "function") {
          throw new TypeError(
            "AbortController does not contain `abort()` method"
          );
        }
        this[VOLUME_THRESHOLD] = Number.isInteger(options.volumeThreshold) ? options.volumeThreshold : 0;
        this[WARMING_UP] = options.allowWarmUp === true;
        if (this.options.status) {
          if (this.options.status instanceof Status) {
            this[STATUS] = this.options.status;
          } else {
            this[STATUS] = new Status({ stats: this.options.status });
          }
        } else {
          this[STATUS] = new Status(this.options);
        }
        this[STATE] = CLOSED;
        if (options.state) {
          this[ENABLED] = options.state.enabled !== false;
          this[WARMING_UP] = options.state.warmUp || this[WARMING_UP];
          this[CLOSED] = options.state.closed !== false;
          this[HALF_OPEN] = this[PENDING_CLOSE] = options.state.halfOpen || false;
          this[OPEN] = !this[CLOSED] && !this[HALF_OPEN];
          this[SHUTDOWN] = options.state.shutdown || false;
        } else {
          this[PENDING_CLOSE] = false;
          this[ENABLED] = options.enabled !== false;
        }
        this[FALLBACK_FUNCTION] = null;
        this[NAME] = options.name || action.name || nextName();
        this[GROUP] = options.group || this[NAME];
        if (this[WARMING_UP]) {
          const timer = this[WARMUP_TIMEOUT] = setTimeout(
            (_) => this[WARMING_UP] = false,
            this.options.rollingCountTimeout
          );
          if (typeof timer.unref === "function") {
            timer.unref();
          }
        }
        if (typeof action !== "function") {
          this.action = (_) => Promise.resolve(action);
        } else this.action = action;
        if (options.maxFailures) console.error(deprecation);
        const increment = (property) => (result, runTime) => this[STATUS].increment(property, runTime);
        this.on("success", increment("successes"));
        this.on("failure", increment("failures"));
        this.on("fallback", increment("fallbacks"));
        this.on("timeout", increment("timeouts"));
        this.on("fire", increment("fires"));
        this.on("reject", increment("rejects"));
        this.on("cacheHit", increment("cacheHits"));
        this.on("cacheMiss", increment("cacheMisses"));
        this.on("coalesceCacheHit", increment("coalesceCacheHits"));
        this.on("coalesceCacheMiss", increment("coalesceCacheMisses"));
        this.on("open", (_) => this[STATUS].open());
        this.on("close", (_) => this[STATUS].close());
        this.on("semaphoreLocked", increment("semaphoreRejections"));
        function _startTimer(circuit) {
          circuit[LAST_TIMER_AT] = Date.now();
          return (_) => {
            const timer = circuit[RESET_TIMEOUT] = setTimeout(() => {
              _halfOpen(circuit);
            }, circuit.options.resetTimeout);
            if (typeof timer.unref === "function") {
              timer.unref();
            }
          };
        }
        function _halfOpen(circuit) {
          circuit[STATE] = HALF_OPEN;
          circuit[PENDING_CLOSE] = true;
          circuit._renewAbortControllerIfNeeded();
          circuit.emit("halfOpen", circuit.options.resetTimeout);
        }
        this.on("open", _startTimer(this));
        this.on("success", (_) => {
          if (this.halfOpen) {
            this.close();
          }
        });
        if (this[SHUTDOWN]) {
          this[STATE] = SHUTDOWN;
          this.shutdown();
        } else if (this[CLOSED]) {
          this.close();
        } else if (this[OPEN]) {
          if (this.options.state.lastTimerAt !== void 0 && Date.now() - this.options.state.lastTimerAt > this.options.resetTimeout) {
            _halfOpen(this);
          } else {
            this.open();
          }
        } else if (this[HALF_OPEN]) {
          this[STATE] = HALF_OPEN;
        }
      }
      /**
       * Renews the abort controller if needed
       * @private
       * @returns {void}
       */
      _renewAbortControllerIfNeeded() {
        if (this.options.autoRenewAbortController && this.options.abortController && this.options.abortController.signal.aborted) {
          this.options.abortController = new AbortController();
        }
      }
      /**
       * Closes the breaker, allowing the action to execute again
       * @fires CircuitBreaker#close
       * @returns {void}
       */
      close() {
        if (this[STATE] !== CLOSED) {
          if (this[RESET_TIMEOUT]) {
            clearTimeout(this[RESET_TIMEOUT]);
          }
          this[STATE] = CLOSED;
          this[PENDING_CLOSE] = false;
          this._renewAbortControllerIfNeeded();
          this.emit("close");
        }
      }
      /**
       * Opens the breaker. Each time the breaker is fired while the circuit is
       * opened, a failed Promise is returned, or if any fallback function
       * has been provided, it is invoked.
       *
       * If the breaker is already open this call does nothing.
       * @fires CircuitBreaker#open
       * @returns {void}
       */
      open() {
        if (this[STATE] !== OPEN) {
          this[STATE] = OPEN;
          this[PENDING_CLOSE] = false;
          this.emit("open");
        }
      }
      /**
       * Shuts down this circuit breaker. All subsequent calls to the
       * circuit will fail, returning a rejected promise.
       * @returns {void}
       */
      shutdown() {
        this.emit("shutdown");
        this.disable();
        this.removeAllListeners();
        if (this[RESET_TIMEOUT]) {
          clearTimeout(this[RESET_TIMEOUT]);
        }
        if (this[WARMUP_TIMEOUT]) {
          clearTimeout(this[WARMUP_TIMEOUT]);
        }
        this.status.shutdown();
        this[STATE] = SHUTDOWN;
        this.clearCache();
      }
      /**
       * Determines if the circuit has been shutdown.
       * @type {Boolean}
       */
      get isShutdown() {
        return this[STATE] === SHUTDOWN;
      }
      /**
       * Gets the name of this circuit
       * @type {String}
       */
      get name() {
        return this[NAME];
      }
      /**
       * Gets the name of this circuit group
       * @type {String}
       */
      get group() {
        return this[GROUP];
      }
      /**
       * Gets whether this circuit is in the `pendingClosed` state
       * @type {Boolean}
       */
      get pendingClose() {
        return this[PENDING_CLOSE];
      }
      /**
       * True if the circuit is currently closed. False otherwise.
       * @type {Boolean}
       */
      get closed() {
        return this[STATE] === CLOSED;
      }
      /**
       * True if the circuit is currently opened. False otherwise.
       * @type {Boolean}
       */
      get opened() {
        return this[STATE] === OPEN;
      }
      /**
       * True if the circuit is currently half opened. False otherwise.
       * @type {Boolean}
       */
      get halfOpen() {
        return this[STATE] === HALF_OPEN;
      }
      /**
       * The current {@link Status} of this {@link CircuitBreaker}
       * @type {Status}
       */
      get status() {
        return this[STATUS];
      }
      /**
       * Get the current stats for the circuit.
       * @see Status#stats
       * @type {Object}
       */
      get stats() {
        return this[STATUS].stats;
      }
      toJSON() {
        return {
          state: {
            name: this.name,
            enabled: this.enabled,
            closed: this.closed,
            open: this.opened,
            halfOpen: this.halfOpen,
            warmUp: this.warmUp,
            shutdown: this.isShutdown,
            lastTimerAt: this[LAST_TIMER_AT]
          },
          status: this.status.stats
        };
      }
      /**
       * Gets whether the circuit is enabled or not
       * @type {Boolean}
       */
      get enabled() {
        return this[ENABLED];
      }
      /**
       * Gets whether the circuit is currently in warm up phase
       * @type {Boolean}
       */
      get warmUp() {
        return this[WARMING_UP];
      }
      /**
       * Gets the volume threshold for this circuit
       * @type {Boolean}
       */
      get volumeThreshold() {
        return this[VOLUME_THRESHOLD];
      }
      /**
       * Provide a fallback function for this {@link CircuitBreaker}. This
       * function will be executed when the circuit is `fire`d and fails.
       * It will always be preceded by a `failure` event, and `breaker.fire` returns
       * a rejected Promise.
       * @param {Function | CircuitBreaker} func the fallback function to execute
       * when the breaker has opened or when a timeout or error occurs.
       * @return {CircuitBreaker} this
       */
      fallback(func) {
        let fb = func;
        if (func instanceof _CircuitBreaker) {
          fb = (...args) => func.fire(...args);
        }
        this[FALLBACK_FUNCTION] = fb;
        return this;
      }
      /**
       * Execute the action for this circuit. If the action fails or times out, the
       * returned promise will be rejected. If the action succeeds, the promise will
       * resolve with the resolved value from action. If a fallback function was
       * provided, it will be invoked in the event of any failure or timeout.
       *
       * Any parameters passed to this function will be proxied to the circuit
       * function.
       *
       * @return {Promise<any>} promise resolves with the circuit function's return
       * value on success or is rejected on failure of the action. Use isOurError()
       * to determine if a rejection was a result of the circuit breaker or the
       * action.
       *
       * @fires CircuitBreaker#failure
       * @fires CircuitBreaker#fallback
       * @fires CircuitBreaker#fire
       * @fires CircuitBreaker#reject
       * @fires CircuitBreaker#success
       * @fires CircuitBreaker#timeout
       * @fires CircuitBreaker#semaphoreLocked
       */
      fire(...args) {
        return this.call(this.action, ...args);
      }
      /**
       * Execute the action for this circuit using `context` as `this`.
       * If the action fails or times out, the
       * returned promise will be rejected. If the action succeeds, the promise will
       * resolve with the resolved value from action. If a fallback function was
       * provided, it will be invoked in the event of any failure or timeout.
       *
       * Any parameters in addition to `context will be passed to the
       * circuit function.
       *
       * @param {any} context the `this` context used for function execution
       * @param {any} rest the arguments passed to the action
       *
       * @return {Promise<any>} promise resolves with the circuit function's return
       * value on success or is rejected on failure of the action.
       *
       * @fires CircuitBreaker#failure
       * @fires CircuitBreaker#fallback
       * @fires CircuitBreaker#fire
       * @fires CircuitBreaker#reject
       * @fires CircuitBreaker#success
       * @fires CircuitBreaker#timeout
       * @fires CircuitBreaker#semaphoreLocked
       */
      call(context, ...rest) {
        if (this.isShutdown) {
          const err = buildError("The circuit has been shutdown.", "ESHUTDOWN");
          return Promise.reject(err);
        }
        const args = rest.slice();
        this.emit("fire", args);
        if (!this[ENABLED]) {
          const result = this.action.apply(context, args);
          return typeof result.then === "function" ? result : Promise.resolve(result);
        }
        const cacheKey = this.options.cache || this.options.coalesce ? this.options.cacheGetKey.apply(this, rest) : "";
        if (this.options.cache) {
          const cached = this.options.cacheTransport.get(cacheKey);
          if (cached) {
            this.emit("cacheHit");
            return cached;
          }
          this.emit("cacheMiss");
        }
        if (this.options.coalesce) {
          const cachedCall = this.options.coalesceCache.get(cacheKey);
          if (cachedCall) {
            this.emit("coalesceCacheHit");
            return cachedCall;
          }
          this.emit("coalesceCacheMiss");
        }
        if (!this.closed && !this.pendingClose) {
          const error = buildError("Breaker is open", "EOPENBREAKER");
          this.emit("reject", error);
          return fallback(this, error, args) || Promise.reject(error);
        }
        this[PENDING_CLOSE] = false;
        let timeout;
        let timeoutError = false;
        const call = new Promise((resolve, reject) => {
          const latencyStartTime = Date.now();
          if (this.semaphore.test()) {
            if (this.options.timeout) {
              timeout = setTimeout(
                () => {
                  timeoutError = true;
                  const error = buildError(
                    `Timed out after ${this.options.timeout}ms`,
                    "ETIMEDOUT"
                  );
                  const latency = Date.now() - latencyStartTime;
                  this.semaphore.release();
                  this.emit("timeout", error, latency, args);
                  handleError(error, this, timeout, args, latency, resolve, reject);
                  resetCoalesce(this, cacheKey, "timeout");
                  if (this.options.abortController) {
                    this.options.abortController.abort();
                  }
                },
                this.options.timeout
              );
            }
            try {
              const result = this.action.apply(context, args);
              const promise = typeof result.then === "function" ? result : Promise.resolve(result);
              promise.then((result2) => {
                if (!timeoutError) {
                  clearTimeout(timeout);
                  this.emit("success", result2, Date.now() - latencyStartTime);
                  resetCoalesce(this, cacheKey, "success");
                  this.semaphore.release();
                  resolve(result2);
                  if (this.options.cache) {
                    this.options.cacheTransport.set(
                      cacheKey,
                      promise,
                      this.options.cacheTTL > 0 ? Date.now() + this.options.cacheTTL : 0
                    );
                  }
                }
              }).catch((error) => {
                if (!timeoutError) {
                  this.semaphore.release();
                  const latencyEndTime = Date.now() - latencyStartTime;
                  handleError(
                    error,
                    this,
                    timeout,
                    args,
                    latencyEndTime,
                    resolve,
                    reject
                  );
                  resetCoalesce(this, cacheKey, "error");
                }
              });
            } catch (error) {
              this.semaphore.release();
              const latency = Date.now() - latencyStartTime;
              handleError(error, this, timeout, args, latency, resolve, reject);
              resetCoalesce(this, cacheKey, "error");
            }
          } else {
            const latency = Date.now() - latencyStartTime;
            const err = buildError("Semaphore locked", "ESEMLOCKED");
            this.emit("semaphoreLocked", err, latency);
            handleError(err, this, timeout, args, latency, resolve, reject);
            resetCoalesce(this, cacheKey);
          }
        });
        if (this.options.coalesce) {
          this.options.coalesceCache.set(
            cacheKey,
            call,
            this.options.coalesceTTL > 0 ? Date.now() + this.options.coalesceTTL : 0
          );
        }
        return call;
      }
      /**
       * Clears the cache of this {@link CircuitBreaker}
       * @returns {void}
       */
      clearCache() {
        if (this.options.cache) {
          this.options.cacheTransport.flush();
        }
        if (this.options.coalesceCache) {
          this.options.coalesceCache.flush();
        }
      }
      /**
       * Provide a health check function to be called periodically. The function
       * should return a Promise. If the promise is rejected the circuit will open.
       * This is in addition to the existing circuit behavior as defined by
       * `options.errorThresholdPercentage` in the constructor. For example, if the
       * health check function provided here always returns a resolved promise, the
       * circuit can still trip and open if there are failures exceeding the
       * configured threshold. The health check function is executed within the
       * circuit breaker's execution context, so `this` within the function is the
       * circuit breaker itself.
       *
       * @param {Function} func a health check function which returns a promise.
       * @param {Number} [interval] the amount of time between calls to the health
       * check function. Default: 5000 (5 seconds)
       *
       * @returns {void}
       *
       * @fires CircuitBreaker#healthCheckFailed
       * @throws {TypeError} if `interval` is supplied but not a number
       */
      healthCheck(func, interval) {
        interval = interval || 5e3;
        if (typeof func !== "function") {
          throw new TypeError("Health check function must be a function");
        }
        if (isNaN(interval)) {
          throw new TypeError("Health check interval must be a number");
        }
        const check = (_) => {
          func.apply(this).catch((e) => {
            this.emit("healthCheckFailed", e);
            this.open();
          });
        };
        const timer = setInterval(check, interval);
        if (typeof timer.unref === "function") {
          timer.unref();
        }
        check();
      }
      /**
       * Enables this circuit. If the circuit is the  disabled
       * state, it will be re-enabled. If not, this is essentially
       * a noop.
       * @returns {void}
       */
      enable() {
        this[ENABLED] = true;
        this.status.startListeneningForRotateEvent();
      }
      /**
       * Disables this circuit, causing all calls to the circuit's function
       * to be executed without circuit or fallback protection.
       * @returns {void}
       */
      disable() {
        this[ENABLED] = false;
        this.status.removeRotateBucketControllerListener();
      }
      /**
       * Retrieves the current AbortSignal from the abortController, if available.
       * This signal can be used to monitor ongoing requests.
       * @returns {AbortSignal|undefined} The AbortSignal if present,
       * otherwise undefined.
       */
      getSignal() {
        if (this.options.abortController && this.options.abortController.signal) {
          return this.options.abortController.signal;
        }
        return void 0;
      }
      /**
       * Retrieves the current AbortController instance.
       * This controller can be used to manually abort ongoing requests or create
       * a new signal.
       * @returns {AbortController|undefined} The AbortController if present,
       * otherwise undefined.
       */
      getAbortController() {
        return this.options.abortController;
      }
    };
    function handleError(error, circuit, timeout, args, latency, resolve, reject) {
      clearTimeout(timeout);
      if (circuit.options.errorFilter(error, ...args)) {
        circuit.emit("success", error, latency);
      } else {
        fail(circuit, error, args, latency);
        const fb = fallback(circuit, error, args);
        if (fb) return resolve(fb);
      }
      reject(error);
    }
    function fallback(circuit, err, args) {
      if (circuit[FALLBACK_FUNCTION]) {
        try {
          const result = circuit[FALLBACK_FUNCTION].apply(circuit[FALLBACK_FUNCTION], [...args, err]);
          circuit.emit("fallback", result, err);
          if (result instanceof Promise) return result;
          return Promise.resolve(result);
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }
    function fail(circuit, err, args, latency) {
      circuit.emit("failure", err, latency, args);
      if (circuit.warmUp) return;
      const stats = circuit.stats;
      if (stats.fires < circuit.volumeThreshold && !circuit.halfOpen) return;
      const errorRate = stats.failures / stats.fires * 100;
      if (errorRate > circuit.options.errorThresholdPercentage || circuit.halfOpen) {
        circuit.open();
      }
    }
    function resetCoalesce(circuit, cacheKey, event) {
      if (!event || circuit.options.coalesceResetOn.includes(event)) {
        circuit.options.coalesceCache?.delete(cacheKey);
      }
    }
    function buildError(msg, code) {
      const error = new Error(msg);
      error.code = code;
      error[OUR_ERROR] = true;
      return error;
    }
    var nextName = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
    module2.exports = exports2 = CircuitBreaker2;
  }
});

// asset-input/packages/worker/node_modules/opossum/index.js
var require_opossum = __commonJS({
  "asset-input/packages/worker/node_modules/opossum/index.js"(exports2, module2) {
    "use strict";
    module2.exports = exports2 = require_circuit();
  }
});

// asset-input/packages/worker/src/lambdas/cdcProcessor.ts
var cdcProcessor_exports = {};
__export(cdcProcessor_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(cdcProcessor_exports);
var import_client_s3 = require("@aws-sdk/client-s3");
var import_client_sqs = require("@aws-sdk/client-sqs");
var import_client_cloudwatch2 = require("@aws-sdk/client-cloudwatch");

// asset-input/packages/worker/node_modules/@opensearch-project/opensearch/index.mjs
var import_index = __toESM(require_opensearch(), 1);
var Client = import_index.default.Client;
var Transport = import_index.default.Transport;
var ConnectionPool = import_index.default.ConnectionPool;
var Connection = import_index.default.Connection;
var Serializer = import_index.default.Serializer;
var events = import_index.default.events;
var errors = import_index.default.errors;

// asset-input/packages/worker/src/services/VectorStoreService.ts
var import_aws = __toESM(require_aws());
var import_credential_provider_node = require("@aws-sdk/credential-provider-node");
var import_client_cloudwatch = require("@aws-sdk/client-cloudwatch");

// asset-input/packages/worker/src/services/BedrockService.ts
var import_client_bedrock_runtime = require("@aws-sdk/client-bedrock-runtime");
var BedrockService = class {
  constructor(region = "us-west-2") {
    this.dimensions = 1024;
    this.client = new import_client_bedrock_runtime.BedrockRuntimeClient({ region });
  }
  /**
   * Generate embeddings for text input
   * @param text - Input text to embed (max 8192 tokens for Titan)
   * @returns Promise<number[]> - Zero-filled array of 1024 dimensions
   */
  async generateEmbeddings(text) {
    console.warn("BedrockService: Using shim implementation with zero-filled vectors");
    return new Array(this.dimensions).fill(0);
  }
  /**
   * Batch embedding generation for multiple texts
   * @param texts - Array of texts to embed
   * @returns Promise<number[][]> - Array of embedding vectors
   */
  async generateBatchEmbeddings(texts) {
    const embeddings = await Promise.all(
      texts.map((text) => this.generateEmbeddings(text))
    );
    return embeddings;
  }
  /**
   * Production implementation template (Week 2)
   * Uncomment when Bedrock access is configured
   */
  async generateEmbeddingsProduction(text) {
    return [];
  }
};

// asset-input/packages/worker/node_modules/lru-cache/dist/esm/index.js
var defaultPerf = typeof performance === "object" && performance && typeof performance.now === "function" ? performance : Date;
var warned = /* @__PURE__ */ new Set();
var PROCESS = typeof process === "object" && !!process ? process : {};
var emitWarning = (msg, type, code, fn) => {
  typeof PROCESS.emitWarning === "function" ? PROCESS.emitWarning(msg, type, code, fn) : console.error(`[${code}] ${type}: ${msg}`);
};
var AC = globalThis.AbortController;
var AS = globalThis.AbortSignal;
if (typeof AC === "undefined") {
  AS = class AbortSignal {
    onabort;
    _onabort = [];
    reason;
    aborted = false;
    addEventListener(_, fn) {
      this._onabort.push(fn);
    }
  };
  AC = class AbortController {
    constructor() {
      warnACPolyfill();
    }
    signal = new AS();
    abort(reason) {
      if (this.signal.aborted)
        return;
      this.signal.reason = reason;
      this.signal.aborted = true;
      for (const fn of this.signal._onabort) {
        fn(reason);
      }
      this.signal.onabort?.(reason);
    }
  };
  let printACPolyfillWarning = PROCESS.env?.LRU_CACHE_IGNORE_AC_WARNING !== "1";
  const warnACPolyfill = () => {
    if (!printACPolyfillWarning)
      return;
    printACPolyfillWarning = false;
    emitWarning("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.", "NO_ABORT_CONTROLLER", "ENOTSUP", warnACPolyfill);
  };
}
var shouldWarn = (code) => !warned.has(code);
var TYPE = Symbol("type");
var isPosInt = (n) => n && n === Math.floor(n) && n > 0 && isFinite(n);
var getUintArray = (max) => !isPosInt(max) ? null : max <= Math.pow(2, 8) ? Uint8Array : max <= Math.pow(2, 16) ? Uint16Array : max <= Math.pow(2, 32) ? Uint32Array : max <= Number.MAX_SAFE_INTEGER ? ZeroArray : null;
var ZeroArray = class extends Array {
  constructor(size) {
    super(size);
    this.fill(0);
  }
};
var Stack = class _Stack {
  heap;
  length;
  // private constructor
  static #constructing = false;
  static create(max) {
    const HeapCls = getUintArray(max);
    if (!HeapCls)
      return [];
    _Stack.#constructing = true;
    const s = new _Stack(max, HeapCls);
    _Stack.#constructing = false;
    return s;
  }
  constructor(max, HeapCls) {
    if (!_Stack.#constructing) {
      throw new TypeError("instantiate Stack using Stack.create(n)");
    }
    this.heap = new HeapCls(max);
    this.length = 0;
  }
  push(n) {
    this.heap[this.length++] = n;
  }
  pop() {
    return this.heap[--this.length];
  }
};
var LRUCache = class _LRUCache {
  // options that cannot be changed without disaster
  #max;
  #maxSize;
  #dispose;
  #onInsert;
  #disposeAfter;
  #fetchMethod;
  #memoMethod;
  #perf;
  /**
   * {@link LRUCache.OptionsBase.perf}
   */
  get perf() {
    return this.#perf;
  }
  /**
   * {@link LRUCache.OptionsBase.ttl}
   */
  ttl;
  /**
   * {@link LRUCache.OptionsBase.ttlResolution}
   */
  ttlResolution;
  /**
   * {@link LRUCache.OptionsBase.ttlAutopurge}
   */
  ttlAutopurge;
  /**
   * {@link LRUCache.OptionsBase.updateAgeOnGet}
   */
  updateAgeOnGet;
  /**
   * {@link LRUCache.OptionsBase.updateAgeOnHas}
   */
  updateAgeOnHas;
  /**
   * {@link LRUCache.OptionsBase.allowStale}
   */
  allowStale;
  /**
   * {@link LRUCache.OptionsBase.noDisposeOnSet}
   */
  noDisposeOnSet;
  /**
   * {@link LRUCache.OptionsBase.noUpdateTTL}
   */
  noUpdateTTL;
  /**
   * {@link LRUCache.OptionsBase.maxEntrySize}
   */
  maxEntrySize;
  /**
   * {@link LRUCache.OptionsBase.sizeCalculation}
   */
  sizeCalculation;
  /**
   * {@link LRUCache.OptionsBase.noDeleteOnFetchRejection}
   */
  noDeleteOnFetchRejection;
  /**
   * {@link LRUCache.OptionsBase.noDeleteOnStaleGet}
   */
  noDeleteOnStaleGet;
  /**
   * {@link LRUCache.OptionsBase.allowStaleOnFetchAbort}
   */
  allowStaleOnFetchAbort;
  /**
   * {@link LRUCache.OptionsBase.allowStaleOnFetchRejection}
   */
  allowStaleOnFetchRejection;
  /**
   * {@link LRUCache.OptionsBase.ignoreFetchAbort}
   */
  ignoreFetchAbort;
  // computed properties
  #size;
  #calculatedSize;
  #keyMap;
  #keyList;
  #valList;
  #next;
  #prev;
  #head;
  #tail;
  #free;
  #disposed;
  #sizes;
  #starts;
  #ttls;
  #hasDispose;
  #hasFetchMethod;
  #hasDisposeAfter;
  #hasOnInsert;
  /**
   * Do not call this method unless you need to inspect the
   * inner workings of the cache.  If anything returned by this
   * object is modified in any way, strange breakage may occur.
   *
   * These fields are private for a reason!
   *
   * @internal
   */
  static unsafeExposeInternals(c) {
    return {
      // properties
      starts: c.#starts,
      ttls: c.#ttls,
      sizes: c.#sizes,
      keyMap: c.#keyMap,
      keyList: c.#keyList,
      valList: c.#valList,
      next: c.#next,
      prev: c.#prev,
      get head() {
        return c.#head;
      },
      get tail() {
        return c.#tail;
      },
      free: c.#free,
      // methods
      isBackgroundFetch: (p) => c.#isBackgroundFetch(p),
      backgroundFetch: (k, index, options, context) => c.#backgroundFetch(k, index, options, context),
      moveToTail: (index) => c.#moveToTail(index),
      indexes: (options) => c.#indexes(options),
      rindexes: (options) => c.#rindexes(options),
      isStale: (index) => c.#isStale(index)
    };
  }
  // Protected read-only members
  /**
   * {@link LRUCache.OptionsBase.max} (read-only)
   */
  get max() {
    return this.#max;
  }
  /**
   * {@link LRUCache.OptionsBase.maxSize} (read-only)
   */
  get maxSize() {
    return this.#maxSize;
  }
  /**
   * The total computed size of items in the cache (read-only)
   */
  get calculatedSize() {
    return this.#calculatedSize;
  }
  /**
   * The number of items stored in the cache (read-only)
   */
  get size() {
    return this.#size;
  }
  /**
   * {@link LRUCache.OptionsBase.fetchMethod} (read-only)
   */
  get fetchMethod() {
    return this.#fetchMethod;
  }
  get memoMethod() {
    return this.#memoMethod;
  }
  /**
   * {@link LRUCache.OptionsBase.dispose} (read-only)
   */
  get dispose() {
    return this.#dispose;
  }
  /**
   * {@link LRUCache.OptionsBase.onInsert} (read-only)
   */
  get onInsert() {
    return this.#onInsert;
  }
  /**
   * {@link LRUCache.OptionsBase.disposeAfter} (read-only)
   */
  get disposeAfter() {
    return this.#disposeAfter;
  }
  constructor(options) {
    const { max = 0, ttl, ttlResolution = 1, ttlAutopurge, updateAgeOnGet, updateAgeOnHas, allowStale, dispose, onInsert, disposeAfter, noDisposeOnSet, noUpdateTTL, maxSize = 0, maxEntrySize = 0, sizeCalculation, fetchMethod, memoMethod, noDeleteOnFetchRejection, noDeleteOnStaleGet, allowStaleOnFetchRejection, allowStaleOnFetchAbort, ignoreFetchAbort, perf } = options;
    if (perf !== void 0) {
      if (typeof perf?.now !== "function") {
        throw new TypeError("perf option must have a now() method if specified");
      }
    }
    this.#perf = perf ?? defaultPerf;
    if (max !== 0 && !isPosInt(max)) {
      throw new TypeError("max option must be a nonnegative integer");
    }
    const UintArray = max ? getUintArray(max) : Array;
    if (!UintArray) {
      throw new Error("invalid max value: " + max);
    }
    this.#max = max;
    this.#maxSize = maxSize;
    this.maxEntrySize = maxEntrySize || this.#maxSize;
    this.sizeCalculation = sizeCalculation;
    if (this.sizeCalculation) {
      if (!this.#maxSize && !this.maxEntrySize) {
        throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");
      }
      if (typeof this.sizeCalculation !== "function") {
        throw new TypeError("sizeCalculation set to non-function");
      }
    }
    if (memoMethod !== void 0 && typeof memoMethod !== "function") {
      throw new TypeError("memoMethod must be a function if defined");
    }
    this.#memoMethod = memoMethod;
    if (fetchMethod !== void 0 && typeof fetchMethod !== "function") {
      throw new TypeError("fetchMethod must be a function if specified");
    }
    this.#fetchMethod = fetchMethod;
    this.#hasFetchMethod = !!fetchMethod;
    this.#keyMap = /* @__PURE__ */ new Map();
    this.#keyList = new Array(max).fill(void 0);
    this.#valList = new Array(max).fill(void 0);
    this.#next = new UintArray(max);
    this.#prev = new UintArray(max);
    this.#head = 0;
    this.#tail = 0;
    this.#free = Stack.create(max);
    this.#size = 0;
    this.#calculatedSize = 0;
    if (typeof dispose === "function") {
      this.#dispose = dispose;
    }
    if (typeof onInsert === "function") {
      this.#onInsert = onInsert;
    }
    if (typeof disposeAfter === "function") {
      this.#disposeAfter = disposeAfter;
      this.#disposed = [];
    } else {
      this.#disposeAfter = void 0;
      this.#disposed = void 0;
    }
    this.#hasDispose = !!this.#dispose;
    this.#hasOnInsert = !!this.#onInsert;
    this.#hasDisposeAfter = !!this.#disposeAfter;
    this.noDisposeOnSet = !!noDisposeOnSet;
    this.noUpdateTTL = !!noUpdateTTL;
    this.noDeleteOnFetchRejection = !!noDeleteOnFetchRejection;
    this.allowStaleOnFetchRejection = !!allowStaleOnFetchRejection;
    this.allowStaleOnFetchAbort = !!allowStaleOnFetchAbort;
    this.ignoreFetchAbort = !!ignoreFetchAbort;
    if (this.maxEntrySize !== 0) {
      if (this.#maxSize !== 0) {
        if (!isPosInt(this.#maxSize)) {
          throw new TypeError("maxSize must be a positive integer if specified");
        }
      }
      if (!isPosInt(this.maxEntrySize)) {
        throw new TypeError("maxEntrySize must be a positive integer if specified");
      }
      this.#initializeSizeTracking();
    }
    this.allowStale = !!allowStale;
    this.noDeleteOnStaleGet = !!noDeleteOnStaleGet;
    this.updateAgeOnGet = !!updateAgeOnGet;
    this.updateAgeOnHas = !!updateAgeOnHas;
    this.ttlResolution = isPosInt(ttlResolution) || ttlResolution === 0 ? ttlResolution : 1;
    this.ttlAutopurge = !!ttlAutopurge;
    this.ttl = ttl || 0;
    if (this.ttl) {
      if (!isPosInt(this.ttl)) {
        throw new TypeError("ttl must be a positive integer if specified");
      }
      this.#initializeTTLTracking();
    }
    if (this.#max === 0 && this.ttl === 0 && this.#maxSize === 0) {
      throw new TypeError("At least one of max, maxSize, or ttl is required");
    }
    if (!this.ttlAutopurge && !this.#max && !this.#maxSize) {
      const code = "LRU_CACHE_UNBOUNDED";
      if (shouldWarn(code)) {
        warned.add(code);
        const msg = "TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.";
        emitWarning(msg, "UnboundedCacheWarning", code, _LRUCache);
      }
    }
  }
  /**
   * Return the number of ms left in the item's TTL. If item is not in cache,
   * returns `0`. Returns `Infinity` if item is in cache without a defined TTL.
   */
  getRemainingTTL(key) {
    return this.#keyMap.has(key) ? Infinity : 0;
  }
  #initializeTTLTracking() {
    const ttls = new ZeroArray(this.#max);
    const starts = new ZeroArray(this.#max);
    this.#ttls = ttls;
    this.#starts = starts;
    this.#setItemTTL = (index, ttl, start = this.#perf.now()) => {
      starts[index] = ttl !== 0 ? start : 0;
      ttls[index] = ttl;
      if (ttl !== 0 && this.ttlAutopurge) {
        const t = setTimeout(() => {
          if (this.#isStale(index)) {
            this.#delete(this.#keyList[index], "expire");
          }
        }, ttl + 1);
        if (t.unref) {
          t.unref();
        }
      }
    };
    this.#updateItemAge = (index) => {
      starts[index] = ttls[index] !== 0 ? this.#perf.now() : 0;
    };
    this.#statusTTL = (status, index) => {
      if (ttls[index]) {
        const ttl = ttls[index];
        const start = starts[index];
        if (!ttl || !start)
          return;
        status.ttl = ttl;
        status.start = start;
        status.now = cachedNow || getNow();
        const age = status.now - start;
        status.remainingTTL = ttl - age;
      }
    };
    let cachedNow = 0;
    const getNow = () => {
      const n = this.#perf.now();
      if (this.ttlResolution > 0) {
        cachedNow = n;
        const t = setTimeout(() => cachedNow = 0, this.ttlResolution);
        if (t.unref) {
          t.unref();
        }
      }
      return n;
    };
    this.getRemainingTTL = (key) => {
      const index = this.#keyMap.get(key);
      if (index === void 0) {
        return 0;
      }
      const ttl = ttls[index];
      const start = starts[index];
      if (!ttl || !start) {
        return Infinity;
      }
      const age = (cachedNow || getNow()) - start;
      return ttl - age;
    };
    this.#isStale = (index) => {
      const s = starts[index];
      const t = ttls[index];
      return !!t && !!s && (cachedNow || getNow()) - s > t;
    };
  }
  // conditionally set private methods related to TTL
  #updateItemAge = () => {
  };
  #statusTTL = () => {
  };
  #setItemTTL = () => {
  };
  /* c8 ignore stop */
  #isStale = () => false;
  #initializeSizeTracking() {
    const sizes = new ZeroArray(this.#max);
    this.#calculatedSize = 0;
    this.#sizes = sizes;
    this.#removeItemSize = (index) => {
      this.#calculatedSize -= sizes[index];
      sizes[index] = 0;
    };
    this.#requireSize = (k, v, size, sizeCalculation) => {
      if (this.#isBackgroundFetch(v)) {
        return 0;
      }
      if (!isPosInt(size)) {
        if (sizeCalculation) {
          if (typeof sizeCalculation !== "function") {
            throw new TypeError("sizeCalculation must be a function");
          }
          size = sizeCalculation(v, k);
          if (!isPosInt(size)) {
            throw new TypeError("sizeCalculation return invalid (expect positive integer)");
          }
        } else {
          throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");
        }
      }
      return size;
    };
    this.#addItemSize = (index, size, status) => {
      sizes[index] = size;
      if (this.#maxSize) {
        const maxSize = this.#maxSize - sizes[index];
        while (this.#calculatedSize > maxSize) {
          this.#evict(true);
        }
      }
      this.#calculatedSize += sizes[index];
      if (status) {
        status.entrySize = size;
        status.totalCalculatedSize = this.#calculatedSize;
      }
    };
  }
  #removeItemSize = (_i) => {
  };
  #addItemSize = (_i, _s, _st) => {
  };
  #requireSize = (_k, _v, size, sizeCalculation) => {
    if (size || sizeCalculation) {
      throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");
    }
    return 0;
  };
  *#indexes({ allowStale = this.allowStale } = {}) {
    if (this.#size) {
      for (let i = this.#tail; true; ) {
        if (!this.#isValidIndex(i)) {
          break;
        }
        if (allowStale || !this.#isStale(i)) {
          yield i;
        }
        if (i === this.#head) {
          break;
        } else {
          i = this.#prev[i];
        }
      }
    }
  }
  *#rindexes({ allowStale = this.allowStale } = {}) {
    if (this.#size) {
      for (let i = this.#head; true; ) {
        if (!this.#isValidIndex(i)) {
          break;
        }
        if (allowStale || !this.#isStale(i)) {
          yield i;
        }
        if (i === this.#tail) {
          break;
        } else {
          i = this.#next[i];
        }
      }
    }
  }
  #isValidIndex(index) {
    return index !== void 0 && this.#keyMap.get(this.#keyList[index]) === index;
  }
  /**
   * Return a generator yielding `[key, value]` pairs,
   * in order from most recently used to least recently used.
   */
  *entries() {
    for (const i of this.#indexes()) {
      if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield [this.#keyList[i], this.#valList[i]];
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.entries}
   *
   * Return a generator yielding `[key, value]` pairs,
   * in order from least recently used to most recently used.
   */
  *rentries() {
    for (const i of this.#rindexes()) {
      if (this.#valList[i] !== void 0 && this.#keyList[i] !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield [this.#keyList[i], this.#valList[i]];
      }
    }
  }
  /**
   * Return a generator yielding the keys in the cache,
   * in order from most recently used to least recently used.
   */
  *keys() {
    for (const i of this.#indexes()) {
      const k = this.#keyList[i];
      if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield k;
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.keys}
   *
   * Return a generator yielding the keys in the cache,
   * in order from least recently used to most recently used.
   */
  *rkeys() {
    for (const i of this.#rindexes()) {
      const k = this.#keyList[i];
      if (k !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield k;
      }
    }
  }
  /**
   * Return a generator yielding the values in the cache,
   * in order from most recently used to least recently used.
   */
  *values() {
    for (const i of this.#indexes()) {
      const v = this.#valList[i];
      if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield this.#valList[i];
      }
    }
  }
  /**
   * Inverse order version of {@link LRUCache.values}
   *
   * Return a generator yielding the values in the cache,
   * in order from least recently used to most recently used.
   */
  *rvalues() {
    for (const i of this.#rindexes()) {
      const v = this.#valList[i];
      if (v !== void 0 && !this.#isBackgroundFetch(this.#valList[i])) {
        yield this.#valList[i];
      }
    }
  }
  /**
   * Iterating over the cache itself yields the same results as
   * {@link LRUCache.entries}
   */
  [Symbol.iterator]() {
    return this.entries();
  }
  /**
   * A String value that is used in the creation of the default string
   * description of an object. Called by the built-in method
   * `Object.prototype.toString`.
   */
  [Symbol.toStringTag] = "LRUCache";
  /**
   * Find a value for which the supplied fn method returns a truthy value,
   * similar to `Array.find()`. fn is called as `fn(value, key, cache)`.
   */
  find(fn, getOptions = {}) {
    for (const i of this.#indexes()) {
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      if (fn(value, this.#keyList[i], this)) {
        return this.get(this.#keyList[i], getOptions);
      }
    }
  }
  /**
   * Call the supplied function on each item in the cache, in order from most
   * recently used to least recently used.
   *
   * `fn` is called as `fn(value, key, cache)`.
   *
   * If `thisp` is provided, function will be called in the `this`-context of
   * the provided object, or the cache if no `thisp` object is provided.
   *
   * Does not update age or recenty of use, or iterate over stale values.
   */
  forEach(fn, thisp = this) {
    for (const i of this.#indexes()) {
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      fn.call(thisp, value, this.#keyList[i], this);
    }
  }
  /**
   * The same as {@link LRUCache.forEach} but items are iterated over in
   * reverse order.  (ie, less recently used items are iterated over first.)
   */
  rforEach(fn, thisp = this) {
    for (const i of this.#rindexes()) {
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0)
        continue;
      fn.call(thisp, value, this.#keyList[i], this);
    }
  }
  /**
   * Delete any stale entries. Returns true if anything was removed,
   * false otherwise.
   */
  purgeStale() {
    let deleted = false;
    for (const i of this.#rindexes({ allowStale: true })) {
      if (this.#isStale(i)) {
        this.#delete(this.#keyList[i], "expire");
        deleted = true;
      }
    }
    return deleted;
  }
  /**
   * Get the extended info about a given entry, to get its value, size, and
   * TTL info simultaneously. Returns `undefined` if the key is not present.
   *
   * Unlike {@link LRUCache#dump}, which is designed to be portable and survive
   * serialization, the `start` value is always the current timestamp, and the
   * `ttl` is a calculated remaining time to live (negative if expired).
   *
   * Always returns stale values, if their info is found in the cache, so be
   * sure to check for expirations (ie, a negative {@link LRUCache.Entry#ttl})
   * if relevant.
   */
  info(key) {
    const i = this.#keyMap.get(key);
    if (i === void 0)
      return void 0;
    const v = this.#valList[i];
    const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
    if (value === void 0)
      return void 0;
    const entry = { value };
    if (this.#ttls && this.#starts) {
      const ttl = this.#ttls[i];
      const start = this.#starts[i];
      if (ttl && start) {
        const remain = ttl - (this.#perf.now() - start);
        entry.ttl = remain;
        entry.start = Date.now();
      }
    }
    if (this.#sizes) {
      entry.size = this.#sizes[i];
    }
    return entry;
  }
  /**
   * Return an array of [key, {@link LRUCache.Entry}] tuples which can be
   * passed to {@link LRUCache#load}.
   *
   * The `start` fields are calculated relative to a portable `Date.now()`
   * timestamp, even if `performance.now()` is available.
   *
   * Stale entries are always included in the `dump`, even if
   * {@link LRUCache.OptionsBase.allowStale} is false.
   *
   * Note: this returns an actual array, not a generator, so it can be more
   * easily passed around.
   */
  dump() {
    const arr = [];
    for (const i of this.#indexes({ allowStale: true })) {
      const key = this.#keyList[i];
      const v = this.#valList[i];
      const value = this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
      if (value === void 0 || key === void 0)
        continue;
      const entry = { value };
      if (this.#ttls && this.#starts) {
        entry.ttl = this.#ttls[i];
        const age = this.#perf.now() - this.#starts[i];
        entry.start = Math.floor(Date.now() - age);
      }
      if (this.#sizes) {
        entry.size = this.#sizes[i];
      }
      arr.unshift([key, entry]);
    }
    return arr;
  }
  /**
   * Reset the cache and load in the items in entries in the order listed.
   *
   * The shape of the resulting cache may be different if the same options are
   * not used in both caches.
   *
   * The `start` fields are assumed to be calculated relative to a portable
   * `Date.now()` timestamp, even if `performance.now()` is available.
   */
  load(arr) {
    this.clear();
    for (const [key, entry] of arr) {
      if (entry.start) {
        const age = Date.now() - entry.start;
        entry.start = this.#perf.now() - age;
      }
      this.set(key, entry.value, entry);
    }
  }
  /**
   * Add a value to the cache.
   *
   * Note: if `undefined` is specified as a value, this is an alias for
   * {@link LRUCache#delete}
   *
   * Fields on the {@link LRUCache.SetOptions} options param will override
   * their corresponding values in the constructor options for the scope
   * of this single `set()` operation.
   *
   * If `start` is provided, then that will set the effective start
   * time for the TTL calculation. Note that this must be a previous
   * value of `performance.now()` if supported, or a previous value of
   * `Date.now()` if not.
   *
   * Options object may also include `size`, which will prevent
   * calling the `sizeCalculation` function and just use the specified
   * number if it is a positive integer, and `noDisposeOnSet` which
   * will prevent calling a `dispose` function in the case of
   * overwrites.
   *
   * If the `size` (or return value of `sizeCalculation`) for a given
   * entry is greater than `maxEntrySize`, then the item will not be
   * added to the cache.
   *
   * Will update the recency of the entry.
   *
   * If the value is `undefined`, then this is an alias for
   * `cache.delete(key)`. `undefined` is never stored in the cache.
   */
  set(k, v, setOptions = {}) {
    if (v === void 0) {
      this.delete(k);
      return this;
    }
    const { ttl = this.ttl, start, noDisposeOnSet = this.noDisposeOnSet, sizeCalculation = this.sizeCalculation, status } = setOptions;
    let { noUpdateTTL = this.noUpdateTTL } = setOptions;
    const size = this.#requireSize(k, v, setOptions.size || 0, sizeCalculation);
    if (this.maxEntrySize && size > this.maxEntrySize) {
      if (status) {
        status.set = "miss";
        status.maxEntrySizeExceeded = true;
      }
      this.#delete(k, "set");
      return this;
    }
    let index = this.#size === 0 ? void 0 : this.#keyMap.get(k);
    if (index === void 0) {
      index = this.#size === 0 ? this.#tail : this.#free.length !== 0 ? this.#free.pop() : this.#size === this.#max ? this.#evict(false) : this.#size;
      this.#keyList[index] = k;
      this.#valList[index] = v;
      this.#keyMap.set(k, index);
      this.#next[this.#tail] = index;
      this.#prev[index] = this.#tail;
      this.#tail = index;
      this.#size++;
      this.#addItemSize(index, size, status);
      if (status)
        status.set = "add";
      noUpdateTTL = false;
      if (this.#hasOnInsert) {
        this.#onInsert?.(v, k, "add");
      }
    } else {
      this.#moveToTail(index);
      const oldVal = this.#valList[index];
      if (v !== oldVal) {
        if (this.#hasFetchMethod && this.#isBackgroundFetch(oldVal)) {
          oldVal.__abortController.abort(new Error("replaced"));
          const { __staleWhileFetching: s } = oldVal;
          if (s !== void 0 && !noDisposeOnSet) {
            if (this.#hasDispose) {
              this.#dispose?.(s, k, "set");
            }
            if (this.#hasDisposeAfter) {
              this.#disposed?.push([s, k, "set"]);
            }
          }
        } else if (!noDisposeOnSet) {
          if (this.#hasDispose) {
            this.#dispose?.(oldVal, k, "set");
          }
          if (this.#hasDisposeAfter) {
            this.#disposed?.push([oldVal, k, "set"]);
          }
        }
        this.#removeItemSize(index);
        this.#addItemSize(index, size, status);
        this.#valList[index] = v;
        if (status) {
          status.set = "replace";
          const oldValue = oldVal && this.#isBackgroundFetch(oldVal) ? oldVal.__staleWhileFetching : oldVal;
          if (oldValue !== void 0)
            status.oldValue = oldValue;
        }
      } else if (status) {
        status.set = "update";
      }
      if (this.#hasOnInsert) {
        this.onInsert?.(v, k, v === oldVal ? "update" : "replace");
      }
    }
    if (ttl !== 0 && !this.#ttls) {
      this.#initializeTTLTracking();
    }
    if (this.#ttls) {
      if (!noUpdateTTL) {
        this.#setItemTTL(index, ttl, start);
      }
      if (status)
        this.#statusTTL(status, index);
    }
    if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
      const dt = this.#disposed;
      let task;
      while (task = dt?.shift()) {
        this.#disposeAfter?.(...task);
      }
    }
    return this;
  }
  /**
   * Evict the least recently used item, returning its value or
   * `undefined` if cache is empty.
   */
  pop() {
    try {
      while (this.#size) {
        const val = this.#valList[this.#head];
        this.#evict(true);
        if (this.#isBackgroundFetch(val)) {
          if (val.__staleWhileFetching) {
            return val.__staleWhileFetching;
          }
        } else if (val !== void 0) {
          return val;
        }
      }
    } finally {
      if (this.#hasDisposeAfter && this.#disposed) {
        const dt = this.#disposed;
        let task;
        while (task = dt?.shift()) {
          this.#disposeAfter?.(...task);
        }
      }
    }
  }
  #evict(free) {
    const head = this.#head;
    const k = this.#keyList[head];
    const v = this.#valList[head];
    if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) {
      v.__abortController.abort(new Error("evicted"));
    } else if (this.#hasDispose || this.#hasDisposeAfter) {
      if (this.#hasDispose) {
        this.#dispose?.(v, k, "evict");
      }
      if (this.#hasDisposeAfter) {
        this.#disposed?.push([v, k, "evict"]);
      }
    }
    this.#removeItemSize(head);
    if (free) {
      this.#keyList[head] = void 0;
      this.#valList[head] = void 0;
      this.#free.push(head);
    }
    if (this.#size === 1) {
      this.#head = this.#tail = 0;
      this.#free.length = 0;
    } else {
      this.#head = this.#next[head];
    }
    this.#keyMap.delete(k);
    this.#size--;
    return head;
  }
  /**
   * Check if a key is in the cache, without updating the recency of use.
   * Will return false if the item is stale, even though it is technically
   * in the cache.
   *
   * Check if a key is in the cache, without updating the recency of
   * use. Age is updated if {@link LRUCache.OptionsBase.updateAgeOnHas} is set
   * to `true` in either the options or the constructor.
   *
   * Will return `false` if the item is stale, even though it is technically in
   * the cache. The difference can be determined (if it matters) by using a
   * `status` argument, and inspecting the `has` field.
   *
   * Will not update item age unless
   * {@link LRUCache.OptionsBase.updateAgeOnHas} is set.
   */
  has(k, hasOptions = {}) {
    const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
    const index = this.#keyMap.get(k);
    if (index !== void 0) {
      const v = this.#valList[index];
      if (this.#isBackgroundFetch(v) && v.__staleWhileFetching === void 0) {
        return false;
      }
      if (!this.#isStale(index)) {
        if (updateAgeOnHas) {
          this.#updateItemAge(index);
        }
        if (status) {
          status.has = "hit";
          this.#statusTTL(status, index);
        }
        return true;
      } else if (status) {
        status.has = "stale";
        this.#statusTTL(status, index);
      }
    } else if (status) {
      status.has = "miss";
    }
    return false;
  }
  /**
   * Like {@link LRUCache#get} but doesn't update recency or delete stale
   * items.
   *
   * Returns `undefined` if the item is stale, unless
   * {@link LRUCache.OptionsBase.allowStale} is set.
   */
  peek(k, peekOptions = {}) {
    const { allowStale = this.allowStale } = peekOptions;
    const index = this.#keyMap.get(k);
    if (index === void 0 || !allowStale && this.#isStale(index)) {
      return;
    }
    const v = this.#valList[index];
    return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
  }
  #backgroundFetch(k, index, options, context) {
    const v = index === void 0 ? void 0 : this.#valList[index];
    if (this.#isBackgroundFetch(v)) {
      return v;
    }
    const ac = new AC();
    const { signal } = options;
    signal?.addEventListener("abort", () => ac.abort(signal.reason), {
      signal: ac.signal
    });
    const fetchOpts = {
      signal: ac.signal,
      options,
      context
    };
    const cb = (v2, updateCache = false) => {
      const { aborted } = ac.signal;
      const ignoreAbort = options.ignoreFetchAbort && v2 !== void 0;
      if (options.status) {
        if (aborted && !updateCache) {
          options.status.fetchAborted = true;
          options.status.fetchError = ac.signal.reason;
          if (ignoreAbort)
            options.status.fetchAbortIgnored = true;
        } else {
          options.status.fetchResolved = true;
        }
      }
      if (aborted && !ignoreAbort && !updateCache) {
        return fetchFail(ac.signal.reason);
      }
      const bf2 = p;
      if (this.#valList[index] === p) {
        if (v2 === void 0) {
          if (bf2.__staleWhileFetching !== void 0) {
            this.#valList[index] = bf2.__staleWhileFetching;
          } else {
            this.#delete(k, "fetch");
          }
        } else {
          if (options.status)
            options.status.fetchUpdated = true;
          this.set(k, v2, fetchOpts.options);
        }
      }
      return v2;
    };
    const eb = (er) => {
      if (options.status) {
        options.status.fetchRejected = true;
        options.status.fetchError = er;
      }
      return fetchFail(er);
    };
    const fetchFail = (er) => {
      const { aborted } = ac.signal;
      const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
      const allowStale = allowStaleAborted || options.allowStaleOnFetchRejection;
      const noDelete = allowStale || options.noDeleteOnFetchRejection;
      const bf2 = p;
      if (this.#valList[index] === p) {
        const del = !noDelete || bf2.__staleWhileFetching === void 0;
        if (del) {
          this.#delete(k, "fetch");
        } else if (!allowStaleAborted) {
          this.#valList[index] = bf2.__staleWhileFetching;
        }
      }
      if (allowStale) {
        if (options.status && bf2.__staleWhileFetching !== void 0) {
          options.status.returnedStale = true;
        }
        return bf2.__staleWhileFetching;
      } else if (bf2.__returned === bf2) {
        throw er;
      }
    };
    const pcall = (res, rej) => {
      const fmp = this.#fetchMethod?.(k, v, fetchOpts);
      if (fmp && fmp instanceof Promise) {
        fmp.then((v2) => res(v2 === void 0 ? void 0 : v2), rej);
      }
      ac.signal.addEventListener("abort", () => {
        if (!options.ignoreFetchAbort || options.allowStaleOnFetchAbort) {
          res(void 0);
          if (options.allowStaleOnFetchAbort) {
            res = (v2) => cb(v2, true);
          }
        }
      });
    };
    if (options.status)
      options.status.fetchDispatched = true;
    const p = new Promise(pcall).then(cb, eb);
    const bf = Object.assign(p, {
      __abortController: ac,
      __staleWhileFetching: v,
      __returned: void 0
    });
    if (index === void 0) {
      this.set(k, bf, { ...fetchOpts.options, status: void 0 });
      index = this.#keyMap.get(k);
    } else {
      this.#valList[index] = bf;
    }
    return bf;
  }
  #isBackgroundFetch(p) {
    if (!this.#hasFetchMethod)
      return false;
    const b = p;
    return !!b && b instanceof Promise && b.hasOwnProperty("__staleWhileFetching") && b.__abortController instanceof AC;
  }
  async fetch(k, fetchOptions = {}) {
    const {
      // get options
      allowStale = this.allowStale,
      updateAgeOnGet = this.updateAgeOnGet,
      noDeleteOnStaleGet = this.noDeleteOnStaleGet,
      // set options
      ttl = this.ttl,
      noDisposeOnSet = this.noDisposeOnSet,
      size = 0,
      sizeCalculation = this.sizeCalculation,
      noUpdateTTL = this.noUpdateTTL,
      // fetch exclusive options
      noDeleteOnFetchRejection = this.noDeleteOnFetchRejection,
      allowStaleOnFetchRejection = this.allowStaleOnFetchRejection,
      ignoreFetchAbort = this.ignoreFetchAbort,
      allowStaleOnFetchAbort = this.allowStaleOnFetchAbort,
      context,
      forceRefresh = false,
      status,
      signal
    } = fetchOptions;
    if (!this.#hasFetchMethod) {
      if (status)
        status.fetch = "get";
      return this.get(k, {
        allowStale,
        updateAgeOnGet,
        noDeleteOnStaleGet,
        status
      });
    }
    const options = {
      allowStale,
      updateAgeOnGet,
      noDeleteOnStaleGet,
      ttl,
      noDisposeOnSet,
      size,
      sizeCalculation,
      noUpdateTTL,
      noDeleteOnFetchRejection,
      allowStaleOnFetchRejection,
      allowStaleOnFetchAbort,
      ignoreFetchAbort,
      status,
      signal
    };
    let index = this.#keyMap.get(k);
    if (index === void 0) {
      if (status)
        status.fetch = "miss";
      const p = this.#backgroundFetch(k, index, options, context);
      return p.__returned = p;
    } else {
      const v = this.#valList[index];
      if (this.#isBackgroundFetch(v)) {
        const stale = allowStale && v.__staleWhileFetching !== void 0;
        if (status) {
          status.fetch = "inflight";
          if (stale)
            status.returnedStale = true;
        }
        return stale ? v.__staleWhileFetching : v.__returned = v;
      }
      const isStale = this.#isStale(index);
      if (!forceRefresh && !isStale) {
        if (status)
          status.fetch = "hit";
        this.#moveToTail(index);
        if (updateAgeOnGet) {
          this.#updateItemAge(index);
        }
        if (status)
          this.#statusTTL(status, index);
        return v;
      }
      const p = this.#backgroundFetch(k, index, options, context);
      const hasStale = p.__staleWhileFetching !== void 0;
      const staleVal = hasStale && allowStale;
      if (status) {
        status.fetch = isStale ? "stale" : "refresh";
        if (staleVal && isStale)
          status.returnedStale = true;
      }
      return staleVal ? p.__staleWhileFetching : p.__returned = p;
    }
  }
  async forceFetch(k, fetchOptions = {}) {
    const v = await this.fetch(k, fetchOptions);
    if (v === void 0)
      throw new Error("fetch() returned undefined");
    return v;
  }
  memo(k, memoOptions = {}) {
    const memoMethod = this.#memoMethod;
    if (!memoMethod) {
      throw new Error("no memoMethod provided to constructor");
    }
    const { context, forceRefresh, ...options } = memoOptions;
    const v = this.get(k, options);
    if (!forceRefresh && v !== void 0)
      return v;
    const vv = memoMethod(k, v, {
      options,
      context
    });
    this.set(k, vv, options);
    return vv;
  }
  /**
   * Return a value from the cache. Will update the recency of the cache
   * entry found.
   *
   * If the key is not found, get() will return `undefined`.
   */
  get(k, getOptions = {}) {
    const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, status } = getOptions;
    const index = this.#keyMap.get(k);
    if (index !== void 0) {
      const value = this.#valList[index];
      const fetching = this.#isBackgroundFetch(value);
      if (status)
        this.#statusTTL(status, index);
      if (this.#isStale(index)) {
        if (status)
          status.get = "stale";
        if (!fetching) {
          if (!noDeleteOnStaleGet) {
            this.#delete(k, "expire");
          }
          if (status && allowStale)
            status.returnedStale = true;
          return allowStale ? value : void 0;
        } else {
          if (status && allowStale && value.__staleWhileFetching !== void 0) {
            status.returnedStale = true;
          }
          return allowStale ? value.__staleWhileFetching : void 0;
        }
      } else {
        if (status)
          status.get = "hit";
        if (fetching) {
          return value.__staleWhileFetching;
        }
        this.#moveToTail(index);
        if (updateAgeOnGet) {
          this.#updateItemAge(index);
        }
        return value;
      }
    } else if (status) {
      status.get = "miss";
    }
  }
  #connect(p, n) {
    this.#prev[n] = p;
    this.#next[p] = n;
  }
  #moveToTail(index) {
    if (index !== this.#tail) {
      if (index === this.#head) {
        this.#head = this.#next[index];
      } else {
        this.#connect(this.#prev[index], this.#next[index]);
      }
      this.#connect(this.#tail, index);
      this.#tail = index;
    }
  }
  /**
   * Deletes a key out of the cache.
   *
   * Returns true if the key was deleted, false otherwise.
   */
  delete(k) {
    return this.#delete(k, "delete");
  }
  #delete(k, reason) {
    let deleted = false;
    if (this.#size !== 0) {
      const index = this.#keyMap.get(k);
      if (index !== void 0) {
        deleted = true;
        if (this.#size === 1) {
          this.#clear(reason);
        } else {
          this.#removeItemSize(index);
          const v = this.#valList[index];
          if (this.#isBackgroundFetch(v)) {
            v.__abortController.abort(new Error("deleted"));
          } else if (this.#hasDispose || this.#hasDisposeAfter) {
            if (this.#hasDispose) {
              this.#dispose?.(v, k, reason);
            }
            if (this.#hasDisposeAfter) {
              this.#disposed?.push([v, k, reason]);
            }
          }
          this.#keyMap.delete(k);
          this.#keyList[index] = void 0;
          this.#valList[index] = void 0;
          if (index === this.#tail) {
            this.#tail = this.#prev[index];
          } else if (index === this.#head) {
            this.#head = this.#next[index];
          } else {
            const pi = this.#prev[index];
            this.#next[pi] = this.#next[index];
            const ni = this.#next[index];
            this.#prev[ni] = this.#prev[index];
          }
          this.#size--;
          this.#free.push(index);
        }
      }
    }
    if (this.#hasDisposeAfter && this.#disposed?.length) {
      const dt = this.#disposed;
      let task;
      while (task = dt?.shift()) {
        this.#disposeAfter?.(...task);
      }
    }
    return deleted;
  }
  /**
   * Clear the cache entirely, throwing away all values.
   */
  clear() {
    return this.#clear("delete");
  }
  #clear(reason) {
    for (const index of this.#rindexes({ allowStale: true })) {
      const v = this.#valList[index];
      if (this.#isBackgroundFetch(v)) {
        v.__abortController.abort(new Error("deleted"));
      } else {
        const k = this.#keyList[index];
        if (this.#hasDispose) {
          this.#dispose?.(v, k, reason);
        }
        if (this.#hasDisposeAfter) {
          this.#disposed?.push([v, k, reason]);
        }
      }
    }
    this.#keyMap.clear();
    this.#valList.fill(void 0);
    this.#keyList.fill(void 0);
    if (this.#ttls && this.#starts) {
      this.#ttls.fill(0);
      this.#starts.fill(0);
    }
    if (this.#sizes) {
      this.#sizes.fill(0);
    }
    this.#head = 0;
    this.#tail = 0;
    this.#free.length = 0;
    this.#calculatedSize = 0;
    this.#size = 0;
    if (this.#hasDisposeAfter && this.#disposed) {
      const dt = this.#disposed;
      let task;
      while (task = dt?.shift()) {
        this.#disposeAfter?.(...task);
      }
    }
  }
};

// asset-input/packages/worker/src/services/VectorStoreService.ts
var VectorStoreService = class {
  constructor(openSearchEndpoint = process.env.OPENSEARCH_ENDPOINT || "", region = process.env.AWS_REGION || "us-west-2") {
    this.openSearchClient = new Client({
      ...(0, import_aws.AwsSigv4Signer)({
        region,
        service: "aoss",
        // Amazon OpenSearch Serverless
        getCredentials: () => {
          const credentialProvider = (0, import_credential_provider_node.defaultProvider)();
          return credentialProvider();
        }
      }),
      node: openSearchEndpoint
    });
    this.bedrockService = new BedrockService(region);
    this.cloudWatchClient = new import_client_cloudwatch.CloudWatchClient({ region });
    this.indexName = process.env.HELIX_INDEX_NAME || "helix-patterns";
    this.l1Cache = new LRUCache({
      max: 100,
      ttl: 1e3 * 60 * 5,
      // 5 minutes TTL for L1 cache
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });
  }
  /**
   * Initialize index with proper mappings for vector search
   */
  async initializeIndex() {
    const indexExists = await this.openSearchClient.indices.exists({
      index: this.indexName
    });
    if (!indexExists.body) {
      await this.openSearchClient.indices.create({
        index: this.indexName,
        body: {
          settings: {
            "index.knn": true,
            "index.knn.algo_param.ef_search": 512,
            "number_of_shards": 2,
            "number_of_replicas": 1
          },
          mappings: {
            properties: {
              patternId: { type: "keyword" },
              version: { type: "long" },
              embedding: {
                type: "knn_vector",
                dimension: 1536,
                // Titan embeddings dimension
                method: {
                  name: "hnsw",
                  space_type: "cosinesimil",
                  engine: "nmslib",
                  parameters: {
                    ef_construction: 512,
                    m: 16
                  }
                }
              },
              content: { type: "text" },
              keywords: { type: "keyword" },
              context: { type: "object", enabled: false },
              projectId: { type: "keyword" },
              agentType: { type: "keyword" },
              successRate: { type: "float" },
              usageCount: { type: "long" },
              lastUsed: { type: "date" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" }
            }
          }
        }
      });
    }
  }
  /**
   * Index patterns in batch with version-based idempotency
   */
  async indexPatternsBatch(patterns) {
    const startTime = Date.now();
    const operations = [];
    for (const pattern of patterns) {
      const cachedPattern = this.l1Cache.get(pattern.patternId);
      if (cachedPattern && cachedPattern.version >= pattern.version) {
        continue;
      }
      if (!pattern.embedding || pattern.embedding.length === 0) {
        pattern.embedding = await this.bedrockService.generateEmbeddings(pattern.content);
      }
      operations.push(
        { index: { _index: this.indexName, _id: pattern.patternId } },
        pattern
      );
      this.l1Cache.set(pattern.patternId, pattern);
    }
    if (operations.length > 0) {
      const bulkResponse = await this.openSearchClient.bulk({
        body: operations,
        refresh: false
        // Async refresh for performance
      });
      if (bulkResponse.body.errors) {
        const erroredDocs = bulkResponse.body.items.filter(
          (item) => item.index && item.index.error
        );
        console.error("Bulk indexing errors:", erroredDocs);
        throw new Error(`Failed to index ${erroredDocs.length} documents`);
      }
    }
    await this.recordMetric("IndexLatency", Date.now() - startTime, "Milliseconds");
    await this.recordMetric("IndexedPatterns", patterns.length, "Count");
  }
  /**
   * Hybrid search combining semantic and keyword search
   */
  async search(query, options = {}) {
    const startTime = Date.now();
    const {
      hybridMode = true,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      maxResults = 10,
      minScore = 0.5,
      projectFilter,
      agentFilter
    } = options;
    const cacheKey = `search:${query}:${JSON.stringify(options)}`;
    const cachedResults = this.getCachedSearchResults(cacheKey);
    if (cachedResults) {
      await this.recordMetric("CacheHit", 1, "Count");
      await this.recordMetric("SearchLatency", Date.now() - startTime, "Milliseconds");
      return cachedResults;
    }
    const queryEmbedding = await this.bedrockService.generateEmbeddings(query);
    const filters = [];
    if (projectFilter) {
      filters.push({ term: { projectId: projectFilter } });
    }
    if (agentFilter) {
      filters.push({ term: { agentType: agentFilter } });
    }
    let searchBody;
    if (hybridMode) {
      searchBody = {
        size: maxResults,
        query: {
          bool: {
            should: [
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                    params: {
                      query_vector: queryEmbedding
                    }
                  },
                  boost: semanticWeight
                }
              },
              {
                multi_match: {
                  query,
                  fields: ["content^2", "keywords"],
                  boost: keywordWeight
                }
              }
            ],
            filter: filters,
            minimum_should_match: 1
          }
        }
      };
    } else {
      searchBody = {
        size: maxResults,
        query: {
          script_score: {
            query: {
              bool: {
                filter: filters
              }
            },
            script: {
              source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
              params: {
                query_vector: queryEmbedding
              }
            }
          }
        }
      };
    }
    const searchResponse = await this.openSearchClient.search({
      index: this.indexName,
      body: searchBody
    });
    const results = searchResponse.body.hits.hits.filter((hit) => hit._score >= minScore).map((hit) => ({
      patternId: hit._source.patternId,
      score: hit._score,
      content: hit._source.content,
      context: hit._source.context,
      source: "opensearch"
    }));
    this.cacheSearchResults(cacheKey, results);
    await this.updatePatternUsageStats(results.map((r) => r.patternId));
    await this.recordMetric("SearchLatency", Date.now() - startTime, "Milliseconds");
    await this.recordMetric("SearchResults", results.length, "Count");
    return results;
  }
  /**
   * Get pattern by ID with cache check
   */
  async getPattern(patternId) {
    const cached = this.l1Cache.get(patternId);
    if (cached) {
      await this.recordMetric("L1CacheHit", 1, "Count");
      return cached;
    }
    try {
      const response = await this.openSearchClient.get({
        index: this.indexName,
        id: patternId
      });
      const pattern = response.body._source;
      this.l1Cache.set(patternId, pattern);
      return pattern;
    } catch (error) {
      if (error.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }
  /**
   * Delete pattern with cache invalidation
   */
  async deletePattern(patternId) {
    this.l1Cache.delete(patternId);
    await this.openSearchClient.delete({
      index: this.indexName,
      id: patternId,
      refresh: true
    });
  }
  /**
   * Update pattern with version check
   */
  async updatePattern(pattern) {
    const existing = await this.getPattern(pattern.patternId);
    if (existing && existing.version >= pattern.version) {
      return;
    }
    if (!existing || existing.content !== pattern.content) {
      pattern.embedding = await this.bedrockService.generateEmbeddings(pattern.content);
    }
    await this.openSearchClient.index({
      index: this.indexName,
      id: pattern.patternId,
      body: pattern,
      refresh: false
    });
    this.l1Cache.set(pattern.patternId, pattern);
  }
  /**
   * Cache search results
   */
  cacheSearchResults(key, results) {
  }
  /**
   * Get cached search results
   */
  getCachedSearchResults(key) {
    return null;
  }
  /**
   * Update pattern usage statistics
   */
  async updatePatternUsageStats(patternIds) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    for (const patternId of patternIds) {
      await this.openSearchClient.update({
        index: this.indexName,
        id: patternId,
        body: {
          script: {
            source: "ctx._source.usageCount += 1; ctx._source.lastUsed = params.now",
            params: { now }
          }
        },
        refresh: false,
        retry_on_conflict: 3
      }).catch((error) => {
        console.error(`Failed to update usage stats for ${patternId}:`, error);
      });
    }
  }
  /**
   * Record CloudWatch metric
   */
  async recordMetric(metricName, value, unit) {
    try {
      await this.cloudWatchClient.send(
        new import_client_cloudwatch.PutMetricDataCommand({
          Namespace: "ECOSYSTEMCL/Helix",
          MetricData: [
            {
              MetricName: metricName,
              Value: value,
              Unit: unit,
              Timestamp: /* @__PURE__ */ new Date()
            }
          ]
        })
      );
    } catch (error) {
      console.error("Failed to record metric:", error);
    }
  }
  /**
   * Get index statistics
   */
  async getIndexStats() {
    const stats = await this.openSearchClient.indices.stats({
      index: this.indexName
    });
    return {
      documentCount: stats.body._all.primaries.docs.count,
      sizeInBytes: stats.body._all.primaries.store.size_in_bytes,
      cacheHitRate: this.l1Cache.size / this.l1Cache.max
    };
  }
};

// asset-input/packages/worker/src/lambdas/cdcProcessor.ts
var import_opossum = __toESM(require_opossum());
var config = {
  region: process.env.AWS_REGION || "us-west-2",
  openSearchEndpoint: process.env.OPENSEARCH_ENDPOINT,
  dlqUrl: process.env.DLQ_URL,
  versionBucket: process.env.VERSION_BUCKET || "helix-pattern-versions",
  maxRetries: 3,
  circuitBreakerThreshold: 0.5,
  circuitBreakerTimeout: 3e4
  // 30 seconds
};
var s3Client = new import_client_s3.S3Client({ region: config.region });
var sqsClient = new import_client_sqs.SQSClient({ region: config.region });
var cloudWatchClient = new import_client_cloudwatch2.CloudWatchClient({ region: config.region });
var vectorStoreService = new VectorStoreService(config.openSearchEndpoint, config.region);
var openSearchCircuitBreaker = new import_opossum.default(
  async (patterns) => {
    return await vectorStoreService.indexPatternsBatch(patterns);
  },
  {
    timeout: config.circuitBreakerTimeout,
    errorThresholdPercentage: config.circuitBreakerThreshold * 100,
    resetTimeout: 3e4,
    rollingCountTimeout: 1e4,
    rollingCountBuckets: 10,
    name: "openSearchIndexing"
  }
);
openSearchCircuitBreaker.on("open", () => {
  console.error("Circuit breaker opened - OpenSearch is experiencing failures");
  recordMetric("CircuitBreakerOpen", 1);
});
openSearchCircuitBreaker.on("halfOpen", () => {
  console.log("Circuit breaker half-open - testing OpenSearch availability");
});
var handler = async (event) => {
  const startTime = Date.now();
  const results = {
    processed: 0,
    failed: 0,
    versioned: 0,
    dlqSent: 0
  };
  console.log(`Processing ${event.Records.length} DynamoDB stream records`);
  const insertRecords = [];
  const modifyRecords = [];
  const removeRecords = [];
  for (const record of event.Records) {
    switch (record.eventName) {
      case "INSERT":
        insertRecords.push(record);
        break;
      case "MODIFY":
        modifyRecords.push(record);
        break;
      case "REMOVE":
        removeRecords.push(record);
        break;
    }
  }
  const [insertResults, modifyResults, removeResults] = await Promise.all([
    processInserts(insertRecords),
    processModifications(modifyRecords),
    processRemovals(removeRecords)
  ]);
  results.processed = insertResults.processed + modifyResults.processed + removeResults.processed;
  results.failed = insertResults.failed + modifyResults.failed + removeResults.failed;
  results.versioned = modifyResults.versioned;
  results.dlqSent = insertResults.dlqSent + modifyResults.dlqSent + removeResults.dlqSent;
  await recordMetric("ProcessedRecords", results.processed);
  await recordMetric("FailedRecords", results.failed);
  await recordMetric("VersionedPatterns", results.versioned);
  await recordMetric("DLQMessages", results.dlqSent);
  await recordMetric("ProcessingLatency", Date.now() - startTime);
  console.log("CDC processing complete:", results);
  if (results.failed > 0 && results.processed === 0) {
    throw new Error("All records failed processing");
  }
};
async function processInserts(records) {
  if (records.length === 0) return { processed: 0, failed: 0, dlqSent: 0 };
  const patterns = [];
  const failedRecords = [];
  for (const record of records) {
    try {
      if (!record.dynamodb?.NewImage) continue;
      const pattern = unmarshallPattern(record.dynamodb.NewImage);
      patterns.push(pattern);
    } catch (error) {
      console.error("Failed to unmarshall INSERT record:", error);
      failedRecords.push(record);
    }
  }
  if (patterns.length > 0) {
    try {
      if (openSearchCircuitBreaker.opened) {
        console.log("Circuit breaker open - sending patterns to DLQ");
        await sendToDLQ(records, "Circuit breaker open");
        return {
          processed: 0,
          failed: patterns.length,
          dlqSent: patterns.length
        };
      }
      await openSearchCircuitBreaker.fire(patterns);
      return {
        processed: patterns.length,
        failed: failedRecords.length,
        dlqSent: 0
      };
    } catch (error) {
      console.error("Failed to index patterns:", error);
      await sendToDLQ(records, error.message);
      return {
        processed: 0,
        failed: patterns.length,
        dlqSent: patterns.length
      };
    }
  }
  if (failedRecords.length > 0) {
    await sendToDLQ(failedRecords, "Failed to unmarshall");
  }
  return {
    processed: patterns.length,
    failed: failedRecords.length,
    dlqSent: failedRecords.length
  };
}
async function processModifications(records) {
  if (records.length === 0) return { processed: 0, failed: 0, versioned: 0, dlqSent: 0 };
  const patterns = [];
  const versioningTasks = [];
  const failedRecords = [];
  for (const record of records) {
    try {
      if (!record.dynamodb?.NewImage || !record.dynamodb?.OldImage) continue;
      const newPattern = unmarshallPattern(record.dynamodb.NewImage);
      const oldPattern = unmarshallPattern(record.dynamodb.OldImage);
      if (newPattern.version <= oldPattern.version) {
        console.log(`Skipping pattern ${newPattern.patternId} - version not newer`);
        continue;
      }
      patterns.push(newPattern);
      versioningTasks.push(
        archivePatternVersion(oldPattern, record.eventID || "")
      );
    } catch (error) {
      console.error("Failed to process MODIFY record:", error);
      failedRecords.push(record);
    }
  }
  const versioningResults = await Promise.allSettled(versioningTasks);
  const versionedCount = versioningResults.filter((r) => r.status === "fulfilled").length;
  if (patterns.length > 0) {
    try {
      if (openSearchCircuitBreaker.opened) {
        console.log("Circuit breaker open - sending patterns to DLQ");
        await sendToDLQ(records, "Circuit breaker open");
        return {
          processed: 0,
          failed: patterns.length,
          versioned: versionedCount,
          dlqSent: patterns.length
        };
      }
      await openSearchCircuitBreaker.fire(patterns);
      return {
        processed: patterns.length,
        failed: failedRecords.length,
        versioned: versionedCount,
        dlqSent: 0
      };
    } catch (error) {
      console.error("Failed to index modified patterns:", error);
      await sendToDLQ(records, error.message);
      return {
        processed: 0,
        failed: patterns.length,
        versioned: versionedCount,
        dlqSent: patterns.length
      };
    }
  }
  if (failedRecords.length > 0) {
    await sendToDLQ(failedRecords, "Failed to process modification");
  }
  return {
    processed: patterns.length,
    failed: failedRecords.length,
    versioned: versionedCount,
    dlqSent: failedRecords.length
  };
}
async function processRemovals(records) {
  if (records.length === 0) return { processed: 0, failed: 0, dlqSent: 0 };
  const deleteTasks = [];
  const failedRecords = [];
  for (const record of records) {
    try {
      if (!record.dynamodb?.OldImage) continue;
      const pattern = unmarshallPattern(record.dynamodb.OldImage);
      await archivePatternVersion(pattern, `${record.eventID}-deleted`);
      deleteTasks.push(vectorStoreService.deletePattern(pattern.patternId));
    } catch (error) {
      console.error("Failed to process REMOVE record:", error);
      failedRecords.push(record);
    }
  }
  const deleteResults = await Promise.allSettled(deleteTasks);
  const successCount = deleteResults.filter((r) => r.status === "fulfilled").length;
  const failedCount = deleteResults.filter((r) => r.status === "rejected").length;
  if (failedRecords.length > 0) {
    await sendToDLQ(failedRecords, "Failed to process removal");
  }
  return {
    processed: successCount,
    failed: failedCount + failedRecords.length,
    dlqSent: failedRecords.length
  };
}
function unmarshallPattern(item) {
  return {
    patternId: item.patternId?.S || "",
    version: parseInt(item.version?.N || "0"),
    embedding: item.embedding?.L?.map((v) => parseFloat(v.N || "0")) || [],
    content: item.content?.S || "",
    keywords: item.keywords?.SS || [],
    context: item.context ? JSON.parse(item.context.S || "{}") : {},
    projectId: item.projectId?.S || "",
    agentType: item.agentType?.S || "",
    successRate: parseFloat(item.successRate?.N || "0"),
    usageCount: parseInt(item.usageCount?.N || "0"),
    lastUsed: item.lastUsed?.S || (/* @__PURE__ */ new Date()).toISOString(),
    createdAt: item.createdAt?.S || (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: item.updatedAt?.S || (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function archivePatternVersion(pattern, eventId) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
  const key = `patterns/${pattern.patternId}/versions/${timestamp}-${eventId}.json`;
  try {
    await s3Client.send(new import_client_s3.PutObjectCommand({
      Bucket: config.versionBucket,
      Key: key,
      Body: JSON.stringify(pattern, null, 2),
      ContentType: "application/json",
      Metadata: {
        patternId: pattern.patternId,
        version: pattern.version.toString(),
        eventId
      }
    }));
    console.log(`Archived pattern version: ${key}`);
  } catch (error) {
    console.error("Failed to archive pattern version:", error);
    throw error;
  }
}
async function sendToDLQ(records, reason) {
  const messages = records.map((record) => ({
    Id: record.eventID || crypto.randomUUID(),
    MessageBody: JSON.stringify({
      record,
      reason,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      retryCount: parseInt(record.userIdentity?.principalId || "0") + 1
    }),
    MessageAttributes: {
      EventName: {
        DataType: "String",
        StringValue: record.eventName || "UNKNOWN"
      },
      Reason: {
        DataType: "String",
        StringValue: reason
      }
    }
  }));
  for (let i = 0; i < messages.length; i += 10) {
    const batch = messages.slice(i, i + 10);
    try {
      await sqsClient.send(new import_client_sqs.SendMessageCommand({
        QueueUrl: config.dlqUrl,
        MessageBody: JSON.stringify(batch)
      }));
      console.log(`Sent ${batch.length} records to DLQ`);
    } catch (error) {
      console.error("Failed to send to DLQ:", error);
    }
  }
}
async function recordMetric(metricName, value) {
  try {
    await cloudWatchClient.send(new import_client_cloudwatch2.PutMetricDataCommand({
      Namespace: "ECOSYSTEMCL/CDC",
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: metricName.includes("Latency") ? "Milliseconds" : "Count",
          Timestamp: /* @__PURE__ */ new Date()
        }
      ]
    }));
  } catch (error) {
    console.error(`Failed to record metric ${metricName}:`, error);
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
//# sourceMappingURL=index.js.map
