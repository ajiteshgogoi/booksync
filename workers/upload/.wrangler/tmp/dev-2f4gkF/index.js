function __cf_cjs(esm) {
  const cjs = 'default' in esm ? esm.default : {};
	for (const [k, v] of Object.entries(esm)) {
		if (k !== 'default') {
			Object.defineProperty(cjs, k, {
				enumerable: true,
				value: v,
			});
		}
	}
	return cjs;
}
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn2, res) => function __init() {
  return fn2 && (res = (0, fn2[__getOwnPropNames(fn2)[0]])(fn2 = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// node_modules/wrangler/_virtual_unenv_global_polyfill-clear$immediate.js
var init_virtual_unenv_global_polyfill_clear_immediate = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-clear$immediate.js"() {
    init_cloudflare();
    globalThis.clearImmediate = clearImmediateFallback;
  }
});

// node_modules/unenv/runtime/_internal/utils.mjs
function mergeFns(...functions) {
  return function(...args) {
    for (const fn2 of functions) {
      fn2(...args);
    }
  };
}
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
function notImplemented(name) {
  const fn2 = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn2, { __unenv__: true });
}
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
var init_utils = __esm({
  "node_modules/unenv/runtime/_internal/utils.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    __name(mergeFns, "mergeFns");
    __name(createNotImplementedError, "createNotImplementedError");
    __name(notImplemented, "notImplemented");
    __name(notImplementedClass, "notImplementedClass");
  }
});

// node_modules/unenv/runtime/mock/noop.mjs
var noop_default;
var init_noop = __esm({
  "node_modules/unenv/runtime/mock/noop.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    noop_default = Object.assign(() => {
    }, { __unenv__: true });
  }
});

// node_modules/unenv/runtime/node/timers/internal/immediate.mjs
var Immediate;
var init_immediate = __esm({
  "node_modules/unenv/runtime/node/timers/internal/immediate.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Immediate = class {
      _onImmediate;
      _timeout;
      constructor(callback, args) {
        this._onImmediate = callback;
        if ("setTimeout" in globalThis) {
          this._timeout = setTimeout(callback, 0, ...args);
        } else {
          callback(...args);
        }
      }
      ref() {
        this._timeout?.ref();
        return this;
      }
      unref() {
        this._timeout?.unref();
        return this;
      }
      hasRef() {
        return this._timeout?.hasRef() ?? false;
      }
      [Symbol.dispose]() {
        if ("clearTimeout" in globalThis) {
          clearTimeout(this._timeout);
        }
      }
    };
    __name(Immediate, "Immediate");
  }
});

// node_modules/unenv/runtime/node/timers/internal/set-immediate.mjs
function setImmediateFallbackPromises(value) {
  return new Promise((res) => {
    res(value);
  });
}
function setImmediateFallback(callback, ...args) {
  return new Immediate(callback, args);
}
function clearImmediateFallback(immediate) {
  immediate?.[Symbol.dispose]();
}
var init_set_immediate = __esm({
  "node_modules/unenv/runtime/node/timers/internal/set-immediate.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_immediate();
    __name(setImmediateFallbackPromises, "setImmediateFallbackPromises");
    __name(setImmediateFallback, "setImmediateFallback");
    setImmediateFallback.__promisify__ = setImmediateFallbackPromises;
    __name(clearImmediateFallback, "clearImmediateFallback");
  }
});

// node_modules/unenv/runtime/node/timers/$cloudflare.mjs
var init_cloudflare = __esm({
  "node_modules/unenv/runtime/node/timers/$cloudflare.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_set_immediate();
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-set$immediate.js
var init_virtual_unenv_global_polyfill_set_immediate = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-set$immediate.js"() {
    init_cloudflare();
    globalThis.setImmediate = setImmediateFallback;
  }
});

// node_modules/unenv/runtime/mock/proxy.mjs
function createMock(name, overrides = {}) {
  fn.prototype.name = name;
  const props = {};
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === "caller") {
        return null;
      }
      if (prop === "__createMock__") {
        return createMock;
      }
      if (prop === "__unenv__") {
        return true;
      }
      if (prop in overrides) {
        return overrides[prop];
      }
      return props[prop] = props[prop] || createMock(`${name}.${prop.toString()}`);
    },
    apply(_target, _this, _args) {
      return createMock(`${name}()`);
    },
    construct(_target, _args, _newT) {
      return createMock(`[${name}]`);
    },
    // @ts-ignore (ES6-only - removed in ES7)
    // https://github.com/tc39/ecma262/issues/161
    enumerate() {
      return [];
    }
  });
}
var fn, proxy_default;
var init_proxy = __esm({
  "node_modules/unenv/runtime/mock/proxy.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    fn = /* @__PURE__ */ __name(function() {
    }, "fn");
    __name(createMock, "createMock");
    proxy_default = createMock("mock");
  }
});

// node_modules/unenv/runtime/node/console/index.mjs
import { Writable } from "node:stream";
var _console, _ignoreErrors, _stderr, _stdout, log, info, trace, debug, table, error, warn, createTask, assert, clear, count, countReset, dir, dirxml, group, groupEnd, groupCollapsed, profile, profileEnd, time, timeEnd, timeLog, timeStamp, Console;
var init_console = __esm({
  "node_modules/unenv/runtime/node/console/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_proxy();
    init_noop();
    init_utils();
    init_proxy();
    init_noop();
    _console = globalThis.console;
    _ignoreErrors = true;
    _stderr = new Writable();
    _stdout = new Writable();
    log = _console?.log ?? noop_default;
    info = _console?.info ?? log;
    trace = _console?.trace ?? info;
    debug = _console?.debug ?? log;
    table = _console?.table ?? log;
    error = _console?.error ?? log;
    warn = _console?.warn ?? error;
    createTask = _console?.createTask ?? notImplemented("console.createTask");
    assert = notImplemented("console.assert");
    clear = _console?.clear ?? noop_default;
    count = _console?.count ?? noop_default;
    countReset = _console?.countReset ?? noop_default;
    dir = _console?.dir ?? noop_default;
    dirxml = _console?.dirxml ?? noop_default;
    group = _console?.group ?? noop_default;
    groupEnd = _console?.groupEnd ?? noop_default;
    groupCollapsed = _console?.groupCollapsed ?? noop_default;
    profile = _console?.profile ?? noop_default;
    profileEnd = _console?.profileEnd ?? noop_default;
    time = _console?.time ?? noop_default;
    timeEnd = _console?.timeEnd ?? noop_default;
    timeLog = _console?.timeLog ?? noop_default;
    timeStamp = _console?.timeStamp ?? noop_default;
    Console = _console?.Console ?? proxy_default.__createMock__("console.Console");
  }
});

// node_modules/unenv/runtime/node/console/$cloudflare.mjs
var workerdConsole, assert2, clear2, context, count2, countReset2, createTask2, debug2, dir2, dirxml2, error2, group2, groupCollapsed2, groupEnd2, info2, log2, profile2, profileEnd2, table2, time2, timeEnd2, timeLog2, timeStamp2, trace2, warn2, cloudflare_default;
var init_cloudflare2 = __esm({
  "node_modules/unenv/runtime/node/console/$cloudflare.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_console();
    workerdConsole = globalThis["console"];
    ({
      assert: assert2,
      clear: clear2,
      context: (
        // @ts-expect-error undocumented public API
        context
      ),
      count: count2,
      countReset: countReset2,
      createTask: (
        // @ts-expect-error undocumented public API
        createTask2
      ),
      debug: debug2,
      dir: dir2,
      dirxml: dirxml2,
      error: error2,
      group: group2,
      groupCollapsed: groupCollapsed2,
      groupEnd: groupEnd2,
      info: info2,
      log: log2,
      profile: profile2,
      profileEnd: profileEnd2,
      table: table2,
      time: time2,
      timeEnd: timeEnd2,
      timeLog: timeLog2,
      timeStamp: timeStamp2,
      trace: trace2,
      warn: warn2
    } = workerdConsole);
    Object.assign(workerdConsole, {
      Console,
      _ignoreErrors,
      _stderr,
      _stderrErrorHandler: noop_default,
      _stdout,
      _stdoutErrorHandler: noop_default,
      _times: proxy_default
    });
    cloudflare_default = workerdConsole;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-console.js
var init_virtual_unenv_global_polyfill_console = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-console.js"() {
    init_cloudflare2();
    globalThis.console = cloudflare_default;
  }
});

// node_modules/unenv/runtime/web/performance/_entry.mjs
var _supportedEntryTypes, _PerformanceEntry, PerformanceEntry, _PerformanceMark, PerformanceMark, _PerformanceMeasure, PerformanceMeasure, _PerformanceResourceTiming, PerformanceResourceTiming;
var init_entry = __esm({
  "node_modules/unenv/runtime/web/performance/_entry.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    _supportedEntryTypes = [
      "event",
      // PerformanceEntry
      "mark",
      // PerformanceMark
      "measure",
      // PerformanceMeasure
      "resource"
      // PerformanceResourceTiming
    ];
    _PerformanceEntry = class {
      __unenv__ = true;
      detail;
      entryType = "event";
      name;
      startTime;
      constructor(name, options) {
        this.name = name;
        this.startTime = options?.startTime || performance.now();
        this.detail = options?.detail;
      }
      get duration() {
        return performance.now() - this.startTime;
      }
      toJSON() {
        return {
          name: this.name,
          entryType: this.entryType,
          startTime: this.startTime,
          duration: this.duration,
          detail: this.detail
        };
      }
    };
    __name(_PerformanceEntry, "_PerformanceEntry");
    PerformanceEntry = globalThis.PerformanceEntry || _PerformanceEntry;
    _PerformanceMark = class extends _PerformanceEntry {
      entryType = "mark";
    };
    __name(_PerformanceMark, "_PerformanceMark");
    PerformanceMark = globalThis.PerformanceMark || _PerformanceMark;
    _PerformanceMeasure = class extends _PerformanceEntry {
      entryType = "measure";
    };
    __name(_PerformanceMeasure, "_PerformanceMeasure");
    PerformanceMeasure = globalThis.PerformanceMeasure || _PerformanceMeasure;
    _PerformanceResourceTiming = class extends _PerformanceEntry {
      entryType = "resource";
      serverTiming = [];
      connectEnd = 0;
      connectStart = 0;
      decodedBodySize = 0;
      domainLookupEnd = 0;
      domainLookupStart = 0;
      encodedBodySize = 0;
      fetchStart = 0;
      initiatorType = "";
      name = "";
      nextHopProtocol = "";
      redirectEnd = 0;
      redirectStart = 0;
      requestStart = 0;
      responseEnd = 0;
      responseStart = 0;
      secureConnectionStart = 0;
      startTime = 0;
      transferSize = 0;
      workerStart = 0;
      responseStatus = 0;
    };
    __name(_PerformanceResourceTiming, "_PerformanceResourceTiming");
    PerformanceResourceTiming = globalThis.PerformanceResourceTiming || _PerformanceResourceTiming;
  }
});

// node_modules/unenv/runtime/web/performance/_performance.mjs
var _timeOrigin, _Performance, Performance, performance2;
var init_performance = __esm({
  "node_modules/unenv/runtime/web/performance/_performance.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_proxy();
    init_entry();
    _timeOrigin = Date.now();
    _Performance = class {
      __unenv__ = true;
      timeOrigin = _timeOrigin;
      eventCounts = /* @__PURE__ */ new Map();
      _entries = [];
      _resourceTimingBufferSize = 0;
      navigation = proxy_default.__createMock__("PerformanceNavigation");
      timing = proxy_default.__createMock__("PerformanceTiming");
      onresourcetimingbufferfull = null;
      now() {
        if (globalThis?.performance?.now && this.timeOrigin === _timeOrigin) {
          return globalThis.performance.now();
        }
        return Date.now() - this.timeOrigin;
      }
      clearMarks(markName) {
        this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter(
          (e) => e.entryType !== "resource" || e.entryType !== "navigation"
        );
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter(
          (e) => e.name === name && (!type || e.entryType === type)
        );
      }
      getEntriesByType(type) {
        return this._entries.filter(
          (e) => e.entryType === type
        );
      }
      mark(name, options) {
        const entry = new _PerformanceMark(name, options);
        this._entries.push(entry);
        return entry;
      }
      measure(measureName, startOrMeasureOptions, endMark) {
        let start;
        let end;
        if (typeof startOrMeasureOptions === "string") {
          start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
          end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
        } else {
          start = Number.parseFloat(startOrMeasureOptions?.start) || performance2.now();
          end = Number.parseFloat(startOrMeasureOptions?.end) || performance2.now();
        }
        const entry = new _PerformanceMeasure(measureName, {
          startTime: start,
          detail: { start, end }
        });
        this._entries.push(entry);
        return entry;
      }
      setResourceTimingBufferSize(maxSize) {
        this._resourceTimingBufferSize = maxSize;
      }
      toJSON() {
        return this;
      }
      addEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.addEventListener");
      }
      removeEventListener(type, listener, options) {
        throw createNotImplementedError("Performance.removeEventListener");
      }
      dispatchEvent(event) {
        throw createNotImplementedError("Performance.dispatchEvent");
      }
    };
    __name(_Performance, "_Performance");
    Performance = globalThis.Performance || _Performance;
    performance2 = globalThis.performance || new Performance();
  }
});

// node_modules/unenv/runtime/web/performance/_observer.mjs
var _PerformanceObserver, PerformanceObserver, _PerformanceObserverEntryList, PerformanceObserverEntryList;
var init_observer = __esm({
  "node_modules/unenv/runtime/web/performance/_observer.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_entry();
    _PerformanceObserver = class {
      __unenv__ = true;
      _callback = null;
      constructor(callback) {
        this._callback = callback;
      }
      takeRecords() {
        return [];
      }
      disconnect() {
        throw createNotImplementedError("PerformanceObserver.disconnect");
      }
      observe(options) {
        throw createNotImplementedError("PerformanceObserver.observe");
      }
    };
    __name(_PerformanceObserver, "_PerformanceObserver");
    __publicField(_PerformanceObserver, "supportedEntryTypes", _supportedEntryTypes);
    PerformanceObserver = globalThis.PerformanceObserver || _PerformanceObserver;
    _PerformanceObserverEntryList = class {
      __unenv__ = true;
      getEntries() {
        return [];
      }
      getEntriesByName(_name, _type) {
        return [];
      }
      getEntriesByType(type) {
        return [];
      }
    };
    __name(_PerformanceObserverEntryList, "_PerformanceObserverEntryList");
    PerformanceObserverEntryList = globalThis.PerformanceObserverEntryList || _PerformanceObserverEntryList;
  }
});

// node_modules/unenv/runtime/web/performance/index.mjs
var init_performance2 = __esm({
  "node_modules/unenv/runtime/web/performance/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_performance();
    init_observer();
    init_entry();
  }
});

// node_modules/unenv/runtime/polyfill/global-this.mjs
function getGlobal() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof window !== "undefined") {
    return window;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  return {};
}
var global_this_default;
var init_global_this = __esm({
  "node_modules/unenv/runtime/polyfill/global-this.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    __name(getGlobal, "getGlobal");
    global_this_default = getGlobal();
  }
});

// node_modules/unenv/runtime/polyfill/performance.mjs
var performance_default;
var init_performance3 = __esm({
  "node_modules/unenv/runtime/polyfill/performance.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_performance2();
    init_global_this();
    global_this_default.performance = global_this_default.performance || performance2;
    global_this_default.Performance = global_this_default.Performance || Performance;
    global_this_default.PerformanceEntry = global_this_default.PerformanceEntry || PerformanceEntry;
    global_this_default.PerformanceMark = global_this_default.PerformanceMark || PerformanceMark;
    global_this_default.PerformanceMeasure = global_this_default.PerformanceMeasure || PerformanceMeasure;
    global_this_default.PerformanceObserver = global_this_default.PerformanceObserver || PerformanceObserver;
    global_this_default.PerformanceObserverEntryList = global_this_default.PerformanceObserverEntryList || PerformanceObserverEntryList;
    global_this_default.PerformanceResourceTiming = global_this_default.PerformanceResourceTiming || PerformanceResourceTiming;
    performance_default = global_this_default.performance;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-performance.js
var init_virtual_unenv_global_polyfill_performance = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-performance.js"() {
    init_performance3();
    globalThis.performance = performance_default;
  }
});

// node_modules/unenv/runtime/node/stream/internal/readable.mjs
import { EventEmitter } from "node:events";
var _Readable, Readable;
var init_readable = __esm({
  "node_modules/unenv/runtime/node/stream/internal/readable.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    _Readable = class extends EventEmitter {
      __unenv__ = true;
      readableEncoding = null;
      readableEnded = true;
      readableFlowing = false;
      readableHighWaterMark = 0;
      readableLength = 0;
      readableObjectMode = false;
      readableAborted = false;
      readableDidRead = false;
      closed = false;
      errored = null;
      readable = false;
      destroyed = false;
      static from(_iterable, options) {
        return new _Readable(options);
      }
      constructor(_opts) {
        super();
      }
      _read(_size) {
      }
      read(_size) {
      }
      setEncoding(_encoding) {
        return this;
      }
      pause() {
        return this;
      }
      resume() {
        return this;
      }
      isPaused() {
        return true;
      }
      unpipe(_destination) {
        return this;
      }
      unshift(_chunk, _encoding) {
      }
      wrap(_oldStream) {
        return this;
      }
      push(_chunk, _encoding) {
        return false;
      }
      _destroy(_error, _callback) {
        this.removeAllListeners();
      }
      destroy(error3) {
        this.destroyed = true;
        this._destroy(error3);
        return this;
      }
      pipe(_destenition, _options) {
        return {};
      }
      compose(stream, options) {
        throw new Error("[unenv] Method not implemented.");
      }
      [Symbol.asyncDispose]() {
        this.destroy();
        return Promise.resolve();
      }
      // eslint-disable-next-line require-yield
      async *[Symbol.asyncIterator]() {
        throw createNotImplementedError("Readable.asyncIterator");
      }
      iterator(options) {
        throw createNotImplementedError("Readable.iterator");
      }
      map(fn2, options) {
        throw createNotImplementedError("Readable.map");
      }
      filter(fn2, options) {
        throw createNotImplementedError("Readable.filter");
      }
      forEach(fn2, options) {
        throw createNotImplementedError("Readable.forEach");
      }
      reduce(fn2, initialValue, options) {
        throw createNotImplementedError("Readable.reduce");
      }
      find(fn2, options) {
        throw createNotImplementedError("Readable.find");
      }
      findIndex(fn2, options) {
        throw createNotImplementedError("Readable.findIndex");
      }
      some(fn2, options) {
        throw createNotImplementedError("Readable.some");
      }
      toArray(options) {
        throw createNotImplementedError("Readable.toArray");
      }
      every(fn2, options) {
        throw createNotImplementedError("Readable.every");
      }
      flatMap(fn2, options) {
        throw createNotImplementedError("Readable.flatMap");
      }
      drop(limit, options) {
        throw createNotImplementedError("Readable.drop");
      }
      take(limit, options) {
        throw createNotImplementedError("Readable.take");
      }
      asIndexedPairs(options) {
        throw createNotImplementedError("Readable.asIndexedPairs");
      }
    };
    __name(_Readable, "_Readable");
    Readable = globalThis.Readable || _Readable;
  }
});

// node_modules/unenv/runtime/node/stream/internal/writable.mjs
import { EventEmitter as EventEmitter2 } from "node:events";
var _Writable, Writable2;
var init_writable = __esm({
  "node_modules/unenv/runtime/node/stream/internal/writable.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    _Writable = class extends EventEmitter2 {
      __unenv__ = true;
      writable = true;
      writableEnded = false;
      writableFinished = false;
      writableHighWaterMark = 0;
      writableLength = 0;
      writableObjectMode = false;
      writableCorked = 0;
      closed = false;
      errored = null;
      writableNeedDrain = false;
      destroyed = false;
      _data;
      _encoding = "utf-8";
      constructor(_opts) {
        super();
      }
      pipe(_destenition, _options) {
        return {};
      }
      _write(chunk, encoding, callback) {
        if (this.writableEnded) {
          if (callback) {
            callback();
          }
          return;
        }
        if (this._data === void 0) {
          this._data = chunk;
        } else {
          const a = typeof this._data === "string" ? Buffer.from(this._data, this._encoding || encoding || "utf8") : this._data;
          const b = typeof chunk === "string" ? Buffer.from(chunk, encoding || this._encoding || "utf8") : chunk;
          this._data = Buffer.concat([a, b]);
        }
        this._encoding = encoding;
        if (callback) {
          callback();
        }
      }
      _writev(_chunks, _callback) {
      }
      _destroy(_error, _callback) {
      }
      _final(_callback) {
      }
      write(chunk, arg2, arg3) {
        const encoding = typeof arg2 === "string" ? this._encoding : "utf-8";
        const cb = typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
        this._write(chunk, encoding, cb);
        return true;
      }
      setDefaultEncoding(_encoding) {
        return this;
      }
      end(arg1, arg2, arg3) {
        const callback = typeof arg1 === "function" ? arg1 : typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : void 0;
        if (this.writableEnded) {
          if (callback) {
            callback();
          }
          return this;
        }
        const data = arg1 === callback ? void 0 : arg1;
        if (data) {
          const encoding = arg2 === callback ? void 0 : arg2;
          this.write(data, encoding, callback);
        }
        this.writableEnded = true;
        this.writableFinished = true;
        this.emit("close");
        this.emit("finish");
        return this;
      }
      cork() {
      }
      uncork() {
      }
      destroy(_error) {
        this.destroyed = true;
        delete this._data;
        this.removeAllListeners();
        return this;
      }
      compose(stream, options) {
        throw new Error("[h3] Method not implemented.");
      }
    };
    __name(_Writable, "_Writable");
    Writable2 = globalThis.Writable || _Writable;
  }
});

// node_modules/unenv/runtime/node/stream/internal/duplex.mjs
function getDuplex() {
  Object.assign(__Duplex.prototype, Readable.prototype);
  Object.assign(__Duplex.prototype, Writable2.prototype);
  return __Duplex;
}
var __Duplex, _Duplex, Duplex;
var init_duplex = __esm({
  "node_modules/unenv/runtime/node/stream/internal/duplex.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_readable();
    init_writable();
    __Duplex = /* @__PURE__ */ __name(class {
      allowHalfOpen = true;
      _destroy;
      constructor(readable = new Readable(), writable = new Writable2()) {
        Object.assign(this, readable);
        Object.assign(this, writable);
        this._destroy = mergeFns(readable._destroy, writable._destroy);
      }
    }, "__Duplex");
    __name(getDuplex, "getDuplex");
    _Duplex = /* @__PURE__ */ getDuplex();
    Duplex = globalThis.Duplex || _Duplex;
  }
});

// node_modules/unenv/runtime/node/net/internal/socket.mjs
var Socket, SocketAddress;
var init_socket = __esm({
  "node_modules/unenv/runtime/node/net/internal/socket.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_duplex();
    Socket = class extends Duplex {
      __unenv__ = true;
      bufferSize = 0;
      bytesRead = 0;
      bytesWritten = 0;
      connecting = false;
      destroyed = false;
      pending = false;
      localAddress = "";
      localPort = 0;
      remoteAddress = "";
      remoteFamily = "";
      remotePort = 0;
      autoSelectFamilyAttemptedAddresses = [];
      readyState = "readOnly";
      constructor(_options) {
        super();
      }
      write(_buffer, _arg1, _arg2) {
        return false;
      }
      connect(_arg1, _arg2, _arg3) {
        return this;
      }
      end(_arg1, _arg2, _arg3) {
        return this;
      }
      setEncoding(_encoding) {
        return this;
      }
      pause() {
        return this;
      }
      resume() {
        return this;
      }
      setTimeout(_timeout, _callback) {
        return this;
      }
      setNoDelay(_noDelay) {
        return this;
      }
      setKeepAlive(_enable, _initialDelay) {
        return this;
      }
      address() {
        return {};
      }
      unref() {
        return this;
      }
      ref() {
        return this;
      }
      destroySoon() {
        this.destroy();
      }
      resetAndDestroy() {
        const err = new Error("ERR_SOCKET_CLOSED");
        err.code = "ERR_SOCKET_CLOSED";
        this.destroy(err);
        return this;
      }
    };
    __name(Socket, "Socket");
    SocketAddress = class {
      __unenv__ = true;
      address;
      family;
      port;
      flowlabel;
      constructor(options) {
        this.address = options.address;
        this.family = options.family;
        this.port = options.port;
        this.flowlabel = options.flowlabel;
      }
    };
    __name(SocketAddress, "SocketAddress");
  }
});

// node_modules/unenv/runtime/node/net/internal/server.mjs
import { EventEmitter as EventEmitter3 } from "node:events";
var Server;
var init_server = __esm({
  "node_modules/unenv/runtime/node/net/internal/server.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    Server = class extends EventEmitter3 {
      __unenv__ = true;
      maxConnections = 1;
      connections = 0;
      listening = false;
      constructor(arg1, arg2) {
        super();
      }
      listen() {
        throw createNotImplementedError("node:net.Server.listen()");
      }
      close(callback) {
        throw createNotImplementedError("node:net.Server.close()");
      }
      address() {
        return null;
      }
      getConnections(cb) {
        cb(null, 0);
      }
      ref() {
        return this;
      }
      unref() {
        return this;
      }
      [Symbol.asyncDispose]() {
        return Promise.resolve();
      }
    };
    __name(Server, "Server");
  }
});

// node_modules/unenv/runtime/node/net/index.mjs
var createServer, BlockList, connect, createConnection, getDefaultAutoSelectFamily, setDefaultAutoSelectFamily, getDefaultAutoSelectFamilyAttemptTimeout, setDefaultAutoSelectFamilyAttemptTimeout, IPV4Regex, isIPv4, IPV6Regex, isIPv6, isIP, _createServerHandle, _normalizeArgs, _setSimultaneousAccepts, exports, net_default;
var init_net = __esm({
  "node_modules/unenv/runtime/node/net/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_socket();
    init_server();
    init_server();
    init_socket();
    createServer = notImplemented(
      "net.createServer"
    );
    BlockList = notImplementedClass(
      "net.BlockList"
    );
    connect = notImplemented("net.connect");
    createConnection = notImplemented(
      "net.createConnection"
    );
    getDefaultAutoSelectFamily = notImplemented(
      "net.getDefaultAutoSelectFamily"
    );
    setDefaultAutoSelectFamily = notImplemented(
      "net.setDefaultAutoSelectFamily"
    );
    getDefaultAutoSelectFamilyAttemptTimeout = notImplemented(
      "net.getDefaultAutoSelectFamilyAttemptTimeout"
    );
    setDefaultAutoSelectFamilyAttemptTimeout = notImplemented(
      "net.setDefaultAutoSelectFamilyAttemptTimeout"
    );
    IPV4Regex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
    isIPv4 = /* @__PURE__ */ __name((host) => IPV4Regex.test(host), "isIPv4");
    IPV6Regex = /^([\dA-Fa-f]{1,4}:){7}[\dA-Fa-f]{1,4}$/;
    isIPv6 = /* @__PURE__ */ __name((host) => IPV6Regex.test(host), "isIPv6");
    isIP = /* @__PURE__ */ __name((host) => {
      if (isIPv4(host)) {
        return 4;
      }
      if (isIPv6(host)) {
        return 6;
      }
      return 0;
    }, "isIP");
    _createServerHandle = notImplemented("net._createServerHandle");
    _normalizeArgs = notImplemented("net._normalizeArgs");
    _setSimultaneousAccepts = notImplemented(
      "net._setSimultaneousAccepts"
    );
    exports = {
      Socket,
      // @ts-expect-error (missing types?)
      Stream: Socket,
      Server,
      BlockList,
      SocketAddress,
      createServer,
      connect,
      createConnection,
      isIPv4,
      isIPv6,
      isIP,
      getDefaultAutoSelectFamily,
      getDefaultAutoSelectFamilyAttemptTimeout,
      setDefaultAutoSelectFamily,
      setDefaultAutoSelectFamilyAttemptTimeout,
      _createServerHandle,
      _normalizeArgs,
      _setSimultaneousAccepts
    };
    net_default = exports;
  }
});

// node_modules/unenv/runtime/node/tty/internal/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/runtime/node/tty/internal/read-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_net();
    ReadStream = class extends Socket {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      isRaw = false;
      setRawMode(mode) {
        this.isRaw = mode;
        return this;
      }
      isTTY = false;
    };
    __name(ReadStream, "ReadStream");
  }
});

// node_modules/unenv/runtime/node/tty/internal/write-stream.mjs
var WriteStream;
var init_write_stream = __esm({
  "node_modules/unenv/runtime/node/tty/internal/write-stream.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_net();
    WriteStream = class extends Socket {
      fd;
      constructor(fd) {
        super();
        this.fd = fd;
      }
      clearLine(dir3, callback) {
        callback && callback();
        return false;
      }
      clearScreenDown(callback) {
        callback && callback();
        return false;
      }
      cursorTo(x, y, callback) {
        callback && typeof callback === "function" && callback();
        return false;
      }
      moveCursor(dx, dy, callback) {
        callback && callback();
        return false;
      }
      getColorDepth(env3) {
        return 1;
      }
      hasColors(count3, env3) {
        return false;
      }
      getWindowSize() {
        return [this.columns, this.rows];
      }
      columns = 80;
      rows = 24;
      isTTY = false;
    };
    __name(WriteStream, "WriteStream");
  }
});

// node_modules/unenv/runtime/node/tty/index.mjs
var init_tty = __esm({
  "node_modules/unenv/runtime/node/tty/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_read_stream();
    init_write_stream();
  }
});

// node_modules/unenv/runtime/mock/empty.mjs
var empty_default;
var init_empty = __esm({
  "node_modules/unenv/runtime/mock/empty.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    empty_default = Object.freeze(
      Object.create(null, {
        __unenv__: { get: () => true }
      })
    );
  }
});

// node_modules/unenv/runtime/node/process/internal/env.mjs
var _envShim, _processEnv, _getEnv, env;
var init_env = __esm({
  "node_modules/unenv/runtime/node/process/internal/env.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    _envShim = /* @__PURE__ */ Object.create(null);
    _processEnv = globalThis.process?.env;
    _getEnv = /* @__PURE__ */ __name((useShim) => _processEnv || globalThis.__env__ || (useShim ? _envShim : globalThis), "_getEnv");
    env = new Proxy(_envShim, {
      get(_, prop) {
        const env22 = _getEnv();
        return env22[prop] ?? _envShim[prop];
      },
      has(_, prop) {
        const env22 = _getEnv();
        return prop in env22 || prop in _envShim;
      },
      set(_, prop, value) {
        const env22 = _getEnv(true);
        env22[prop] = value;
        return true;
      },
      deleteProperty(_, prop) {
        const env22 = _getEnv(true);
        delete env22[prop];
        return true;
      },
      ownKeys() {
        const env22 = _getEnv();
        return Object.keys(env22);
      }
    });
  }
});

// node_modules/unenv/runtime/node/process/internal/time.mjs
function _createNextTickWithTimeout() {
  let queue = [];
  let draining = false;
  let currentQueue;
  let queueIndex = -1;
  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }
    draining = false;
    if (currentQueue.length > 0) {
      queue = [...currentQueue, ...queue];
    } else {
      queueIndex = -1;
    }
    if (queue.length > 0) {
      drainQueue();
    }
  }
  __name(cleanUpNextTick, "cleanUpNextTick");
  function drainQueue() {
    if (draining) {
      return;
    }
    const timeout = setTimeout(cleanUpNextTick);
    draining = true;
    let len = queue.length;
    while (len) {
      currentQueue = queue;
      queue = [];
      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex]();
        }
      }
      queueIndex = -1;
      len = queue.length;
    }
    currentQueue = void 0;
    draining = false;
    clearTimeout(timeout);
  }
  __name(drainQueue, "drainQueue");
  const nextTick22 = /* @__PURE__ */ __name((cb, ...args) => {
    queue.push(cb.bind(void 0, ...args));
    if (queue.length === 1 && !draining) {
      setTimeout(drainQueue);
    }
  }, "nextTick2");
  return nextTick22;
}
var hrtime, nextTick;
var init_time = __esm({
  "node_modules/unenv/runtime/node/process/internal/time.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    hrtime = Object.assign(
      /* @__PURE__ */ __name(function hrtime2(startTime) {
        const now = Date.now();
        const seconds = Math.trunc(now / 1e3);
        const nanos = now % 1e3 * 1e6;
        if (startTime) {
          let diffSeconds = seconds - startTime[0];
          let diffNanos = nanos - startTime[0];
          if (diffNanos < 0) {
            diffSeconds = diffSeconds - 1;
            diffNanos = 1e9 + diffNanos;
          }
          return [diffSeconds, diffNanos];
        }
        return [seconds, nanos];
      }, "hrtime2"),
      {
        bigint: /* @__PURE__ */ __name(function bigint() {
          return BigInt(Date.now() * 1e6);
        }, "bigint")
      }
    );
    nextTick = globalThis.queueMicrotask ? (cb, ...args) => {
      globalThis.queueMicrotask(cb.bind(void 0, ...args));
    } : _createNextTickWithTimeout();
    __name(_createNextTickWithTimeout, "_createNextTickWithTimeout");
  }
});

// node_modules/unenv/runtime/node/process/internal/process.mjs
function noop() {
  return process2;
}
var title, argv, version, versions, on, addListener, once, off, removeListener, removeAllListeners, emit, prependListener, prependOnceListener, listeners, listenerCount, binding, _cwd, cwd, chdir, umask, getegid, geteuid, getgid, getuid, getgroups, getBuiltinModule, abort, allowedNodeEnvironmentFlags, arch, argv0, config, connected, constrainedMemory, availableMemory, cpuUsage, debugPort, dlopen, disconnect, emitWarning, eventNames, execArgv, execPath, exit, features, getActiveResourcesInfo, getMaxListeners, kill, memoryUsage, pid, platform, ppid, rawListeners, release, report, resourceUsage, setegid, seteuid, setgid, setgroups, setuid, setMaxListeners, setSourceMapsEnabled, stdin, stdout, stderr, traceDeprecation, uptime, exitCode, setUncaughtExceptionCaptureCallback, hasUncaughtExceptionCaptureCallback, sourceMapsEnabled, loadEnvFile, mainModule, permission, channel, throwDeprecation, finalization, assert3, openStdin, _debugEnd, _debugProcess, _fatalException, _getActiveHandles, _getActiveRequests, _kill, _preload_modules, _rawDebug, _startProfilerIdleNotifier, _stopProfilerIdleNotifier, _tickCallback, _linkedBinding, domain, initgroups, moduleLoadList, reallyExit, _exiting, _events, _eventsCount, _maxListeners, process2;
var init_process = __esm({
  "node_modules/unenv/runtime/node/process/internal/process.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_tty();
    init_empty();
    init_utils();
    init_env();
    init_time();
    init_time();
    title = "unenv";
    argv = [];
    version = "";
    versions = {
      ares: "",
      http_parser: "",
      icu: "",
      modules: "",
      node: "",
      openssl: "",
      uv: "",
      v8: "",
      zlib: ""
    };
    __name(noop, "noop");
    on = noop;
    addListener = noop;
    once = noop;
    off = noop;
    removeListener = noop;
    removeAllListeners = noop;
    emit = /* @__PURE__ */ __name(function emit2(event) {
      if (event === "message" || event === "multipleResolves") {
        return process2;
      }
      return false;
    }, "emit2");
    prependListener = noop;
    prependOnceListener = noop;
    listeners = /* @__PURE__ */ __name(function(name) {
      return [];
    }, "listeners");
    listenerCount = /* @__PURE__ */ __name(() => 0, "listenerCount");
    binding = /* @__PURE__ */ __name(function(name) {
      throw new Error("[unenv] process.binding is not supported");
    }, "binding");
    _cwd = "/";
    cwd = /* @__PURE__ */ __name(function cwd2() {
      return _cwd;
    }, "cwd2");
    chdir = /* @__PURE__ */ __name(function chdir2(dir3) {
      _cwd = dir3;
    }, "chdir2");
    umask = /* @__PURE__ */ __name(function umask2() {
      return 0;
    }, "umask2");
    getegid = /* @__PURE__ */ __name(function getegid2() {
      return 1e3;
    }, "getegid2");
    geteuid = /* @__PURE__ */ __name(function geteuid2() {
      return 1e3;
    }, "geteuid2");
    getgid = /* @__PURE__ */ __name(function getgid2() {
      return 1e3;
    }, "getgid2");
    getuid = /* @__PURE__ */ __name(function getuid2() {
      return 1e3;
    }, "getuid2");
    getgroups = /* @__PURE__ */ __name(function getgroups2() {
      return [];
    }, "getgroups2");
    getBuiltinModule = /* @__PURE__ */ __name((_name) => void 0, "getBuiltinModule");
    abort = notImplemented("process.abort");
    allowedNodeEnvironmentFlags = /* @__PURE__ */ new Set();
    arch = "";
    argv0 = "";
    config = empty_default;
    connected = false;
    constrainedMemory = /* @__PURE__ */ __name(() => 0, "constrainedMemory");
    availableMemory = /* @__PURE__ */ __name(() => 0, "availableMemory");
    cpuUsage = notImplemented("process.cpuUsage");
    debugPort = 0;
    dlopen = notImplemented("process.dlopen");
    disconnect = noop;
    emitWarning = noop;
    eventNames = notImplemented("process.eventNames");
    execArgv = [];
    execPath = "";
    exit = notImplemented("process.exit");
    features = /* @__PURE__ */ Object.create({
      inspector: void 0,
      debug: void 0,
      uv: void 0,
      ipv6: void 0,
      tls_alpn: void 0,
      tls_sni: void 0,
      tls_ocsp: void 0,
      tls: void 0,
      cached_builtins: void 0
    });
    getActiveResourcesInfo = /* @__PURE__ */ __name(() => [], "getActiveResourcesInfo");
    getMaxListeners = notImplemented(
      "process.getMaxListeners"
    );
    kill = notImplemented("process.kill");
    memoryUsage = Object.assign(
      () => ({
        arrayBuffers: 0,
        rss: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: 0
      }),
      { rss: () => 0 }
    );
    pid = 1e3;
    platform = "";
    ppid = 1e3;
    rawListeners = notImplemented(
      "process.rawListeners"
    );
    release = /* @__PURE__ */ Object.create({
      name: "",
      lts: "",
      sourceUrl: void 0,
      headersUrl: void 0
    });
    report = /* @__PURE__ */ Object.create({
      compact: void 0,
      directory: void 0,
      filename: void 0,
      getReport: notImplemented("process.report.getReport"),
      reportOnFatalError: void 0,
      reportOnSignal: void 0,
      reportOnUncaughtException: void 0,
      signal: void 0,
      writeReport: notImplemented("process.report.writeReport")
    });
    resourceUsage = notImplemented(
      "process.resourceUsage"
    );
    setegid = notImplemented("process.setegid");
    seteuid = notImplemented("process.seteuid");
    setgid = notImplemented("process.setgid");
    setgroups = notImplemented("process.setgroups");
    setuid = notImplemented("process.setuid");
    setMaxListeners = notImplemented(
      "process.setMaxListeners"
    );
    setSourceMapsEnabled = notImplemented("process.setSourceMapsEnabled");
    stdin = new ReadStream(0);
    stdout = new WriteStream(1);
    stderr = new WriteStream(2);
    traceDeprecation = false;
    uptime = /* @__PURE__ */ __name(() => 0, "uptime");
    exitCode = 0;
    setUncaughtExceptionCaptureCallback = notImplemented("process.setUncaughtExceptionCaptureCallback");
    hasUncaughtExceptionCaptureCallback = /* @__PURE__ */ __name(() => false, "hasUncaughtExceptionCaptureCallback");
    sourceMapsEnabled = false;
    loadEnvFile = notImplemented(
      "process.loadEnvFile"
    );
    mainModule = void 0;
    permission = {
      has: () => false
    };
    channel = {
      ref() {
      },
      unref() {
      }
    };
    throwDeprecation = false;
    finalization = {
      register() {
      },
      unregister() {
      },
      registerBeforeExit() {
      }
    };
    assert3 = notImplemented("process.assert");
    openStdin = notImplemented("process.openStdin");
    _debugEnd = notImplemented("process._debugEnd");
    _debugProcess = notImplemented("process._debugProcess");
    _fatalException = notImplemented("process._fatalException");
    _getActiveHandles = notImplemented("process._getActiveHandles");
    _getActiveRequests = notImplemented("process._getActiveRequests");
    _kill = notImplemented("process._kill");
    _preload_modules = [];
    _rawDebug = notImplemented("process._rawDebug");
    _startProfilerIdleNotifier = notImplemented(
      "process._startProfilerIdleNotifier"
    );
    _stopProfilerIdleNotifier = notImplemented(
      "process.__stopProfilerIdleNotifier"
    );
    _tickCallback = notImplemented("process._tickCallback");
    _linkedBinding = notImplemented("process._linkedBinding");
    domain = void 0;
    initgroups = notImplemented("process.initgroups");
    moduleLoadList = [];
    reallyExit = noop;
    _exiting = false;
    _events = [];
    _eventsCount = 0;
    _maxListeners = 0;
    process2 = {
      // @ts-expect-error
      _events,
      _eventsCount,
      _exiting,
      _maxListeners,
      _debugEnd,
      _debugProcess,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      domain,
      initgroups,
      moduleLoadList,
      reallyExit,
      exitCode,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      hasUncaughtExceptionCaptureCallback,
      setUncaughtExceptionCaptureCallback,
      loadEnvFile,
      sourceMapsEnabled,
      throwDeprecation,
      mainModule,
      permission,
      channel,
      arch,
      argv,
      argv0,
      assert: assert3,
      binding,
      chdir,
      config,
      connected,
      constrainedMemory,
      availableMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      disconnect,
      emit,
      emitWarning,
      env,
      eventNames,
      execArgv,
      execPath,
      exit,
      finalization,
      features,
      getBuiltinModule,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      getActiveResourcesInfo,
      getMaxListeners,
      hrtime,
      kill,
      listeners,
      listenerCount,
      memoryUsage,
      nextTick,
      on,
      off,
      once,
      openStdin,
      pid,
      platform,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      setMaxListeners,
      setSourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      traceDeprecation,
      umask,
      uptime,
      version,
      versions
    };
  }
});

// node_modules/unenv/runtime/node/process/$cloudflare.mjs
var unpatchedGlobalThisProcess, getBuiltinModule2, workerdProcess, env2, exit2, nextTick2, platform2, _process, cloudflare_default2;
var init_cloudflare3 = __esm({
  "node_modules/unenv/runtime/node/process/$cloudflare.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_process();
    unpatchedGlobalThisProcess = globalThis["process"];
    getBuiltinModule2 = unpatchedGlobalThisProcess.getBuiltinModule;
    workerdProcess = getBuiltinModule2("node:process");
    ({ env: env2, exit: exit2, nextTick: nextTick2, platform: platform2 } = workerdProcess);
    _process = {
      /**
       * manually unroll unenv-polyfilled-symbols to make it tree-shakeable
       */
      // @ts-expect-error (not typed)
      _debugEnd,
      _debugProcess,
      _events,
      _eventsCount,
      _exiting,
      _fatalException,
      _getActiveHandles,
      _getActiveRequests,
      _kill,
      _linkedBinding,
      _maxListeners,
      _preload_modules,
      _rawDebug,
      _startProfilerIdleNotifier,
      _stopProfilerIdleNotifier,
      _tickCallback,
      abort,
      addListener,
      allowedNodeEnvironmentFlags,
      arch,
      argv,
      argv0,
      assert: assert3,
      availableMemory,
      binding,
      chdir,
      config,
      constrainedMemory,
      cpuUsage,
      cwd,
      debugPort,
      dlopen,
      domain,
      emit,
      emitWarning,
      eventNames,
      execArgv,
      execPath,
      exit: exit2,
      exitCode,
      features,
      getActiveResourcesInfo,
      getMaxListeners,
      getegid,
      geteuid,
      getgid,
      getgroups,
      getuid,
      hasUncaughtExceptionCaptureCallback,
      hrtime,
      initgroups,
      kill,
      listenerCount,
      listeners,
      loadEnvFile,
      memoryUsage,
      moduleLoadList,
      off,
      on,
      once,
      openStdin,
      pid,
      platform: platform2,
      ppid,
      prependListener,
      prependOnceListener,
      rawListeners,
      reallyExit,
      release,
      removeAllListeners,
      removeListener,
      report,
      resourceUsage,
      setMaxListeners,
      setSourceMapsEnabled,
      setUncaughtExceptionCaptureCallback,
      setegid,
      seteuid,
      setgid,
      setgroups,
      setuid,
      sourceMapsEnabled,
      stderr,
      stdin,
      stdout,
      title,
      umask,
      uptime,
      version,
      versions,
      /**
       * manually unroll workerd-polyfilled-symbols to make it tree-shakeable
       */
      env: env2,
      getBuiltinModule: getBuiltinModule2,
      nextTick: nextTick2
    };
    cloudflare_default2 = _process;
  }
});

// node_modules/wrangler/_virtual_unenv_global_polyfill-process.js
var init_virtual_unenv_global_polyfill_process = __esm({
  "node_modules/wrangler/_virtual_unenv_global_polyfill-process.js"() {
    init_cloudflare3();
    globalThis.process = cloudflare_default2;
  }
});

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// node_modules/@ioredis/commands/built/commands.json
var require_commands = __commonJS({
  "node_modules/@ioredis/commands/built/commands.json"(exports2, module) {
    module.exports = {
      acl: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      append: {
        arity: 3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      asking: {
        arity: 1,
        flags: [
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      auth: {
        arity: -2,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "no_auth",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      bgrewriteaof: {
        arity: 1,
        flags: [
          "admin",
          "noscript",
          "no_async_loading"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      bgsave: {
        arity: -1,
        flags: [
          "admin",
          "noscript",
          "no_async_loading"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      bitcount: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      bitfield: {
        arity: -2,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      bitfield_ro: {
        arity: -2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      bitop: {
        arity: -4,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 2,
        keyStop: -1,
        step: 1
      },
      bitpos: {
        arity: -3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      blmove: {
        arity: 6,
        flags: [
          "write",
          "denyoom",
          "noscript",
          "blocking"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      blmpop: {
        arity: -5,
        flags: [
          "write",
          "blocking",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      blpop: {
        arity: -3,
        flags: [
          "write",
          "noscript",
          "blocking"
        ],
        keyStart: 1,
        keyStop: -2,
        step: 1
      },
      brpop: {
        arity: -3,
        flags: [
          "write",
          "noscript",
          "blocking"
        ],
        keyStart: 1,
        keyStop: -2,
        step: 1
      },
      brpoplpush: {
        arity: 4,
        flags: [
          "write",
          "denyoom",
          "noscript",
          "blocking"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      bzmpop: {
        arity: -5,
        flags: [
          "write",
          "blocking",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      bzpopmax: {
        arity: -3,
        flags: [
          "write",
          "noscript",
          "blocking",
          "fast"
        ],
        keyStart: 1,
        keyStop: -2,
        step: 1
      },
      bzpopmin: {
        arity: -3,
        flags: [
          "write",
          "noscript",
          "blocking",
          "fast"
        ],
        keyStart: 1,
        keyStop: -2,
        step: 1
      },
      client: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      cluster: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      command: {
        arity: -1,
        flags: [
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      config: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      copy: {
        arity: -3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      dbsize: {
        arity: 1,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      debug: {
        arity: -2,
        flags: [
          "admin",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      decr: {
        arity: 2,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      decrby: {
        arity: 3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      del: {
        arity: -2,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      discard: {
        arity: 1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      dump: {
        arity: 2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      echo: {
        arity: 2,
        flags: [
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      eval: {
        arity: -3,
        flags: [
          "noscript",
          "stale",
          "skip_monitor",
          "no_mandatory_keys",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      eval_ro: {
        arity: -3,
        flags: [
          "readonly",
          "noscript",
          "stale",
          "skip_monitor",
          "no_mandatory_keys",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      evalsha: {
        arity: -3,
        flags: [
          "noscript",
          "stale",
          "skip_monitor",
          "no_mandatory_keys",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      evalsha_ro: {
        arity: -3,
        flags: [
          "readonly",
          "noscript",
          "stale",
          "skip_monitor",
          "no_mandatory_keys",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      exec: {
        arity: 1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "skip_slowlog"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      exists: {
        arity: -2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      expire: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      expireat: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      expiretime: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      failover: {
        arity: -1,
        flags: [
          "admin",
          "noscript",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      fcall: {
        arity: -3,
        flags: [
          "noscript",
          "stale",
          "skip_monitor",
          "no_mandatory_keys",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      fcall_ro: {
        arity: -3,
        flags: [
          "readonly",
          "noscript",
          "stale",
          "skip_monitor",
          "no_mandatory_keys",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      flushall: {
        arity: -1,
        flags: [
          "write"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      flushdb: {
        arity: -1,
        flags: [
          "write"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      function: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      geoadd: {
        arity: -5,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      geodist: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      geohash: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      geopos: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      georadius: {
        arity: -6,
        flags: [
          "write",
          "denyoom",
          "movablekeys"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      georadius_ro: {
        arity: -6,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      georadiusbymember: {
        arity: -5,
        flags: [
          "write",
          "denyoom",
          "movablekeys"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      georadiusbymember_ro: {
        arity: -5,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      geosearch: {
        arity: -7,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      geosearchstore: {
        arity: -8,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      get: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      getbit: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      getdel: {
        arity: 2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      getex: {
        arity: -2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      getrange: {
        arity: 4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      getset: {
        arity: 3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hdel: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hello: {
        arity: -1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "no_auth",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      hexists: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hget: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hgetall: {
        arity: 2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hincrby: {
        arity: 4,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hincrbyfloat: {
        arity: 4,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hkeys: {
        arity: 2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hlen: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hmget: {
        arity: -3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hmset: {
        arity: -4,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hrandfield: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hscan: {
        arity: -3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hset: {
        arity: -4,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hsetnx: {
        arity: 4,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hstrlen: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      hvals: {
        arity: 2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      incr: {
        arity: 2,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      incrby: {
        arity: 3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      incrbyfloat: {
        arity: 3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      info: {
        arity: -1,
        flags: [
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      keys: {
        arity: 2,
        flags: [
          "readonly"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      lastsave: {
        arity: 1,
        flags: [
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      latency: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      lcs: {
        arity: -3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      lindex: {
        arity: 3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      linsert: {
        arity: 5,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      llen: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      lmove: {
        arity: 5,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      lmpop: {
        arity: -4,
        flags: [
          "write",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      lolwut: {
        arity: -1,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      lpop: {
        arity: -2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      lpos: {
        arity: -3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      lpush: {
        arity: -3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      lpushx: {
        arity: -3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      lrange: {
        arity: 4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      lrem: {
        arity: 4,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      lset: {
        arity: 4,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      ltrim: {
        arity: 4,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      memory: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      mget: {
        arity: -2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      migrate: {
        arity: -6,
        flags: [
          "write",
          "movablekeys"
        ],
        keyStart: 3,
        keyStop: 3,
        step: 1
      },
      module: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      monitor: {
        arity: 1,
        flags: [
          "admin",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      move: {
        arity: 3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      mset: {
        arity: -3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 2
      },
      msetnx: {
        arity: -3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 2
      },
      multi: {
        arity: 1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      object: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      persist: {
        arity: 2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      pexpire: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      pexpireat: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      pexpiretime: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      pfadd: {
        arity: -2,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      pfcount: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      pfdebug: {
        arity: 3,
        flags: [
          "write",
          "denyoom",
          "admin"
        ],
        keyStart: 2,
        keyStop: 2,
        step: 1
      },
      pfmerge: {
        arity: -2,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      pfselftest: {
        arity: 1,
        flags: [
          "admin"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      ping: {
        arity: -1,
        flags: [
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      psetex: {
        arity: 4,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      psubscribe: {
        arity: -2,
        flags: [
          "pubsub",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      psync: {
        arity: -3,
        flags: [
          "admin",
          "noscript",
          "no_async_loading",
          "no_multi"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      pttl: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      publish: {
        arity: 3,
        flags: [
          "pubsub",
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      pubsub: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      punsubscribe: {
        arity: -1,
        flags: [
          "pubsub",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      quit: {
        arity: -1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "no_auth",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      randomkey: {
        arity: 1,
        flags: [
          "readonly"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      readonly: {
        arity: 1,
        flags: [
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      readwrite: {
        arity: 1,
        flags: [
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      rename: {
        arity: 3,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      renamenx: {
        arity: 3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      replconf: {
        arity: -1,
        flags: [
          "admin",
          "noscript",
          "loading",
          "stale",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      replicaof: {
        arity: 3,
        flags: [
          "admin",
          "noscript",
          "stale",
          "no_async_loading"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      reset: {
        arity: 1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "no_auth",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      restore: {
        arity: -4,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      "restore-asking": {
        arity: -4,
        flags: [
          "write",
          "denyoom",
          "asking"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      role: {
        arity: 1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      rpop: {
        arity: -2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      rpoplpush: {
        arity: 3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      rpush: {
        arity: -3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      rpushx: {
        arity: -3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      sadd: {
        arity: -3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      save: {
        arity: 1,
        flags: [
          "admin",
          "noscript",
          "no_async_loading",
          "no_multi"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      scan: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      scard: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      script: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      sdiff: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      sdiffstore: {
        arity: -3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      select: {
        arity: 2,
        flags: [
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      set: {
        arity: -3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      setbit: {
        arity: 4,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      setex: {
        arity: 4,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      setnx: {
        arity: 3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      setrange: {
        arity: 4,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      shutdown: {
        arity: -1,
        flags: [
          "admin",
          "noscript",
          "loading",
          "stale",
          "no_multi",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      sinter: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      sintercard: {
        arity: -3,
        flags: [
          "readonly",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      sinterstore: {
        arity: -3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      sismember: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      slaveof: {
        arity: 3,
        flags: [
          "admin",
          "noscript",
          "stale",
          "no_async_loading"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      slowlog: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      smembers: {
        arity: 2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      smismember: {
        arity: -3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      smove: {
        arity: 4,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      sort: {
        arity: -2,
        flags: [
          "write",
          "denyoom",
          "movablekeys"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      sort_ro: {
        arity: -2,
        flags: [
          "readonly",
          "movablekeys"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      spop: {
        arity: -2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      spublish: {
        arity: 3,
        flags: [
          "pubsub",
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      srandmember: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      srem: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      sscan: {
        arity: -3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      ssubscribe: {
        arity: -2,
        flags: [
          "pubsub",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      strlen: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      subscribe: {
        arity: -2,
        flags: [
          "pubsub",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      substr: {
        arity: 4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      sunion: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      sunionstore: {
        arity: -3,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      sunsubscribe: {
        arity: -1,
        flags: [
          "pubsub",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      swapdb: {
        arity: 3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      sync: {
        arity: 1,
        flags: [
          "admin",
          "noscript",
          "no_async_loading",
          "no_multi"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      time: {
        arity: 1,
        flags: [
          "loading",
          "stale",
          "fast"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      touch: {
        arity: -2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      ttl: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      type: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      unlink: {
        arity: -2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      unsubscribe: {
        arity: -1,
        flags: [
          "pubsub",
          "noscript",
          "loading",
          "stale"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      unwatch: {
        arity: 1,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "allow_busy"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      wait: {
        arity: 3,
        flags: [
          "noscript"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      watch: {
        arity: -2,
        flags: [
          "noscript",
          "loading",
          "stale",
          "fast",
          "allow_busy"
        ],
        keyStart: 1,
        keyStop: -1,
        step: 1
      },
      xack: {
        arity: -4,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xadd: {
        arity: -5,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xautoclaim: {
        arity: -6,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xclaim: {
        arity: -6,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xdel: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xgroup: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      xinfo: {
        arity: -2,
        flags: [],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      xlen: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xpending: {
        arity: -3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xrange: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xread: {
        arity: -4,
        flags: [
          "readonly",
          "blocking",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      xreadgroup: {
        arity: -7,
        flags: [
          "write",
          "blocking",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      xrevrange: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xsetid: {
        arity: -3,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      xtrim: {
        arity: -4,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zadd: {
        arity: -4,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zcard: {
        arity: 2,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zcount: {
        arity: 4,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zdiff: {
        arity: -3,
        flags: [
          "readonly",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      zdiffstore: {
        arity: -4,
        flags: [
          "write",
          "denyoom",
          "movablekeys"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zincrby: {
        arity: 4,
        flags: [
          "write",
          "denyoom",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zinter: {
        arity: -3,
        flags: [
          "readonly",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      zintercard: {
        arity: -3,
        flags: [
          "readonly",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      zinterstore: {
        arity: -4,
        flags: [
          "write",
          "denyoom",
          "movablekeys"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zlexcount: {
        arity: 4,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zmpop: {
        arity: -4,
        flags: [
          "write",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      zmscore: {
        arity: -3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zpopmax: {
        arity: -2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zpopmin: {
        arity: -2,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrandmember: {
        arity: -2,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrange: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrangebylex: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrangebyscore: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrangestore: {
        arity: -5,
        flags: [
          "write",
          "denyoom"
        ],
        keyStart: 1,
        keyStop: 2,
        step: 1
      },
      zrank: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrem: {
        arity: -3,
        flags: [
          "write",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zremrangebylex: {
        arity: 4,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zremrangebyrank: {
        arity: 4,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zremrangebyscore: {
        arity: 4,
        flags: [
          "write"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrevrange: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrevrangebylex: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrevrangebyscore: {
        arity: -4,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zrevrank: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zscan: {
        arity: -3,
        flags: [
          "readonly"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zscore: {
        arity: 3,
        flags: [
          "readonly",
          "fast"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      },
      zunion: {
        arity: -3,
        flags: [
          "readonly",
          "movablekeys"
        ],
        keyStart: 0,
        keyStop: 0,
        step: 0
      },
      zunionstore: {
        arity: -4,
        flags: [
          "write",
          "denyoom",
          "movablekeys"
        ],
        keyStart: 1,
        keyStop: 1,
        step: 1
      }
    };
  }
});

// node_modules/@ioredis/commands/built/index.js
var require_built = __commonJS({
  "node_modules/@ioredis/commands/built/index.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getKeyIndexes = exports2.hasFlag = exports2.exists = exports2.list = void 0;
    var commands_json_1 = __importDefault(require_commands());
    exports2.list = Object.keys(commands_json_1.default);
    var flags = {};
    exports2.list.forEach((commandName) => {
      flags[commandName] = commands_json_1.default[commandName].flags.reduce(function(flags2, flag) {
        flags2[flag] = true;
        return flags2;
      }, {});
    });
    function exists(commandName) {
      return Boolean(commands_json_1.default[commandName]);
    }
    __name(exists, "exists");
    exports2.exists = exists;
    function hasFlag(commandName, flag) {
      if (!flags[commandName]) {
        throw new Error("Unknown command " + commandName);
      }
      return Boolean(flags[commandName][flag]);
    }
    __name(hasFlag, "hasFlag");
    exports2.hasFlag = hasFlag;
    function getKeyIndexes(commandName, args, options) {
      const command = commands_json_1.default[commandName];
      if (!command) {
        throw new Error("Unknown command " + commandName);
      }
      if (!Array.isArray(args)) {
        throw new Error("Expect args to be an array");
      }
      const keys = [];
      const parseExternalKey = Boolean(options && options.parseExternalKey);
      const takeDynamicKeys = /* @__PURE__ */ __name((args2, startIndex) => {
        const keys2 = [];
        const keyStop = Number(args2[startIndex]);
        for (let i = 0; i < keyStop; i++) {
          keys2.push(i + startIndex + 1);
        }
        return keys2;
      }, "takeDynamicKeys");
      const takeKeyAfterToken = /* @__PURE__ */ __name((args2, startIndex, token) => {
        for (let i = startIndex; i < args2.length - 1; i += 1) {
          if (String(args2[i]).toLowerCase() === token.toLowerCase()) {
            return i + 1;
          }
        }
        return null;
      }, "takeKeyAfterToken");
      switch (commandName) {
        case "zunionstore":
        case "zinterstore":
        case "zdiffstore":
          keys.push(0, ...takeDynamicKeys(args, 1));
          break;
        case "eval":
        case "evalsha":
        case "eval_ro":
        case "evalsha_ro":
        case "fcall":
        case "fcall_ro":
        case "blmpop":
        case "bzmpop":
          keys.push(...takeDynamicKeys(args, 1));
          break;
        case "sintercard":
        case "lmpop":
        case "zunion":
        case "zinter":
        case "zmpop":
        case "zintercard":
        case "zdiff": {
          keys.push(...takeDynamicKeys(args, 0));
          break;
        }
        case "georadius": {
          keys.push(0);
          const storeKey = takeKeyAfterToken(args, 5, "STORE");
          if (storeKey)
            keys.push(storeKey);
          const distKey = takeKeyAfterToken(args, 5, "STOREDIST");
          if (distKey)
            keys.push(distKey);
          break;
        }
        case "georadiusbymember": {
          keys.push(0);
          const storeKey = takeKeyAfterToken(args, 4, "STORE");
          if (storeKey)
            keys.push(storeKey);
          const distKey = takeKeyAfterToken(args, 4, "STOREDIST");
          if (distKey)
            keys.push(distKey);
          break;
        }
        case "sort":
        case "sort_ro":
          keys.push(0);
          for (let i = 1; i < args.length - 1; i++) {
            let arg = args[i];
            if (typeof arg !== "string") {
              continue;
            }
            const directive = arg.toUpperCase();
            if (directive === "GET") {
              i += 1;
              arg = args[i];
              if (arg !== "#") {
                if (parseExternalKey) {
                  keys.push([i, getExternalKeyNameLength(arg)]);
                } else {
                  keys.push(i);
                }
              }
            } else if (directive === "BY") {
              i += 1;
              if (parseExternalKey) {
                keys.push([i, getExternalKeyNameLength(args[i])]);
              } else {
                keys.push(i);
              }
            } else if (directive === "STORE") {
              i += 1;
              keys.push(i);
            }
          }
          break;
        case "migrate":
          if (args[2] === "") {
            for (let i = 5; i < args.length - 1; i++) {
              const arg = args[i];
              if (typeof arg === "string" && arg.toUpperCase() === "KEYS") {
                for (let j = i + 1; j < args.length; j++) {
                  keys.push(j);
                }
                break;
              }
            }
          } else {
            keys.push(2);
          }
          break;
        case "xreadgroup":
        case "xread":
          for (let i = commandName === "xread" ? 0 : 3; i < args.length - 1; i++) {
            if (String(args[i]).toUpperCase() === "STREAMS") {
              for (let j = i + 1; j <= i + (args.length - 1 - i) / 2; j++) {
                keys.push(j);
              }
              break;
            }
          }
          break;
        default:
          if (command.step > 0) {
            const keyStart = command.keyStart - 1;
            const keyStop = command.keyStop > 0 ? command.keyStop : args.length + command.keyStop + 1;
            for (let i = keyStart; i < keyStop; i += command.step) {
              keys.push(i);
            }
          }
          break;
      }
      return keys;
    }
    __name(getKeyIndexes, "getKeyIndexes");
    exports2.getKeyIndexes = getKeyIndexes;
    function getExternalKeyNameLength(key) {
      if (typeof key !== "string") {
        key = String(key);
      }
      const hashPos = key.indexOf("->");
      return hashPos === -1 ? key.length : hashPos;
    }
    __name(getExternalKeyNameLength, "getExternalKeyNameLength");
  }
});

// node-built-in-modules:events
import libDefault from "events";
var require_events = __commonJS({
  "node-built-in-modules:events"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = libDefault;
  }
});

// node_modules/standard-as-callback/built/utils.js
var require_utils = __commonJS({
  "node_modules/standard-as-callback/built/utils.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.tryCatch = exports2.errorObj = void 0;
    exports2.errorObj = { e: {} };
    var tryCatchTarget;
    function tryCatcher(err, val) {
      try {
        const target = tryCatchTarget;
        tryCatchTarget = null;
        return target.apply(this, arguments);
      } catch (e) {
        exports2.errorObj.e = e;
        return exports2.errorObj;
      }
    }
    __name(tryCatcher, "tryCatcher");
    function tryCatch(fn2) {
      tryCatchTarget = fn2;
      return tryCatcher;
    }
    __name(tryCatch, "tryCatch");
    exports2.tryCatch = tryCatch;
  }
});

// node_modules/standard-as-callback/built/index.js
var require_built2 = __commonJS({
  "node_modules/standard-as-callback/built/index.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils_1 = require_utils();
    function throwLater(e) {
      setTimeout(function() {
        throw e;
      }, 0);
    }
    __name(throwLater, "throwLater");
    function asCallback(promise, nodeback, options) {
      if (typeof nodeback === "function") {
        promise.then((val) => {
          let ret;
          if (options !== void 0 && Object(options).spread && Array.isArray(val)) {
            ret = utils_1.tryCatch(nodeback).apply(void 0, [null].concat(val));
          } else {
            ret = val === void 0 ? utils_1.tryCatch(nodeback)(null) : utils_1.tryCatch(nodeback)(null, val);
          }
          if (ret === utils_1.errorObj) {
            throwLater(ret.e);
          }
        }, (cause) => {
          if (!cause) {
            const newReason = new Error(cause + "");
            Object.assign(newReason, { cause });
            cause = newReason;
          }
          const ret = utils_1.tryCatch(nodeback)(cause);
          if (ret === utils_1.errorObj) {
            throwLater(ret.e);
          }
        });
      }
      return promise;
    }
    __name(asCallback, "asCallback");
    exports2.default = asCallback;
  }
});

// node-built-in-modules:assert
import libDefault2 from "assert";
var require_assert = __commonJS({
  "node-built-in-modules:assert"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = libDefault2;
  }
});

// node_modules/unenv/runtime/npm/inherits.mjs
function inherits(ctor, superCtor) {
  if (!superCtor) {
    return;
  }
  ctor.super_ = superCtor;
  ctor.prototype = Object.create(superCtor.prototype, {
    constructor: {
      value: ctor,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
}
var init_inherits = __esm({
  "node_modules/unenv/runtime/npm/inherits.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    __name(inherits, "inherits");
  }
});

// node_modules/unenv/runtime/node/util/internal/legacy-types.mjs
var legacy_types_exports = {};
__export(legacy_types_exports, {
  isArray: () => isArray,
  isBoolean: () => isBoolean,
  isBuffer: () => isBuffer,
  isDate: () => isDate,
  isDeepStrictEqual: () => isDeepStrictEqual,
  isError: () => isError,
  isFunction: () => isFunction,
  isNull: () => isNull,
  isNullOrUndefined: () => isNullOrUndefined,
  isNumber: () => isNumber,
  isObject: () => isObject,
  isPrimitive: () => isPrimitive,
  isRegExp: () => isRegExp,
  isString: () => isString,
  isSymbol: () => isSymbol,
  isUndefined: () => isUndefined
});
var isRegExp, isDate, isArray, isBoolean, isNull, isNullOrUndefined, isNumber, isString, isSymbol, isUndefined, isFunction, isBuffer, isDeepStrictEqual, isObject, isError, isPrimitive;
var init_legacy_types = __esm({
  "node_modules/unenv/runtime/node/util/internal/legacy-types.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    isRegExp = /* @__PURE__ */ __name((val) => val instanceof RegExp, "isRegExp");
    isDate = /* @__PURE__ */ __name((val) => val instanceof Date, "isDate");
    isArray = /* @__PURE__ */ __name((val) => Array.isArray(val), "isArray");
    isBoolean = /* @__PURE__ */ __name((val) => typeof val === "boolean", "isBoolean");
    isNull = /* @__PURE__ */ __name((val) => val === null, "isNull");
    isNullOrUndefined = /* @__PURE__ */ __name((val) => val === null || val === void 0, "isNullOrUndefined");
    isNumber = /* @__PURE__ */ __name((val) => typeof val === "number", "isNumber");
    isString = /* @__PURE__ */ __name((val) => typeof val === "string", "isString");
    isSymbol = /* @__PURE__ */ __name((val) => typeof val === "symbol", "isSymbol");
    isUndefined = /* @__PURE__ */ __name((val) => val === void 0, "isUndefined");
    isFunction = /* @__PURE__ */ __name((val) => typeof val === "function", "isFunction");
    isBuffer = /* @__PURE__ */ __name((val) => {
      return val && typeof val === "object" && typeof val.copy === "function" && typeof val.fill === "function" && typeof val.readUInt8 === "function";
    }, "isBuffer");
    isDeepStrictEqual = /* @__PURE__ */ __name((a, b) => JSON.stringify(a) === JSON.stringify(b), "isDeepStrictEqual");
    isObject = /* @__PURE__ */ __name((val) => val !== null && typeof val === "object" && // eslint-disable-next-line no-prototype-builtins
    Object.getPrototypeOf(val).isPrototypeOf(Object), "isObject");
    isError = /* @__PURE__ */ __name((val) => val instanceof Error, "isError");
    isPrimitive = /* @__PURE__ */ __name((val) => {
      if (typeof val === "object") {
        return val === null;
      }
      return typeof val !== "function";
    }, "isPrimitive");
  }
});

// node_modules/unenv/runtime/node/util/internal/log.mjs
var log_exports = {};
__export(log_exports, {
  debug: () => debug3,
  debuglog: () => debuglog,
  format: () => format,
  formatWithOptions: () => formatWithOptions,
  inspect: () => inspect,
  log: () => log3
});
function _format(fmt, ...args) {
  const re = /(%?)(%([djos]))/g;
  if (args.length > 0) {
    fmt = fmt.replace(re, (match, escaped, ptn, flag) => {
      let arg = args.shift();
      switch (flag) {
        case "o":
          if (Array.isArray(arg)) {
            arg = JSON.stringify(arg);
            break;
          }
          break;
        case "s":
          arg = "" + arg;
          break;
        case "d":
          arg = Number(arg);
          break;
        case "j":
          arg = JSON.stringify(arg);
          break;
      }
      if (!escaped) {
        return arg;
      }
      args.unshift(arg);
      return match;
    });
  }
  if (args.length > 0) {
    fmt += " " + args.join(" ");
  }
  fmt = fmt.replace(/%{2}/g, "%");
  return "" + fmt;
}
var log3, debuglog, debug3, inspect, format, formatWithOptions;
var init_log = __esm({
  "node_modules/unenv/runtime/node/util/internal/log.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    log3 = /* @__PURE__ */ __name((...args) => {
      console.log(...args);
    }, "log");
    debuglog = /* @__PURE__ */ __name((section, _cb) => {
      const fn2 = /* @__PURE__ */ __name((msg, ...params) => {
        if (fn2.enabled) {
          console.debug(`[${section}] ${msg}`, ...params);
        }
      }, "fn");
      fn2.enabled = true;
      return fn2;
    }, "debuglog");
    debug3 = debuglog;
    inspect = /* @__PURE__ */ __name((object) => JSON.stringify(object, null, 2), "inspect");
    format = /* @__PURE__ */ __name((...args) => _format(...args), "format");
    formatWithOptions = /* @__PURE__ */ __name((_options, ...args) => _format(...args), "formatWithOptions");
    __name(_format, "_format");
  }
});

// node_modules/unenv/runtime/node/util/internal/types.mjs
var types_exports = {};
__export(types_exports, {
  isAnyArrayBuffer: () => isAnyArrayBuffer,
  isArgumentsObject: () => isArgumentsObject,
  isArrayBuffer: () => isArrayBuffer,
  isArrayBufferView: () => isArrayBufferView,
  isAsyncFunction: () => isAsyncFunction,
  isBigInt64Array: () => isBigInt64Array,
  isBigIntObject: () => isBigIntObject,
  isBigUint64Array: () => isBigUint64Array,
  isBooleanObject: () => isBooleanObject,
  isBoxedPrimitive: () => isBoxedPrimitive,
  isCryptoKey: () => isCryptoKey,
  isDataView: () => isDataView,
  isDate: () => isDate2,
  isExternal: () => isExternal,
  isFloat32Array: () => isFloat32Array,
  isFloat64Array: () => isFloat64Array,
  isGeneratorFunction: () => isGeneratorFunction,
  isGeneratorObject: () => isGeneratorObject,
  isInt16Array: () => isInt16Array,
  isInt32Array: () => isInt32Array,
  isInt8Array: () => isInt8Array,
  isKeyObject: () => isKeyObject,
  isMap: () => isMap,
  isMapIterator: () => isMapIterator,
  isModuleNamespaceObject: () => isModuleNamespaceObject,
  isNativeError: () => isNativeError,
  isNumberObject: () => isNumberObject,
  isPromise: () => isPromise,
  isProxy: () => isProxy,
  isRegExp: () => isRegExp2,
  isSet: () => isSet,
  isSetIterator: () => isSetIterator,
  isSharedArrayBuffer: () => isSharedArrayBuffer,
  isStringObject: () => isStringObject,
  isSymbolObject: () => isSymbolObject,
  isTypedArray: () => isTypedArray,
  isUint16Array: () => isUint16Array,
  isUint32Array: () => isUint32Array,
  isUint8Array: () => isUint8Array,
  isUint8ClampedArray: () => isUint8ClampedArray,
  isWeakMap: () => isWeakMap,
  isWeakSet: () => isWeakSet
});
var isExternal, isDate2, isArgumentsObject, isBigIntObject, isBooleanObject, isNumberObject, isStringObject, isSymbolObject, isNativeError, isRegExp2, isAsyncFunction, isGeneratorFunction, isGeneratorObject, isPromise, isMap, isSet, isMapIterator, isSetIterator, isWeakMap, isWeakSet, isArrayBuffer, isDataView, isSharedArrayBuffer, isProxy, isModuleNamespaceObject, isAnyArrayBuffer, isBoxedPrimitive, isArrayBufferView, isTypedArray, isUint8Array, isUint8ClampedArray, isUint16Array, isUint32Array, isInt8Array, isInt16Array, isInt32Array, isFloat32Array, isFloat64Array, isBigInt64Array, isBigUint64Array, isKeyObject, isCryptoKey;
var init_types = __esm({
  "node_modules/unenv/runtime/node/util/internal/types.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    isExternal = /* @__PURE__ */ __name((_obj) => false, "isExternal");
    isDate2 = /* @__PURE__ */ __name((val) => val instanceof Date, "isDate");
    isArgumentsObject = notImplemented("util.types.isArgumentsObject");
    isBigIntObject = /* @__PURE__ */ __name((val) => val instanceof BigInt, "isBigIntObject");
    isBooleanObject = /* @__PURE__ */ __name((val) => val instanceof Boolean, "isBooleanObject");
    isNumberObject = /* @__PURE__ */ __name((val) => val instanceof Number, "isNumberObject");
    isStringObject = /* @__PURE__ */ __name((val) => val instanceof String, "isStringObject");
    isSymbolObject = /* @__PURE__ */ __name((val) => val instanceof Symbol, "isSymbolObject");
    isNativeError = notImplemented(
      "util.types.isNativeError"
    );
    isRegExp2 = /* @__PURE__ */ __name((val) => val instanceof RegExp, "isRegExp");
    isAsyncFunction = notImplemented(
      "util.types.isAsyncFunction"
    );
    isGeneratorFunction = notImplemented("util.types.isGeneratorFunction");
    isGeneratorObject = notImplemented("util.types.isGeneratorObject");
    isPromise = /* @__PURE__ */ __name((val) => val instanceof Promise, "isPromise");
    isMap = /* @__PURE__ */ __name((val) => val instanceof Map, "isMap");
    isSet = /* @__PURE__ */ __name((val) => val instanceof Set, "isSet");
    isMapIterator = notImplemented(
      "util.types.isMapIterator"
    );
    isSetIterator = notImplemented(
      "util.types.isSetIterator"
    );
    isWeakMap = /* @__PURE__ */ __name((val) => val instanceof WeakMap, "isWeakMap");
    isWeakSet = /* @__PURE__ */ __name((val) => val instanceof WeakSet, "isWeakSet");
    isArrayBuffer = /* @__PURE__ */ __name((val) => val instanceof ArrayBuffer, "isArrayBuffer");
    isDataView = /* @__PURE__ */ __name((val) => val instanceof DataView, "isDataView");
    isSharedArrayBuffer = /* @__PURE__ */ __name((val) => val instanceof SharedArrayBuffer, "isSharedArrayBuffer");
    isProxy = notImplemented("util.types.isProxy");
    isModuleNamespaceObject = notImplemented("util.types.isModuleNamespaceObject");
    isAnyArrayBuffer = notImplemented("util.types.isAnyArrayBuffer");
    isBoxedPrimitive = notImplemented("util.types.isBoxedPrimitive");
    isArrayBufferView = notImplemented("util.types.isArrayBufferView");
    isTypedArray = notImplemented(
      "util.types.isTypedArray"
    );
    isUint8Array = notImplemented(
      "util.types.isUint8Array"
    );
    isUint8ClampedArray = notImplemented("util.types.isUint8ClampedArray");
    isUint16Array = notImplemented(
      "util.types.isUint16Array"
    );
    isUint32Array = notImplemented(
      "util.types.isUint32Array"
    );
    isInt8Array = notImplemented(
      "util.types.isInt8Array"
    );
    isInt16Array = notImplemented(
      "util.types.isInt16Array"
    );
    isInt32Array = notImplemented(
      "util.types.isInt32Array"
    );
    isFloat32Array = notImplemented(
      "util.types.isFloat32Array"
    );
    isFloat64Array = notImplemented(
      "util.types.isFloat64Array"
    );
    isBigInt64Array = notImplemented(
      "util.types.isBigInt64Array"
    );
    isBigUint64Array = notImplemented("util.types.isBigUint64Array");
    isKeyObject = notImplemented(
      "util.types.isKeyObject"
    );
    isCryptoKey = notImplemented(
      "util.types.isCryptoKey"
    );
  }
});

// node_modules/unenv/runtime/node/util/types/index.mjs
var types_default;
var init_types2 = __esm({
  "node_modules/unenv/runtime/node/util/types/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_types();
    init_types();
    types_default = types_exports;
  }
});

// node_modules/unenv/runtime/node/util/internal/promisify.mjs
function _promisify(fn2) {
  if (fn2[customSymbol]) {
    return fn2[customSymbol];
  }
  return function(...args) {
    return new Promise((resolve, reject) => {
      try {
        fn2.call(this, ...args, (err, val) => {
          if (err) {
            return reject(err);
          }
          resolve(val);
        });
      } catch (error3) {
        reject(error3);
      }
    });
  };
}
var customSymbol, promisify;
var init_promisify = __esm({
  "node_modules/unenv/runtime/node/util/internal/promisify.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    customSymbol = Symbol("customPromisify");
    __name(_promisify, "_promisify");
    _promisify.custom = customSymbol;
    promisify = _promisify;
  }
});

// node_modules/unenv/runtime/node/util/internal/mime.mjs
var mime_exports = {};
__export(mime_exports, {
  MIMEParams: () => MIMEParams,
  MIMEType: () => MIMEType
});
var MIMEType, MIMEParams;
var init_mime = __esm({
  "node_modules/unenv/runtime/node/util/internal/mime.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    MIMEType = class {
      __unenv__ = true;
      params = new MIMEParams();
      type;
      subtype;
      constructor(input) {
        const [essence = "", ...params] = String(input).split(";");
        const [type = "", subtype = ""] = essence.split("/");
        this.type = type;
        this.subtype = subtype;
        this.params = new MIMEParams();
        for (const param of params) {
          const [name, value] = param.split("=");
          this.params.set(name, value);
        }
      }
      get essence() {
        return this.type + "/" + this.subtype;
      }
      toString() {
        const paramsStr = this.params.toString();
        return this.essence + (paramsStr ? `;${paramsStr}` : "");
      }
    };
    __name(MIMEType, "MIMEType");
    MIMEParams = class extends Map {
      __unenv__ = true;
      get(name) {
        return super.get(name) || null;
      }
      toString() {
        return [...this.entries()].map(([name, value]) => `${name}=${value}`).join("&");
      }
    };
    __name(MIMEParams, "MIMEParams");
  }
});

// node_modules/unenv/runtime/node/util/index.mjs
var TextDecoder, TextEncoder2, deprecate, _errnoException, _exceptionWithHostPort, _extend, aborted, callbackify, getSystemErrorMap, getSystemErrorName, toUSVString, stripVTControlCharacters, transferableAbortController, transferableAbortSignal, parseArgs, parseEnv, styleText, getCallSite, util_default;
var init_util = __esm({
  "node_modules/unenv/runtime/node/util/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_inherits();
    init_legacy_types();
    init_log();
    init_types2();
    init_promisify();
    init_mime();
    init_mime();
    init_legacy_types();
    init_log();
    TextDecoder = globalThis.TextDecoder;
    TextEncoder2 = globalThis.TextEncoder;
    deprecate = /* @__PURE__ */ __name((fn2) => fn2, "deprecate");
    _errnoException = notImplemented("util._errnoException");
    _exceptionWithHostPort = notImplemented(
      "util._exceptionWithHostPort"
    );
    _extend = notImplemented("util._extend");
    aborted = notImplemented("util.aborted");
    callbackify = notImplemented("util.callbackify");
    getSystemErrorMap = notImplemented(
      "util.getSystemErrorMap"
    );
    getSystemErrorName = notImplemented("util.getSystemErrorName");
    toUSVString = notImplemented("util.toUSVString");
    stripVTControlCharacters = notImplemented("util.stripVTControlCharacters");
    transferableAbortController = notImplemented("util.transferableAbortController");
    transferableAbortSignal = notImplemented("util.transferableAbortSignal");
    parseArgs = notImplemented("util.parseArgs");
    parseEnv = notImplemented("util.parseEnv");
    styleText = notImplemented("util.styleText");
    getCallSite = notImplemented("util.getCallSites");
    util_default = {
      _errnoException,
      _exceptionWithHostPort,
      _extend,
      aborted,
      callbackify,
      deprecate,
      getCallSite,
      getSystemErrorMap,
      getSystemErrorName,
      inherits,
      promisify,
      stripVTControlCharacters,
      toUSVString,
      TextDecoder,
      TextEncoder: TextEncoder2,
      types: types_default,
      transferableAbortController,
      transferableAbortSignal,
      parseArgs,
      parseEnv,
      styleText,
      ...mime_exports,
      ...log_exports,
      ...legacy_types_exports
    };
  }
});

// node_modules/unenv/runtime/node/util/$cloudflare.mjs
var workerdUtil, MIMEParams2, MIMEType2, TextDecoder2, TextEncoder3, _extend2, aborted2, callbackify2, debug4, debuglog2, deprecate2, format2, formatWithOptions2, getCallSite2, inherits2, inspect2, log4, parseArgs2, promisify2, stripVTControlCharacters2, toUSVString2, transferableAbortController2, transferableAbortSignal2, types, cloudflare_default3;
var init_cloudflare4 = __esm({
  "node_modules/unenv/runtime/node/util/$cloudflare.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_util();
    workerdUtil = process.getBuiltinModule("node:util");
    ({
      MIMEParams: MIMEParams2,
      MIMEType: MIMEType2,
      TextDecoder: TextDecoder2,
      TextEncoder: TextEncoder3,
      _extend: (
        // @ts-expect-error missing types?
        _extend2
      ),
      aborted: aborted2,
      callbackify: callbackify2,
      debug: debug4,
      debuglog: debuglog2,
      deprecate: deprecate2,
      format: format2,
      formatWithOptions: formatWithOptions2,
      getCallSite: getCallSite2,
      inherits: inherits2,
      inspect: inspect2,
      log: log4,
      parseArgs: parseArgs2,
      promisify: promisify2,
      stripVTControlCharacters: stripVTControlCharacters2,
      toUSVString: toUSVString2,
      transferableAbortController: transferableAbortController2,
      transferableAbortSignal: transferableAbortSignal2
    } = workerdUtil);
    types = workerdUtil.types;
    cloudflare_default3 = {
      /**
       * manually unroll unenv-polyfilled-symbols to make it tree-shakeable
       */
      // @ts-expect-error undocumented public API
      _errnoException,
      _exceptionWithHostPort,
      getSystemErrorMap,
      getSystemErrorName,
      isArray,
      isBoolean,
      isBuffer,
      isDate,
      isDeepStrictEqual,
      isError,
      isFunction,
      isNull,
      isNullOrUndefined,
      isNumber,
      isObject,
      isPrimitive,
      isRegExp,
      isString,
      isSymbol,
      isUndefined,
      parseEnv,
      styleText,
      /**
       * manually unroll workerd-polyfilled-symbols to make it tree-shakeable
       */
      MIMEParams: MIMEParams2,
      MIMEType: MIMEType2,
      TextDecoder: TextDecoder2,
      TextEncoder: TextEncoder3,
      _extend: _extend2,
      aborted: aborted2,
      callbackify: callbackify2,
      debug: debug4,
      debuglog: debuglog2,
      deprecate: deprecate2,
      format: format2,
      formatWithOptions: formatWithOptions2,
      getCallSite: getCallSite2,
      inherits: inherits2,
      inspect: inspect2,
      log: log4,
      parseArgs: parseArgs2,
      promisify: promisify2,
      stripVTControlCharacters: stripVTControlCharacters2,
      toUSVString: toUSVString2,
      transferableAbortController: transferableAbortController2,
      transferableAbortSignal: transferableAbortSignal2,
      // special-cased deep merged symbols
      types
    };
  }
});

// node-built-in-modules:util
var require_util = __commonJS({
  "node-built-in-modules:util"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_cloudflare4();
    module.exports = cloudflare_default3;
  }
});

// node_modules/redis-errors/lib/old.js
var require_old = __commonJS({
  "node_modules/redis-errors/lib/old.js"(exports2, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var assert4 = require_assert();
    var util = require_util();
    function RedisError(message) {
      Object.defineProperty(this, "message", {
        value: message || "",
        configurable: true,
        writable: true
      });
      Error.captureStackTrace(this, this.constructor);
    }
    __name(RedisError, "RedisError");
    util.inherits(RedisError, Error);
    Object.defineProperty(RedisError.prototype, "name", {
      value: "RedisError",
      configurable: true,
      writable: true
    });
    function ParserError(message, buffer, offset) {
      assert4(buffer);
      assert4.strictEqual(typeof offset, "number");
      Object.defineProperty(this, "message", {
        value: message || "",
        configurable: true,
        writable: true
      });
      const tmp = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;
      Error.captureStackTrace(this, this.constructor);
      Error.stackTraceLimit = tmp;
      this.offset = offset;
      this.buffer = buffer;
    }
    __name(ParserError, "ParserError");
    util.inherits(ParserError, RedisError);
    Object.defineProperty(ParserError.prototype, "name", {
      value: "ParserError",
      configurable: true,
      writable: true
    });
    function ReplyError(message) {
      Object.defineProperty(this, "message", {
        value: message || "",
        configurable: true,
        writable: true
      });
      const tmp = Error.stackTraceLimit;
      Error.stackTraceLimit = 2;
      Error.captureStackTrace(this, this.constructor);
      Error.stackTraceLimit = tmp;
    }
    __name(ReplyError, "ReplyError");
    util.inherits(ReplyError, RedisError);
    Object.defineProperty(ReplyError.prototype, "name", {
      value: "ReplyError",
      configurable: true,
      writable: true
    });
    function AbortError(message) {
      Object.defineProperty(this, "message", {
        value: message || "",
        configurable: true,
        writable: true
      });
      Error.captureStackTrace(this, this.constructor);
    }
    __name(AbortError, "AbortError");
    util.inherits(AbortError, RedisError);
    Object.defineProperty(AbortError.prototype, "name", {
      value: "AbortError",
      configurable: true,
      writable: true
    });
    function InterruptError(message) {
      Object.defineProperty(this, "message", {
        value: message || "",
        configurable: true,
        writable: true
      });
      Error.captureStackTrace(this, this.constructor);
    }
    __name(InterruptError, "InterruptError");
    util.inherits(InterruptError, AbortError);
    Object.defineProperty(InterruptError.prototype, "name", {
      value: "InterruptError",
      configurable: true,
      writable: true
    });
    module.exports = {
      RedisError,
      ParserError,
      ReplyError,
      AbortError,
      InterruptError
    };
  }
});

// node_modules/redis-errors/lib/modern.js
var require_modern = __commonJS({
  "node_modules/redis-errors/lib/modern.js"(exports2, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var assert4 = require_assert();
    var RedisError = class extends Error {
      get name() {
        return this.constructor.name;
      }
    };
    __name(RedisError, "RedisError");
    var ParserError = class extends RedisError {
      constructor(message, buffer, offset) {
        assert4(buffer);
        assert4.strictEqual(typeof offset, "number");
        const tmp = Error.stackTraceLimit;
        Error.stackTraceLimit = 2;
        super(message);
        Error.stackTraceLimit = tmp;
        this.offset = offset;
        this.buffer = buffer;
      }
      get name() {
        return this.constructor.name;
      }
    };
    __name(ParserError, "ParserError");
    var ReplyError = class extends RedisError {
      constructor(message) {
        const tmp = Error.stackTraceLimit;
        Error.stackTraceLimit = 2;
        super(message);
        Error.stackTraceLimit = tmp;
      }
      get name() {
        return this.constructor.name;
      }
    };
    __name(ReplyError, "ReplyError");
    var AbortError = class extends RedisError {
      get name() {
        return this.constructor.name;
      }
    };
    __name(AbortError, "AbortError");
    var InterruptError = class extends AbortError {
      get name() {
        return this.constructor.name;
      }
    };
    __name(InterruptError, "InterruptError");
    module.exports = {
      RedisError,
      ParserError,
      ReplyError,
      AbortError,
      InterruptError
    };
  }
});

// node_modules/redis-errors/index.js
var require_redis_errors = __commonJS({
  "node_modules/redis-errors/index.js"(exports2, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var Errors = process.version.charCodeAt(1) < 55 && process.version.charCodeAt(2) === 46 ? require_old() : require_modern();
    module.exports = Errors;
  }
});

// node_modules/cluster-key-slot/lib/index.js
var require_lib = __commonJS({
  "node_modules/cluster-key-slot/lib/index.js"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var lookup = [
      0,
      4129,
      8258,
      12387,
      16516,
      20645,
      24774,
      28903,
      33032,
      37161,
      41290,
      45419,
      49548,
      53677,
      57806,
      61935,
      4657,
      528,
      12915,
      8786,
      21173,
      17044,
      29431,
      25302,
      37689,
      33560,
      45947,
      41818,
      54205,
      50076,
      62463,
      58334,
      9314,
      13379,
      1056,
      5121,
      25830,
      29895,
      17572,
      21637,
      42346,
      46411,
      34088,
      38153,
      58862,
      62927,
      50604,
      54669,
      13907,
      9842,
      5649,
      1584,
      30423,
      26358,
      22165,
      18100,
      46939,
      42874,
      38681,
      34616,
      63455,
      59390,
      55197,
      51132,
      18628,
      22757,
      26758,
      30887,
      2112,
      6241,
      10242,
      14371,
      51660,
      55789,
      59790,
      63919,
      35144,
      39273,
      43274,
      47403,
      23285,
      19156,
      31415,
      27286,
      6769,
      2640,
      14899,
      10770,
      56317,
      52188,
      64447,
      60318,
      39801,
      35672,
      47931,
      43802,
      27814,
      31879,
      19684,
      23749,
      11298,
      15363,
      3168,
      7233,
      60846,
      64911,
      52716,
      56781,
      44330,
      48395,
      36200,
      40265,
      32407,
      28342,
      24277,
      20212,
      15891,
      11826,
      7761,
      3696,
      65439,
      61374,
      57309,
      53244,
      48923,
      44858,
      40793,
      36728,
      37256,
      33193,
      45514,
      41451,
      53516,
      49453,
      61774,
      57711,
      4224,
      161,
      12482,
      8419,
      20484,
      16421,
      28742,
      24679,
      33721,
      37784,
      41979,
      46042,
      49981,
      54044,
      58239,
      62302,
      689,
      4752,
      8947,
      13010,
      16949,
      21012,
      25207,
      29270,
      46570,
      42443,
      38312,
      34185,
      62830,
      58703,
      54572,
      50445,
      13538,
      9411,
      5280,
      1153,
      29798,
      25671,
      21540,
      17413,
      42971,
      47098,
      34713,
      38840,
      59231,
      63358,
      50973,
      55100,
      9939,
      14066,
      1681,
      5808,
      26199,
      30326,
      17941,
      22068,
      55628,
      51565,
      63758,
      59695,
      39368,
      35305,
      47498,
      43435,
      22596,
      18533,
      30726,
      26663,
      6336,
      2273,
      14466,
      10403,
      52093,
      56156,
      60223,
      64286,
      35833,
      39896,
      43963,
      48026,
      19061,
      23124,
      27191,
      31254,
      2801,
      6864,
      10931,
      14994,
      64814,
      60687,
      56684,
      52557,
      48554,
      44427,
      40424,
      36297,
      31782,
      27655,
      23652,
      19525,
      15522,
      11395,
      7392,
      3265,
      61215,
      65342,
      53085,
      57212,
      44955,
      49082,
      36825,
      40952,
      28183,
      32310,
      20053,
      24180,
      11923,
      16050,
      3793,
      7920
    ];
    var toUTF8Array = /* @__PURE__ */ __name(function toUTF8Array2(str) {
      var char;
      var i = 0;
      var p = 0;
      var utf8 = [];
      var len = str.length;
      for (; i < len; i++) {
        char = str.charCodeAt(i);
        if (char < 128) {
          utf8[p++] = char;
        } else if (char < 2048) {
          utf8[p++] = char >> 6 | 192;
          utf8[p++] = char & 63 | 128;
        } else if ((char & 64512) === 55296 && i + 1 < str.length && (str.charCodeAt(i + 1) & 64512) === 56320) {
          char = 65536 + ((char & 1023) << 10) + (str.charCodeAt(++i) & 1023);
          utf8[p++] = char >> 18 | 240;
          utf8[p++] = char >> 12 & 63 | 128;
          utf8[p++] = char >> 6 & 63 | 128;
          utf8[p++] = char & 63 | 128;
        } else {
          utf8[p++] = char >> 12 | 224;
          utf8[p++] = char >> 6 & 63 | 128;
          utf8[p++] = char & 63 | 128;
        }
      }
      return utf8;
    }, "toUTF8Array");
    var generate = module.exports = /* @__PURE__ */ __name(function generate2(str) {
      var char;
      var i = 0;
      var start = -1;
      var result = 0;
      var resultHash = 0;
      var utf8 = typeof str === "string" ? toUTF8Array(str) : str;
      var len = utf8.length;
      while (i < len) {
        char = utf8[i++];
        if (start === -1) {
          if (char === 123) {
            start = i;
          }
        } else if (char !== 125) {
          resultHash = lookup[(char ^ resultHash >> 8) & 255] ^ resultHash << 8;
        } else if (i - 1 !== start) {
          return resultHash & 16383;
        }
        result = lookup[(char ^ result >> 8) & 255] ^ result << 8;
      }
      return result & 16383;
    }, "generate");
    module.exports.generateMulti = /* @__PURE__ */ __name(function generateMulti(keys) {
      var i = 1;
      var len = keys.length;
      var base = generate(keys[0]);
      while (i < len) {
        if (generate(keys[i++]) !== base)
          return -1;
      }
      return base;
    }, "generateMulti");
  }
});

// node-built-in-modules:url
import libDefault3 from "url";
var require_url = __commonJS({
  "node-built-in-modules:url"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = libDefault3;
  }
});

// node_modules/lodash.defaults/index.js
var require_lodash = __commonJS({
  "node_modules/lodash.defaults/index.js"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var MAX_SAFE_INTEGER = 9007199254740991;
    var argsTag = "[object Arguments]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var reIsUint = /^(?:0|[1-9]\d*)$/;
    function apply(func, thisArg, args) {
      switch (args.length) {
        case 0:
          return func.call(thisArg);
        case 1:
          return func.call(thisArg, args[0]);
        case 2:
          return func.call(thisArg, args[0], args[1]);
        case 3:
          return func.call(thisArg, args[0], args[1], args[2]);
      }
      return func.apply(thisArg, args);
    }
    __name(apply, "apply");
    function baseTimes(n, iteratee) {
      var index = -1, result = Array(n);
      while (++index < n) {
        result[index] = iteratee(index);
      }
      return result;
    }
    __name(baseTimes, "baseTimes");
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    var nativeMax = Math.max;
    function arrayLikeKeys(value, inherited) {
      var result = isArray2(value) || isArguments(value) ? baseTimes(value.length, String) : [];
      var length = result.length, skipIndexes = !!length;
      for (var key in value) {
        if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (key == "length" || isIndex(key, length)))) {
          result.push(key);
        }
      }
      return result;
    }
    __name(arrayLikeKeys, "arrayLikeKeys");
    function assignInDefaults(objValue, srcValue, key, object) {
      if (objValue === void 0 || eq(objValue, objectProto[key]) && !hasOwnProperty.call(object, key)) {
        return srcValue;
      }
      return objValue;
    }
    __name(assignInDefaults, "assignInDefaults");
    function assignValue(object, key, value) {
      var objValue = object[key];
      if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
        object[key] = value;
      }
    }
    __name(assignValue, "assignValue");
    function baseKeysIn(object) {
      if (!isObject2(object)) {
        return nativeKeysIn(object);
      }
      var isProto = isPrototype(object), result = [];
      for (var key in object) {
        if (!(key == "constructor" && (isProto || !hasOwnProperty.call(object, key)))) {
          result.push(key);
        }
      }
      return result;
    }
    __name(baseKeysIn, "baseKeysIn");
    function baseRest(func, start) {
      start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
      return function() {
        var args = arguments, index = -1, length = nativeMax(args.length - start, 0), array = Array(length);
        while (++index < length) {
          array[index] = args[start + index];
        }
        index = -1;
        var otherArgs = Array(start + 1);
        while (++index < start) {
          otherArgs[index] = args[index];
        }
        otherArgs[start] = array;
        return apply(func, this, otherArgs);
      };
    }
    __name(baseRest, "baseRest");
    function copyObject(source, props, object, customizer) {
      object || (object = {});
      var index = -1, length = props.length;
      while (++index < length) {
        var key = props[index];
        var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
        assignValue(object, key, newValue === void 0 ? source[key] : newValue);
      }
      return object;
    }
    __name(copyObject, "copyObject");
    function createAssigner(assigner) {
      return baseRest(function(object, sources) {
        var index = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard = length > 2 ? sources[2] : void 0;
        customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
        if (guard && isIterateeCall(sources[0], sources[1], guard)) {
          customizer = length < 3 ? void 0 : customizer;
          length = 1;
        }
        object = Object(object);
        while (++index < length) {
          var source = sources[index];
          if (source) {
            assigner(object, source, index, customizer);
          }
        }
        return object;
      });
    }
    __name(createAssigner, "createAssigner");
    function isIndex(value, length) {
      length = length == null ? MAX_SAFE_INTEGER : length;
      return !!length && (typeof value == "number" || reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
    }
    __name(isIndex, "isIndex");
    function isIterateeCall(value, index, object) {
      if (!isObject2(object)) {
        return false;
      }
      var type = typeof index;
      if (type == "number" ? isArrayLike(object) && isIndex(index, object.length) : type == "string" && index in object) {
        return eq(object[index], value);
      }
      return false;
    }
    __name(isIterateeCall, "isIterateeCall");
    function isPrototype(value) {
      var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto;
      return value === proto;
    }
    __name(isPrototype, "isPrototype");
    function nativeKeysIn(object) {
      var result = [];
      if (object != null) {
        for (var key in Object(object)) {
          result.push(key);
        }
      }
      return result;
    }
    __name(nativeKeysIn, "nativeKeysIn");
    function eq(value, other) {
      return value === other || value !== value && other !== other;
    }
    __name(eq, "eq");
    function isArguments(value) {
      return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    __name(isArguments, "isArguments");
    var isArray2 = Array.isArray;
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction2(value);
    }
    __name(isArrayLike, "isArrayLike");
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    __name(isArrayLikeObject, "isArrayLikeObject");
    function isFunction2(value) {
      var tag = isObject2(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }
    __name(isFunction2, "isFunction");
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    __name(isLength, "isLength");
    function isObject2(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    __name(isObject2, "isObject");
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    __name(isObjectLike, "isObjectLike");
    var assignInWith = createAssigner(function(object, source, srcIndex, customizer) {
      copyObject(source, keysIn(source), object, customizer);
    });
    var defaults = baseRest(function(args) {
      args.push(void 0, assignInDefaults);
      return apply(assignInWith, void 0, args);
    });
    function keysIn(object) {
      return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
    }
    __name(keysIn, "keysIn");
    module.exports = defaults;
  }
});

// node_modules/lodash.isarguments/index.js
var require_lodash2 = __commonJS({
  "node_modules/lodash.isarguments/index.js"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var MAX_SAFE_INTEGER = 9007199254740991;
    var argsTag = "[object Arguments]";
    var funcTag = "[object Function]";
    var genTag = "[object GeneratorFunction]";
    var objectProto = Object.prototype;
    var hasOwnProperty = objectProto.hasOwnProperty;
    var objectToString = objectProto.toString;
    var propertyIsEnumerable = objectProto.propertyIsEnumerable;
    function isArguments(value) {
      return isArrayLikeObject(value) && hasOwnProperty.call(value, "callee") && (!propertyIsEnumerable.call(value, "callee") || objectToString.call(value) == argsTag);
    }
    __name(isArguments, "isArguments");
    function isArrayLike(value) {
      return value != null && isLength(value.length) && !isFunction2(value);
    }
    __name(isArrayLike, "isArrayLike");
    function isArrayLikeObject(value) {
      return isObjectLike(value) && isArrayLike(value);
    }
    __name(isArrayLikeObject, "isArrayLikeObject");
    function isFunction2(value) {
      var tag = isObject2(value) ? objectToString.call(value) : "";
      return tag == funcTag || tag == genTag;
    }
    __name(isFunction2, "isFunction");
    function isLength(value) {
      return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
    }
    __name(isLength, "isLength");
    function isObject2(value) {
      var type = typeof value;
      return !!value && (type == "object" || type == "function");
    }
    __name(isObject2, "isObject");
    function isObjectLike(value) {
      return !!value && typeof value == "object";
    }
    __name(isObjectLike, "isObjectLike");
    module.exports = isArguments;
  }
});

// node_modules/ioredis/built/utils/lodash.js
var require_lodash3 = __commonJS({
  "node_modules/ioredis/built/utils/lodash.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isArguments = exports2.defaults = exports2.noop = void 0;
    var defaults = require_lodash();
    exports2.defaults = defaults;
    var isArguments = require_lodash2();
    exports2.isArguments = isArguments;
    function noop2() {
    }
    __name(noop2, "noop");
    exports2.noop = noop2;
  }
});

// node_modules/ms/index.js
var require_ms = __commonJS({
  "node_modules/ms/index.js"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var s = 1e3;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;
    module.exports = function(val, options) {
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
    __name(parse, "parse");
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
    __name(fmtShort, "fmtShort");
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
    __name(fmtLong, "fmtLong");
    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
    }
    __name(plural, "plural");
  }
});

// node_modules/debug/src/common.js
var require_common = __commonJS({
  "node_modules/debug/src/common.js"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    function setup(env3) {
      createDebug.debug = createDebug;
      createDebug.default = createDebug;
      createDebug.coerce = coerce;
      createDebug.disable = disable;
      createDebug.enable = enable;
      createDebug.enabled = enabled;
      createDebug.humanize = require_ms();
      createDebug.destroy = destroy;
      Object.keys(env3).forEach((key) => {
        createDebug[key] = env3[key];
      });
      createDebug.names = [];
      createDebug.skips = [];
      createDebug.formatters = {};
      function selectColor(namespace) {
        let hash2 = 0;
        for (let i = 0; i < namespace.length; i++) {
          hash2 = (hash2 << 5) - hash2 + namespace.charCodeAt(i);
          hash2 |= 0;
        }
        return createDebug.colors[Math.abs(hash2) % createDebug.colors.length];
      }
      __name(selectColor, "selectColor");
      createDebug.selectColor = selectColor;
      function createDebug(namespace) {
        let prevTime;
        let enableOverride = null;
        let namespacesCache;
        let enabledCache;
        function debug5(...args) {
          if (!debug5.enabled) {
            return;
          }
          const self2 = debug5;
          const curr = Number(/* @__PURE__ */ new Date());
          const ms = curr - (prevTime || curr);
          self2.diff = ms;
          self2.prev = prevTime;
          self2.curr = curr;
          prevTime = curr;
          args[0] = createDebug.coerce(args[0]);
          if (typeof args[0] !== "string") {
            args.unshift("%O");
          }
          let index = 0;
          args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format3) => {
            if (match === "%%") {
              return "%";
            }
            index++;
            const formatter = createDebug.formatters[format3];
            if (typeof formatter === "function") {
              const val = args[index];
              match = formatter.call(self2, val);
              args.splice(index, 1);
              index--;
            }
            return match;
          });
          createDebug.formatArgs.call(self2, args);
          const logFn = self2.log || createDebug.log;
          logFn.apply(self2, args);
        }
        __name(debug5, "debug");
        debug5.namespace = namespace;
        debug5.useColors = createDebug.useColors();
        debug5.color = createDebug.selectColor(namespace);
        debug5.extend = extend;
        debug5.destroy = createDebug.destroy;
        Object.defineProperty(debug5, "enabled", {
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
          createDebug.init(debug5);
        }
        return debug5;
      }
      __name(createDebug, "createDebug");
      function extend(namespace, delimiter) {
        const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
        newDebug.log = this.log;
        return newDebug;
      }
      __name(extend, "extend");
      function enable(namespaces) {
        createDebug.save(namespaces);
        createDebug.namespaces = namespaces;
        createDebug.names = [];
        createDebug.skips = [];
        const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(" ", ",").split(",").filter(Boolean);
        for (const ns of split) {
          if (ns[0] === "-") {
            createDebug.skips.push(ns.slice(1));
          } else {
            createDebug.names.push(ns);
          }
        }
      }
      __name(enable, "enable");
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
      __name(matchesTemplate, "matchesTemplate");
      function disable() {
        const namespaces = [
          ...createDebug.names,
          ...createDebug.skips.map((namespace) => "-" + namespace)
        ].join(",");
        createDebug.enable("");
        return namespaces;
      }
      __name(disable, "disable");
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
      __name(enabled, "enabled");
      function coerce(val) {
        if (val instanceof Error) {
          return val.stack || val.message;
        }
        return val;
      }
      __name(coerce, "coerce");
      function destroy() {
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
      __name(destroy, "destroy");
      createDebug.enable(createDebug.load());
      return createDebug;
    }
    __name(setup, "setup");
    module.exports = setup;
  }
});

// node_modules/debug/src/browser.js
var require_browser = __commonJS({
  "node_modules/debug/src/browser.js"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    exports2.formatArgs = formatArgs;
    exports2.save = save;
    exports2.load = load;
    exports2.useColors = useColors;
    exports2.storage = localstorage();
    exports2.destroy = (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
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
      if (typeof navigator !== "undefined" && "Cloudflare-Workers" && "Cloudflare-Workers".toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && "Cloudflare-Workers" && (m = "Cloudflare-Workers".toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && "Cloudflare-Workers" && "Cloudflare-Workers".toLowerCase().match(/applewebkit\/(\d+)/);
    }
    __name(useColors, "useColors");
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
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
    __name(formatArgs, "formatArgs");
    exports2.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports2.storage.setItem("debug", namespaces);
        } else {
          exports2.storage.removeItem("debug");
        }
      } catch (error3) {
      }
    }
    __name(save, "save");
    function load() {
      let r;
      try {
        r = exports2.storage.getItem("debug");
      } catch (error3) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    __name(load, "load");
    function localstorage() {
      try {
        return localStorage;
      } catch (error3) {
      }
    }
    __name(localstorage, "localstorage");
    module.exports = require_common()(exports2);
    var { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error3) {
        return "[UnexpectedJSONParseError]: " + error3.message;
      }
    };
  }
});

// node_modules/ioredis/built/utils/debug.js
var require_debug = __commonJS({
  "node_modules/ioredis/built/utils/debug.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.genRedactedString = exports2.getStringValue = exports2.MAX_ARGUMENT_LENGTH = void 0;
    var debug_1 = require_browser();
    var MAX_ARGUMENT_LENGTH = 200;
    exports2.MAX_ARGUMENT_LENGTH = MAX_ARGUMENT_LENGTH;
    var NAMESPACE_PREFIX = "ioredis";
    function getStringValue(v) {
      if (v === null) {
        return;
      }
      switch (typeof v) {
        case "boolean":
          return;
        case "number":
          return;
        case "object":
          if (Buffer.isBuffer(v)) {
            return v.toString("hex");
          }
          if (Array.isArray(v)) {
            return v.join(",");
          }
          try {
            return JSON.stringify(v);
          } catch (e) {
            return;
          }
        case "string":
          return v;
      }
    }
    __name(getStringValue, "getStringValue");
    exports2.getStringValue = getStringValue;
    function genRedactedString(str, maxLen) {
      const { length } = str;
      return length <= maxLen ? str : str.slice(0, maxLen) + ' ... <REDACTED full-length="' + length + '">';
    }
    __name(genRedactedString, "genRedactedString");
    exports2.genRedactedString = genRedactedString;
    function genDebugFunction(namespace) {
      const fn2 = (0, debug_1.default)(`${NAMESPACE_PREFIX}:${namespace}`);
      function wrappedDebug(...args) {
        if (!fn2.enabled) {
          return;
        }
        for (let i = 1; i < args.length; i++) {
          const str = getStringValue(args[i]);
          if (typeof str === "string" && str.length > MAX_ARGUMENT_LENGTH) {
            args[i] = genRedactedString(str, MAX_ARGUMENT_LENGTH);
          }
        }
        return fn2.apply(null, args);
      }
      __name(wrappedDebug, "wrappedDebug");
      Object.defineProperties(wrappedDebug, {
        namespace: {
          get() {
            return fn2.namespace;
          }
        },
        enabled: {
          get() {
            return fn2.enabled;
          }
        },
        destroy: {
          get() {
            return fn2.destroy;
          }
        },
        log: {
          get() {
            return fn2.log;
          },
          set(l) {
            fn2.log = l;
          }
        }
      });
      return wrappedDebug;
    }
    __name(genDebugFunction, "genDebugFunction");
    exports2.default = genDebugFunction;
  }
});

// node_modules/ioredis/built/constants/TLSProfiles.js
var require_TLSProfiles = __commonJS({
  "node_modules/ioredis/built/constants/TLSProfiles.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var RedisCloudCA = `-----BEGIN CERTIFICATE-----
MIIDTzCCAjegAwIBAgIJAKSVpiDswLcwMA0GCSqGSIb3DQEBBQUAMD4xFjAUBgNV
BAoMDUdhcmFudGlhIERhdGExJDAiBgNVBAMMG1NTTCBDZXJ0aWZpY2F0aW9uIEF1
dGhvcml0eTAeFw0xMzEwMDExMjE0NTVaFw0yMzA5MjkxMjE0NTVaMD4xFjAUBgNV
BAoMDUdhcmFudGlhIERhdGExJDAiBgNVBAMMG1NTTCBDZXJ0aWZpY2F0aW9uIEF1
dGhvcml0eTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALZqkh/DczWP
JnxnHLQ7QL0T4B4CDKWBKCcisriGbA6ZePWVNo4hfKQC6JrzfR+081NeD6VcWUiz
rmd+jtPhIY4c+WVQYm5PKaN6DT1imYdxQw7aqO5j2KUCEh/cznpLxeSHoTxlR34E
QwF28Wl3eg2vc5ct8LjU3eozWVk3gb7alx9mSA2SgmuX5lEQawl++rSjsBStemY2
BDwOpAMXIrdEyP/cVn8mkvi/BDs5M5G+09j0gfhyCzRWMQ7Hn71u1eolRxwVxgi3
TMn+/vTaFSqxKjgck6zuAYjBRPaHe7qLxHNr1So/Mc9nPy+3wHebFwbIcnUojwbp
4nctkWbjb2cCAwEAAaNQME4wHQYDVR0OBBYEFP1whtcrydmW3ZJeuSoKZIKjze3w
MB8GA1UdIwQYMBaAFP1whtcrydmW3ZJeuSoKZIKjze3wMAwGA1UdEwQFMAMBAf8w
DQYJKoZIhvcNAQEFBQADggEBAG2erXhwRAa7+ZOBs0B6X57Hwyd1R4kfmXcs0rta
lbPpvgULSiB+TCbf3EbhJnHGyvdCY1tvlffLjdA7HJ0PCOn+YYLBA0pTU/dyvrN6
Su8NuS5yubnt9mb13nDGYo1rnt0YRfxN+8DM3fXIVr038A30UlPX2Ou1ExFJT0MZ
uFKY6ZvLdI6/1cbgmguMlAhM+DhKyV6Sr5699LM3zqeI816pZmlREETYkGr91q7k
BpXJu/dtHaGxg1ZGu6w/PCsYGUcECWENYD4VQPd8N32JjOfu6vEgoEAwfPP+3oGp
Z4m3ewACcWOAenqflb+cQYC4PsF7qbXDmRaWrbKntOlZ3n0=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIGMTCCBBmgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwajELMAkGA1UEBhMCVVMx
CzAJBgNVBAgMAkNBMQswCQYDVQQHDAJDQTESMBAGA1UECgwJUmVkaXNMYWJzMS0w
KwYDVQQDDCRSZWRpc0xhYnMgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkwHhcN
MTgwMjI1MTUzNzM3WhcNMjgwMjIzMTUzNzM3WjBfMQswCQYDVQQGEwJVUzELMAkG
A1UECAwCQ0ExEjAQBgNVBAoMCVJlZGlzTGFiczEvMC0GA1UEAwwmUkNQIEludGVy
bWVkaWF0ZSBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkwggIiMA0GCSqGSIb3DQEBAQUA
A4ICDwAwggIKAoICAQDf9dqbxc8Bq7Ctq9rWcxrGNKKHivqLAFpPq02yLPx6fsOv
Tq7GsDChAYBBc4v7Y2Ap9RD5Vs3dIhEANcnolf27QwrG9RMnnvzk8pCvp1o6zSU4
VuOE1W66/O1/7e2rVxyrnTcP7UgK43zNIXu7+tiAqWsO92uSnuMoGPGpeaUm1jym
hjWKtkAwDFSqvHY+XL5qDVBEjeUe+WHkYUg40cAXjusAqgm2hZt29c2wnVrxW25W
P0meNlzHGFdA2AC5z54iRiqj57dTfBTkHoBczQxcyw6hhzxZQ4e5I5zOKjXXEhZN
r0tA3YC14CTabKRus/JmZieyZzRgEy2oti64tmLYTqSlAD78pRL40VNoaSYetXLw
hhNsXCHgWaY6d5bLOc/aIQMAV5oLvZQKvuXAF1IDmhPA+bZbpWipp0zagf1P1H3s
UzsMdn2KM0ejzgotbtNlj5TcrVwpmvE3ktvUAuA+hi3FkVx1US+2Gsp5x4YOzJ7u
P1WPk6ShF0JgnJH2ILdj6kttTWwFzH17keSFICWDfH/+kM+k7Y1v3EXMQXE7y0T9
MjvJskz6d/nv+sQhY04xt64xFMGTnZjlJMzfQNi7zWFLTZnDD0lPowq7l3YiPoTT
t5Xky83lu0KZsZBo0WlWaDG00gLVdtRgVbcuSWxpi5BdLb1kRab66JptWjxwXQID
AQABo4HrMIHoMDoGA1UdHwQzMDEwL6AtoCuGKWh0dHBzOi8vcmwtY2Etc2VydmVy
LnJlZGlzbGFicy5jb20vdjEvY3JsMEYGCCsGAQUFBwEBBDowODA2BggrBgEFBQcw
AYYqaHR0cHM6Ly9ybC1jYS1zZXJ2ZXIucmVkaXNsYWJzLmNvbS92MS9vY3NwMB0G
A1UdDgQWBBQHar5OKvQUpP2qWt6mckzToeCOHDAfBgNVHSMEGDAWgBQi42wH6hM4
L2sujEvLM0/u8lRXTzASBgNVHRMBAf8ECDAGAQH/AgEAMA4GA1UdDwEB/wQEAwIB
hjANBgkqhkiG9w0BAQsFAAOCAgEAirEn/iTsAKyhd+pu2W3Z5NjCko4NPU0EYUbr
AP7+POK2rzjIrJO3nFYQ/LLuC7KCXG+2qwan2SAOGmqWst13Y+WHp44Kae0kaChW
vcYLXXSoGQGC8QuFSNUdaeg3RbMDYFT04dOkqufeWVccoHVxyTSg9eD8LZuHn5jw
7QDLiEECBmIJHk5Eeo2TAZrx4Yx6ufSUX5HeVjlAzqwtAqdt99uCJ/EL8bgpWbe+
XoSpvUv0SEC1I1dCAhCKAvRlIOA6VBcmzg5Am12KzkqTul12/VEFIgzqu0Zy2Jbc
AUPrYVu/+tOGXQaijy7YgwH8P8n3s7ZeUa1VABJHcxrxYduDDJBLZi+MjheUDaZ1
jQRHYevI2tlqeSBqdPKG4zBY5lS0GiAlmuze5oENt0P3XboHoZPHiqcK3VECgTVh
/BkJcuudETSJcZDmQ8YfoKfBzRQNg2sv/hwvUv73Ss51Sco8GEt2lD8uEdib1Q6z
zDT5lXJowSzOD5ZA9OGDjnSRL+2riNtKWKEqvtEG3VBJoBzu9GoxbAc7wIZLxmli
iF5a/Zf5X+UXD3s4TMmy6C4QZJpAA2egsSQCnraWO2ULhh7iXMysSkF/nzVfZn43
iqpaB8++9a37hWq14ZmOv0TJIDz//b2+KC4VFXWQ5W5QC6whsjT+OlG4p5ZYG0jo
616pxqo=
-----END CERTIFICATE-----
-----BEGIN CERTIFICATE-----
MIIFujCCA6KgAwIBAgIJAJ1aTT1lu2ScMA0GCSqGSIb3DQEBCwUAMGoxCzAJBgNV
BAYTAlVTMQswCQYDVQQIDAJDQTELMAkGA1UEBwwCQ0ExEjAQBgNVBAoMCVJlZGlz
TGFiczEtMCsGA1UEAwwkUmVkaXNMYWJzIFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9y
aXR5MB4XDTE4MDIyNTE1MjA0MloXDTM4MDIyMDE1MjA0MlowajELMAkGA1UEBhMC
VVMxCzAJBgNVBAgMAkNBMQswCQYDVQQHDAJDQTESMBAGA1UECgwJUmVkaXNMYWJz
MS0wKwYDVQQDDCRSZWRpc0xhYnMgUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkw
ggIiMA0GCSqGSIb3DQEBAQUAA4ICDwAwggIKAoICAQDLEjXy7YrbN5Waau5cd6g1
G5C2tMmeTpZ0duFAPxNU4oE3RHS5gGiok346fUXuUxbZ6QkuzeN2/2Z+RmRcJhQY
Dm0ZgdG4x59An1TJfnzKKoWj8ISmoHS/TGNBdFzXV7FYNLBuqZouqePI6ReC6Qhl
pp45huV32Q3a6IDrrvx7Wo5ZczEQeFNbCeCOQYNDdTmCyEkHqc2AGo8eoIlSTutT
ULOC7R5gzJVTS0e1hesQ7jmqHjbO+VQS1NAL4/5K6cuTEqUl+XhVhPdLWBXJQ5ag
54qhX4v+ojLzeU1R/Vc6NjMvVtptWY6JihpgplprN0Yh2556ewcXMeturcKgXfGJ
xeYzsjzXerEjrVocX5V8BNrg64NlifzTMKNOOv4fVZszq1SIHR8F9ROrqiOdh8iC
JpUbLpXH9hWCSEO6VRMB2xJoKu3cgl63kF30s77x7wLFMEHiwsQRKxooE1UhgS9K
2sO4TlQ1eWUvFvHSTVDQDlGQ6zu4qjbOpb3Q8bQwoK+ai2alkXVR4Ltxe9QlgYK3
StsnPhruzZGA0wbXdpw0bnM+YdlEm5ffSTpNIfgHeaa7Dtb801FtA71ZlH7A6TaI
SIQuUST9EKmv7xrJyx0W1pGoPOLw5T029aTjnICSLdtV9bLwysrLhIYG5bnPq78B
cS+jZHFGzD7PUVGQD01nOQIDAQABo2MwYTAdBgNVHQ4EFgQUIuNsB+oTOC9rLoxL
yzNP7vJUV08wHwYDVR0jBBgwFoAUIuNsB+oTOC9rLoxLyzNP7vJUV08wDwYDVR0T
AQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMCAYYwDQYJKoZIhvcNAQELBQADggIBAHfg
z5pMNUAKdMzK1aS1EDdK9yKz4qicILz5czSLj1mC7HKDRy8cVADUxEICis++CsCu
rYOvyCVergHQLREcxPq4rc5Nq1uj6J6649NEeh4WazOOjL4ZfQ1jVznMbGy+fJm3
3Hoelv6jWRG9iqeJZja7/1s6YC6bWymI/OY1e4wUKeNHAo+Vger7MlHV+RuabaX+
hSJ8bJAM59NCM7AgMTQpJCncrcdLeceYniGy5Q/qt2b5mJkQVkIdy4TPGGB+AXDJ
D0q3I/JDRkDUFNFdeW0js7fHdsvCR7O3tJy5zIgEV/o/BCkmJVtuwPYOrw/yOlKj
TY/U7ATAx9VFF6/vYEOMYSmrZlFX+98L6nJtwDqfLB5VTltqZ4H/KBxGE3IRSt9l
FXy40U+LnXzhhW+7VBAvyYX8GEXhHkKU8Gqk1xitrqfBXY74xKgyUSTolFSfFVgj
mcM/X4K45bka+qpkj7Kfv/8D4j6aZekwhN2ly6hhC1SmQ8qjMjpG/mrWOSSHZFmf
ybu9iD2AYHeIOkshIl6xYIa++Q/00/vs46IzAbQyriOi0XxlSMMVtPx0Q3isp+ji
n8Mq9eOuxYOEQ4of8twUkUDd528iwGtEdwf0Q01UyT84S62N8AySl1ZBKXJz6W4F
UhWfa/HQYOAPDdEjNgnVwLI23b8t0TozyCWw7q8h
-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
MIIEjzCCA3egAwIBAgIQe55B/ALCKJDZtdNT8kD6hTANBgkqhkiG9w0BAQsFADBM
MSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMzETMBEGA1UEChMKR2xv
YmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjAeFw0yMjAxMjYxMjAwMDBaFw0y
NTAxMjYwMDAwMDBaMFgxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWdu
IG52LXNhMS4wLAYDVQQDEyVHbG9iYWxTaWduIEF0bGFzIFIzIE9WIFRMUyBDQSAy
MDIyIFEyMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAmGmg1LW9b7Lf
8zDD83yBDTEkt+FOxKJZqF4veWc5KZsQj9HfnUS2e5nj/E+JImlGPsQuoiosLuXD
BVBNAMcUFa11buFMGMeEMwiTmCXoXRrXQmH0qjpOfKgYc5gHG3BsRGaRrf7VR4eg
ofNMG9wUBw4/g/TT7+bQJdA4NfE7Y4d5gEryZiBGB/swaX6Jp/8MF4TgUmOWmalK
dZCKyb4sPGQFRTtElk67F7vU+wdGcrcOx1tDcIB0ncjLPMnaFicagl+daWGsKqTh
counQb6QJtYHa91KvCfKWocMxQ7OIbB5UARLPmC4CJ1/f8YFm35ebfzAeULYdGXu
jE9CLor0OwIDAQABo4IBXzCCAVswDgYDVR0PAQH/BAQDAgGGMB0GA1UdJQQWMBQG
CCsGAQUFBwMBBggrBgEFBQcDAjASBgNVHRMBAf8ECDAGAQH/AgEAMB0GA1UdDgQW
BBSH5Zq7a7B/t95GfJWkDBpA8HHqdjAfBgNVHSMEGDAWgBSP8Et/qC5FJK5NUPpj
move4t0bvDB7BggrBgEFBQcBAQRvMG0wLgYIKwYBBQUHMAGGImh0dHA6Ly9vY3Nw
Mi5nbG9iYWxzaWduLmNvbS9yb290cjMwOwYIKwYBBQUHMAKGL2h0dHA6Ly9zZWN1
cmUuZ2xvYmFsc2lnbi5jb20vY2FjZXJ0L3Jvb3QtcjMuY3J0MDYGA1UdHwQvMC0w
K6ApoCeGJWh0dHA6Ly9jcmwuZ2xvYmFsc2lnbi5jb20vcm9vdC1yMy5jcmwwIQYD
VR0gBBowGDAIBgZngQwBAgIwDAYKKwYBBAGgMgoBAjANBgkqhkiG9w0BAQsFAAOC
AQEAKRic9/f+nmhQU/wz04APZLjgG5OgsuUOyUEZjKVhNGDwxGTvKhyXGGAMW2B/
3bRi+aElpXwoxu3pL6fkElbX3B0BeS5LoDtxkyiVEBMZ8m+sXbocwlPyxrPbX6mY
0rVIvnuUeBH8X0L5IwfpNVvKnBIilTbcebfHyXkPezGwz7E1yhUULjJFm2bt0SdX
y+4X/WeiiYIv+fTVgZZgl+/2MKIsu/qdBJc3f3TvJ8nz+Eax1zgZmww+RSQWeOj3
15Iw6Z5FX+NwzY/Ab+9PosR5UosSeq+9HhtaxZttXG1nVh+avYPGYddWmiMT90J5
ZgKnO/Fx2hBgTxhOTMYaD312kg==
-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
MIIDXzCCAkegAwIBAgILBAAAAAABIVhTCKIwDQYJKoZIhvcNAQELBQAwTDEgMB4G
A1UECxMXR2xvYmFsU2lnbiBSb290IENBIC0gUjMxEzARBgNVBAoTCkdsb2JhbFNp
Z24xEzARBgNVBAMTCkdsb2JhbFNpZ24wHhcNMDkwMzE4MTAwMDAwWhcNMjkwMzE4
MTAwMDAwWjBMMSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMzETMBEG
A1UEChMKR2xvYmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjCCASIwDQYJKoZI
hvcNAQEBBQADggEPADCCAQoCggEBAMwldpB5BngiFvXAg7aEyiie/QV2EcWtiHL8
RgJDx7KKnQRfJMsuS+FggkbhUqsMgUdwbN1k0ev1LKMPgj0MK66X17YUhhB5uzsT
gHeMCOFJ0mpiLx9e+pZo34knlTifBtc+ycsmWQ1z3rDI6SYOgxXG71uL0gRgykmm
KPZpO/bLyCiR5Z2KYVc3rHQU3HTgOu5yLy6c+9C7v/U9AOEGM+iCK65TpjoWc4zd
QQ4gOsC0p6Hpsk+QLjJg6VfLuQSSaGjlOCZgdbKfd/+RFO+uIEn8rUAVSNECMWEZ
XriX7613t2Saer9fwRPvm2L7DWzgVGkWqQPabumDk3F2xmmFghcCAwEAAaNCMEAw
DgYDVR0PAQH/BAQDAgEGMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFI/wS3+o
LkUkrk1Q+mOai97i3Ru8MA0GCSqGSIb3DQEBCwUAA4IBAQBLQNvAUKr+yAzv95ZU
RUm7lgAJQayzE4aGKAczymvmdLm6AC2upArT9fHxD4q/c2dKg8dEe3jgr25sbwMp
jjM5RcOO5LlXbKr8EpbsU8Yt5CRsuZRj+9xTaGdWPoO4zzUhw8lo/s7awlOqzJCK
6fBdRoyV3XpYKBovHd7NADdBj+1EbddTKJd+82cEHhXXipa0095MJ6RMG3NzdvQX
mcIfeg7jLQitChws/zyrVQ4PkX4268NXSb7hLi18YIvDQVETI53O9zJrlAGomecs
Mx86OyXShkDOOyyGeMlhLxS67ttVb9+E7gUJTb0o2HLO02JQZR7rkpeDMdmztcpH
WD9f
-----END CERTIFICATE-----`;
    var TLSProfiles = {
      RedisCloudFixed: { ca: RedisCloudCA },
      RedisCloudFlexible: { ca: RedisCloudCA }
    };
    exports2.default = TLSProfiles;
  }
});

// node_modules/ioredis/built/utils/index.js
var require_utils2 = __commonJS({
  "node_modules/ioredis/built/utils/index.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.noop = exports2.defaults = exports2.Debug = exports2.zipMap = exports2.CONNECTION_CLOSED_ERROR_MSG = exports2.shuffle = exports2.sample = exports2.resolveTLSProfile = exports2.parseURL = exports2.optimizeErrorStack = exports2.toArg = exports2.convertMapToArray = exports2.convertObjectToArray = exports2.timeout = exports2.packObject = exports2.isInt = exports2.wrapMultiResult = exports2.convertBufferToString = void 0;
    var url_1 = require_url();
    var lodash_1 = require_lodash3();
    Object.defineProperty(exports2, "defaults", { enumerable: true, get: function() {
      return lodash_1.defaults;
    } });
    Object.defineProperty(exports2, "noop", { enumerable: true, get: function() {
      return lodash_1.noop;
    } });
    var debug_1 = require_debug();
    exports2.Debug = debug_1.default;
    var TLSProfiles_1 = require_TLSProfiles();
    function convertBufferToString(value, encoding) {
      if (value instanceof Buffer) {
        return value.toString(encoding);
      }
      if (Array.isArray(value)) {
        const length = value.length;
        const res = Array(length);
        for (let i = 0; i < length; ++i) {
          res[i] = value[i] instanceof Buffer && encoding === "utf8" ? value[i].toString() : convertBufferToString(value[i], encoding);
        }
        return res;
      }
      return value;
    }
    __name(convertBufferToString, "convertBufferToString");
    exports2.convertBufferToString = convertBufferToString;
    function wrapMultiResult(arr) {
      if (!arr) {
        return null;
      }
      const result = [];
      const length = arr.length;
      for (let i = 0; i < length; ++i) {
        const item = arr[i];
        if (item instanceof Error) {
          result.push([item]);
        } else {
          result.push([null, item]);
        }
      }
      return result;
    }
    __name(wrapMultiResult, "wrapMultiResult");
    exports2.wrapMultiResult = wrapMultiResult;
    function isInt(value) {
      const x = parseFloat(value);
      return !isNaN(value) && (x | 0) === x;
    }
    __name(isInt, "isInt");
    exports2.isInt = isInt;
    function packObject(array) {
      const result = {};
      const length = array.length;
      for (let i = 1; i < length; i += 2) {
        result[array[i - 1]] = array[i];
      }
      return result;
    }
    __name(packObject, "packObject");
    exports2.packObject = packObject;
    function timeout(callback, timeout2) {
      let timer = null;
      const run = /* @__PURE__ */ __name(function() {
        if (timer) {
          clearTimeout(timer);
          timer = null;
          callback.apply(this, arguments);
        }
      }, "run");
      timer = setTimeout(run, timeout2, new Error("timeout"));
      return run;
    }
    __name(timeout, "timeout");
    exports2.timeout = timeout;
    function convertObjectToArray(obj) {
      const result = [];
      const keys = Object.keys(obj);
      for (let i = 0, l = keys.length; i < l; i++) {
        result.push(keys[i], obj[keys[i]]);
      }
      return result;
    }
    __name(convertObjectToArray, "convertObjectToArray");
    exports2.convertObjectToArray = convertObjectToArray;
    function convertMapToArray(map) {
      const result = [];
      let pos = 0;
      map.forEach(function(value, key) {
        result[pos] = key;
        result[pos + 1] = value;
        pos += 2;
      });
      return result;
    }
    __name(convertMapToArray, "convertMapToArray");
    exports2.convertMapToArray = convertMapToArray;
    function toArg(arg) {
      if (arg === null || typeof arg === "undefined") {
        return "";
      }
      return String(arg);
    }
    __name(toArg, "toArg");
    exports2.toArg = toArg;
    function optimizeErrorStack(error3, friendlyStack, filterPath) {
      const stacks = friendlyStack.split("\n");
      let lines = "";
      let i;
      for (i = 1; i < stacks.length; ++i) {
        if (stacks[i].indexOf(filterPath) === -1) {
          break;
        }
      }
      for (let j = i; j < stacks.length; ++j) {
        lines += "\n" + stacks[j];
      }
      if (error3.stack) {
        const pos = error3.stack.indexOf("\n");
        error3.stack = error3.stack.slice(0, pos) + lines;
      }
      return error3;
    }
    __name(optimizeErrorStack, "optimizeErrorStack");
    exports2.optimizeErrorStack = optimizeErrorStack;
    function parseURL(url) {
      if (isInt(url)) {
        return { port: url };
      }
      let parsed = (0, url_1.parse)(url, true, true);
      if (!parsed.slashes && url[0] !== "/") {
        url = "//" + url;
        parsed = (0, url_1.parse)(url, true, true);
      }
      const options = parsed.query || {};
      const result = {};
      if (parsed.auth) {
        const index = parsed.auth.indexOf(":");
        result.username = index === -1 ? parsed.auth : parsed.auth.slice(0, index);
        result.password = index === -1 ? "" : parsed.auth.slice(index + 1);
      }
      if (parsed.pathname) {
        if (parsed.protocol === "redis:" || parsed.protocol === "rediss:") {
          if (parsed.pathname.length > 1) {
            result.db = parsed.pathname.slice(1);
          }
        } else {
          result.path = parsed.pathname;
        }
      }
      if (parsed.host) {
        result.host = parsed.hostname;
      }
      if (parsed.port) {
        result.port = parsed.port;
      }
      if (typeof options.family === "string") {
        const intFamily = Number.parseInt(options.family, 10);
        if (!Number.isNaN(intFamily)) {
          result.family = intFamily;
        }
      }
      (0, lodash_1.defaults)(result, options);
      return result;
    }
    __name(parseURL, "parseURL");
    exports2.parseURL = parseURL;
    function resolveTLSProfile(options) {
      let tls = options === null || options === void 0 ? void 0 : options.tls;
      if (typeof tls === "string")
        tls = { profile: tls };
      const profile3 = TLSProfiles_1.default[tls === null || tls === void 0 ? void 0 : tls.profile];
      if (profile3) {
        tls = Object.assign({}, profile3, tls);
        delete tls.profile;
        options = Object.assign({}, options, { tls });
      }
      return options;
    }
    __name(resolveTLSProfile, "resolveTLSProfile");
    exports2.resolveTLSProfile = resolveTLSProfile;
    function sample(array, from = 0) {
      const length = array.length;
      if (from >= length) {
        return null;
      }
      return array[from + Math.floor(Math.random() * (length - from))];
    }
    __name(sample, "sample");
    exports2.sample = sample;
    function shuffle(array) {
      let counter = array.length;
      while (counter > 0) {
        const index = Math.floor(Math.random() * counter);
        counter--;
        [array[counter], array[index]] = [array[index], array[counter]];
      }
      return array;
    }
    __name(shuffle, "shuffle");
    exports2.shuffle = shuffle;
    exports2.CONNECTION_CLOSED_ERROR_MSG = "Connection is closed.";
    function zipMap(keys, values) {
      const map = /* @__PURE__ */ new Map();
      keys.forEach((key, index) => {
        map.set(key, values[index]);
      });
      return map;
    }
    __name(zipMap, "zipMap");
    exports2.zipMap = zipMap;
  }
});

// node_modules/ioredis/built/Command.js
var require_Command = __commonJS({
  "node_modules/ioredis/built/Command.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var commands_1 = require_built();
    var calculateSlot = require_lib();
    var standard_as_callback_1 = require_built2();
    var utils_1 = require_utils2();
    var Command = class {
      /**
       * Creates an instance of Command.
       * @param name Command name
       * @param args An array of command arguments
       * @param options
       * @param callback The callback that handles the response.
       * If omit, the response will be handled via Promise
       */
      constructor(name, args = [], options = {}, callback) {
        this.name = name;
        this.inTransaction = false;
        this.isResolved = false;
        this.transformed = false;
        this.replyEncoding = options.replyEncoding;
        this.errorStack = options.errorStack;
        this.args = args.flat();
        this.callback = callback;
        this.initPromise();
        if (options.keyPrefix) {
          const isBufferKeyPrefix = options.keyPrefix instanceof Buffer;
          let keyPrefixBuffer = isBufferKeyPrefix ? options.keyPrefix : null;
          this._iterateKeys((key) => {
            if (key instanceof Buffer) {
              if (keyPrefixBuffer === null) {
                keyPrefixBuffer = Buffer.from(options.keyPrefix);
              }
              return Buffer.concat([keyPrefixBuffer, key]);
            } else if (isBufferKeyPrefix) {
              return Buffer.concat([options.keyPrefix, Buffer.from(String(key))]);
            }
            return options.keyPrefix + key;
          });
        }
        if (options.readOnly) {
          this.isReadOnly = true;
        }
      }
      /**
       * Check whether the command has the flag
       */
      static checkFlag(flagName, commandName) {
        return !!this.getFlagMap()[flagName][commandName];
      }
      static setArgumentTransformer(name, func) {
        this._transformer.argument[name] = func;
      }
      static setReplyTransformer(name, func) {
        this._transformer.reply[name] = func;
      }
      static getFlagMap() {
        if (!this.flagMap) {
          this.flagMap = Object.keys(Command.FLAGS).reduce((map, flagName) => {
            map[flagName] = {};
            Command.FLAGS[flagName].forEach((commandName) => {
              map[flagName][commandName] = true;
            });
            return map;
          }, {});
        }
        return this.flagMap;
      }
      getSlot() {
        if (typeof this.slot === "undefined") {
          const key = this.getKeys()[0];
          this.slot = key == null ? null : calculateSlot(key);
        }
        return this.slot;
      }
      getKeys() {
        return this._iterateKeys();
      }
      /**
       * Convert command to writable buffer or string
       */
      toWritable(_socket) {
        let result;
        const commandStr = "*" + (this.args.length + 1) + "\r\n$" + Buffer.byteLength(this.name) + "\r\n" + this.name + "\r\n";
        if (this.bufferMode) {
          const buffers = new MixedBuffers();
          buffers.push(commandStr);
          for (let i = 0; i < this.args.length; ++i) {
            const arg = this.args[i];
            if (arg instanceof Buffer) {
              if (arg.length === 0) {
                buffers.push("$0\r\n\r\n");
              } else {
                buffers.push("$" + arg.length + "\r\n");
                buffers.push(arg);
                buffers.push("\r\n");
              }
            } else {
              buffers.push("$" + Buffer.byteLength(arg) + "\r\n" + arg + "\r\n");
            }
          }
          result = buffers.toBuffer();
        } else {
          result = commandStr;
          for (let i = 0; i < this.args.length; ++i) {
            const arg = this.args[i];
            result += "$" + Buffer.byteLength(arg) + "\r\n" + arg + "\r\n";
          }
        }
        return result;
      }
      stringifyArguments() {
        for (let i = 0; i < this.args.length; ++i) {
          const arg = this.args[i];
          if (typeof arg === "string") {
          } else if (arg instanceof Buffer) {
            this.bufferMode = true;
          } else {
            this.args[i] = (0, utils_1.toArg)(arg);
          }
        }
      }
      /**
       * Convert buffer/buffer[] to string/string[],
       * and apply reply transformer.
       */
      transformReply(result) {
        if (this.replyEncoding) {
          result = (0, utils_1.convertBufferToString)(result, this.replyEncoding);
        }
        const transformer = Command._transformer.reply[this.name];
        if (transformer) {
          result = transformer(result);
        }
        return result;
      }
      /**
       * Set the wait time before terminating the attempt to execute a command
       * and generating an error.
       */
      setTimeout(ms) {
        if (!this._commandTimeoutTimer) {
          this._commandTimeoutTimer = setTimeout(() => {
            if (!this.isResolved) {
              this.reject(new Error("Command timed out"));
            }
          }, ms);
        }
      }
      initPromise() {
        const promise = new Promise((resolve, reject) => {
          if (!this.transformed) {
            this.transformed = true;
            const transformer = Command._transformer.argument[this.name];
            if (transformer) {
              this.args = transformer(this.args);
            }
            this.stringifyArguments();
          }
          this.resolve = this._convertValue(resolve);
          if (this.errorStack) {
            this.reject = (err) => {
              reject((0, utils_1.optimizeErrorStack)(err, this.errorStack.stack, __dirname));
            };
          } else {
            this.reject = reject;
          }
        });
        this.promise = (0, standard_as_callback_1.default)(promise, this.callback);
      }
      /**
       * Iterate through the command arguments that are considered keys.
       */
      _iterateKeys(transform = (key) => key) {
        if (typeof this.keys === "undefined") {
          this.keys = [];
          if ((0, commands_1.exists)(this.name)) {
            const keyIndexes = (0, commands_1.getKeyIndexes)(this.name, this.args);
            for (const index of keyIndexes) {
              this.args[index] = transform(this.args[index]);
              this.keys.push(this.args[index]);
            }
          }
        }
        return this.keys;
      }
      /**
       * Convert the value from buffer to the target encoding.
       */
      _convertValue(resolve) {
        return (value) => {
          try {
            const existingTimer = this._commandTimeoutTimer;
            if (existingTimer) {
              clearTimeout(existingTimer);
              delete this._commandTimeoutTimer;
            }
            resolve(this.transformReply(value));
            this.isResolved = true;
          } catch (err) {
            this.reject(err);
          }
          return this.promise;
        };
      }
    };
    __name(Command, "Command");
    exports2.default = Command;
    Command.FLAGS = {
      VALID_IN_SUBSCRIBER_MODE: [
        "subscribe",
        "psubscribe",
        "unsubscribe",
        "punsubscribe",
        "ssubscribe",
        "sunsubscribe",
        "ping",
        "quit"
      ],
      VALID_IN_MONITOR_MODE: ["monitor", "auth"],
      ENTER_SUBSCRIBER_MODE: ["subscribe", "psubscribe", "ssubscribe"],
      EXIT_SUBSCRIBER_MODE: ["unsubscribe", "punsubscribe", "sunsubscribe"],
      WILL_DISCONNECT: ["quit"]
    };
    Command._transformer = {
      argument: {},
      reply: {}
    };
    var msetArgumentTransformer = /* @__PURE__ */ __name(function(args) {
      if (args.length === 1) {
        if (args[0] instanceof Map) {
          return (0, utils_1.convertMapToArray)(args[0]);
        }
        if (typeof args[0] === "object" && args[0] !== null) {
          return (0, utils_1.convertObjectToArray)(args[0]);
        }
      }
      return args;
    }, "msetArgumentTransformer");
    var hsetArgumentTransformer = /* @__PURE__ */ __name(function(args) {
      if (args.length === 2) {
        if (args[1] instanceof Map) {
          return [args[0]].concat((0, utils_1.convertMapToArray)(args[1]));
        }
        if (typeof args[1] === "object" && args[1] !== null) {
          return [args[0]].concat((0, utils_1.convertObjectToArray)(args[1]));
        }
      }
      return args;
    }, "hsetArgumentTransformer");
    Command.setArgumentTransformer("mset", msetArgumentTransformer);
    Command.setArgumentTransformer("msetnx", msetArgumentTransformer);
    Command.setArgumentTransformer("hset", hsetArgumentTransformer);
    Command.setArgumentTransformer("hmset", hsetArgumentTransformer);
    Command.setReplyTransformer("hgetall", function(result) {
      if (Array.isArray(result)) {
        const obj = {};
        for (let i = 0; i < result.length; i += 2) {
          const key = result[i];
          const value = result[i + 1];
          if (key in obj) {
            Object.defineProperty(obj, key, {
              value,
              configurable: true,
              enumerable: true,
              writable: true
            });
          } else {
            obj[key] = value;
          }
        }
        return obj;
      }
      return result;
    });
    var MixedBuffers = class {
      constructor() {
        this.length = 0;
        this.items = [];
      }
      push(x) {
        this.length += Buffer.byteLength(x);
        this.items.push(x);
      }
      toBuffer() {
        const result = Buffer.allocUnsafe(this.length);
        let offset = 0;
        for (const item of this.items) {
          const length = Buffer.byteLength(item);
          Buffer.isBuffer(item) ? item.copy(result, offset) : result.write(item, offset, length);
          offset += length;
        }
        return result;
      }
    };
    __name(MixedBuffers, "MixedBuffers");
  }
});

// node_modules/ioredis/built/errors/ClusterAllFailedError.js
var require_ClusterAllFailedError = __commonJS({
  "node_modules/ioredis/built/errors/ClusterAllFailedError.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var redis_errors_1 = require_redis_errors();
    var ClusterAllFailedError = class extends redis_errors_1.RedisError {
      constructor(message, lastNodeError) {
        super(message);
        this.lastNodeError = lastNodeError;
        Error.captureStackTrace(this, this.constructor);
      }
      get name() {
        return this.constructor.name;
      }
    };
    __name(ClusterAllFailedError, "ClusterAllFailedError");
    exports2.default = ClusterAllFailedError;
    ClusterAllFailedError.defaultMessage = "Failed to refresh slots cache.";
  }
});

// node-built-in-modules:stream
import libDefault4 from "stream";
var require_stream = __commonJS({
  "node-built-in-modules:stream"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = libDefault4;
  }
});

// node_modules/ioredis/built/ScanStream.js
var require_ScanStream = __commonJS({
  "node_modules/ioredis/built/ScanStream.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var stream_1 = require_stream();
    var ScanStream = class extends stream_1.Readable {
      constructor(opt) {
        super(opt);
        this.opt = opt;
        this._redisCursor = "0";
        this._redisDrained = false;
      }
      _read() {
        if (this._redisDrained) {
          this.push(null);
          return;
        }
        const args = [this._redisCursor];
        if (this.opt.key) {
          args.unshift(this.opt.key);
        }
        if (this.opt.match) {
          args.push("MATCH", this.opt.match);
        }
        if (this.opt.type) {
          args.push("TYPE", this.opt.type);
        }
        if (this.opt.count) {
          args.push("COUNT", String(this.opt.count));
        }
        this.opt.redis[this.opt.command](args, (err, res) => {
          if (err) {
            this.emit("error", err);
            return;
          }
          this._redisCursor = res[0] instanceof Buffer ? res[0].toString() : res[0];
          if (this._redisCursor === "0") {
            this._redisDrained = true;
          }
          this.push(res[1]);
        });
      }
      close() {
        this._redisDrained = true;
      }
    };
    __name(ScanStream, "ScanStream");
    exports2.default = ScanStream;
  }
});

// node_modules/ioredis/built/autoPipelining.js
var require_autoPipelining = __commonJS({
  "node_modules/ioredis/built/autoPipelining.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.executeWithAutoPipelining = exports2.getFirstValueInFlattenedArray = exports2.shouldUseAutoPipelining = exports2.notAllowedAutoPipelineCommands = exports2.kCallbacks = exports2.kExec = void 0;
    var lodash_1 = require_lodash3();
    var calculateSlot = require_lib();
    var standard_as_callback_1 = require_built2();
    exports2.kExec = Symbol("exec");
    exports2.kCallbacks = Symbol("callbacks");
    exports2.notAllowedAutoPipelineCommands = [
      "auth",
      "info",
      "script",
      "quit",
      "cluster",
      "pipeline",
      "multi",
      "subscribe",
      "psubscribe",
      "unsubscribe",
      "unpsubscribe",
      "select"
    ];
    function executeAutoPipeline(client, slotKey) {
      if (client._runningAutoPipelines.has(slotKey)) {
        return;
      }
      if (!client._autoPipelines.has(slotKey)) {
        return;
      }
      client._runningAutoPipelines.add(slotKey);
      const pipeline = client._autoPipelines.get(slotKey);
      client._autoPipelines.delete(slotKey);
      const callbacks = pipeline[exports2.kCallbacks];
      pipeline[exports2.kCallbacks] = null;
      pipeline.exec(function(err, results) {
        client._runningAutoPipelines.delete(slotKey);
        if (err) {
          for (let i = 0; i < callbacks.length; i++) {
            process.nextTick(callbacks[i], err);
          }
        } else {
          for (let i = 0; i < callbacks.length; i++) {
            process.nextTick(callbacks[i], ...results[i]);
          }
        }
        if (client._autoPipelines.has(slotKey)) {
          executeAutoPipeline(client, slotKey);
        }
      });
    }
    __name(executeAutoPipeline, "executeAutoPipeline");
    function shouldUseAutoPipelining(client, functionName, commandName) {
      return functionName && client.options.enableAutoPipelining && !client.isPipeline && !exports2.notAllowedAutoPipelineCommands.includes(commandName) && !client.options.autoPipeliningIgnoredCommands.includes(commandName);
    }
    __name(shouldUseAutoPipelining, "shouldUseAutoPipelining");
    exports2.shouldUseAutoPipelining = shouldUseAutoPipelining;
    function getFirstValueInFlattenedArray(args) {
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (typeof arg === "string") {
          return arg;
        } else if (Array.isArray(arg) || (0, lodash_1.isArguments)(arg)) {
          if (arg.length === 0) {
            continue;
          }
          return arg[0];
        }
        const flattened = [arg].flat();
        if (flattened.length > 0) {
          return flattened[0];
        }
      }
      return void 0;
    }
    __name(getFirstValueInFlattenedArray, "getFirstValueInFlattenedArray");
    exports2.getFirstValueInFlattenedArray = getFirstValueInFlattenedArray;
    function executeWithAutoPipelining(client, functionName, commandName, args, callback) {
      if (client.isCluster && !client.slots.length) {
        if (client.status === "wait")
          client.connect().catch(lodash_1.noop);
        return (0, standard_as_callback_1.default)(new Promise(function(resolve, reject) {
          client.delayUntilReady((err) => {
            if (err) {
              reject(err);
              return;
            }
            executeWithAutoPipelining(client, functionName, commandName, args, null).then(resolve, reject);
          });
        }), callback);
      }
      const prefix = client.options.keyPrefix || "";
      const slotKey = client.isCluster ? client.slots[calculateSlot(`${prefix}${getFirstValueInFlattenedArray(args)}`)].join(",") : "main";
      if (!client._autoPipelines.has(slotKey)) {
        const pipeline2 = client.pipeline();
        pipeline2[exports2.kExec] = false;
        pipeline2[exports2.kCallbacks] = [];
        client._autoPipelines.set(slotKey, pipeline2);
      }
      const pipeline = client._autoPipelines.get(slotKey);
      if (!pipeline[exports2.kExec]) {
        pipeline[exports2.kExec] = true;
        setImmediate(executeAutoPipeline, client, slotKey);
      }
      const autoPipelinePromise = new Promise(function(resolve, reject) {
        pipeline[exports2.kCallbacks].push(function(err, value) {
          if (err) {
            reject(err);
            return;
          }
          resolve(value);
        });
        if (functionName === "call") {
          args.unshift(commandName);
        }
        pipeline[functionName](...args);
      });
      return (0, standard_as_callback_1.default)(autoPipelinePromise, callback);
    }
    __name(executeWithAutoPipelining, "executeWithAutoPipelining");
    exports2.executeWithAutoPipelining = executeWithAutoPipelining;
  }
});

// node_modules/unenv/runtime/node/crypto/internal/web.mjs
var web_exports = {};
__export(web_exports, {
  getRandomValues: () => getRandomValues,
  randomUUID: () => randomUUID,
  subtle: () => subtle
});
var subtle, randomUUID, getRandomValues;
var init_web = __esm({
  "node_modules/unenv/runtime/node/crypto/internal/web.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    subtle = globalThis.crypto?.subtle;
    randomUUID = /* @__PURE__ */ __name(() => {
      return globalThis.crypto?.randomUUID();
    }, "randomUUID");
    getRandomValues = /* @__PURE__ */ __name((array) => {
      return globalThis.crypto?.getRandomValues(array);
    }, "getRandomValues");
  }
});

// node_modules/unenv/runtime/node/crypto/internal/node.mjs
var node_exports = {};
__export(node_exports, {
  Certificate: () => Certificate,
  Cipher: () => Cipher,
  Cipheriv: () => Cipheriv,
  Decipher: () => Decipher,
  Decipheriv: () => Decipheriv,
  DiffieHellman: () => DiffieHellman,
  DiffieHellmanGroup: () => DiffieHellmanGroup,
  ECDH: () => ECDH,
  Hash: () => Hash,
  Hmac: () => Hmac,
  KeyObject: () => KeyObject,
  Sign: () => Sign,
  Verify: () => Verify,
  X509Certificate: () => X509Certificate,
  checkPrime: () => checkPrime,
  checkPrimeSync: () => checkPrimeSync,
  constants: () => constants,
  createCipher: () => createCipher,
  createCipheriv: () => createCipheriv,
  createDecipher: () => createDecipher,
  createDecipheriv: () => createDecipheriv,
  createDiffieHellman: () => createDiffieHellman,
  createDiffieHellmanGroup: () => createDiffieHellmanGroup,
  createECDH: () => createECDH,
  createHash: () => createHash,
  createHmac: () => createHmac,
  createPrivateKey: () => createPrivateKey,
  createPublicKey: () => createPublicKey,
  createSecretKey: () => createSecretKey,
  createSign: () => createSign,
  createVerify: () => createVerify,
  diffieHellman: () => diffieHellman,
  fips: () => fips,
  generateKey: () => generateKey,
  generateKeyPair: () => generateKeyPair,
  generateKeyPairSync: () => generateKeyPairSync,
  generateKeySync: () => generateKeySync,
  generatePrime: () => generatePrime,
  generatePrimeSync: () => generatePrimeSync,
  getCipherInfo: () => getCipherInfo,
  getCiphers: () => getCiphers,
  getCurves: () => getCurves,
  getDiffieHellman: () => getDiffieHellman,
  getFips: () => getFips,
  getHashes: () => getHashes,
  hash: () => hash,
  hkdf: () => hkdf,
  hkdfSync: () => hkdfSync,
  pbkdf2: () => pbkdf2,
  pbkdf2Sync: () => pbkdf2Sync,
  privateDecrypt: () => privateDecrypt,
  privateEncrypt: () => privateEncrypt,
  pseudoRandomBytes: () => pseudoRandomBytes,
  publicDecrypt: () => publicDecrypt,
  publicEncrypt: () => publicEncrypt,
  randomBytes: () => randomBytes,
  randomFill: () => randomFill,
  randomFillSync: () => randomFillSync,
  randomInt: () => randomInt,
  scrypt: () => scrypt,
  scryptSync: () => scryptSync,
  secureHeapUsed: () => secureHeapUsed,
  setEngine: () => setEngine,
  setFips: () => setFips,
  sign: () => sign,
  timingSafeEqual: () => timingSafeEqual,
  verify: () => verify,
  webcrypto: () => webcrypto
});
var MAX_RANDOM_VALUE_BYTES, webcrypto, randomBytes, fips, constants, checkPrime, checkPrimeSync, createCipher, createDecipher, pseudoRandomBytes, createCipheriv, createDecipheriv, createDiffieHellman, createDiffieHellmanGroup, createECDH, createHash, createHmac, createPrivateKey, createPublicKey, createSecretKey, createSign, createVerify, diffieHellman, generatePrime, generatePrimeSync, getCiphers, getCipherInfo, getCurves, getDiffieHellman, getHashes, hkdf, hkdfSync, pbkdf2, pbkdf2Sync, generateKeyPair, generateKeyPairSync, generateKey, generateKeySync, privateDecrypt, privateEncrypt, publicDecrypt, publicEncrypt, randomFill, randomFillSync, randomInt, scrypt, scryptSync, sign, setEngine, timingSafeEqual, getFips, setFips, verify, secureHeapUsed, hash, Certificate, Cipher, Cipheriv, Decipher, Decipheriv, DiffieHellman, DiffieHellmanGroup, ECDH, Hash, Hmac, KeyObject, Sign, Verify, X509Certificate;
var init_node = __esm({
  "node_modules/unenv/runtime/node/crypto/internal/node.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_web();
    MAX_RANDOM_VALUE_BYTES = 65536;
    webcrypto = new Proxy(
      globalThis.crypto,
      {
        get(_, key) {
          if (key === "CryptoKey") {
            return globalThis.CryptoKey;
          }
          if (typeof globalThis.crypto[key] === "function") {
            return globalThis.crypto[key].bind(globalThis.crypto);
          }
          return globalThis.crypto[key];
        }
      }
    );
    randomBytes = /* @__PURE__ */ __name((size, cb) => {
      const bytes = Buffer.alloc(size, 0, void 0);
      for (let generated = 0; generated < size; generated += MAX_RANDOM_VALUE_BYTES) {
        getRandomValues(
          Uint8Array.prototype.slice.call(
            bytes,
            generated,
            generated + MAX_RANDOM_VALUE_BYTES
          )
        );
      }
      if (typeof cb === "function") {
        cb(null, bytes);
        return void 0;
      }
      return bytes;
    }, "randomBytes");
    fips = false;
    constants = {};
    checkPrime = notImplemented("crypto.checkPrime");
    checkPrimeSync = notImplemented(
      "crypto.checkPrimeSync"
    );
    createCipher = notImplemented("crypto.createCipher");
    createDecipher = notImplemented("crypto.createDecipher");
    pseudoRandomBytes = notImplemented("crypto.pseudoRandomBytes");
    createCipheriv = notImplemented(
      "crypto.createCipheriv"
    );
    createDecipheriv = notImplemented("crypto.createDecipheriv");
    createDiffieHellman = notImplemented("crypto.createDiffieHellman");
    createDiffieHellmanGroup = notImplemented("crypto.createDiffieHellmanGroup");
    createECDH = notImplemented("crypto.createECDH");
    createHash = notImplemented("crypto.createHash");
    createHmac = notImplemented("crypto.createHmac");
    createPrivateKey = notImplemented("crypto.createPrivateKey");
    createPublicKey = notImplemented("crypto.createPublicKey");
    createSecretKey = notImplemented("crypto.createSecretKey");
    createSign = notImplemented("crypto.createSign");
    createVerify = notImplemented(
      "crypto.createVerify"
    );
    diffieHellman = notImplemented(
      "crypto.diffieHellman"
    );
    generatePrime = notImplemented(
      "crypto.generatePrime"
    );
    generatePrimeSync = notImplemented("crypto.generatePrimeSync");
    getCiphers = notImplemented("crypto.getCiphers");
    getCipherInfo = notImplemented(
      "crypto.getCipherInfo"
    );
    getCurves = notImplemented("crypto.getCurves");
    getDiffieHellman = notImplemented("crypto.getDiffieHellman");
    getHashes = notImplemented("crypto.getHashes");
    hkdf = notImplemented("crypto.hkdf");
    hkdfSync = notImplemented("crypto.hkdfSync");
    pbkdf2 = notImplemented("crypto.pbkdf2");
    pbkdf2Sync = notImplemented("crypto.pbkdf2Sync");
    generateKeyPair = notImplemented("crypto.generateKeyPair");
    generateKeyPairSync = notImplemented("crypto.generateKeyPairSync");
    generateKey = notImplemented("crypto.generateKey");
    generateKeySync = notImplemented("crypto.generateKeySync");
    privateDecrypt = notImplemented(
      "crypto.privateDecrypt"
    );
    privateEncrypt = notImplemented(
      "crypto.privateEncrypt"
    );
    publicDecrypt = notImplemented(
      "crypto.publicDecrypt"
    );
    publicEncrypt = notImplemented(
      "crypto.publicEncrypt"
    );
    randomFill = notImplemented("crypto.randomFill");
    randomFillSync = notImplemented(
      "crypto.randomFillSync"
    );
    randomInt = notImplemented("crypto.randomInt");
    scrypt = notImplemented("crypto.scrypt");
    scryptSync = notImplemented("crypto.scryptSync");
    sign = notImplemented("crypto.sign");
    setEngine = notImplemented("crypto.setEngine");
    timingSafeEqual = notImplemented("crypto.timingSafeEqual");
    getFips = notImplemented("crypto.getFips");
    setFips = notImplemented("crypto.setFips");
    verify = notImplemented("crypto.verify");
    secureHeapUsed = notImplemented(
      "crypto.secureHeapUsed"
    );
    hash = notImplemented("crypto.hash");
    Certificate = notImplementedClass(
      "crypto.Certificate"
    );
    Cipher = notImplementedClass(
      "crypto.Cipher"
    );
    Cipheriv = notImplementedClass(
      "crypto.Cipheriv"
      // @ts-expect-error not typed yet
    );
    Decipher = notImplementedClass(
      "crypto.Decipher"
    );
    Decipheriv = notImplementedClass(
      "crypto.Decipheriv"
      // @ts-expect-error not typed yet
    );
    DiffieHellman = notImplementedClass(
      "crypto.DiffieHellman"
    );
    DiffieHellmanGroup = notImplementedClass(
      "crypto.DiffieHellmanGroup"
    );
    ECDH = notImplementedClass(
      "crypto.ECDH"
    );
    Hash = notImplementedClass(
      "crypto.Hash"
    );
    Hmac = notImplementedClass(
      "crypto.Hmac"
    );
    KeyObject = notImplementedClass(
      "crypto.KeyObject"
    );
    Sign = notImplementedClass(
      "crypto.Sign"
    );
    Verify = notImplementedClass(
      "crypto.Verify"
    );
    X509Certificate = notImplementedClass(
      "crypto.X509Certificate"
    );
  }
});

// node_modules/unenv/runtime/node/crypto/internal/constants.mjs
var constants2, constants_default;
var init_constants = __esm({
  "node_modules/unenv/runtime/node/crypto/internal/constants.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    constants2 = {
      ALPN_ENABLED: 1,
      // Node.js v18 only
      DH_CHECK_P_NOT_PRIME: 1,
      DH_CHECK_P_NOT_SAFE_PRIME: 2,
      DH_NOT_SUITABLE_GENERATOR: 8,
      DH_UNABLE_TO_CHECK_GENERATOR: 4,
      ENGINE_METHOD_ALL: 65535,
      ENGINE_METHOD_CIPHERS: 64,
      ENGINE_METHOD_DH: 4,
      ENGINE_METHOD_DIGESTS: 128,
      ENGINE_METHOD_DSA: 2,
      ENGINE_METHOD_EC: 2048,
      ENGINE_METHOD_NONE: 0,
      ENGINE_METHOD_PKEY_ASN1_METHS: 1024,
      ENGINE_METHOD_PKEY_METHS: 512,
      ENGINE_METHOD_RAND: 8,
      ENGINE_METHOD_RSA: 1,
      OPENSSL_VERSION_NUMBER: 0,
      // explicitly set to 0 to avoid version misdetection
      POINT_CONVERSION_COMPRESSED: 2,
      POINT_CONVERSION_HYBRID: 6,
      POINT_CONVERSION_UNCOMPRESSED: 4,
      RSA_NO_PADDING: 3,
      RSA_PKCS1_OAEP_PADDING: 4,
      RSA_PKCS1_PADDING: 1,
      RSA_PKCS1_PSS_PADDING: 6,
      RSA_PSS_SALTLEN_AUTO: -2,
      RSA_PSS_SALTLEN_DIGEST: -1,
      RSA_PSS_SALTLEN_MAX_SIGN: -2,
      RSA_X931_PADDING: 5,
      SSL_OP_ALL: 2147485776,
      SSL_OP_ALLOW_NO_DHE_KEX: 1024,
      SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION: 262144,
      SSL_OP_CIPHER_SERVER_PREFERENCE: 4194304,
      SSL_OP_CISCO_ANYCONNECT: 32768,
      SSL_OP_COOKIE_EXCHANGE: 8192,
      SSL_OP_CRYPTOPRO_TLSEXT_BUG: 2147483648,
      SSL_OP_DONT_INSERT_EMPTY_FRAGMENTS: 2048,
      SSL_OP_EPHEMERAL_RSA: 0,
      // Node.js v18 only
      SSL_OP_LEGACY_SERVER_CONNECT: 4,
      SSL_OP_MICROSOFT_BIG_SSLV3_BUFFER: 0,
      // Node.js v18 only
      SSL_OP_MICROSOFT_SESS_ID_BUG: 0,
      // Node.js v18 only
      SSL_OP_MSIE_SSLV2_RSA_PADDING: 0,
      // Node.js v18 only
      SSL_OP_NETSCAPE_CA_DN_BUG: 0,
      // Node.js v18 only
      SSL_OP_NETSCAPE_CHALLENGE_BUG: 0,
      // Node.js v18 only
      SSL_OP_NETSCAPE_DEMO_CIPHER_CHANGE_BUG: 0,
      // Node.js v18 only
      SSL_OP_NETSCAPE_REUSE_CIPHER_CHANGE_BUG: 0,
      // Node.js v18 only
      SSL_OP_NO_COMPRESSION: 131072,
      SSL_OP_NO_ENCRYPT_THEN_MAC: 524288,
      SSL_OP_NO_QUERY_MTU: 4096,
      SSL_OP_NO_RENEGOTIATION: 1073741824,
      SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION: 65536,
      SSL_OP_NO_SSLv2: 0,
      SSL_OP_NO_SSLv3: 33554432,
      SSL_OP_NO_TICKET: 16384,
      SSL_OP_NO_TLSv1_1: 268435456,
      SSL_OP_NO_TLSv1_2: 134217728,
      SSL_OP_NO_TLSv1_3: 536870912,
      SSL_OP_NO_TLSv1: 67108864,
      SSL_OP_PKCS1_CHECK_1: 0,
      // Node.js v18 only
      SSL_OP_PKCS1_CHECK_2: 0,
      // Node.js v18 only
      SSL_OP_PRIORITIZE_CHACHA: 2097152,
      SSL_OP_SINGLE_DH_USE: 0,
      // Node.js v18 only
      SSL_OP_SINGLE_ECDH_USE: 0,
      // Node.js v18 only
      SSL_OP_SSLEAY_080_CLIENT_DH_BUG: 0,
      // Node.js v18 only
      SSL_OP_SSLREF2_REUSE_CERT_TYPE_BUG: 0,
      // Node.js v18 only
      SSL_OP_TLS_BLOCK_PADDING_BUG: 0,
      // Node.js v18 only
      SSL_OP_TLS_D5_BUG: 0,
      // Node.js v18 only
      SSL_OP_TLS_ROLLBACK_BUG: 8388608,
      TLS1_1_VERSION: 0,
      // explicitly set to 0 to avoid version misdetection
      TLS1_2_VERSION: 0,
      // explicitly set to 0 to avoid version misdetection
      TLS1_3_VERSION: 0,
      // explicitly set to 0 to avoid version misdetection
      TLS1_VERSION: 0,
      // explicitly set to 0 to avoid version misdetection
      defaultCoreCipherList: "",
      // explicitly set to "" to avoid version misdetection
      get defaultCipherList() {
        return constants2.defaultCoreCipherList;
      },
      set defaultCipherList(_ignored) {
      }
    };
    constants_default = constants2;
  }
});

// node_modules/unenv/runtime/node/crypto/index.mjs
var crypto_default;
var init_crypto = __esm({
  "node_modules/unenv/runtime/node/crypto/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_web();
    init_node();
    init_constants();
    init_web();
    init_node();
    init_constants();
    crypto_default = {
      ...web_exports,
      ...node_exports,
      // @ts-expect-error @types/node is out of date - this is a bug in typings
      constants: constants_default
    };
  }
});

// node_modules/unenv/runtime/node/crypto/$cloudflare.mjs
var workerdCrypto, Certificate2, DiffieHellman2, DiffieHellmanGroup2, Hash2, Hmac2, KeyObject2, X509Certificate2, checkPrime2, checkPrimeSync2, createDiffieHellman2, createDiffieHellmanGroup2, createHash2, createHmac2, createPrivateKey2, createPublicKey2, createSecretKey2, generateKey2, generateKeyPair2, generateKeyPairSync2, generateKeySync2, generatePrime2, generatePrimeSync2, getCiphers2, getCurves2, getDiffieHellman2, getFips2, getHashes2, hkdf2, hkdfSync2, pbkdf22, pbkdf2Sync2, randomBytes2, randomFill2, randomFillSync2, randomInt2, randomUUID2, scrypt2, scryptSync2, secureHeapUsed2, setEngine2, setFips2, subtle2, timingSafeEqual2, getRandomValues2, webcrypto2, fips2, cloudflare_default4;
var init_cloudflare5 = __esm({
  "node_modules/unenv/runtime/node/crypto/$cloudflare.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_crypto();
    init_crypto();
    workerdCrypto = process.getBuiltinModule("node:crypto");
    ({
      Certificate: Certificate2,
      DiffieHellman: DiffieHellman2,
      DiffieHellmanGroup: DiffieHellmanGroup2,
      Hash: Hash2,
      Hmac: Hmac2,
      KeyObject: KeyObject2,
      X509Certificate: X509Certificate2,
      checkPrime: checkPrime2,
      checkPrimeSync: checkPrimeSync2,
      createDiffieHellman: createDiffieHellman2,
      createDiffieHellmanGroup: createDiffieHellmanGroup2,
      createHash: createHash2,
      createHmac: createHmac2,
      createPrivateKey: createPrivateKey2,
      createPublicKey: createPublicKey2,
      createSecretKey: createSecretKey2,
      generateKey: generateKey2,
      generateKeyPair: generateKeyPair2,
      generateKeyPairSync: generateKeyPairSync2,
      generateKeySync: generateKeySync2,
      generatePrime: generatePrime2,
      generatePrimeSync: generatePrimeSync2,
      getCiphers: getCiphers2,
      getCurves: getCurves2,
      getDiffieHellman: getDiffieHellman2,
      getFips: getFips2,
      getHashes: getHashes2,
      hkdf: hkdf2,
      hkdfSync: hkdfSync2,
      pbkdf2: pbkdf22,
      pbkdf2Sync: pbkdf2Sync2,
      randomBytes: randomBytes2,
      randomFill: randomFill2,
      randomFillSync: randomFillSync2,
      randomInt: randomInt2,
      randomUUID: randomUUID2,
      scrypt: scrypt2,
      scryptSync: scryptSync2,
      secureHeapUsed: secureHeapUsed2,
      setEngine: setEngine2,
      setFips: setFips2,
      subtle: subtle2,
      timingSafeEqual: timingSafeEqual2
    } = workerdCrypto);
    getRandomValues2 = workerdCrypto.getRandomValues.bind(
      workerdCrypto.webcrypto
    );
    webcrypto2 = {
      CryptoKey: webcrypto.CryptoKey,
      getRandomValues: getRandomValues2,
      randomUUID: randomUUID2,
      subtle: subtle2
    };
    fips2 = workerdCrypto.fips;
    cloudflare_default4 = {
      /**
       * manually unroll unenv-polyfilled-symbols to make it tree-shakeable
       */
      Certificate: Certificate2,
      Cipher,
      Cipheriv,
      Decipher,
      Decipheriv,
      ECDH,
      Sign,
      Verify,
      X509Certificate: X509Certificate2,
      // @ts-expect-error @types/node is out of date - this is a bug in typings
      constants: constants_default,
      createCipheriv,
      createDecipheriv,
      createECDH,
      createSign,
      createVerify,
      diffieHellman,
      getCipherInfo,
      hash,
      privateDecrypt,
      privateEncrypt,
      publicDecrypt,
      publicEncrypt,
      scrypt: scrypt2,
      scryptSync: scryptSync2,
      sign,
      verify,
      // default-only export from unenv
      createCipher,
      createDecipher,
      pseudoRandomBytes,
      /**
       * manually unroll workerd-polyfilled-symbols to make it tree-shakeable
       */
      DiffieHellman: DiffieHellman2,
      DiffieHellmanGroup: DiffieHellmanGroup2,
      Hash: Hash2,
      Hmac: Hmac2,
      KeyObject: KeyObject2,
      checkPrime: checkPrime2,
      checkPrimeSync: checkPrimeSync2,
      createDiffieHellman: createDiffieHellman2,
      createDiffieHellmanGroup: createDiffieHellmanGroup2,
      createHash: createHash2,
      createHmac: createHmac2,
      createPrivateKey: createPrivateKey2,
      createPublicKey: createPublicKey2,
      createSecretKey: createSecretKey2,
      generateKey: generateKey2,
      generateKeyPair: generateKeyPair2,
      generateKeyPairSync: generateKeyPairSync2,
      generateKeySync: generateKeySync2,
      generatePrime: generatePrime2,
      generatePrimeSync: generatePrimeSync2,
      getCiphers: getCiphers2,
      getCurves: getCurves2,
      getDiffieHellman: getDiffieHellman2,
      getFips: getFips2,
      getHashes: getHashes2,
      getRandomValues: getRandomValues2,
      hkdf: hkdf2,
      hkdfSync: hkdfSync2,
      pbkdf2: pbkdf22,
      pbkdf2Sync: pbkdf2Sync2,
      randomBytes: randomBytes2,
      randomFill: randomFill2,
      randomFillSync: randomFillSync2,
      randomInt: randomInt2,
      randomUUID: randomUUID2,
      secureHeapUsed: secureHeapUsed2,
      setEngine: setEngine2,
      setFips: setFips2,
      subtle: subtle2,
      timingSafeEqual: timingSafeEqual2,
      // default-only export from workerd
      fips: fips2,
      // special-cased deep merged symbols
      webcrypto: webcrypto2
    };
  }
});

// node-built-in-modules:crypto
var require_crypto = __commonJS({
  "node-built-in-modules:crypto"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_cloudflare5();
    module.exports = cloudflare_default4;
  }
});

// node_modules/ioredis/built/Script.js
var require_Script = __commonJS({
  "node_modules/ioredis/built/Script.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var crypto_1 = require_crypto();
    var Command_1 = require_Command();
    var standard_as_callback_1 = require_built2();
    var Script = class {
      constructor(lua, numberOfKeys = null, keyPrefix = "", readOnly = false) {
        this.lua = lua;
        this.numberOfKeys = numberOfKeys;
        this.keyPrefix = keyPrefix;
        this.readOnly = readOnly;
        this.sha = (0, crypto_1.createHash)("sha1").update(lua).digest("hex");
        const sha = this.sha;
        const socketHasScriptLoaded = /* @__PURE__ */ new WeakSet();
        this.Command = /* @__PURE__ */ __name(class CustomScriptCommand extends Command_1.default {
          toWritable(socket) {
            const origReject = this.reject;
            this.reject = (err) => {
              if (err.message.indexOf("NOSCRIPT") !== -1) {
                socketHasScriptLoaded.delete(socket);
              }
              origReject.call(this, err);
            };
            if (!socketHasScriptLoaded.has(socket)) {
              socketHasScriptLoaded.add(socket);
              this.name = "eval";
              this.args[0] = lua;
            } else if (this.name === "eval") {
              this.name = "evalsha";
              this.args[0] = sha;
            }
            return super.toWritable(socket);
          }
        }, "CustomScriptCommand");
      }
      execute(container, args, options, callback) {
        if (typeof this.numberOfKeys === "number") {
          args.unshift(this.numberOfKeys);
        }
        if (this.keyPrefix) {
          options.keyPrefix = this.keyPrefix;
        }
        if (this.readOnly) {
          options.readOnly = true;
        }
        const evalsha = new this.Command("evalsha", [this.sha, ...args], options);
        evalsha.promise = evalsha.promise.catch((err) => {
          if (err.message.indexOf("NOSCRIPT") === -1) {
            throw err;
          }
          const resend = new this.Command("evalsha", [this.sha, ...args], options);
          const client = container.isPipeline ? container.redis : container;
          return client.sendCommand(resend);
        });
        (0, standard_as_callback_1.default)(evalsha.promise, callback);
        return container.sendCommand(evalsha);
      }
    };
    __name(Script, "Script");
    exports2.default = Script;
  }
});

// node_modules/ioredis/built/utils/Commander.js
var require_Commander = __commonJS({
  "node_modules/ioredis/built/utils/Commander.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var commands_1 = require_built();
    var autoPipelining_1 = require_autoPipelining();
    var Command_1 = require_Command();
    var Script_1 = require_Script();
    var Commander = class {
      constructor() {
        this.options = {};
        this.scriptsSet = {};
        this.addedBuiltinSet = /* @__PURE__ */ new Set();
      }
      /**
       * Return supported builtin commands
       */
      getBuiltinCommands() {
        return commands.slice(0);
      }
      /**
       * Create a builtin command
       */
      createBuiltinCommand(commandName) {
        return {
          string: generateFunction(null, commandName, "utf8"),
          buffer: generateFunction(null, commandName, null)
        };
      }
      /**
       * Create add builtin command
       */
      addBuiltinCommand(commandName) {
        this.addedBuiltinSet.add(commandName);
        this[commandName] = generateFunction(commandName, commandName, "utf8");
        this[commandName + "Buffer"] = generateFunction(commandName + "Buffer", commandName, null);
      }
      /**
       * Define a custom command using lua script
       */
      defineCommand(name, definition) {
        const script = new Script_1.default(definition.lua, definition.numberOfKeys, this.options.keyPrefix, definition.readOnly);
        this.scriptsSet[name] = script;
        this[name] = generateScriptingFunction(name, name, script, "utf8");
        this[name + "Buffer"] = generateScriptingFunction(name + "Buffer", name, script, null);
      }
      /**
       * @ignore
       */
      sendCommand(command, stream, node) {
        throw new Error('"sendCommand" is not implemented');
      }
    };
    __name(Commander, "Commander");
    var commands = commands_1.list.filter((command) => command !== "monitor");
    commands.push("sentinel");
    commands.forEach(function(commandName) {
      Commander.prototype[commandName] = generateFunction(commandName, commandName, "utf8");
      Commander.prototype[commandName + "Buffer"] = generateFunction(commandName + "Buffer", commandName, null);
    });
    Commander.prototype.call = generateFunction("call", "utf8");
    Commander.prototype.callBuffer = generateFunction("callBuffer", null);
    Commander.prototype.send_command = Commander.prototype.call;
    function generateFunction(functionName, _commandName, _encoding) {
      if (typeof _encoding === "undefined") {
        _encoding = _commandName;
        _commandName = null;
      }
      return function(...args) {
        const commandName = _commandName || args.shift();
        let callback = args[args.length - 1];
        if (typeof callback === "function") {
          args.pop();
        } else {
          callback = void 0;
        }
        const options = {
          errorStack: this.options.showFriendlyErrorStack ? new Error() : void 0,
          keyPrefix: this.options.keyPrefix,
          replyEncoding: _encoding
        };
        if (!(0, autoPipelining_1.shouldUseAutoPipelining)(this, functionName, commandName)) {
          return this.sendCommand(
            // @ts-expect-error
            new Command_1.default(commandName, args, options, callback)
          );
        }
        return (0, autoPipelining_1.executeWithAutoPipelining)(
          this,
          functionName,
          commandName,
          // @ts-expect-error
          args,
          callback
        );
      };
    }
    __name(generateFunction, "generateFunction");
    function generateScriptingFunction(functionName, commandName, script, encoding) {
      return function(...args) {
        const callback = typeof args[args.length - 1] === "function" ? args.pop() : void 0;
        const options = {
          replyEncoding: encoding
        };
        if (this.options.showFriendlyErrorStack) {
          options.errorStack = new Error();
        }
        if (!(0, autoPipelining_1.shouldUseAutoPipelining)(this, functionName, commandName)) {
          return script.execute(this, args, options, callback);
        }
        return (0, autoPipelining_1.executeWithAutoPipelining)(this, functionName, commandName, args, callback);
      };
    }
    __name(generateScriptingFunction, "generateScriptingFunction");
    exports2.default = Commander;
  }
});

// node_modules/ioredis/built/Pipeline.js
var require_Pipeline = __commonJS({
  "node_modules/ioredis/built/Pipeline.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var calculateSlot = require_lib();
    var commands_1 = require_built();
    var standard_as_callback_1 = require_built2();
    var util_1 = require_util();
    var Command_1 = require_Command();
    var utils_1 = require_utils2();
    var Commander_1 = require_Commander();
    function generateMultiWithNodes(redis, keys) {
      const slot = calculateSlot(keys[0]);
      const target = redis._groupsBySlot[slot];
      for (let i = 1; i < keys.length; i++) {
        if (redis._groupsBySlot[calculateSlot(keys[i])] !== target) {
          return -1;
        }
      }
      return slot;
    }
    __name(generateMultiWithNodes, "generateMultiWithNodes");
    var Pipeline = class extends Commander_1.default {
      constructor(redis) {
        super();
        this.redis = redis;
        this.isPipeline = true;
        this.replyPending = 0;
        this._queue = [];
        this._result = [];
        this._transactions = 0;
        this._shaToScript = {};
        this.isCluster = this.redis.constructor.name === "Cluster" || this.redis.isCluster;
        this.options = redis.options;
        Object.keys(redis.scriptsSet).forEach((name) => {
          const script = redis.scriptsSet[name];
          this._shaToScript[script.sha] = script;
          this[name] = redis[name];
          this[name + "Buffer"] = redis[name + "Buffer"];
        });
        redis.addedBuiltinSet.forEach((name) => {
          this[name] = redis[name];
          this[name + "Buffer"] = redis[name + "Buffer"];
        });
        this.promise = new Promise((resolve, reject) => {
          this.resolve = resolve;
          this.reject = reject;
        });
        const _this = this;
        Object.defineProperty(this, "length", {
          get: function() {
            return _this._queue.length;
          }
        });
      }
      fillResult(value, position) {
        if (this._queue[position].name === "exec" && Array.isArray(value[1])) {
          const execLength = value[1].length;
          for (let i = 0; i < execLength; i++) {
            if (value[1][i] instanceof Error) {
              continue;
            }
            const cmd = this._queue[position - (execLength - i)];
            try {
              value[1][i] = cmd.transformReply(value[1][i]);
            } catch (err) {
              value[1][i] = err;
            }
          }
        }
        this._result[position] = value;
        if (--this.replyPending) {
          return;
        }
        if (this.isCluster) {
          let retriable = true;
          let commonError;
          for (let i = 0; i < this._result.length; ++i) {
            const error3 = this._result[i][0];
            const command = this._queue[i];
            if (error3) {
              if (command.name === "exec" && error3.message === "EXECABORT Transaction discarded because of previous errors.") {
                continue;
              }
              if (!commonError) {
                commonError = {
                  name: error3.name,
                  message: error3.message
                };
              } else if (commonError.name !== error3.name || commonError.message !== error3.message) {
                retriable = false;
                break;
              }
            } else if (!command.inTransaction) {
              const isReadOnly = (0, commands_1.exists)(command.name) && (0, commands_1.hasFlag)(command.name, "readonly");
              if (!isReadOnly) {
                retriable = false;
                break;
              }
            }
          }
          if (commonError && retriable) {
            const _this = this;
            const errv = commonError.message.split(" ");
            const queue = this._queue;
            let inTransaction = false;
            this._queue = [];
            for (let i = 0; i < queue.length; ++i) {
              if (errv[0] === "ASK" && !inTransaction && queue[i].name !== "asking" && (!queue[i - 1] || queue[i - 1].name !== "asking")) {
                const asking = new Command_1.default("asking");
                asking.ignore = true;
                this.sendCommand(asking);
              }
              queue[i].initPromise();
              this.sendCommand(queue[i]);
              inTransaction = queue[i].inTransaction;
            }
            let matched = true;
            if (typeof this.leftRedirections === "undefined") {
              this.leftRedirections = {};
            }
            const exec = /* @__PURE__ */ __name(function() {
              _this.exec();
            }, "exec");
            const cluster = this.redis;
            cluster.handleError(commonError, this.leftRedirections, {
              moved: function(_slot, key) {
                _this.preferKey = key;
                cluster.slots[errv[1]] = [key];
                cluster._groupsBySlot[errv[1]] = cluster._groupsIds[cluster.slots[errv[1]].join(";")];
                cluster.refreshSlotsCache();
                _this.exec();
              },
              ask: function(_slot, key) {
                _this.preferKey = key;
                _this.exec();
              },
              tryagain: exec,
              clusterDown: exec,
              connectionClosed: exec,
              maxRedirections: () => {
                matched = false;
              },
              defaults: () => {
                matched = false;
              }
            });
            if (matched) {
              return;
            }
          }
        }
        let ignoredCount = 0;
        for (let i = 0; i < this._queue.length - ignoredCount; ++i) {
          if (this._queue[i + ignoredCount].ignore) {
            ignoredCount += 1;
          }
          this._result[i] = this._result[i + ignoredCount];
        }
        this.resolve(this._result.slice(0, this._result.length - ignoredCount));
      }
      sendCommand(command) {
        if (this._transactions > 0) {
          command.inTransaction = true;
        }
        const position = this._queue.length;
        command.pipelineIndex = position;
        command.promise.then((result) => {
          this.fillResult([null, result], position);
        }).catch((error3) => {
          this.fillResult([error3], position);
        });
        this._queue.push(command);
        return this;
      }
      addBatch(commands) {
        let command, commandName, args;
        for (let i = 0; i < commands.length; ++i) {
          command = commands[i];
          commandName = command[0];
          args = command.slice(1);
          this[commandName].apply(this, args);
        }
        return this;
      }
    };
    __name(Pipeline, "Pipeline");
    exports2.default = Pipeline;
    var multi = Pipeline.prototype.multi;
    Pipeline.prototype.multi = function() {
      this._transactions += 1;
      return multi.apply(this, arguments);
    };
    var execBuffer = Pipeline.prototype.execBuffer;
    Pipeline.prototype.execBuffer = (0, util_1.deprecate)(function() {
      if (this._transactions > 0) {
        this._transactions -= 1;
      }
      return execBuffer.apply(this, arguments);
    }, "Pipeline#execBuffer: Use Pipeline#exec instead");
    Pipeline.prototype.exec = function(callback) {
      if (this.isCluster && !this.redis.slots.length) {
        if (this.redis.status === "wait")
          this.redis.connect().catch(utils_1.noop);
        if (callback && !this.nodeifiedPromise) {
          this.nodeifiedPromise = true;
          (0, standard_as_callback_1.default)(this.promise, callback);
        }
        this.redis.delayUntilReady((err) => {
          if (err) {
            this.reject(err);
            return;
          }
          this.exec(callback);
        });
        return this.promise;
      }
      if (this._transactions > 0) {
        this._transactions -= 1;
        return execBuffer.apply(this, arguments);
      }
      if (!this.nodeifiedPromise) {
        this.nodeifiedPromise = true;
        (0, standard_as_callback_1.default)(this.promise, callback);
      }
      if (!this._queue.length) {
        this.resolve([]);
      }
      let pipelineSlot;
      if (this.isCluster) {
        const sampleKeys = [];
        for (let i = 0; i < this._queue.length; i++) {
          const keys = this._queue[i].getKeys();
          if (keys.length) {
            sampleKeys.push(keys[0]);
          }
          if (keys.length && calculateSlot.generateMulti(keys) < 0) {
            this.reject(new Error("All the keys in a pipeline command should belong to the same slot"));
            return this.promise;
          }
        }
        if (sampleKeys.length) {
          pipelineSlot = generateMultiWithNodes(this.redis, sampleKeys);
          if (pipelineSlot < 0) {
            this.reject(new Error("All keys in the pipeline should belong to the same slots allocation group"));
            return this.promise;
          }
        } else {
          pipelineSlot = Math.random() * 16384 | 0;
        }
      }
      const _this = this;
      execPipeline();
      return this.promise;
      function execPipeline() {
        let writePending = _this.replyPending = _this._queue.length;
        let node;
        if (_this.isCluster) {
          node = {
            slot: pipelineSlot,
            redis: _this.redis.connectionPool.nodes.all[_this.preferKey]
          };
        }
        let data = "";
        let buffers;
        const stream = {
          isPipeline: true,
          destination: _this.isCluster ? node : { redis: _this.redis },
          write(writable) {
            if (typeof writable !== "string") {
              if (!buffers) {
                buffers = [];
              }
              if (data) {
                buffers.push(Buffer.from(data, "utf8"));
                data = "";
              }
              buffers.push(writable);
            } else {
              data += writable;
            }
            if (!--writePending) {
              if (buffers) {
                if (data) {
                  buffers.push(Buffer.from(data, "utf8"));
                }
                stream.destination.redis.stream.write(Buffer.concat(buffers));
              } else {
                stream.destination.redis.stream.write(data);
              }
              writePending = _this._queue.length;
              data = "";
              buffers = void 0;
            }
          }
        };
        for (let i = 0; i < _this._queue.length; ++i) {
          _this.redis.sendCommand(_this._queue[i], stream, node);
        }
        return _this.promise;
      }
      __name(execPipeline, "execPipeline");
    };
  }
});

// node_modules/ioredis/built/transaction.js
var require_transaction = __commonJS({
  "node_modules/ioredis/built/transaction.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addTransactionSupport = void 0;
    var utils_1 = require_utils2();
    var standard_as_callback_1 = require_built2();
    var Pipeline_1 = require_Pipeline();
    function addTransactionSupport(redis) {
      redis.pipeline = function(commands) {
        const pipeline = new Pipeline_1.default(this);
        if (Array.isArray(commands)) {
          pipeline.addBatch(commands);
        }
        return pipeline;
      };
      const { multi } = redis;
      redis.multi = function(commands, options) {
        if (typeof options === "undefined" && !Array.isArray(commands)) {
          options = commands;
          commands = null;
        }
        if (options && options.pipeline === false) {
          return multi.call(this);
        }
        const pipeline = new Pipeline_1.default(this);
        pipeline.multi();
        if (Array.isArray(commands)) {
          pipeline.addBatch(commands);
        }
        const exec2 = pipeline.exec;
        pipeline.exec = function(callback) {
          if (this.isCluster && !this.redis.slots.length) {
            if (this.redis.status === "wait")
              this.redis.connect().catch(utils_1.noop);
            return (0, standard_as_callback_1.default)(new Promise((resolve, reject) => {
              this.redis.delayUntilReady((err) => {
                if (err) {
                  reject(err);
                  return;
                }
                this.exec(pipeline).then(resolve, reject);
              });
            }), callback);
          }
          if (this._transactions > 0) {
            exec2.call(pipeline);
          }
          if (this.nodeifiedPromise) {
            return exec2.call(pipeline);
          }
          const promise = exec2.call(pipeline);
          return (0, standard_as_callback_1.default)(promise.then(function(result) {
            const execResult = result[result.length - 1];
            if (typeof execResult === "undefined") {
              throw new Error("Pipeline cannot be used to send any commands when the `exec()` has been called on it.");
            }
            if (execResult[0]) {
              execResult[0].previousErrors = [];
              for (let i = 0; i < result.length - 1; ++i) {
                if (result[i][0]) {
                  execResult[0].previousErrors.push(result[i][0]);
                }
              }
              throw execResult[0];
            }
            return (0, utils_1.wrapMultiResult)(execResult[1]);
          }), callback);
        };
        const { execBuffer } = pipeline;
        pipeline.execBuffer = function(callback) {
          if (this._transactions > 0) {
            execBuffer.call(pipeline);
          }
          return pipeline.exec(callback);
        };
        return pipeline;
      };
      const { exec } = redis;
      redis.exec = function(callback) {
        return (0, standard_as_callback_1.default)(exec.call(this).then(function(results) {
          if (Array.isArray(results)) {
            results = (0, utils_1.wrapMultiResult)(results);
          }
          return results;
        }), callback);
      };
    }
    __name(addTransactionSupport, "addTransactionSupport");
    exports2.addTransactionSupport = addTransactionSupport;
  }
});

// node_modules/ioredis/built/utils/applyMixin.js
var require_applyMixin = __commonJS({
  "node_modules/ioredis/built/utils/applyMixin.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    function applyMixin(derivedConstructor, mixinConstructor) {
      Object.getOwnPropertyNames(mixinConstructor.prototype).forEach((name) => {
        Object.defineProperty(derivedConstructor.prototype, name, Object.getOwnPropertyDescriptor(mixinConstructor.prototype, name));
      });
    }
    __name(applyMixin, "applyMixin");
    exports2.default = applyMixin;
  }
});

// node-built-in-modules:dns
import libDefault5 from "dns";
var require_dns = __commonJS({
  "node-built-in-modules:dns"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = libDefault5;
  }
});

// node_modules/ioredis/built/cluster/ClusterOptions.js
var require_ClusterOptions = __commonJS({
  "node_modules/ioredis/built/cluster/ClusterOptions.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DEFAULT_CLUSTER_OPTIONS = void 0;
    var dns_1 = require_dns();
    exports2.DEFAULT_CLUSTER_OPTIONS = {
      clusterRetryStrategy: (times) => Math.min(100 + times * 2, 2e3),
      enableOfflineQueue: true,
      enableReadyCheck: true,
      scaleReads: "master",
      maxRedirections: 16,
      retryDelayOnMoved: 0,
      retryDelayOnFailover: 100,
      retryDelayOnClusterDown: 100,
      retryDelayOnTryAgain: 100,
      slotsRefreshTimeout: 1e3,
      useSRVRecords: false,
      resolveSrv: dns_1.resolveSrv,
      dnsLookup: dns_1.lookup,
      enableAutoPipelining: false,
      autoPipeliningIgnoredCommands: []
    };
  }
});

// node-built-in-modules:net
var require_net = __commonJS({
  "node-built-in-modules:net"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_net();
    module.exports = net_default;
  }
});

// node_modules/ioredis/built/cluster/util.js
var require_util2 = __commonJS({
  "node_modules/ioredis/built/cluster/util.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getConnectionName = exports2.weightSrvRecords = exports2.groupSrvRecords = exports2.getUniqueHostnamesFromOptions = exports2.normalizeNodeOptions = exports2.nodeKeyToRedisOptions = exports2.getNodeKey = void 0;
    var utils_1 = require_utils2();
    var net_1 = require_net();
    function getNodeKey(node) {
      node.port = node.port || 6379;
      node.host = node.host || "127.0.0.1";
      return node.host + ":" + node.port;
    }
    __name(getNodeKey, "getNodeKey");
    exports2.getNodeKey = getNodeKey;
    function nodeKeyToRedisOptions(nodeKey) {
      const portIndex = nodeKey.lastIndexOf(":");
      if (portIndex === -1) {
        throw new Error(`Invalid node key ${nodeKey}`);
      }
      return {
        host: nodeKey.slice(0, portIndex),
        port: Number(nodeKey.slice(portIndex + 1))
      };
    }
    __name(nodeKeyToRedisOptions, "nodeKeyToRedisOptions");
    exports2.nodeKeyToRedisOptions = nodeKeyToRedisOptions;
    function normalizeNodeOptions(nodes) {
      return nodes.map((node) => {
        const options = {};
        if (typeof node === "object") {
          Object.assign(options, node);
        } else if (typeof node === "string") {
          Object.assign(options, (0, utils_1.parseURL)(node));
        } else if (typeof node === "number") {
          options.port = node;
        } else {
          throw new Error("Invalid argument " + node);
        }
        if (typeof options.port === "string") {
          options.port = parseInt(options.port, 10);
        }
        delete options.db;
        if (!options.port) {
          options.port = 6379;
        }
        if (!options.host) {
          options.host = "127.0.0.1";
        }
        return (0, utils_1.resolveTLSProfile)(options);
      });
    }
    __name(normalizeNodeOptions, "normalizeNodeOptions");
    exports2.normalizeNodeOptions = normalizeNodeOptions;
    function getUniqueHostnamesFromOptions(nodes) {
      const uniqueHostsMap = {};
      nodes.forEach((node) => {
        uniqueHostsMap[node.host] = true;
      });
      return Object.keys(uniqueHostsMap).filter((host) => !(0, net_1.isIP)(host));
    }
    __name(getUniqueHostnamesFromOptions, "getUniqueHostnamesFromOptions");
    exports2.getUniqueHostnamesFromOptions = getUniqueHostnamesFromOptions;
    function groupSrvRecords(records) {
      const recordsByPriority = {};
      for (const record of records) {
        if (!recordsByPriority.hasOwnProperty(record.priority)) {
          recordsByPriority[record.priority] = {
            totalWeight: record.weight,
            records: [record]
          };
        } else {
          recordsByPriority[record.priority].totalWeight += record.weight;
          recordsByPriority[record.priority].records.push(record);
        }
      }
      return recordsByPriority;
    }
    __name(groupSrvRecords, "groupSrvRecords");
    exports2.groupSrvRecords = groupSrvRecords;
    function weightSrvRecords(recordsGroup) {
      if (recordsGroup.records.length === 1) {
        recordsGroup.totalWeight = 0;
        return recordsGroup.records.shift();
      }
      const random = Math.floor(Math.random() * (recordsGroup.totalWeight + recordsGroup.records.length));
      let total = 0;
      for (const [i, record] of recordsGroup.records.entries()) {
        total += 1 + record.weight;
        if (total > random) {
          recordsGroup.totalWeight -= record.weight;
          recordsGroup.records.splice(i, 1);
          return record;
        }
      }
    }
    __name(weightSrvRecords, "weightSrvRecords");
    exports2.weightSrvRecords = weightSrvRecords;
    function getConnectionName(component, nodeConnectionName) {
      const prefix = `ioredis-cluster(${component})`;
      return nodeConnectionName ? `${prefix}:${nodeConnectionName}` : prefix;
    }
    __name(getConnectionName, "getConnectionName");
    exports2.getConnectionName = getConnectionName;
  }
});

// node_modules/ioredis/built/cluster/ClusterSubscriber.js
var require_ClusterSubscriber = __commonJS({
  "node_modules/ioredis/built/cluster/ClusterSubscriber.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var util_1 = require_util2();
    var utils_1 = require_utils2();
    var Redis_1 = require_Redis();
    var debug5 = (0, utils_1.Debug)("cluster:subscriber");
    var ClusterSubscriber = class {
      constructor(connectionPool, emitter) {
        this.connectionPool = connectionPool;
        this.emitter = emitter;
        this.started = false;
        this.subscriber = null;
        this.onSubscriberEnd = () => {
          if (!this.started) {
            debug5("subscriber has disconnected, but ClusterSubscriber is not started, so not reconnecting.");
            return;
          }
          debug5("subscriber has disconnected, selecting a new one...");
          this.selectSubscriber();
        };
        this.connectionPool.on("-node", (_, key) => {
          if (!this.started || !this.subscriber) {
            return;
          }
          if ((0, util_1.getNodeKey)(this.subscriber.options) === key) {
            debug5("subscriber has left, selecting a new one...");
            this.selectSubscriber();
          }
        });
        this.connectionPool.on("+node", () => {
          if (!this.started || this.subscriber) {
            return;
          }
          debug5("a new node is discovered and there is no subscriber, selecting a new one...");
          this.selectSubscriber();
        });
      }
      getInstance() {
        return this.subscriber;
      }
      start() {
        this.started = true;
        this.selectSubscriber();
        debug5("started");
      }
      stop() {
        this.started = false;
        if (this.subscriber) {
          this.subscriber.disconnect();
          this.subscriber = null;
        }
        debug5("stopped");
      }
      selectSubscriber() {
        const lastActiveSubscriber = this.lastActiveSubscriber;
        if (lastActiveSubscriber) {
          lastActiveSubscriber.off("end", this.onSubscriberEnd);
          lastActiveSubscriber.disconnect();
        }
        if (this.subscriber) {
          this.subscriber.off("end", this.onSubscriberEnd);
          this.subscriber.disconnect();
        }
        const sampleNode = (0, utils_1.sample)(this.connectionPool.getNodes());
        if (!sampleNode) {
          debug5("selecting subscriber failed since there is no node discovered in the cluster yet");
          this.subscriber = null;
          return;
        }
        const { options } = sampleNode;
        debug5("selected a subscriber %s:%s", options.host, options.port);
        this.subscriber = new Redis_1.default({
          port: options.port,
          host: options.host,
          username: options.username,
          password: options.password,
          enableReadyCheck: true,
          connectionName: (0, util_1.getConnectionName)("subscriber", options.connectionName),
          lazyConnect: true,
          tls: options.tls,
          // Don't try to reconnect the subscriber connection. If the connection fails
          // we will get an end event (handled below), at which point we'll pick a new
          // node from the pool and try to connect to that as the subscriber connection.
          retryStrategy: null
        });
        this.subscriber.on("error", utils_1.noop);
        this.subscriber.once("end", this.onSubscriberEnd);
        const previousChannels = { subscribe: [], psubscribe: [], ssubscribe: [] };
        if (lastActiveSubscriber) {
          const condition = lastActiveSubscriber.condition || lastActiveSubscriber.prevCondition;
          if (condition && condition.subscriber) {
            previousChannels.subscribe = condition.subscriber.channels("subscribe");
            previousChannels.psubscribe = condition.subscriber.channels("psubscribe");
            previousChannels.ssubscribe = condition.subscriber.channels("ssubscribe");
          }
        }
        if (previousChannels.subscribe.length || previousChannels.psubscribe.length || previousChannels.ssubscribe.length) {
          let pending = 0;
          for (const type of ["subscribe", "psubscribe", "ssubscribe"]) {
            const channels = previousChannels[type];
            if (channels.length) {
              pending += 1;
              debug5("%s %d channels", type, channels.length);
              this.subscriber[type](channels).then(() => {
                if (!--pending) {
                  this.lastActiveSubscriber = this.subscriber;
                }
              }).catch(() => {
                debug5("failed to %s %d channels", type, channels.length);
              });
            }
          }
        } else {
          this.lastActiveSubscriber = this.subscriber;
        }
        for (const event of [
          "message",
          "messageBuffer",
          "smessage",
          "smessageBuffer"
        ]) {
          this.subscriber.on(event, (arg1, arg2) => {
            this.emitter.emit(event, arg1, arg2);
          });
        }
        for (const event of ["pmessage", "pmessageBuffer"]) {
          this.subscriber.on(event, (arg1, arg2, arg3) => {
            this.emitter.emit(event, arg1, arg2, arg3);
          });
        }
      }
    };
    __name(ClusterSubscriber, "ClusterSubscriber");
    exports2.default = ClusterSubscriber;
  }
});

// node_modules/ioredis/built/cluster/ConnectionPool.js
var require_ConnectionPool = __commonJS({
  "node_modules/ioredis/built/cluster/ConnectionPool.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var events_1 = require_events();
    var utils_1 = require_utils2();
    var util_1 = require_util2();
    var Redis_1 = require_Redis();
    var debug5 = (0, utils_1.Debug)("cluster:connectionPool");
    var ConnectionPool = class extends events_1.EventEmitter {
      constructor(redisOptions) {
        super();
        this.redisOptions = redisOptions;
        this.nodes = {
          all: {},
          master: {},
          slave: {}
        };
        this.specifiedOptions = {};
      }
      getNodes(role = "all") {
        const nodes = this.nodes[role];
        return Object.keys(nodes).map((key) => nodes[key]);
      }
      getInstanceByKey(key) {
        return this.nodes.all[key];
      }
      getSampleInstance(role) {
        const keys = Object.keys(this.nodes[role]);
        const sampleKey = (0, utils_1.sample)(keys);
        return this.nodes[role][sampleKey];
      }
      /**
       * Find or create a connection to the node
       */
      findOrCreate(node, readOnly = false) {
        const key = (0, util_1.getNodeKey)(node);
        readOnly = Boolean(readOnly);
        if (this.specifiedOptions[key]) {
          Object.assign(node, this.specifiedOptions[key]);
        } else {
          this.specifiedOptions[key] = node;
        }
        let redis;
        if (this.nodes.all[key]) {
          redis = this.nodes.all[key];
          if (redis.options.readOnly !== readOnly) {
            redis.options.readOnly = readOnly;
            debug5("Change role of %s to %s", key, readOnly ? "slave" : "master");
            redis[readOnly ? "readonly" : "readwrite"]().catch(utils_1.noop);
            if (readOnly) {
              delete this.nodes.master[key];
              this.nodes.slave[key] = redis;
            } else {
              delete this.nodes.slave[key];
              this.nodes.master[key] = redis;
            }
          }
        } else {
          debug5("Connecting to %s as %s", key, readOnly ? "slave" : "master");
          redis = new Redis_1.default((0, utils_1.defaults)({
            // Never try to reconnect when a node is lose,
            // instead, waiting for a `MOVED` error and
            // fetch the slots again.
            retryStrategy: null,
            // Offline queue should be enabled so that
            // we don't need to wait for the `ready` event
            // before sending commands to the node.
            enableOfflineQueue: true,
            readOnly
          }, node, this.redisOptions, { lazyConnect: true }));
          this.nodes.all[key] = redis;
          this.nodes[readOnly ? "slave" : "master"][key] = redis;
          redis.once("end", () => {
            this.removeNode(key);
            this.emit("-node", redis, key);
            if (!Object.keys(this.nodes.all).length) {
              this.emit("drain");
            }
          });
          this.emit("+node", redis, key);
          redis.on("error", function(error3) {
            this.emit("nodeError", error3, key);
          });
        }
        return redis;
      }
      /**
       * Reset the pool with a set of nodes.
       * The old node will be removed.
       */
      reset(nodes) {
        debug5("Reset with %O", nodes);
        const newNodes = {};
        nodes.forEach((node) => {
          const key = (0, util_1.getNodeKey)(node);
          if (!(node.readOnly && newNodes[key])) {
            newNodes[key] = node;
          }
        });
        Object.keys(this.nodes.all).forEach((key) => {
          if (!newNodes[key]) {
            debug5("Disconnect %s because the node does not hold any slot", key);
            this.nodes.all[key].disconnect();
            this.removeNode(key);
          }
        });
        Object.keys(newNodes).forEach((key) => {
          const node = newNodes[key];
          this.findOrCreate(node, node.readOnly);
        });
      }
      /**
       * Remove a node from the pool.
       */
      removeNode(key) {
        const { nodes } = this;
        if (nodes.all[key]) {
          debug5("Remove %s from the pool", key);
          delete nodes.all[key];
        }
        delete nodes.master[key];
        delete nodes.slave[key];
      }
    };
    __name(ConnectionPool, "ConnectionPool");
    exports2.default = ConnectionPool;
  }
});

// node_modules/denque/index.js
var require_denque = __commonJS({
  "node_modules/denque/index.js"(exports2, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    function Denque(array, options) {
      var options = options || {};
      this._capacity = options.capacity;
      this._head = 0;
      this._tail = 0;
      if (Array.isArray(array)) {
        this._fromArray(array);
      } else {
        this._capacityMask = 3;
        this._list = new Array(4);
      }
    }
    __name(Denque, "Denque");
    Denque.prototype.peekAt = /* @__PURE__ */ __name(function peekAt(index) {
      var i = index;
      if (i !== (i | 0)) {
        return void 0;
      }
      var len = this.size();
      if (i >= len || i < -len)
        return void 0;
      if (i < 0)
        i += len;
      i = this._head + i & this._capacityMask;
      return this._list[i];
    }, "peekAt");
    Denque.prototype.get = /* @__PURE__ */ __name(function get(i) {
      return this.peekAt(i);
    }, "get");
    Denque.prototype.peek = /* @__PURE__ */ __name(function peek() {
      if (this._head === this._tail)
        return void 0;
      return this._list[this._head];
    }, "peek");
    Denque.prototype.peekFront = /* @__PURE__ */ __name(function peekFront() {
      return this.peek();
    }, "peekFront");
    Denque.prototype.peekBack = /* @__PURE__ */ __name(function peekBack() {
      return this.peekAt(-1);
    }, "peekBack");
    Object.defineProperty(Denque.prototype, "length", {
      get: /* @__PURE__ */ __name(function length() {
        return this.size();
      }, "length")
    });
    Denque.prototype.size = /* @__PURE__ */ __name(function size() {
      if (this._head === this._tail)
        return 0;
      if (this._head < this._tail)
        return this._tail - this._head;
      else
        return this._capacityMask + 1 - (this._head - this._tail);
    }, "size");
    Denque.prototype.unshift = /* @__PURE__ */ __name(function unshift(item) {
      if (arguments.length === 0)
        return this.size();
      var len = this._list.length;
      this._head = this._head - 1 + len & this._capacityMask;
      this._list[this._head] = item;
      if (this._tail === this._head)
        this._growArray();
      if (this._capacity && this.size() > this._capacity)
        this.pop();
      if (this._head < this._tail)
        return this._tail - this._head;
      else
        return this._capacityMask + 1 - (this._head - this._tail);
    }, "unshift");
    Denque.prototype.shift = /* @__PURE__ */ __name(function shift() {
      var head = this._head;
      if (head === this._tail)
        return void 0;
      var item = this._list[head];
      this._list[head] = void 0;
      this._head = head + 1 & this._capacityMask;
      if (head < 2 && this._tail > 1e4 && this._tail <= this._list.length >>> 2)
        this._shrinkArray();
      return item;
    }, "shift");
    Denque.prototype.push = /* @__PURE__ */ __name(function push(item) {
      if (arguments.length === 0)
        return this.size();
      var tail = this._tail;
      this._list[tail] = item;
      this._tail = tail + 1 & this._capacityMask;
      if (this._tail === this._head) {
        this._growArray();
      }
      if (this._capacity && this.size() > this._capacity) {
        this.shift();
      }
      if (this._head < this._tail)
        return this._tail - this._head;
      else
        return this._capacityMask + 1 - (this._head - this._tail);
    }, "push");
    Denque.prototype.pop = /* @__PURE__ */ __name(function pop() {
      var tail = this._tail;
      if (tail === this._head)
        return void 0;
      var len = this._list.length;
      this._tail = tail - 1 + len & this._capacityMask;
      var item = this._list[this._tail];
      this._list[this._tail] = void 0;
      if (this._head < 2 && tail > 1e4 && tail <= len >>> 2)
        this._shrinkArray();
      return item;
    }, "pop");
    Denque.prototype.removeOne = /* @__PURE__ */ __name(function removeOne(index) {
      var i = index;
      if (i !== (i | 0)) {
        return void 0;
      }
      if (this._head === this._tail)
        return void 0;
      var size = this.size();
      var len = this._list.length;
      if (i >= size || i < -size)
        return void 0;
      if (i < 0)
        i += size;
      i = this._head + i & this._capacityMask;
      var item = this._list[i];
      var k;
      if (index < size / 2) {
        for (k = index; k > 0; k--) {
          this._list[i] = this._list[i = i - 1 + len & this._capacityMask];
        }
        this._list[i] = void 0;
        this._head = this._head + 1 + len & this._capacityMask;
      } else {
        for (k = size - 1 - index; k > 0; k--) {
          this._list[i] = this._list[i = i + 1 + len & this._capacityMask];
        }
        this._list[i] = void 0;
        this._tail = this._tail - 1 + len & this._capacityMask;
      }
      return item;
    }, "removeOne");
    Denque.prototype.remove = /* @__PURE__ */ __name(function remove(index, count3) {
      var i = index;
      var removed;
      var del_count = count3;
      if (i !== (i | 0)) {
        return void 0;
      }
      if (this._head === this._tail)
        return void 0;
      var size = this.size();
      var len = this._list.length;
      if (i >= size || i < -size || count3 < 1)
        return void 0;
      if (i < 0)
        i += size;
      if (count3 === 1 || !count3) {
        removed = new Array(1);
        removed[0] = this.removeOne(i);
        return removed;
      }
      if (i === 0 && i + count3 >= size) {
        removed = this.toArray();
        this.clear();
        return removed;
      }
      if (i + count3 > size)
        count3 = size - i;
      var k;
      removed = new Array(count3);
      for (k = 0; k < count3; k++) {
        removed[k] = this._list[this._head + i + k & this._capacityMask];
      }
      i = this._head + i & this._capacityMask;
      if (index + count3 === size) {
        this._tail = this._tail - count3 + len & this._capacityMask;
        for (k = count3; k > 0; k--) {
          this._list[i = i + 1 + len & this._capacityMask] = void 0;
        }
        return removed;
      }
      if (index === 0) {
        this._head = this._head + count3 + len & this._capacityMask;
        for (k = count3 - 1; k > 0; k--) {
          this._list[i = i + 1 + len & this._capacityMask] = void 0;
        }
        return removed;
      }
      if (i < size / 2) {
        this._head = this._head + index + count3 + len & this._capacityMask;
        for (k = index; k > 0; k--) {
          this.unshift(this._list[i = i - 1 + len & this._capacityMask]);
        }
        i = this._head - 1 + len & this._capacityMask;
        while (del_count > 0) {
          this._list[i = i - 1 + len & this._capacityMask] = void 0;
          del_count--;
        }
        if (index < 0)
          this._tail = i;
      } else {
        this._tail = i;
        i = i + count3 + len & this._capacityMask;
        for (k = size - (count3 + index); k > 0; k--) {
          this.push(this._list[i++]);
        }
        i = this._tail;
        while (del_count > 0) {
          this._list[i = i + 1 + len & this._capacityMask] = void 0;
          del_count--;
        }
      }
      if (this._head < 2 && this._tail > 1e4 && this._tail <= len >>> 2)
        this._shrinkArray();
      return removed;
    }, "remove");
    Denque.prototype.splice = /* @__PURE__ */ __name(function splice(index, count3) {
      var i = index;
      if (i !== (i | 0)) {
        return void 0;
      }
      var size = this.size();
      if (i < 0)
        i += size;
      if (i > size)
        return void 0;
      if (arguments.length > 2) {
        var k;
        var temp;
        var removed;
        var arg_len = arguments.length;
        var len = this._list.length;
        var arguments_index = 2;
        if (!size || i < size / 2) {
          temp = new Array(i);
          for (k = 0; k < i; k++) {
            temp[k] = this._list[this._head + k & this._capacityMask];
          }
          if (count3 === 0) {
            removed = [];
            if (i > 0) {
              this._head = this._head + i + len & this._capacityMask;
            }
          } else {
            removed = this.remove(i, count3);
            this._head = this._head + i + len & this._capacityMask;
          }
          while (arg_len > arguments_index) {
            this.unshift(arguments[--arg_len]);
          }
          for (k = i; k > 0; k--) {
            this.unshift(temp[k - 1]);
          }
        } else {
          temp = new Array(size - (i + count3));
          var leng = temp.length;
          for (k = 0; k < leng; k++) {
            temp[k] = this._list[this._head + i + count3 + k & this._capacityMask];
          }
          if (count3 === 0) {
            removed = [];
            if (i != size) {
              this._tail = this._head + i + len & this._capacityMask;
            }
          } else {
            removed = this.remove(i, count3);
            this._tail = this._tail - leng + len & this._capacityMask;
          }
          while (arguments_index < arg_len) {
            this.push(arguments[arguments_index++]);
          }
          for (k = 0; k < leng; k++) {
            this.push(temp[k]);
          }
        }
        return removed;
      } else {
        return this.remove(i, count3);
      }
    }, "splice");
    Denque.prototype.clear = /* @__PURE__ */ __name(function clear3() {
      this._list = new Array(this._list.length);
      this._head = 0;
      this._tail = 0;
    }, "clear");
    Denque.prototype.isEmpty = /* @__PURE__ */ __name(function isEmpty() {
      return this._head === this._tail;
    }, "isEmpty");
    Denque.prototype.toArray = /* @__PURE__ */ __name(function toArray() {
      return this._copyArray(false);
    }, "toArray");
    Denque.prototype._fromArray = /* @__PURE__ */ __name(function _fromArray(array) {
      var length = array.length;
      var capacity = this._nextPowerOf2(length);
      this._list = new Array(capacity);
      this._capacityMask = capacity - 1;
      this._tail = length;
      for (var i = 0; i < length; i++)
        this._list[i] = array[i];
    }, "_fromArray");
    Denque.prototype._copyArray = /* @__PURE__ */ __name(function _copyArray(fullCopy, size) {
      var src = this._list;
      var capacity = src.length;
      var length = this.length;
      size = size | length;
      if (size == length && this._head < this._tail) {
        return this._list.slice(this._head, this._tail);
      }
      var dest = new Array(size);
      var k = 0;
      var i;
      if (fullCopy || this._head > this._tail) {
        for (i = this._head; i < capacity; i++)
          dest[k++] = src[i];
        for (i = 0; i < this._tail; i++)
          dest[k++] = src[i];
      } else {
        for (i = this._head; i < this._tail; i++)
          dest[k++] = src[i];
      }
      return dest;
    }, "_copyArray");
    Denque.prototype._growArray = /* @__PURE__ */ __name(function _growArray() {
      if (this._head != 0) {
        var newList = this._copyArray(true, this._list.length << 1);
        this._tail = this._list.length;
        this._head = 0;
        this._list = newList;
      } else {
        this._tail = this._list.length;
        this._list.length <<= 1;
      }
      this._capacityMask = this._capacityMask << 1 | 1;
    }, "_growArray");
    Denque.prototype._shrinkArray = /* @__PURE__ */ __name(function _shrinkArray() {
      this._list.length >>>= 1;
      this._capacityMask >>>= 1;
    }, "_shrinkArray");
    Denque.prototype._nextPowerOf2 = /* @__PURE__ */ __name(function _nextPowerOf2(num) {
      var log22 = Math.log(num) / Math.log(2);
      var nextPow2 = 1 << log22 + 1;
      return Math.max(nextPow2, 4);
    }, "_nextPowerOf2");
    module.exports = Denque;
  }
});

// node_modules/ioredis/built/cluster/DelayQueue.js
var require_DelayQueue = __commonJS({
  "node_modules/ioredis/built/cluster/DelayQueue.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils_1 = require_utils2();
    var Deque = require_denque();
    var debug5 = (0, utils_1.Debug)("delayqueue");
    var DelayQueue = class {
      constructor() {
        this.queues = {};
        this.timeouts = {};
      }
      /**
       * Add a new item to the queue
       *
       * @param bucket bucket name
       * @param item function that will run later
       * @param options
       */
      push(bucket, item, options) {
        const callback = options.callback || process.nextTick;
        if (!this.queues[bucket]) {
          this.queues[bucket] = new Deque();
        }
        const queue = this.queues[bucket];
        queue.push(item);
        if (!this.timeouts[bucket]) {
          this.timeouts[bucket] = setTimeout(() => {
            callback(() => {
              this.timeouts[bucket] = null;
              this.execute(bucket);
            });
          }, options.timeout);
        }
      }
      execute(bucket) {
        const queue = this.queues[bucket];
        if (!queue) {
          return;
        }
        const { length } = queue;
        if (!length) {
          return;
        }
        debug5("send %d commands in %s queue", length, bucket);
        this.queues[bucket] = null;
        while (queue.length > 0) {
          queue.shift()();
        }
      }
    };
    __name(DelayQueue, "DelayQueue");
    exports2.default = DelayQueue;
  }
});

// node_modules/ioredis/built/cluster/index.js
var require_cluster = __commonJS({
  "node_modules/ioredis/built/cluster/index.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var commands_1 = require_built();
    var events_1 = require_events();
    var redis_errors_1 = require_redis_errors();
    var standard_as_callback_1 = require_built2();
    var Command_1 = require_Command();
    var ClusterAllFailedError_1 = require_ClusterAllFailedError();
    var Redis_1 = require_Redis();
    var ScanStream_1 = require_ScanStream();
    var transaction_1 = require_transaction();
    var utils_1 = require_utils2();
    var applyMixin_1 = require_applyMixin();
    var Commander_1 = require_Commander();
    var ClusterOptions_1 = require_ClusterOptions();
    var ClusterSubscriber_1 = require_ClusterSubscriber();
    var ConnectionPool_1 = require_ConnectionPool();
    var DelayQueue_1 = require_DelayQueue();
    var util_1 = require_util2();
    var Deque = require_denque();
    var debug5 = (0, utils_1.Debug)("cluster");
    var REJECT_OVERWRITTEN_COMMANDS = /* @__PURE__ */ new WeakSet();
    var Cluster = class extends Commander_1.default {
      /**
       * Creates an instance of Cluster.
       */
      constructor(startupNodes, options = {}) {
        super();
        this.slots = [];
        this._groupsIds = {};
        this._groupsBySlot = Array(16384);
        this.isCluster = true;
        this.retryAttempts = 0;
        this.delayQueue = new DelayQueue_1.default();
        this.offlineQueue = new Deque();
        this.isRefreshing = false;
        this._refreshSlotsCacheCallbacks = [];
        this._autoPipelines = /* @__PURE__ */ new Map();
        this._runningAutoPipelines = /* @__PURE__ */ new Set();
        this._readyDelayedCallbacks = [];
        this.connectionEpoch = 0;
        events_1.EventEmitter.call(this);
        this.startupNodes = startupNodes;
        this.options = (0, utils_1.defaults)({}, options, ClusterOptions_1.DEFAULT_CLUSTER_OPTIONS, this.options);
        if (this.options.redisOptions && this.options.redisOptions.keyPrefix && !this.options.keyPrefix) {
          this.options.keyPrefix = this.options.redisOptions.keyPrefix;
        }
        if (typeof this.options.scaleReads !== "function" && ["all", "master", "slave"].indexOf(this.options.scaleReads) === -1) {
          throw new Error('Invalid option scaleReads "' + this.options.scaleReads + '". Expected "all", "master", "slave" or a custom function');
        }
        this.connectionPool = new ConnectionPool_1.default(this.options.redisOptions);
        this.connectionPool.on("-node", (redis, key) => {
          this.emit("-node", redis);
        });
        this.connectionPool.on("+node", (redis) => {
          this.emit("+node", redis);
        });
        this.connectionPool.on("drain", () => {
          this.setStatus("close");
        });
        this.connectionPool.on("nodeError", (error3, key) => {
          this.emit("node error", error3, key);
        });
        this.subscriber = new ClusterSubscriber_1.default(this.connectionPool, this);
        if (this.options.scripts) {
          Object.entries(this.options.scripts).forEach(([name, definition]) => {
            this.defineCommand(name, definition);
          });
        }
        if (this.options.lazyConnect) {
          this.setStatus("wait");
        } else {
          this.connect().catch((err) => {
            debug5("connecting failed: %s", err);
          });
        }
      }
      /**
       * Connect to a cluster
       */
      connect() {
        return new Promise((resolve, reject) => {
          if (this.status === "connecting" || this.status === "connect" || this.status === "ready") {
            reject(new Error("Redis is already connecting/connected"));
            return;
          }
          const epoch = ++this.connectionEpoch;
          this.setStatus("connecting");
          this.resolveStartupNodeHostnames().then((nodes) => {
            if (this.connectionEpoch !== epoch) {
              debug5("discard connecting after resolving startup nodes because epoch not match: %d != %d", epoch, this.connectionEpoch);
              reject(new redis_errors_1.RedisError("Connection is discarded because a new connection is made"));
              return;
            }
            if (this.status !== "connecting") {
              debug5("discard connecting after resolving startup nodes because the status changed to %s", this.status);
              reject(new redis_errors_1.RedisError("Connection is aborted"));
              return;
            }
            this.connectionPool.reset(nodes);
            const readyHandler = /* @__PURE__ */ __name(() => {
              this.setStatus("ready");
              this.retryAttempts = 0;
              this.executeOfflineCommands();
              this.resetNodesRefreshInterval();
              resolve();
            }, "readyHandler");
            let closeListener = void 0;
            const refreshListener = /* @__PURE__ */ __name(() => {
              this.invokeReadyDelayedCallbacks(void 0);
              this.removeListener("close", closeListener);
              this.manuallyClosing = false;
              this.setStatus("connect");
              if (this.options.enableReadyCheck) {
                this.readyCheck((err, fail) => {
                  if (err || fail) {
                    debug5("Ready check failed (%s). Reconnecting...", err || fail);
                    if (this.status === "connect") {
                      this.disconnect(true);
                    }
                  } else {
                    readyHandler();
                  }
                });
              } else {
                readyHandler();
              }
            }, "refreshListener");
            closeListener = /* @__PURE__ */ __name(() => {
              const error3 = new Error("None of startup nodes is available");
              this.removeListener("refresh", refreshListener);
              this.invokeReadyDelayedCallbacks(error3);
              reject(error3);
            }, "closeListener");
            this.once("refresh", refreshListener);
            this.once("close", closeListener);
            this.once("close", this.handleCloseEvent.bind(this));
            this.refreshSlotsCache((err) => {
              if (err && err.message === ClusterAllFailedError_1.default.defaultMessage) {
                Redis_1.default.prototype.silentEmit.call(this, "error", err);
                this.connectionPool.reset([]);
              }
            });
            this.subscriber.start();
          }).catch((err) => {
            this.setStatus("close");
            this.handleCloseEvent(err);
            this.invokeReadyDelayedCallbacks(err);
            reject(err);
          });
        });
      }
      /**
       * Disconnect from every node in the cluster.
       */
      disconnect(reconnect = false) {
        const status = this.status;
        this.setStatus("disconnecting");
        if (!reconnect) {
          this.manuallyClosing = true;
        }
        if (this.reconnectTimeout && !reconnect) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
          debug5("Canceled reconnecting attempts");
        }
        this.clearNodesRefreshInterval();
        this.subscriber.stop();
        if (status === "wait") {
          this.setStatus("close");
          this.handleCloseEvent();
        } else {
          this.connectionPool.reset([]);
        }
      }
      /**
       * Quit the cluster gracefully.
       */
      quit(callback) {
        const status = this.status;
        this.setStatus("disconnecting");
        this.manuallyClosing = true;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        this.clearNodesRefreshInterval();
        this.subscriber.stop();
        if (status === "wait") {
          const ret = (0, standard_as_callback_1.default)(Promise.resolve("OK"), callback);
          setImmediate(function() {
            this.setStatus("close");
            this.handleCloseEvent();
          }.bind(this));
          return ret;
        }
        return (0, standard_as_callback_1.default)(Promise.all(this.nodes().map((node) => node.quit().catch((err) => {
          if (err.message === utils_1.CONNECTION_CLOSED_ERROR_MSG) {
            return "OK";
          }
          throw err;
        }))).then(() => "OK"), callback);
      }
      /**
       * Create a new instance with the same startup nodes and options as the current one.
       *
       * @example
       * ```js
       * var cluster = new Redis.Cluster([{ host: "127.0.0.1", port: "30001" }]);
       * var anotherCluster = cluster.duplicate();
       * ```
       */
      duplicate(overrideStartupNodes = [], overrideOptions = {}) {
        const startupNodes = overrideStartupNodes.length > 0 ? overrideStartupNodes : this.startupNodes.slice(0);
        const options = Object.assign({}, this.options, overrideOptions);
        return new Cluster(startupNodes, options);
      }
      /**
       * Get nodes with the specified role
       */
      nodes(role = "all") {
        if (role !== "all" && role !== "master" && role !== "slave") {
          throw new Error('Invalid role "' + role + '". Expected "all", "master" or "slave"');
        }
        return this.connectionPool.getNodes(role);
      }
      /**
       * This is needed in order not to install a listener for each auto pipeline
       *
       * @ignore
       */
      delayUntilReady(callback) {
        this._readyDelayedCallbacks.push(callback);
      }
      /**
       * Get the number of commands queued in automatic pipelines.
       *
       * This is not available (and returns 0) until the cluster is connected and slots information have been received.
       */
      get autoPipelineQueueSize() {
        let queued = 0;
        for (const pipeline of this._autoPipelines.values()) {
          queued += pipeline.length;
        }
        return queued;
      }
      /**
       * Refresh the slot cache
       *
       * @ignore
       */
      refreshSlotsCache(callback) {
        if (callback) {
          this._refreshSlotsCacheCallbacks.push(callback);
        }
        if (this.isRefreshing) {
          return;
        }
        this.isRefreshing = true;
        const _this = this;
        const wrapper = /* @__PURE__ */ __name((error3) => {
          this.isRefreshing = false;
          for (const callback2 of this._refreshSlotsCacheCallbacks) {
            callback2(error3);
          }
          this._refreshSlotsCacheCallbacks = [];
        }, "wrapper");
        const nodes = (0, utils_1.shuffle)(this.connectionPool.getNodes());
        let lastNodeError = null;
        function tryNode(index) {
          if (index === nodes.length) {
            const error3 = new ClusterAllFailedError_1.default(ClusterAllFailedError_1.default.defaultMessage, lastNodeError);
            return wrapper(error3);
          }
          const node = nodes[index];
          const key = `${node.options.host}:${node.options.port}`;
          debug5("getting slot cache from %s", key);
          _this.getInfoFromNode(node, function(err) {
            switch (_this.status) {
              case "close":
              case "end":
                return wrapper(new Error("Cluster is disconnected."));
              case "disconnecting":
                return wrapper(new Error("Cluster is disconnecting."));
            }
            if (err) {
              _this.emit("node error", err, key);
              lastNodeError = err;
              tryNode(index + 1);
            } else {
              _this.emit("refresh");
              wrapper();
            }
          });
        }
        __name(tryNode, "tryNode");
        tryNode(0);
      }
      /**
       * @ignore
       */
      sendCommand(command, stream, node) {
        if (this.status === "wait") {
          this.connect().catch(utils_1.noop);
        }
        if (this.status === "end") {
          command.reject(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
          return command.promise;
        }
        let to = this.options.scaleReads;
        if (to !== "master") {
          const isCommandReadOnly = command.isReadOnly || (0, commands_1.exists)(command.name) && (0, commands_1.hasFlag)(command.name, "readonly");
          if (!isCommandReadOnly) {
            to = "master";
          }
        }
        let targetSlot = node ? node.slot : command.getSlot();
        const ttl = {};
        const _this = this;
        if (!node && !REJECT_OVERWRITTEN_COMMANDS.has(command)) {
          REJECT_OVERWRITTEN_COMMANDS.add(command);
          const reject = command.reject;
          command.reject = function(err) {
            const partialTry = tryConnection.bind(null, true);
            _this.handleError(err, ttl, {
              moved: function(slot, key) {
                debug5("command %s is moved to %s", command.name, key);
                targetSlot = Number(slot);
                if (_this.slots[slot]) {
                  _this.slots[slot][0] = key;
                } else {
                  _this.slots[slot] = [key];
                }
                _this._groupsBySlot[slot] = _this._groupsIds[_this.slots[slot].join(";")];
                _this.connectionPool.findOrCreate(_this.natMapper(key));
                tryConnection();
                debug5("refreshing slot caches... (triggered by MOVED error)");
                _this.refreshSlotsCache();
              },
              ask: function(slot, key) {
                debug5("command %s is required to ask %s:%s", command.name, key);
                const mapped = _this.natMapper(key);
                _this.connectionPool.findOrCreate(mapped);
                tryConnection(false, `${mapped.host}:${mapped.port}`);
              },
              tryagain: partialTry,
              clusterDown: partialTry,
              connectionClosed: partialTry,
              maxRedirections: function(redirectionError) {
                reject.call(command, redirectionError);
              },
              defaults: function() {
                reject.call(command, err);
              }
            });
          };
        }
        tryConnection();
        function tryConnection(random, asking) {
          if (_this.status === "end") {
            command.reject(new redis_errors_1.AbortError("Cluster is ended."));
            return;
          }
          let redis;
          if (_this.status === "ready" || command.name === "cluster") {
            if (node && node.redis) {
              redis = node.redis;
            } else if (Command_1.default.checkFlag("ENTER_SUBSCRIBER_MODE", command.name) || Command_1.default.checkFlag("EXIT_SUBSCRIBER_MODE", command.name)) {
              redis = _this.subscriber.getInstance();
              if (!redis) {
                command.reject(new redis_errors_1.AbortError("No subscriber for the cluster"));
                return;
              }
            } else {
              if (!random) {
                if (typeof targetSlot === "number" && _this.slots[targetSlot]) {
                  const nodeKeys = _this.slots[targetSlot];
                  if (typeof to === "function") {
                    const nodes = nodeKeys.map(function(key) {
                      return _this.connectionPool.getInstanceByKey(key);
                    });
                    redis = to(nodes, command);
                    if (Array.isArray(redis)) {
                      redis = (0, utils_1.sample)(redis);
                    }
                    if (!redis) {
                      redis = nodes[0];
                    }
                  } else {
                    let key;
                    if (to === "all") {
                      key = (0, utils_1.sample)(nodeKeys);
                    } else if (to === "slave" && nodeKeys.length > 1) {
                      key = (0, utils_1.sample)(nodeKeys, 1);
                    } else {
                      key = nodeKeys[0];
                    }
                    redis = _this.connectionPool.getInstanceByKey(key);
                  }
                }
                if (asking) {
                  redis = _this.connectionPool.getInstanceByKey(asking);
                  redis.asking();
                }
              }
              if (!redis) {
                redis = (typeof to === "function" ? null : _this.connectionPool.getSampleInstance(to)) || _this.connectionPool.getSampleInstance("all");
              }
            }
            if (node && !node.redis) {
              node.redis = redis;
            }
          }
          if (redis) {
            redis.sendCommand(command, stream);
          } else if (_this.options.enableOfflineQueue) {
            _this.offlineQueue.push({
              command,
              stream,
              node
            });
          } else {
            command.reject(new Error("Cluster isn't ready and enableOfflineQueue options is false"));
          }
        }
        __name(tryConnection, "tryConnection");
        return command.promise;
      }
      sscanStream(key, options) {
        return this.createScanStream("sscan", { key, options });
      }
      sscanBufferStream(key, options) {
        return this.createScanStream("sscanBuffer", { key, options });
      }
      hscanStream(key, options) {
        return this.createScanStream("hscan", { key, options });
      }
      hscanBufferStream(key, options) {
        return this.createScanStream("hscanBuffer", { key, options });
      }
      zscanStream(key, options) {
        return this.createScanStream("zscan", { key, options });
      }
      zscanBufferStream(key, options) {
        return this.createScanStream("zscanBuffer", { key, options });
      }
      /**
       * @ignore
       */
      handleError(error3, ttl, handlers) {
        if (typeof ttl.value === "undefined") {
          ttl.value = this.options.maxRedirections;
        } else {
          ttl.value -= 1;
        }
        if (ttl.value <= 0) {
          handlers.maxRedirections(new Error("Too many Cluster redirections. Last error: " + error3));
          return;
        }
        const errv = error3.message.split(" ");
        if (errv[0] === "MOVED") {
          const timeout = this.options.retryDelayOnMoved;
          if (timeout && typeof timeout === "number") {
            this.delayQueue.push("moved", handlers.moved.bind(null, errv[1], errv[2]), { timeout });
          } else {
            handlers.moved(errv[1], errv[2]);
          }
        } else if (errv[0] === "ASK") {
          handlers.ask(errv[1], errv[2]);
        } else if (errv[0] === "TRYAGAIN") {
          this.delayQueue.push("tryagain", handlers.tryagain, {
            timeout: this.options.retryDelayOnTryAgain
          });
        } else if (errv[0] === "CLUSTERDOWN" && this.options.retryDelayOnClusterDown > 0) {
          this.delayQueue.push("clusterdown", handlers.connectionClosed, {
            timeout: this.options.retryDelayOnClusterDown,
            callback: this.refreshSlotsCache.bind(this)
          });
        } else if (error3.message === utils_1.CONNECTION_CLOSED_ERROR_MSG && this.options.retryDelayOnFailover > 0 && this.status === "ready") {
          this.delayQueue.push("failover", handlers.connectionClosed, {
            timeout: this.options.retryDelayOnFailover,
            callback: this.refreshSlotsCache.bind(this)
          });
        } else {
          handlers.defaults();
        }
      }
      resetOfflineQueue() {
        this.offlineQueue = new Deque();
      }
      clearNodesRefreshInterval() {
        if (this.slotsTimer) {
          clearTimeout(this.slotsTimer);
          this.slotsTimer = null;
        }
      }
      resetNodesRefreshInterval() {
        if (this.slotsTimer || !this.options.slotsRefreshInterval) {
          return;
        }
        const nextRound = /* @__PURE__ */ __name(() => {
          this.slotsTimer = setTimeout(() => {
            debug5('refreshing slot caches... (triggered by "slotsRefreshInterval" option)');
            this.refreshSlotsCache(() => {
              nextRound();
            });
          }, this.options.slotsRefreshInterval);
        }, "nextRound");
        nextRound();
      }
      /**
       * Change cluster instance's status
       */
      setStatus(status) {
        debug5("status: %s -> %s", this.status || "[empty]", status);
        this.status = status;
        process.nextTick(() => {
          this.emit(status);
        });
      }
      /**
       * Called when closed to check whether a reconnection should be made
       */
      handleCloseEvent(reason) {
        if (reason) {
          debug5("closed because %s", reason);
        }
        let retryDelay;
        if (!this.manuallyClosing && typeof this.options.clusterRetryStrategy === "function") {
          retryDelay = this.options.clusterRetryStrategy.call(this, ++this.retryAttempts, reason);
        }
        if (typeof retryDelay === "number") {
          this.setStatus("reconnecting");
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            debug5("Cluster is disconnected. Retrying after %dms", retryDelay);
            this.connect().catch(function(err) {
              debug5("Got error %s when reconnecting. Ignoring...", err);
            });
          }, retryDelay);
        } else {
          this.setStatus("end");
          this.flushQueue(new Error("None of startup nodes is available"));
        }
      }
      /**
       * Flush offline queue with error.
       */
      flushQueue(error3) {
        let item;
        while (item = this.offlineQueue.shift()) {
          item.command.reject(error3);
        }
      }
      executeOfflineCommands() {
        if (this.offlineQueue.length) {
          debug5("send %d commands in offline queue", this.offlineQueue.length);
          const offlineQueue = this.offlineQueue;
          this.resetOfflineQueue();
          let item;
          while (item = offlineQueue.shift()) {
            this.sendCommand(item.command, item.stream, item.node);
          }
        }
      }
      natMapper(nodeKey) {
        if (this.options.natMap && typeof this.options.natMap === "object") {
          const key = typeof nodeKey === "string" ? nodeKey : `${nodeKey.host}:${nodeKey.port}`;
          const mapped = this.options.natMap[key];
          if (mapped) {
            debug5("NAT mapping %s -> %O", key, mapped);
            return Object.assign({}, mapped);
          }
        }
        return typeof nodeKey === "string" ? (0, util_1.nodeKeyToRedisOptions)(nodeKey) : nodeKey;
      }
      getInfoFromNode(redis, callback) {
        if (!redis) {
          return callback(new Error("Node is disconnected"));
        }
        const duplicatedConnection = redis.duplicate({
          enableOfflineQueue: true,
          enableReadyCheck: false,
          retryStrategy: null,
          connectionName: (0, util_1.getConnectionName)("refresher", this.options.redisOptions && this.options.redisOptions.connectionName)
        });
        duplicatedConnection.on("error", utils_1.noop);
        duplicatedConnection.cluster("SLOTS", (0, utils_1.timeout)((err, result) => {
          duplicatedConnection.disconnect();
          if (err) {
            return callback(err);
          }
          if (this.status === "disconnecting" || this.status === "close" || this.status === "end") {
            debug5("ignore CLUSTER.SLOTS results (count: %d) since cluster status is %s", result.length, this.status);
            callback();
            return;
          }
          const nodes = [];
          debug5("cluster slots result count: %d", result.length);
          for (let i = 0; i < result.length; ++i) {
            const items = result[i];
            const slotRangeStart = items[0];
            const slotRangeEnd = items[1];
            const keys = [];
            for (let j2 = 2; j2 < items.length; j2++) {
              if (!items[j2][0]) {
                continue;
              }
              const node = this.natMapper({
                host: items[j2][0],
                port: items[j2][1]
              });
              node.readOnly = j2 !== 2;
              nodes.push(node);
              keys.push(node.host + ":" + node.port);
            }
            debug5("cluster slots result [%d]: slots %d~%d served by %s", i, slotRangeStart, slotRangeEnd, keys);
            for (let slot = slotRangeStart; slot <= slotRangeEnd; slot++) {
              this.slots[slot] = keys;
            }
          }
          this._groupsIds = /* @__PURE__ */ Object.create(null);
          let j = 0;
          for (let i = 0; i < 16384; i++) {
            const target = (this.slots[i] || []).join(";");
            if (!target.length) {
              this._groupsBySlot[i] = void 0;
              continue;
            }
            if (!this._groupsIds[target]) {
              this._groupsIds[target] = ++j;
            }
            this._groupsBySlot[i] = this._groupsIds[target];
          }
          this.connectionPool.reset(nodes);
          callback();
        }, this.options.slotsRefreshTimeout));
      }
      invokeReadyDelayedCallbacks(err) {
        for (const c of this._readyDelayedCallbacks) {
          process.nextTick(c, err);
        }
        this._readyDelayedCallbacks = [];
      }
      /**
       * Check whether Cluster is able to process commands
       */
      readyCheck(callback) {
        this.cluster("INFO", (err, res) => {
          if (err) {
            return callback(err);
          }
          if (typeof res !== "string") {
            return callback();
          }
          let state;
          const lines = res.split("\r\n");
          for (let i = 0; i < lines.length; ++i) {
            const parts = lines[i].split(":");
            if (parts[0] === "cluster_state") {
              state = parts[1];
              break;
            }
          }
          if (state === "fail") {
            debug5("cluster state not ok (%s)", state);
            callback(null, state);
          } else {
            callback();
          }
        });
      }
      resolveSrv(hostname) {
        return new Promise((resolve, reject) => {
          this.options.resolveSrv(hostname, (err, records) => {
            if (err) {
              return reject(err);
            }
            const self2 = this, groupedRecords = (0, util_1.groupSrvRecords)(records), sortedKeys = Object.keys(groupedRecords).sort((a, b) => parseInt(a) - parseInt(b));
            function tryFirstOne(err2) {
              if (!sortedKeys.length) {
                return reject(err2);
              }
              const key = sortedKeys[0], group3 = groupedRecords[key], record = (0, util_1.weightSrvRecords)(group3);
              if (!group3.records.length) {
                sortedKeys.shift();
              }
              self2.dnsLookup(record.name).then((host) => resolve({
                host,
                port: record.port
              }), tryFirstOne);
            }
            __name(tryFirstOne, "tryFirstOne");
            tryFirstOne();
          });
        });
      }
      dnsLookup(hostname) {
        return new Promise((resolve, reject) => {
          this.options.dnsLookup(hostname, (err, address) => {
            if (err) {
              debug5("failed to resolve hostname %s to IP: %s", hostname, err.message);
              reject(err);
            } else {
              debug5("resolved hostname %s to IP %s", hostname, address);
              resolve(address);
            }
          });
        });
      }
      /**
       * Normalize startup nodes, and resolving hostnames to IPs.
       *
       * This process happens every time when #connect() is called since
       * #startupNodes and DNS records may chanage.
       */
      async resolveStartupNodeHostnames() {
        if (!Array.isArray(this.startupNodes) || this.startupNodes.length === 0) {
          throw new Error("`startupNodes` should contain at least one node.");
        }
        const startupNodes = (0, util_1.normalizeNodeOptions)(this.startupNodes);
        const hostnames = (0, util_1.getUniqueHostnamesFromOptions)(startupNodes);
        if (hostnames.length === 0) {
          return startupNodes;
        }
        const configs = await Promise.all(hostnames.map((this.options.useSRVRecords ? this.resolveSrv : this.dnsLookup).bind(this)));
        const hostnameToConfig = (0, utils_1.zipMap)(hostnames, configs);
        return startupNodes.map((node) => {
          const config2 = hostnameToConfig.get(node.host);
          if (!config2) {
            return node;
          }
          if (this.options.useSRVRecords) {
            return Object.assign({}, node, config2);
          }
          return Object.assign({}, node, { host: config2 });
        });
      }
      createScanStream(command, { key, options = {} }) {
        return new ScanStream_1.default({
          objectMode: true,
          key,
          redis: this,
          command,
          ...options
        });
      }
    };
    __name(Cluster, "Cluster");
    (0, applyMixin_1.default)(Cluster, events_1.EventEmitter);
    (0, transaction_1.addTransactionSupport)(Cluster.prototype);
    exports2.default = Cluster;
  }
});

// node_modules/unenv/runtime/node/tls/internal/tls-socket.mjs
var TLSSocket;
var init_tls_socket = __esm({
  "node_modules/unenv/runtime/node/tls/internal/tls-socket.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_net();
    init_utils();
    TLSSocket = class extends Socket {
      authorized = false;
      encrypted = true;
      alpnProtocol = null;
      authorizationError = new Error(
        "[unenv] TLSSocket.authorizationError is not implemented yet!"
      );
      exportKeyingMaterial() {
        throw createNotImplementedError("TLSSocket.exportKeyingMaterial");
      }
      getCipher() {
        throw createNotImplementedError("TLSSocket.getCipher");
      }
      getPeerCertificate(_detailed) {
        throw createNotImplementedError("TLSSocket.getPeerCertificate");
      }
      getCertificate() {
        return null;
      }
      getEphemeralKeyInfo() {
        return null;
      }
      getFinished() {
      }
      getPeerFinished() {
      }
      getProtocol() {
        return null;
      }
      getSession() {
      }
      getSharedSigalgs() {
        return [];
      }
      getTLSTicket() {
      }
      isSessionReused() {
        return false;
      }
      renegotiate(options, callback) {
        if (typeof callback === "function") {
          callback(null);
        }
      }
      setMaxSendFragment(size) {
        return false;
      }
      disableRenegotiation() {
      }
      enableTrace() {
      }
      getPeerX509Certificate() {
      }
      getX509Certificate() {
      }
    };
    __name(TLSSocket, "TLSSocket");
  }
});

// node_modules/unenv/runtime/node/tls/internal/server.mjs
var Server2;
var init_server2 = __esm({
  "node_modules/unenv/runtime/node/tls/internal/server.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_net();
    Server2 = class extends Server {
      constructor(arg1, arg2) {
        super(arg1, arg2);
      }
      addContext(hostname, context2) {
      }
      setSecureContext(options) {
      }
      setTicketKeys(_keys) {
        throw createNotImplementedError("Server.setTicketKeys");
      }
      getTicketKeys() {
        throw createNotImplementedError("Server.getTicketKeys");
      }
    };
    __name(Server2, "Server");
  }
});

// node_modules/unenv/runtime/node/tls/internal/secure-context.mjs
var SecureContext;
var init_secure_context = __esm({
  "node_modules/unenv/runtime/node/tls/internal/secure-context.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    SecureContext = class {
      context = {};
    };
    __name(SecureContext, "SecureContext");
  }
});

// node_modules/unenv/runtime/node/tls/internal/constants.mjs
var constants_exports = {};
__export(constants_exports, {
  CLIENT_RENEG_LIMIT: () => CLIENT_RENEG_LIMIT,
  CLIENT_RENEG_WINDOW: () => CLIENT_RENEG_WINDOW,
  DEFAULT_CIPHERS: () => DEFAULT_CIPHERS,
  DEFAULT_ECDH_CURVE: () => DEFAULT_ECDH_CURVE,
  DEFAULT_MAX_VERSION: () => DEFAULT_MAX_VERSION,
  DEFAULT_MIN_VERSION: () => DEFAULT_MIN_VERSION
});
var CLIENT_RENEG_LIMIT, CLIENT_RENEG_WINDOW, DEFAULT_CIPHERS, DEFAULT_ECDH_CURVE, DEFAULT_MAX_VERSION, DEFAULT_MIN_VERSION;
var init_constants2 = __esm({
  "node_modules/unenv/runtime/node/tls/internal/constants.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    CLIENT_RENEG_LIMIT = 0;
    CLIENT_RENEG_WINDOW = 0;
    DEFAULT_CIPHERS = "";
    DEFAULT_ECDH_CURVE = "";
    DEFAULT_MAX_VERSION = "TLSv1.3";
    DEFAULT_MIN_VERSION = "TLSv1.2";
  }
});

// node_modules/unenv/runtime/node/tls/index.mjs
var connect2, createServer2, checkServerIdentity, convertALPNProtocols, createSecureContext, createSecurePair, getCiphers3, rootCertificates, tls_default;
var init_tls = __esm({
  "node_modules/unenv/runtime/node/tls/index.mjs"() {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
    init_tls_socket();
    init_server2();
    init_secure_context();
    init_constants2();
    init_constants2();
    connect2 = /* @__PURE__ */ __name(function connect22() {
      return new TLSSocket();
    }, "connect2");
    createServer2 = /* @__PURE__ */ __name(function createServer22() {
      return new Server2();
    }, "createServer2");
    checkServerIdentity = notImplemented("tls.checkServerIdentity");
    convertALPNProtocols = notImplemented("tls.convertALPNProtocols");
    createSecureContext = notImplemented("tls.createSecureContext");
    createSecurePair = notImplemented(
      "tls.createSecurePair"
    );
    getCiphers3 = notImplemented("tls.getCiphers");
    rootCertificates = [];
    tls_default = {
      ...constants_exports,
      SecureContext,
      Server: Server2,
      TLSSocket,
      checkServerIdentity,
      connect: connect2,
      convertALPNProtocols,
      createSecureContext,
      createSecurePair,
      createServer: createServer2,
      getCiphers: getCiphers3,
      rootCertificates
    };
  }
});

// node-built-in-modules:tls
var require_tls = __commonJS({
  "node-built-in-modules:tls"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_tls();
    module.exports = tls_default;
  }
});

// node_modules/ioredis/built/connectors/AbstractConnector.js
var require_AbstractConnector = __commonJS({
  "node_modules/ioredis/built/connectors/AbstractConnector.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var utils_1 = require_utils2();
    var debug5 = (0, utils_1.Debug)("AbstractConnector");
    var AbstractConnector = class {
      constructor(disconnectTimeout) {
        this.connecting = false;
        this.disconnectTimeout = disconnectTimeout;
      }
      check(info3) {
        return true;
      }
      disconnect() {
        this.connecting = false;
        if (this.stream) {
          const stream = this.stream;
          const timeout = setTimeout(() => {
            debug5("stream %s:%s still open, destroying it", stream.remoteAddress, stream.remotePort);
            stream.destroy();
          }, this.disconnectTimeout);
          stream.on("close", () => clearTimeout(timeout));
          stream.end();
        }
      }
    };
    __name(AbstractConnector, "AbstractConnector");
    exports2.default = AbstractConnector;
  }
});

// node_modules/ioredis/built/connectors/StandaloneConnector.js
var require_StandaloneConnector = __commonJS({
  "node_modules/ioredis/built/connectors/StandaloneConnector.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var net_1 = require_net();
    var tls_1 = require_tls();
    var utils_1 = require_utils2();
    var AbstractConnector_1 = require_AbstractConnector();
    var StandaloneConnector = class extends AbstractConnector_1.default {
      constructor(options) {
        super(options.disconnectTimeout);
        this.options = options;
      }
      connect(_) {
        const { options } = this;
        this.connecting = true;
        let connectionOptions;
        if ("path" in options && options.path) {
          connectionOptions = {
            path: options.path
          };
        } else {
          connectionOptions = {};
          if ("port" in options && options.port != null) {
            connectionOptions.port = options.port;
          }
          if ("host" in options && options.host != null) {
            connectionOptions.host = options.host;
          }
          if ("family" in options && options.family != null) {
            connectionOptions.family = options.family;
          }
        }
        if (options.tls) {
          Object.assign(connectionOptions, options.tls);
        }
        return new Promise((resolve, reject) => {
          process.nextTick(() => {
            if (!this.connecting) {
              reject(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
              return;
            }
            try {
              if (options.tls) {
                this.stream = (0, tls_1.connect)(connectionOptions);
              } else {
                this.stream = (0, net_1.createConnection)(connectionOptions);
              }
            } catch (err) {
              reject(err);
              return;
            }
            this.stream.once("error", (err) => {
              this.firstError = err;
            });
            resolve(this.stream);
          });
        });
      }
    };
    __name(StandaloneConnector, "StandaloneConnector");
    exports2.default = StandaloneConnector;
  }
});

// node_modules/ioredis/built/connectors/SentinelConnector/SentinelIterator.js
var require_SentinelIterator = __commonJS({
  "node_modules/ioredis/built/connectors/SentinelConnector/SentinelIterator.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    function isSentinelEql(a, b) {
      return (a.host || "127.0.0.1") === (b.host || "127.0.0.1") && (a.port || 26379) === (b.port || 26379);
    }
    __name(isSentinelEql, "isSentinelEql");
    var SentinelIterator = class {
      constructor(sentinels) {
        this.cursor = 0;
        this.sentinels = sentinels.slice(0);
      }
      next() {
        const done = this.cursor >= this.sentinels.length;
        return { done, value: done ? void 0 : this.sentinels[this.cursor++] };
      }
      reset(moveCurrentEndpointToFirst) {
        if (moveCurrentEndpointToFirst && this.sentinels.length > 1 && this.cursor !== 1) {
          this.sentinels.unshift(...this.sentinels.splice(this.cursor - 1));
        }
        this.cursor = 0;
      }
      add(sentinel) {
        for (let i = 0; i < this.sentinels.length; i++) {
          if (isSentinelEql(sentinel, this.sentinels[i])) {
            return false;
          }
        }
        this.sentinels.push(sentinel);
        return true;
      }
      toString() {
        return `${JSON.stringify(this.sentinels)} @${this.cursor}`;
      }
    };
    __name(SentinelIterator, "SentinelIterator");
    exports2.default = SentinelIterator;
  }
});

// node_modules/ioredis/built/connectors/SentinelConnector/FailoverDetector.js
var require_FailoverDetector = __commonJS({
  "node_modules/ioredis/built/connectors/SentinelConnector/FailoverDetector.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.FailoverDetector = void 0;
    var utils_1 = require_utils2();
    var debug5 = (0, utils_1.Debug)("FailoverDetector");
    var CHANNEL_NAME = "+switch-master";
    var FailoverDetector = class {
      // sentinels can't be used for regular commands after this
      constructor(connector, sentinels) {
        this.isDisconnected = false;
        this.connector = connector;
        this.sentinels = sentinels;
      }
      cleanup() {
        this.isDisconnected = true;
        for (const sentinel of this.sentinels) {
          sentinel.client.disconnect();
        }
      }
      async subscribe() {
        debug5("Starting FailoverDetector");
        const promises = [];
        for (const sentinel of this.sentinels) {
          const promise = sentinel.client.subscribe(CHANNEL_NAME).catch((err) => {
            debug5("Failed to subscribe to failover messages on sentinel %s:%s (%s)", sentinel.address.host || "127.0.0.1", sentinel.address.port || 26739, err.message);
          });
          promises.push(promise);
          sentinel.client.on("message", (channel2) => {
            if (!this.isDisconnected && channel2 === CHANNEL_NAME) {
              this.disconnect();
            }
          });
        }
        await Promise.all(promises);
      }
      disconnect() {
        this.isDisconnected = true;
        debug5("Failover detected, disconnecting");
        this.connector.disconnect();
      }
    };
    __name(FailoverDetector, "FailoverDetector");
    exports2.FailoverDetector = FailoverDetector;
  }
});

// node_modules/ioredis/built/connectors/SentinelConnector/index.js
var require_SentinelConnector = __commonJS({
  "node_modules/ioredis/built/connectors/SentinelConnector/index.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SentinelIterator = void 0;
    var net_1 = require_net();
    var utils_1 = require_utils2();
    var tls_1 = require_tls();
    var SentinelIterator_1 = require_SentinelIterator();
    exports2.SentinelIterator = SentinelIterator_1.default;
    var AbstractConnector_1 = require_AbstractConnector();
    var Redis_1 = require_Redis();
    var FailoverDetector_1 = require_FailoverDetector();
    var debug5 = (0, utils_1.Debug)("SentinelConnector");
    var SentinelConnector = class extends AbstractConnector_1.default {
      constructor(options) {
        super(options.disconnectTimeout);
        this.options = options;
        this.emitter = null;
        this.failoverDetector = null;
        if (!this.options.sentinels.length) {
          throw new Error("Requires at least one sentinel to connect to.");
        }
        if (!this.options.name) {
          throw new Error("Requires the name of master.");
        }
        this.sentinelIterator = new SentinelIterator_1.default(this.options.sentinels);
      }
      check(info3) {
        const roleMatches = !info3.role || this.options.role === info3.role;
        if (!roleMatches) {
          debug5("role invalid, expected %s, but got %s", this.options.role, info3.role);
          this.sentinelIterator.next();
          this.sentinelIterator.next();
          this.sentinelIterator.reset(true);
        }
        return roleMatches;
      }
      disconnect() {
        super.disconnect();
        if (this.failoverDetector) {
          this.failoverDetector.cleanup();
        }
      }
      connect(eventEmitter) {
        this.connecting = true;
        this.retryAttempts = 0;
        let lastError;
        const connectToNext = /* @__PURE__ */ __name(async () => {
          const endpoint = this.sentinelIterator.next();
          if (endpoint.done) {
            this.sentinelIterator.reset(false);
            const retryDelay = typeof this.options.sentinelRetryStrategy === "function" ? this.options.sentinelRetryStrategy(++this.retryAttempts) : null;
            let errorMsg = typeof retryDelay !== "number" ? "All sentinels are unreachable and retry is disabled." : `All sentinels are unreachable. Retrying from scratch after ${retryDelay}ms.`;
            if (lastError) {
              errorMsg += ` Last error: ${lastError.message}`;
            }
            debug5(errorMsg);
            const error3 = new Error(errorMsg);
            if (typeof retryDelay === "number") {
              eventEmitter("error", error3);
              await new Promise((resolve) => setTimeout(resolve, retryDelay));
              return connectToNext();
            } else {
              throw error3;
            }
          }
          let resolved = null;
          let err = null;
          try {
            resolved = await this.resolve(endpoint.value);
          } catch (error3) {
            err = error3;
          }
          if (!this.connecting) {
            throw new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG);
          }
          const endpointAddress = endpoint.value.host + ":" + endpoint.value.port;
          if (resolved) {
            debug5("resolved: %s:%s from sentinel %s", resolved.host, resolved.port, endpointAddress);
            if (this.options.enableTLSForSentinelMode && this.options.tls) {
              Object.assign(resolved, this.options.tls);
              this.stream = (0, tls_1.connect)(resolved);
              this.stream.once("secureConnect", this.initFailoverDetector.bind(this));
            } else {
              this.stream = (0, net_1.createConnection)(resolved);
              this.stream.once("connect", this.initFailoverDetector.bind(this));
            }
            this.stream.once("error", (err2) => {
              this.firstError = err2;
            });
            return this.stream;
          } else {
            const errorMsg = err ? "failed to connect to sentinel " + endpointAddress + " because " + err.message : "connected to sentinel " + endpointAddress + " successfully, but got an invalid reply: " + resolved;
            debug5(errorMsg);
            eventEmitter("sentinelError", new Error(errorMsg));
            if (err) {
              lastError = err;
            }
            return connectToNext();
          }
        }, "connectToNext");
        return connectToNext();
      }
      async updateSentinels(client) {
        if (!this.options.updateSentinels) {
          return;
        }
        const result = await client.sentinel("sentinels", this.options.name);
        if (!Array.isArray(result)) {
          return;
        }
        result.map(utils_1.packObject).forEach((sentinel) => {
          const flags = sentinel.flags ? sentinel.flags.split(",") : [];
          if (flags.indexOf("disconnected") === -1 && sentinel.ip && sentinel.port) {
            const endpoint = this.sentinelNatResolve(addressResponseToAddress(sentinel));
            if (this.sentinelIterator.add(endpoint)) {
              debug5("adding sentinel %s:%s", endpoint.host, endpoint.port);
            }
          }
        });
        debug5("Updated internal sentinels: %s", this.sentinelIterator);
      }
      async resolveMaster(client) {
        const result = await client.sentinel("get-master-addr-by-name", this.options.name);
        await this.updateSentinels(client);
        return this.sentinelNatResolve(Array.isArray(result) ? { host: result[0], port: Number(result[1]) } : null);
      }
      async resolveSlave(client) {
        const result = await client.sentinel("slaves", this.options.name);
        if (!Array.isArray(result)) {
          return null;
        }
        const availableSlaves = result.map(utils_1.packObject).filter((slave) => slave.flags && !slave.flags.match(/(disconnected|s_down|o_down)/));
        return this.sentinelNatResolve(selectPreferredSentinel(availableSlaves, this.options.preferredSlaves));
      }
      sentinelNatResolve(item) {
        if (!item || !this.options.natMap)
          return item;
        return this.options.natMap[`${item.host}:${item.port}`] || item;
      }
      connectToSentinel(endpoint, options) {
        const redis = new Redis_1.default({
          port: endpoint.port || 26379,
          host: endpoint.host,
          username: this.options.sentinelUsername || null,
          password: this.options.sentinelPassword || null,
          family: endpoint.family || // @ts-expect-error
          ("path" in this.options && this.options.path ? void 0 : (
            // @ts-expect-error
            this.options.family
          )),
          tls: this.options.sentinelTLS,
          retryStrategy: null,
          enableReadyCheck: false,
          connectTimeout: this.options.connectTimeout,
          commandTimeout: this.options.sentinelCommandTimeout,
          ...options
        });
        return redis;
      }
      async resolve(endpoint) {
        const client = this.connectToSentinel(endpoint);
        client.on("error", noop2);
        try {
          if (this.options.role === "slave") {
            return await this.resolveSlave(client);
          } else {
            return await this.resolveMaster(client);
          }
        } finally {
          client.disconnect();
        }
      }
      async initFailoverDetector() {
        var _a;
        if (!this.options.failoverDetector) {
          return;
        }
        this.sentinelIterator.reset(true);
        const sentinels = [];
        while (sentinels.length < this.options.sentinelMaxConnections) {
          const { done, value } = this.sentinelIterator.next();
          if (done) {
            break;
          }
          const client = this.connectToSentinel(value, {
            lazyConnect: true,
            retryStrategy: this.options.sentinelReconnectStrategy
          });
          client.on("reconnecting", () => {
            var _a2;
            (_a2 = this.emitter) === null || _a2 === void 0 ? void 0 : _a2.emit("sentinelReconnecting");
          });
          sentinels.push({ address: value, client });
        }
        this.sentinelIterator.reset(false);
        if (this.failoverDetector) {
          this.failoverDetector.cleanup();
        }
        this.failoverDetector = new FailoverDetector_1.FailoverDetector(this, sentinels);
        await this.failoverDetector.subscribe();
        (_a = this.emitter) === null || _a === void 0 ? void 0 : _a.emit("failoverSubscribed");
      }
    };
    __name(SentinelConnector, "SentinelConnector");
    exports2.default = SentinelConnector;
    function selectPreferredSentinel(availableSlaves, preferredSlaves) {
      if (availableSlaves.length === 0) {
        return null;
      }
      let selectedSlave;
      if (typeof preferredSlaves === "function") {
        selectedSlave = preferredSlaves(availableSlaves);
      } else if (preferredSlaves !== null && typeof preferredSlaves === "object") {
        const preferredSlavesArray = Array.isArray(preferredSlaves) ? preferredSlaves : [preferredSlaves];
        preferredSlavesArray.sort((a, b) => {
          if (!a.prio) {
            a.prio = 1;
          }
          if (!b.prio) {
            b.prio = 1;
          }
          if (a.prio < b.prio) {
            return -1;
          }
          if (a.prio > b.prio) {
            return 1;
          }
          return 0;
        });
        for (let p = 0; p < preferredSlavesArray.length; p++) {
          for (let a = 0; a < availableSlaves.length; a++) {
            const slave = availableSlaves[a];
            if (slave.ip === preferredSlavesArray[p].ip) {
              if (slave.port === preferredSlavesArray[p].port) {
                selectedSlave = slave;
                break;
              }
            }
          }
          if (selectedSlave) {
            break;
          }
        }
      }
      if (!selectedSlave) {
        selectedSlave = (0, utils_1.sample)(availableSlaves);
      }
      return addressResponseToAddress(selectedSlave);
    }
    __name(selectPreferredSentinel, "selectPreferredSentinel");
    function addressResponseToAddress(input) {
      return { host: input.ip, port: Number(input.port) };
    }
    __name(addressResponseToAddress, "addressResponseToAddress");
    function noop2() {
    }
    __name(noop2, "noop");
  }
});

// node_modules/ioredis/built/connectors/index.js
var require_connectors = __commonJS({
  "node_modules/ioredis/built/connectors/index.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.SentinelConnector = exports2.StandaloneConnector = void 0;
    var StandaloneConnector_1 = require_StandaloneConnector();
    exports2.StandaloneConnector = StandaloneConnector_1.default;
    var SentinelConnector_1 = require_SentinelConnector();
    exports2.SentinelConnector = SentinelConnector_1.default;
  }
});

// node_modules/ioredis/built/errors/MaxRetriesPerRequestError.js
var require_MaxRetriesPerRequestError = __commonJS({
  "node_modules/ioredis/built/errors/MaxRetriesPerRequestError.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var redis_errors_1 = require_redis_errors();
    var MaxRetriesPerRequestError = class extends redis_errors_1.AbortError {
      constructor(maxRetriesPerRequest) {
        const message = `Reached the max retries per request limit (which is ${maxRetriesPerRequest}). Refer to "maxRetriesPerRequest" option for details.`;
        super(message);
        Error.captureStackTrace(this, this.constructor);
      }
      get name() {
        return this.constructor.name;
      }
    };
    __name(MaxRetriesPerRequestError, "MaxRetriesPerRequestError");
    exports2.default = MaxRetriesPerRequestError;
  }
});

// node_modules/ioredis/built/errors/index.js
var require_errors = __commonJS({
  "node_modules/ioredis/built/errors/index.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.MaxRetriesPerRequestError = void 0;
    var MaxRetriesPerRequestError_1 = require_MaxRetriesPerRequestError();
    exports2.MaxRetriesPerRequestError = MaxRetriesPerRequestError_1.default;
  }
});

// node-built-in-modules:buffer
import libDefault6 from "buffer";
var require_buffer = __commonJS({
  "node-built-in-modules:buffer"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = libDefault6;
  }
});

// node-built-in-modules:string_decoder
import libDefault7 from "string_decoder";
var require_string_decoder = __commonJS({
  "node-built-in-modules:string_decoder"(exports2, module) {
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = libDefault7;
  }
});

// node_modules/redis-parser/lib/parser.js
var require_parser = __commonJS({
  "node_modules/redis-parser/lib/parser.js"(exports2, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var Buffer2 = require_buffer().Buffer;
    var StringDecoder = require_string_decoder().StringDecoder;
    var decoder = new StringDecoder();
    var errors = require_redis_errors();
    var ReplyError = errors.ReplyError;
    var ParserError = errors.ParserError;
    var bufferPool = Buffer2.allocUnsafe(32 * 1024);
    var bufferOffset = 0;
    var interval = null;
    var counter = 0;
    var notDecreased = 0;
    function parseSimpleNumbers(parser) {
      const length = parser.buffer.length - 1;
      var offset = parser.offset;
      var number = 0;
      var sign2 = 1;
      if (parser.buffer[offset] === 45) {
        sign2 = -1;
        offset++;
      }
      while (offset < length) {
        const c1 = parser.buffer[offset++];
        if (c1 === 13) {
          parser.offset = offset + 1;
          return sign2 * number;
        }
        number = number * 10 + (c1 - 48);
      }
    }
    __name(parseSimpleNumbers, "parseSimpleNumbers");
    function parseStringNumbers(parser) {
      const length = parser.buffer.length - 1;
      var offset = parser.offset;
      var number = 0;
      var res = "";
      if (parser.buffer[offset] === 45) {
        res += "-";
        offset++;
      }
      while (offset < length) {
        var c1 = parser.buffer[offset++];
        if (c1 === 13) {
          parser.offset = offset + 1;
          if (number !== 0) {
            res += number;
          }
          return res;
        } else if (number > 429496728) {
          res += number * 10 + (c1 - 48);
          number = 0;
        } else if (c1 === 48 && number === 0) {
          res += 0;
        } else {
          number = number * 10 + (c1 - 48);
        }
      }
    }
    __name(parseStringNumbers, "parseStringNumbers");
    function parseSimpleString(parser) {
      const start = parser.offset;
      const buffer = parser.buffer;
      const length = buffer.length - 1;
      var offset = start;
      while (offset < length) {
        if (buffer[offset++] === 13) {
          parser.offset = offset + 1;
          if (parser.optionReturnBuffers === true) {
            return parser.buffer.slice(start, offset - 1);
          }
          return parser.buffer.toString("utf8", start, offset - 1);
        }
      }
    }
    __name(parseSimpleString, "parseSimpleString");
    function parseLength(parser) {
      const length = parser.buffer.length - 1;
      var offset = parser.offset;
      var number = 0;
      while (offset < length) {
        const c1 = parser.buffer[offset++];
        if (c1 === 13) {
          parser.offset = offset + 1;
          return number;
        }
        number = number * 10 + (c1 - 48);
      }
    }
    __name(parseLength, "parseLength");
    function parseInteger(parser) {
      if (parser.optionStringNumbers === true) {
        return parseStringNumbers(parser);
      }
      return parseSimpleNumbers(parser);
    }
    __name(parseInteger, "parseInteger");
    function parseBulkString(parser) {
      const length = parseLength(parser);
      if (length === void 0) {
        return;
      }
      if (length < 0) {
        return null;
      }
      const offset = parser.offset + length;
      if (offset + 2 > parser.buffer.length) {
        parser.bigStrSize = offset + 2;
        parser.totalChunkSize = parser.buffer.length;
        parser.bufferCache.push(parser.buffer);
        return;
      }
      const start = parser.offset;
      parser.offset = offset + 2;
      if (parser.optionReturnBuffers === true) {
        return parser.buffer.slice(start, offset);
      }
      return parser.buffer.toString("utf8", start, offset);
    }
    __name(parseBulkString, "parseBulkString");
    function parseError(parser) {
      var string = parseSimpleString(parser);
      if (string !== void 0) {
        if (parser.optionReturnBuffers === true) {
          string = string.toString();
        }
        return new ReplyError(string);
      }
    }
    __name(parseError, "parseError");
    function handleError(parser, type) {
      const err = new ParserError(
        "Protocol error, got " + JSON.stringify(String.fromCharCode(type)) + " as reply type byte",
        JSON.stringify(parser.buffer),
        parser.offset
      );
      parser.buffer = null;
      parser.returnFatalError(err);
    }
    __name(handleError, "handleError");
    function parseArray(parser) {
      const length = parseLength(parser);
      if (length === void 0) {
        return;
      }
      if (length < 0) {
        return null;
      }
      const responses = new Array(length);
      return parseArrayElements(parser, responses, 0);
    }
    __name(parseArray, "parseArray");
    function pushArrayCache(parser, array, pos) {
      parser.arrayCache.push(array);
      parser.arrayPos.push(pos);
    }
    __name(pushArrayCache, "pushArrayCache");
    function parseArrayChunks(parser) {
      const tmp = parser.arrayCache.pop();
      var pos = parser.arrayPos.pop();
      if (parser.arrayCache.length) {
        const res = parseArrayChunks(parser);
        if (res === void 0) {
          pushArrayCache(parser, tmp, pos);
          return;
        }
        tmp[pos++] = res;
      }
      return parseArrayElements(parser, tmp, pos);
    }
    __name(parseArrayChunks, "parseArrayChunks");
    function parseArrayElements(parser, responses, i) {
      const bufferLength = parser.buffer.length;
      while (i < responses.length) {
        const offset = parser.offset;
        if (parser.offset >= bufferLength) {
          pushArrayCache(parser, responses, i);
          return;
        }
        const response = parseType(parser, parser.buffer[parser.offset++]);
        if (response === void 0) {
          if (!(parser.arrayCache.length || parser.bufferCache.length)) {
            parser.offset = offset;
          }
          pushArrayCache(parser, responses, i);
          return;
        }
        responses[i] = response;
        i++;
      }
      return responses;
    }
    __name(parseArrayElements, "parseArrayElements");
    function parseType(parser, type) {
      switch (type) {
        case 36:
          return parseBulkString(parser);
        case 43:
          return parseSimpleString(parser);
        case 42:
          return parseArray(parser);
        case 58:
          return parseInteger(parser);
        case 45:
          return parseError(parser);
        default:
          return handleError(parser, type);
      }
    }
    __name(parseType, "parseType");
    function decreaseBufferPool() {
      if (bufferPool.length > 50 * 1024) {
        if (counter === 1 || notDecreased > counter * 2) {
          const minSliceLen = Math.floor(bufferPool.length / 10);
          const sliceLength = minSliceLen < bufferOffset ? bufferOffset : minSliceLen;
          bufferOffset = 0;
          bufferPool = bufferPool.slice(sliceLength, bufferPool.length);
        } else {
          notDecreased++;
          counter--;
        }
      } else {
        clearInterval(interval);
        counter = 0;
        notDecreased = 0;
        interval = null;
      }
    }
    __name(decreaseBufferPool, "decreaseBufferPool");
    function resizeBuffer(length) {
      if (bufferPool.length < length + bufferOffset) {
        const multiplier = length > 1024 * 1024 * 75 ? 2 : 3;
        if (bufferOffset > 1024 * 1024 * 111) {
          bufferOffset = 1024 * 1024 * 50;
        }
        bufferPool = Buffer2.allocUnsafe(length * multiplier + bufferOffset);
        bufferOffset = 0;
        counter++;
        if (interval === null) {
          interval = setInterval(decreaseBufferPool, 50);
        }
      }
    }
    __name(resizeBuffer, "resizeBuffer");
    function concatBulkString(parser) {
      const list = parser.bufferCache;
      const oldOffset = parser.offset;
      var chunks = list.length;
      var offset = parser.bigStrSize - parser.totalChunkSize;
      parser.offset = offset;
      if (offset <= 2) {
        if (chunks === 2) {
          return list[0].toString("utf8", oldOffset, list[0].length + offset - 2);
        }
        chunks--;
        offset = list[list.length - 2].length + offset;
      }
      var res = decoder.write(list[0].slice(oldOffset));
      for (var i = 1; i < chunks - 1; i++) {
        res += decoder.write(list[i]);
      }
      res += decoder.end(list[i].slice(0, offset - 2));
      return res;
    }
    __name(concatBulkString, "concatBulkString");
    function concatBulkBuffer(parser) {
      const list = parser.bufferCache;
      const oldOffset = parser.offset;
      const length = parser.bigStrSize - oldOffset - 2;
      var chunks = list.length;
      var offset = parser.bigStrSize - parser.totalChunkSize;
      parser.offset = offset;
      if (offset <= 2) {
        if (chunks === 2) {
          return list[0].slice(oldOffset, list[0].length + offset - 2);
        }
        chunks--;
        offset = list[list.length - 2].length + offset;
      }
      resizeBuffer(length);
      const start = bufferOffset;
      list[0].copy(bufferPool, start, oldOffset, list[0].length);
      bufferOffset += list[0].length - oldOffset;
      for (var i = 1; i < chunks - 1; i++) {
        list[i].copy(bufferPool, bufferOffset);
        bufferOffset += list[i].length;
      }
      list[i].copy(bufferPool, bufferOffset, 0, offset - 2);
      bufferOffset += offset - 2;
      return bufferPool.slice(start, bufferOffset);
    }
    __name(concatBulkBuffer, "concatBulkBuffer");
    var JavascriptRedisParser = class {
      /**
       * Javascript Redis Parser constructor
       * @param {{returnError: Function, returnReply: Function, returnFatalError?: Function, returnBuffers: boolean, stringNumbers: boolean }} options
       * @constructor
       */
      constructor(options) {
        if (!options) {
          throw new TypeError("Options are mandatory.");
        }
        if (typeof options.returnError !== "function" || typeof options.returnReply !== "function") {
          throw new TypeError("The returnReply and returnError options have to be functions.");
        }
        this.setReturnBuffers(!!options.returnBuffers);
        this.setStringNumbers(!!options.stringNumbers);
        this.returnError = options.returnError;
        this.returnFatalError = options.returnFatalError || options.returnError;
        this.returnReply = options.returnReply;
        this.reset();
      }
      /**
       * Reset the parser values to the initial state
       *
       * @returns {undefined}
       */
      reset() {
        this.offset = 0;
        this.buffer = null;
        this.bigStrSize = 0;
        this.totalChunkSize = 0;
        this.bufferCache = [];
        this.arrayCache = [];
        this.arrayPos = [];
      }
      /**
       * Set the returnBuffers option
       *
       * @param {boolean} returnBuffers
       * @returns {undefined}
       */
      setReturnBuffers(returnBuffers) {
        if (typeof returnBuffers !== "boolean") {
          throw new TypeError("The returnBuffers argument has to be a boolean");
        }
        this.optionReturnBuffers = returnBuffers;
      }
      /**
       * Set the stringNumbers option
       *
       * @param {boolean} stringNumbers
       * @returns {undefined}
       */
      setStringNumbers(stringNumbers) {
        if (typeof stringNumbers !== "boolean") {
          throw new TypeError("The stringNumbers argument has to be a boolean");
        }
        this.optionStringNumbers = stringNumbers;
      }
      /**
       * Parse the redis buffer
       * @param {Buffer} buffer
       * @returns {undefined}
       */
      execute(buffer) {
        if (this.buffer === null) {
          this.buffer = buffer;
          this.offset = 0;
        } else if (this.bigStrSize === 0) {
          const oldLength = this.buffer.length;
          const remainingLength = oldLength - this.offset;
          const newBuffer = Buffer2.allocUnsafe(remainingLength + buffer.length);
          this.buffer.copy(newBuffer, 0, this.offset, oldLength);
          buffer.copy(newBuffer, remainingLength, 0, buffer.length);
          this.buffer = newBuffer;
          this.offset = 0;
          if (this.arrayCache.length) {
            const arr = parseArrayChunks(this);
            if (arr === void 0) {
              return;
            }
            this.returnReply(arr);
          }
        } else if (this.totalChunkSize + buffer.length >= this.bigStrSize) {
          this.bufferCache.push(buffer);
          var tmp = this.optionReturnBuffers ? concatBulkBuffer(this) : concatBulkString(this);
          this.bigStrSize = 0;
          this.bufferCache = [];
          this.buffer = buffer;
          if (this.arrayCache.length) {
            this.arrayCache[0][this.arrayPos[0]++] = tmp;
            tmp = parseArrayChunks(this);
            if (tmp === void 0) {
              return;
            }
          }
          this.returnReply(tmp);
        } else {
          this.bufferCache.push(buffer);
          this.totalChunkSize += buffer.length;
          return;
        }
        while (this.offset < this.buffer.length) {
          const offset = this.offset;
          const type = this.buffer[this.offset++];
          const response = parseType(this, type);
          if (response === void 0) {
            if (!(this.arrayCache.length || this.bufferCache.length)) {
              this.offset = offset;
            }
            return;
          }
          if (type === 45) {
            this.returnError(response);
          } else {
            this.returnReply(response);
          }
        }
        this.buffer = null;
      }
    };
    __name(JavascriptRedisParser, "JavascriptRedisParser");
    module.exports = JavascriptRedisParser;
  }
});

// node_modules/redis-parser/index.js
var require_redis_parser = __commonJS({
  "node_modules/redis-parser/index.js"(exports2, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    module.exports = require_parser();
  }
});

// node_modules/ioredis/built/SubscriptionSet.js
var require_SubscriptionSet = __commonJS({
  "node_modules/ioredis/built/SubscriptionSet.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var SubscriptionSet = class {
      constructor() {
        this.set = {
          subscribe: {},
          psubscribe: {},
          ssubscribe: {}
        };
      }
      add(set, channel2) {
        this.set[mapSet(set)][channel2] = true;
      }
      del(set, channel2) {
        delete this.set[mapSet(set)][channel2];
      }
      channels(set) {
        return Object.keys(this.set[mapSet(set)]);
      }
      isEmpty() {
        return this.channels("subscribe").length === 0 && this.channels("psubscribe").length === 0 && this.channels("ssubscribe").length === 0;
      }
    };
    __name(SubscriptionSet, "SubscriptionSet");
    exports2.default = SubscriptionSet;
    function mapSet(set) {
      if (set === "unsubscribe") {
        return "subscribe";
      }
      if (set === "punsubscribe") {
        return "psubscribe";
      }
      if (set === "sunsubscribe") {
        return "ssubscribe";
      }
      return set;
    }
    __name(mapSet, "mapSet");
  }
});

// node_modules/ioredis/built/DataHandler.js
var require_DataHandler = __commonJS({
  "node_modules/ioredis/built/DataHandler.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var Command_1 = require_Command();
    var utils_1 = require_utils2();
    var RedisParser = require_redis_parser();
    var SubscriptionSet_1 = require_SubscriptionSet();
    var debug5 = (0, utils_1.Debug)("dataHandler");
    var DataHandler = class {
      constructor(redis, parserOptions) {
        this.redis = redis;
        const parser = new RedisParser({
          stringNumbers: parserOptions.stringNumbers,
          returnBuffers: true,
          returnError: (err) => {
            this.returnError(err);
          },
          returnFatalError: (err) => {
            this.returnFatalError(err);
          },
          returnReply: (reply) => {
            this.returnReply(reply);
          }
        });
        redis.stream.prependListener("data", (data) => {
          parser.execute(data);
        });
        redis.stream.resume();
      }
      returnFatalError(err) {
        err.message += ". Please report this.";
        this.redis.recoverFromFatalError(err, err, { offlineQueue: false });
      }
      returnError(err) {
        const item = this.shiftCommand(err);
        if (!item) {
          return;
        }
        err.command = {
          name: item.command.name,
          args: item.command.args
        };
        this.redis.handleReconnection(err, item);
      }
      returnReply(reply) {
        if (this.handleMonitorReply(reply)) {
          return;
        }
        if (this.handleSubscriberReply(reply)) {
          return;
        }
        const item = this.shiftCommand(reply);
        if (!item) {
          return;
        }
        if (Command_1.default.checkFlag("ENTER_SUBSCRIBER_MODE", item.command.name)) {
          this.redis.condition.subscriber = new SubscriptionSet_1.default();
          this.redis.condition.subscriber.add(item.command.name, reply[1].toString());
          if (!fillSubCommand(item.command, reply[2])) {
            this.redis.commandQueue.unshift(item);
          }
        } else if (Command_1.default.checkFlag("EXIT_SUBSCRIBER_MODE", item.command.name)) {
          if (!fillUnsubCommand(item.command, reply[2])) {
            this.redis.commandQueue.unshift(item);
          }
        } else {
          item.command.resolve(reply);
        }
      }
      handleSubscriberReply(reply) {
        if (!this.redis.condition.subscriber) {
          return false;
        }
        const replyType = Array.isArray(reply) ? reply[0].toString() : null;
        debug5('receive reply "%s" in subscriber mode', replyType);
        switch (replyType) {
          case "message":
            if (this.redis.listeners("message").length > 0) {
              this.redis.emit("message", reply[1].toString(), reply[2] ? reply[2].toString() : "");
            }
            this.redis.emit("messageBuffer", reply[1], reply[2]);
            break;
          case "pmessage": {
            const pattern = reply[1].toString();
            if (this.redis.listeners("pmessage").length > 0) {
              this.redis.emit("pmessage", pattern, reply[2].toString(), reply[3].toString());
            }
            this.redis.emit("pmessageBuffer", pattern, reply[2], reply[3]);
            break;
          }
          case "smessage": {
            if (this.redis.listeners("smessage").length > 0) {
              this.redis.emit("smessage", reply[1].toString(), reply[2] ? reply[2].toString() : "");
            }
            this.redis.emit("smessageBuffer", reply[1], reply[2]);
            break;
          }
          case "ssubscribe":
          case "subscribe":
          case "psubscribe": {
            const channel2 = reply[1].toString();
            this.redis.condition.subscriber.add(replyType, channel2);
            const item = this.shiftCommand(reply);
            if (!item) {
              return;
            }
            if (!fillSubCommand(item.command, reply[2])) {
              this.redis.commandQueue.unshift(item);
            }
            break;
          }
          case "sunsubscribe":
          case "unsubscribe":
          case "punsubscribe": {
            const channel2 = reply[1] ? reply[1].toString() : null;
            if (channel2) {
              this.redis.condition.subscriber.del(replyType, channel2);
            }
            const count3 = reply[2];
            if (Number(count3) === 0) {
              this.redis.condition.subscriber = false;
            }
            const item = this.shiftCommand(reply);
            if (!item) {
              return;
            }
            if (!fillUnsubCommand(item.command, count3)) {
              this.redis.commandQueue.unshift(item);
            }
            break;
          }
          default: {
            const item = this.shiftCommand(reply);
            if (!item) {
              return;
            }
            item.command.resolve(reply);
          }
        }
        return true;
      }
      handleMonitorReply(reply) {
        if (this.redis.status !== "monitoring") {
          return false;
        }
        const replyStr = reply.toString();
        if (replyStr === "OK") {
          return false;
        }
        const len = replyStr.indexOf(" ");
        const timestamp = replyStr.slice(0, len);
        const argIndex = replyStr.indexOf('"');
        const args = replyStr.slice(argIndex + 1, -1).split('" "').map((elem) => elem.replace(/\\"/g, '"'));
        const dbAndSource = replyStr.slice(len + 2, argIndex - 2).split(" ");
        this.redis.emit("monitor", timestamp, args, dbAndSource[1], dbAndSource[0]);
        return true;
      }
      shiftCommand(reply) {
        const item = this.redis.commandQueue.shift();
        if (!item) {
          const message = "Command queue state error. If you can reproduce this, please report it.";
          const error3 = new Error(message + (reply instanceof Error ? ` Last error: ${reply.message}` : ` Last reply: ${reply.toString()}`));
          this.redis.emit("error", error3);
          return null;
        }
        return item;
      }
    };
    __name(DataHandler, "DataHandler");
    exports2.default = DataHandler;
    var remainingRepliesMap = /* @__PURE__ */ new WeakMap();
    function fillSubCommand(command, count3) {
      let remainingReplies = remainingRepliesMap.has(command) ? remainingRepliesMap.get(command) : command.args.length;
      remainingReplies -= 1;
      if (remainingReplies <= 0) {
        command.resolve(count3);
        remainingRepliesMap.delete(command);
        return true;
      }
      remainingRepliesMap.set(command, remainingReplies);
      return false;
    }
    __name(fillSubCommand, "fillSubCommand");
    function fillUnsubCommand(command, count3) {
      let remainingReplies = remainingRepliesMap.has(command) ? remainingRepliesMap.get(command) : command.args.length;
      if (remainingReplies === 0) {
        if (Number(count3) === 0) {
          remainingRepliesMap.delete(command);
          command.resolve(count3);
          return true;
        }
        return false;
      }
      remainingReplies -= 1;
      if (remainingReplies <= 0) {
        command.resolve(count3);
        return true;
      }
      remainingRepliesMap.set(command, remainingReplies);
      return false;
    }
    __name(fillUnsubCommand, "fillUnsubCommand");
  }
});

// node_modules/ioredis/built/redis/event_handler.js
var require_event_handler = __commonJS({
  "node_modules/ioredis/built/redis/event_handler.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.readyHandler = exports2.errorHandler = exports2.closeHandler = exports2.connectHandler = void 0;
    var redis_errors_1 = require_redis_errors();
    var Command_1 = require_Command();
    var errors_1 = require_errors();
    var utils_1 = require_utils2();
    var DataHandler_1 = require_DataHandler();
    var debug5 = (0, utils_1.Debug)("connection");
    function connectHandler(self2) {
      return function() {
        self2.setStatus("connect");
        self2.resetCommandQueue();
        let flushed = false;
        const { connectionEpoch } = self2;
        if (self2.condition.auth) {
          self2.auth(self2.condition.auth, function(err) {
            if (connectionEpoch !== self2.connectionEpoch) {
              return;
            }
            if (err) {
              if (err.message.indexOf("no password is set") !== -1) {
                console.warn("[WARN] Redis server does not require a password, but a password was supplied.");
              } else if (err.message.indexOf("without any password configured for the default user") !== -1) {
                console.warn("[WARN] This Redis server's `default` user does not require a password, but a password was supplied");
              } else if (err.message.indexOf("wrong number of arguments for 'auth' command") !== -1) {
                console.warn(`[ERROR] The server returned "wrong number of arguments for 'auth' command". You are probably passing both username and password to Redis version 5 or below. You should only pass the 'password' option for Redis version 5 and under.`);
              } else {
                flushed = true;
                self2.recoverFromFatalError(err, err);
              }
            }
          });
        }
        if (self2.condition.select) {
          self2.select(self2.condition.select).catch((err) => {
            self2.silentEmit("error", err);
          });
        }
        if (!self2.options.enableReadyCheck) {
          exports2.readyHandler(self2)();
        }
        new DataHandler_1.default(self2, {
          stringNumbers: self2.options.stringNumbers
        });
        if (self2.options.enableReadyCheck) {
          self2._readyCheck(function(err, info3) {
            if (connectionEpoch !== self2.connectionEpoch) {
              return;
            }
            if (err) {
              if (!flushed) {
                self2.recoverFromFatalError(new Error("Ready check failed: " + err.message), err);
              }
            } else {
              if (self2.connector.check(info3)) {
                exports2.readyHandler(self2)();
              } else {
                self2.disconnect(true);
              }
            }
          });
        }
      };
    }
    __name(connectHandler, "connectHandler");
    exports2.connectHandler = connectHandler;
    function abortError(command) {
      const err = new redis_errors_1.AbortError("Command aborted due to connection close");
      err.command = {
        name: command.name,
        args: command.args
      };
      return err;
    }
    __name(abortError, "abortError");
    function abortIncompletePipelines(commandQueue) {
      var _a;
      let expectedIndex = 0;
      for (let i = 0; i < commandQueue.length; ) {
        const command = (_a = commandQueue.peekAt(i)) === null || _a === void 0 ? void 0 : _a.command;
        const pipelineIndex = command.pipelineIndex;
        if (pipelineIndex === void 0 || pipelineIndex === 0) {
          expectedIndex = 0;
        }
        if (pipelineIndex !== void 0 && pipelineIndex !== expectedIndex++) {
          commandQueue.remove(i, 1);
          command.reject(abortError(command));
          continue;
        }
        i++;
      }
    }
    __name(abortIncompletePipelines, "abortIncompletePipelines");
    function abortTransactionFragments(commandQueue) {
      var _a;
      for (let i = 0; i < commandQueue.length; ) {
        const command = (_a = commandQueue.peekAt(i)) === null || _a === void 0 ? void 0 : _a.command;
        if (command.name === "multi") {
          break;
        }
        if (command.name === "exec") {
          commandQueue.remove(i, 1);
          command.reject(abortError(command));
          break;
        }
        if (command.inTransaction) {
          commandQueue.remove(i, 1);
          command.reject(abortError(command));
        } else {
          i++;
        }
      }
    }
    __name(abortTransactionFragments, "abortTransactionFragments");
    function closeHandler(self2) {
      return function() {
        const prevStatus = self2.status;
        self2.setStatus("close");
        if (self2.commandQueue.length) {
          abortIncompletePipelines(self2.commandQueue);
        }
        if (self2.offlineQueue.length) {
          abortTransactionFragments(self2.offlineQueue);
        }
        if (prevStatus === "ready") {
          if (!self2.prevCondition) {
            self2.prevCondition = self2.condition;
          }
          if (self2.commandQueue.length) {
            self2.prevCommandQueue = self2.commandQueue;
          }
        }
        if (self2.manuallyClosing) {
          self2.manuallyClosing = false;
          debug5("skip reconnecting since the connection is manually closed.");
          return close();
        }
        if (typeof self2.options.retryStrategy !== "function") {
          debug5("skip reconnecting because `retryStrategy` is not a function");
          return close();
        }
        const retryDelay = self2.options.retryStrategy(++self2.retryAttempts);
        if (typeof retryDelay !== "number") {
          debug5("skip reconnecting because `retryStrategy` doesn't return a number");
          return close();
        }
        debug5("reconnect in %sms", retryDelay);
        self2.setStatus("reconnecting", retryDelay);
        self2.reconnectTimeout = setTimeout(function() {
          self2.reconnectTimeout = null;
          self2.connect().catch(utils_1.noop);
        }, retryDelay);
        const { maxRetriesPerRequest } = self2.options;
        if (typeof maxRetriesPerRequest === "number") {
          if (maxRetriesPerRequest < 0) {
            debug5("maxRetriesPerRequest is negative, ignoring...");
          } else {
            const remainder = self2.retryAttempts % (maxRetriesPerRequest + 1);
            if (remainder === 0) {
              debug5("reach maxRetriesPerRequest limitation, flushing command queue...");
              self2.flushQueue(new errors_1.MaxRetriesPerRequestError(maxRetriesPerRequest));
            }
          }
        }
      };
      function close() {
        self2.setStatus("end");
        self2.flushQueue(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
      }
      __name(close, "close");
    }
    __name(closeHandler, "closeHandler");
    exports2.closeHandler = closeHandler;
    function errorHandler(self2) {
      return function(error3) {
        debug5("error: %s", error3);
        self2.silentEmit("error", error3);
      };
    }
    __name(errorHandler, "errorHandler");
    exports2.errorHandler = errorHandler;
    function readyHandler(self2) {
      return function() {
        self2.setStatus("ready");
        self2.retryAttempts = 0;
        if (self2.options.monitor) {
          self2.call("monitor").then(() => self2.setStatus("monitoring"), (error3) => self2.emit("error", error3));
          const { sendCommand } = self2;
          self2.sendCommand = function(command) {
            if (Command_1.default.checkFlag("VALID_IN_MONITOR_MODE", command.name)) {
              return sendCommand.call(self2, command);
            }
            command.reject(new Error("Connection is in monitoring mode, can't process commands."));
            return command.promise;
          };
          self2.once("close", function() {
            delete self2.sendCommand;
          });
          return;
        }
        const finalSelect = self2.prevCondition ? self2.prevCondition.select : self2.condition.select;
        if (self2.options.connectionName) {
          debug5("set the connection name [%s]", self2.options.connectionName);
          self2.client("setname", self2.options.connectionName).catch(utils_1.noop);
        }
        if (self2.options.readOnly) {
          debug5("set the connection to readonly mode");
          self2.readonly().catch(utils_1.noop);
        }
        if (self2.prevCondition) {
          const condition = self2.prevCondition;
          self2.prevCondition = null;
          if (condition.subscriber && self2.options.autoResubscribe) {
            if (self2.condition.select !== finalSelect) {
              debug5("connect to db [%d]", finalSelect);
              self2.select(finalSelect);
            }
            const subscribeChannels = condition.subscriber.channels("subscribe");
            if (subscribeChannels.length) {
              debug5("subscribe %d channels", subscribeChannels.length);
              self2.subscribe(subscribeChannels);
            }
            const psubscribeChannels = condition.subscriber.channels("psubscribe");
            if (psubscribeChannels.length) {
              debug5("psubscribe %d channels", psubscribeChannels.length);
              self2.psubscribe(psubscribeChannels);
            }
            const ssubscribeChannels = condition.subscriber.channels("ssubscribe");
            if (ssubscribeChannels.length) {
              debug5("ssubscribe %d channels", ssubscribeChannels.length);
              self2.ssubscribe(ssubscribeChannels);
            }
          }
        }
        if (self2.prevCommandQueue) {
          if (self2.options.autoResendUnfulfilledCommands) {
            debug5("resend %d unfulfilled commands", self2.prevCommandQueue.length);
            while (self2.prevCommandQueue.length > 0) {
              const item = self2.prevCommandQueue.shift();
              if (item.select !== self2.condition.select && item.command.name !== "select") {
                self2.select(item.select);
              }
              self2.sendCommand(item.command, item.stream);
            }
          } else {
            self2.prevCommandQueue = null;
          }
        }
        if (self2.offlineQueue.length) {
          debug5("send %d commands in offline queue", self2.offlineQueue.length);
          const offlineQueue = self2.offlineQueue;
          self2.resetOfflineQueue();
          while (offlineQueue.length > 0) {
            const item = offlineQueue.shift();
            if (item.select !== self2.condition.select && item.command.name !== "select") {
              self2.select(item.select);
            }
            self2.sendCommand(item.command, item.stream);
          }
        }
        if (self2.condition.select !== finalSelect) {
          debug5("connect to db [%d]", finalSelect);
          self2.select(finalSelect);
        }
      };
    }
    __name(readyHandler, "readyHandler");
    exports2.readyHandler = readyHandler;
  }
});

// node_modules/ioredis/built/redis/RedisOptions.js
var require_RedisOptions = __commonJS({
  "node_modules/ioredis/built/redis/RedisOptions.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.DEFAULT_REDIS_OPTIONS = void 0;
    exports2.DEFAULT_REDIS_OPTIONS = {
      // Connection
      port: 6379,
      host: "localhost",
      family: 4,
      connectTimeout: 1e4,
      disconnectTimeout: 2e3,
      retryStrategy: function(times) {
        return Math.min(times * 50, 2e3);
      },
      keepAlive: 0,
      noDelay: true,
      connectionName: null,
      // Sentinel
      sentinels: null,
      name: null,
      role: "master",
      sentinelRetryStrategy: function(times) {
        return Math.min(times * 10, 1e3);
      },
      sentinelReconnectStrategy: function() {
        return 6e4;
      },
      natMap: null,
      enableTLSForSentinelMode: false,
      updateSentinels: true,
      failoverDetector: false,
      // Status
      username: null,
      password: null,
      db: 0,
      // Others
      enableOfflineQueue: true,
      enableReadyCheck: true,
      autoResubscribe: true,
      autoResendUnfulfilledCommands: true,
      lazyConnect: false,
      keyPrefix: "",
      reconnectOnError: null,
      readOnly: false,
      stringNumbers: false,
      maxRetriesPerRequest: 20,
      maxLoadingRetryTime: 1e4,
      enableAutoPipelining: false,
      autoPipeliningIgnoredCommands: [],
      sentinelMaxConnections: 10
    };
  }
});

// node_modules/ioredis/built/Redis.js
var require_Redis = __commonJS({
  "node_modules/ioredis/built/Redis.js"(exports2) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    var commands_1 = require_built();
    var events_1 = require_events();
    var standard_as_callback_1 = require_built2();
    var cluster_1 = require_cluster();
    var Command_1 = require_Command();
    var connectors_1 = require_connectors();
    var SentinelConnector_1 = require_SentinelConnector();
    var eventHandler = require_event_handler();
    var RedisOptions_1 = require_RedisOptions();
    var ScanStream_1 = require_ScanStream();
    var transaction_1 = require_transaction();
    var utils_1 = require_utils2();
    var applyMixin_1 = require_applyMixin();
    var Commander_1 = require_Commander();
    var lodash_1 = require_lodash3();
    var Deque = require_denque();
    var debug5 = (0, utils_1.Debug)("redis");
    var Redis2 = class extends Commander_1.default {
      constructor(arg1, arg2, arg3) {
        super();
        this.status = "wait";
        this.isCluster = false;
        this.reconnectTimeout = null;
        this.connectionEpoch = 0;
        this.retryAttempts = 0;
        this.manuallyClosing = false;
        this._autoPipelines = /* @__PURE__ */ new Map();
        this._runningAutoPipelines = /* @__PURE__ */ new Set();
        this.parseOptions(arg1, arg2, arg3);
        events_1.EventEmitter.call(this);
        this.resetCommandQueue();
        this.resetOfflineQueue();
        if (this.options.Connector) {
          this.connector = new this.options.Connector(this.options);
        } else if (this.options.sentinels) {
          const sentinelConnector = new SentinelConnector_1.default(this.options);
          sentinelConnector.emitter = this;
          this.connector = sentinelConnector;
        } else {
          this.connector = new connectors_1.StandaloneConnector(this.options);
        }
        if (this.options.scripts) {
          Object.entries(this.options.scripts).forEach(([name, definition]) => {
            this.defineCommand(name, definition);
          });
        }
        if (this.options.lazyConnect) {
          this.setStatus("wait");
        } else {
          this.connect().catch(lodash_1.noop);
        }
      }
      /**
       * Create a Redis instance.
       * This is the same as `new Redis()` but is included for compatibility with node-redis.
       */
      static createClient(...args) {
        return new Redis2(...args);
      }
      get autoPipelineQueueSize() {
        let queued = 0;
        for (const pipeline of this._autoPipelines.values()) {
          queued += pipeline.length;
        }
        return queued;
      }
      /**
       * Create a connection to Redis.
       * This method will be invoked automatically when creating a new Redis instance
       * unless `lazyConnect: true` is passed.
       *
       * When calling this method manually, a Promise is returned, which will
       * be resolved when the connection status is ready.
       */
      connect(callback) {
        const promise = new Promise((resolve, reject) => {
          if (this.status === "connecting" || this.status === "connect" || this.status === "ready") {
            reject(new Error("Redis is already connecting/connected"));
            return;
          }
          this.connectionEpoch += 1;
          this.setStatus("connecting");
          const { options } = this;
          this.condition = {
            select: options.db,
            auth: options.username ? [options.username, options.password] : options.password,
            subscriber: false
          };
          const _this = this;
          (0, standard_as_callback_1.default)(this.connector.connect(function(type, err) {
            _this.silentEmit(type, err);
          }), function(err, stream) {
            if (err) {
              _this.flushQueue(err);
              _this.silentEmit("error", err);
              reject(err);
              _this.setStatus("end");
              return;
            }
            let CONNECT_EVENT = options.tls ? "secureConnect" : "connect";
            if ("sentinels" in options && options.sentinels && !options.enableTLSForSentinelMode) {
              CONNECT_EVENT = "connect";
            }
            _this.stream = stream;
            if (options.noDelay) {
              stream.setNoDelay(true);
            }
            if (typeof options.keepAlive === "number") {
              if (stream.connecting) {
                stream.once(CONNECT_EVENT, () => {
                  stream.setKeepAlive(true, options.keepAlive);
                });
              } else {
                stream.setKeepAlive(true, options.keepAlive);
              }
            }
            if (stream.connecting) {
              stream.once(CONNECT_EVENT, eventHandler.connectHandler(_this));
              if (options.connectTimeout) {
                let connectTimeoutCleared = false;
                stream.setTimeout(options.connectTimeout, function() {
                  if (connectTimeoutCleared) {
                    return;
                  }
                  stream.setTimeout(0);
                  stream.destroy();
                  const err2 = new Error("connect ETIMEDOUT");
                  err2.errorno = "ETIMEDOUT";
                  err2.code = "ETIMEDOUT";
                  err2.syscall = "connect";
                  eventHandler.errorHandler(_this)(err2);
                });
                stream.once(CONNECT_EVENT, function() {
                  connectTimeoutCleared = true;
                  stream.setTimeout(0);
                });
              }
            } else if (stream.destroyed) {
              const firstError = _this.connector.firstError;
              if (firstError) {
                process.nextTick(() => {
                  eventHandler.errorHandler(_this)(firstError);
                });
              }
              process.nextTick(eventHandler.closeHandler(_this));
            } else {
              process.nextTick(eventHandler.connectHandler(_this));
            }
            if (!stream.destroyed) {
              stream.once("error", eventHandler.errorHandler(_this));
              stream.once("close", eventHandler.closeHandler(_this));
            }
            const connectionReadyHandler = /* @__PURE__ */ __name(function() {
              _this.removeListener("close", connectionCloseHandler);
              resolve();
            }, "connectionReadyHandler");
            var connectionCloseHandler = /* @__PURE__ */ __name(function() {
              _this.removeListener("ready", connectionReadyHandler);
              reject(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
            }, "connectionCloseHandler");
            _this.once("ready", connectionReadyHandler);
            _this.once("close", connectionCloseHandler);
          });
        });
        return (0, standard_as_callback_1.default)(promise, callback);
      }
      /**
       * Disconnect from Redis.
       *
       * This method closes the connection immediately,
       * and may lose some pending replies that haven't written to client.
       * If you want to wait for the pending replies, use Redis#quit instead.
       */
      disconnect(reconnect = false) {
        if (!reconnect) {
          this.manuallyClosing = true;
        }
        if (this.reconnectTimeout && !reconnect) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
        if (this.status === "wait") {
          eventHandler.closeHandler(this)();
        } else {
          this.connector.disconnect();
        }
      }
      /**
       * Disconnect from Redis.
       *
       * @deprecated
       */
      end() {
        this.disconnect();
      }
      /**
       * Create a new instance with the same options as the current one.
       *
       * @example
       * ```js
       * var redis = new Redis(6380);
       * var anotherRedis = redis.duplicate();
       * ```
       */
      duplicate(override) {
        return new Redis2({ ...this.options, ...override });
      }
      /**
       * Mode of the connection.
       *
       * One of `"normal"`, `"subscriber"`, or `"monitor"`. When the connection is
       * not in `"normal"` mode, certain commands are not allowed.
       */
      get mode() {
        var _a;
        return this.options.monitor ? "monitor" : ((_a = this.condition) === null || _a === void 0 ? void 0 : _a.subscriber) ? "subscriber" : "normal";
      }
      /**
       * Listen for all requests received by the server in real time.
       *
       * This command will create a new connection to Redis and send a
       * MONITOR command via the new connection in order to avoid disturbing
       * the current connection.
       *
       * @param callback The callback function. If omit, a promise will be returned.
       * @example
       * ```js
       * var redis = new Redis();
       * redis.monitor(function (err, monitor) {
       *   // Entering monitoring mode.
       *   monitor.on('monitor', function (time, args, source, database) {
       *     console.log(time + ": " + util.inspect(args));
       *   });
       * });
       *
       * // supports promise as well as other commands
       * redis.monitor().then(function (monitor) {
       *   monitor.on('monitor', function (time, args, source, database) {
       *     console.log(time + ": " + util.inspect(args));
       *   });
       * });
       * ```
       */
      monitor(callback) {
        const monitorInstance = this.duplicate({
          monitor: true,
          lazyConnect: false
        });
        return (0, standard_as_callback_1.default)(new Promise(function(resolve, reject) {
          monitorInstance.once("error", reject);
          monitorInstance.once("monitoring", function() {
            resolve(monitorInstance);
          });
        }), callback);
      }
      /**
       * Send a command to Redis
       *
       * This method is used internally and in most cases you should not
       * use it directly. If you need to send a command that is not supported
       * by the library, you can use the `call` method:
       *
       * ```js
       * const redis = new Redis();
       *
       * redis.call('set', 'foo', 'bar');
       * // or
       * redis.call(['set', 'foo', 'bar']);
       * ```
       *
       * @ignore
       */
      sendCommand(command, stream) {
        var _a, _b;
        if (this.status === "wait") {
          this.connect().catch(lodash_1.noop);
        }
        if (this.status === "end") {
          command.reject(new Error(utils_1.CONNECTION_CLOSED_ERROR_MSG));
          return command.promise;
        }
        if (((_a = this.condition) === null || _a === void 0 ? void 0 : _a.subscriber) && !Command_1.default.checkFlag("VALID_IN_SUBSCRIBER_MODE", command.name)) {
          command.reject(new Error("Connection in subscriber mode, only subscriber commands may be used"));
          return command.promise;
        }
        if (typeof this.options.commandTimeout === "number") {
          command.setTimeout(this.options.commandTimeout);
        }
        let writable = this.status === "ready" || !stream && this.status === "connect" && (0, commands_1.exists)(command.name) && (0, commands_1.hasFlag)(command.name, "loading");
        if (!this.stream) {
          writable = false;
        } else if (!this.stream.writable) {
          writable = false;
        } else if (this.stream._writableState && this.stream._writableState.ended) {
          writable = false;
        }
        if (!writable) {
          if (!this.options.enableOfflineQueue) {
            command.reject(new Error("Stream isn't writeable and enableOfflineQueue options is false"));
            return command.promise;
          }
          if (command.name === "quit" && this.offlineQueue.length === 0) {
            this.disconnect();
            command.resolve(Buffer.from("OK"));
            return command.promise;
          }
          if (debug5.enabled) {
            debug5("queue command[%s]: %d -> %s(%o)", this._getDescription(), this.condition.select, command.name, command.args);
          }
          this.offlineQueue.push({
            command,
            stream,
            select: this.condition.select
          });
        } else {
          if (debug5.enabled) {
            debug5("write command[%s]: %d -> %s(%o)", this._getDescription(), (_b = this.condition) === null || _b === void 0 ? void 0 : _b.select, command.name, command.args);
          }
          if (stream) {
            if ("isPipeline" in stream && stream.isPipeline) {
              stream.write(command.toWritable(stream.destination.redis.stream));
            } else {
              stream.write(command.toWritable(stream));
            }
          } else {
            this.stream.write(command.toWritable(this.stream));
          }
          this.commandQueue.push({
            command,
            stream,
            select: this.condition.select
          });
          if (Command_1.default.checkFlag("WILL_DISCONNECT", command.name)) {
            this.manuallyClosing = true;
          }
          if (this.options.socketTimeout !== void 0 && this.socketTimeoutTimer === void 0) {
            this.setSocketTimeout();
          }
        }
        if (command.name === "select" && (0, utils_1.isInt)(command.args[0])) {
          const db = parseInt(command.args[0], 10);
          if (this.condition.select !== db) {
            this.condition.select = db;
            this.emit("select", db);
            debug5("switch to db [%d]", this.condition.select);
          }
        }
        return command.promise;
      }
      setSocketTimeout() {
        this.socketTimeoutTimer = setTimeout(() => {
          this.stream.destroy(new Error(`Socket timeout. Expecting data, but didn't receive any in ${this.options.socketTimeout}ms.`));
          this.socketTimeoutTimer = void 0;
        }, this.options.socketTimeout);
        this.stream.once("data", () => {
          clearTimeout(this.socketTimeoutTimer);
          this.socketTimeoutTimer = void 0;
          if (this.commandQueue.length === 0)
            return;
          this.setSocketTimeout();
        });
      }
      scanStream(options) {
        return this.createScanStream("scan", { options });
      }
      scanBufferStream(options) {
        return this.createScanStream("scanBuffer", { options });
      }
      sscanStream(key, options) {
        return this.createScanStream("sscan", { key, options });
      }
      sscanBufferStream(key, options) {
        return this.createScanStream("sscanBuffer", { key, options });
      }
      hscanStream(key, options) {
        return this.createScanStream("hscan", { key, options });
      }
      hscanBufferStream(key, options) {
        return this.createScanStream("hscanBuffer", { key, options });
      }
      zscanStream(key, options) {
        return this.createScanStream("zscan", { key, options });
      }
      zscanBufferStream(key, options) {
        return this.createScanStream("zscanBuffer", { key, options });
      }
      /**
       * Emit only when there's at least one listener.
       *
       * @ignore
       */
      silentEmit(eventName, arg) {
        let error3;
        if (eventName === "error") {
          error3 = arg;
          if (this.status === "end") {
            return;
          }
          if (this.manuallyClosing) {
            if (error3 instanceof Error && (error3.message === utils_1.CONNECTION_CLOSED_ERROR_MSG || // @ts-expect-error
            error3.syscall === "connect" || // @ts-expect-error
            error3.syscall === "read")) {
              return;
            }
          }
        }
        if (this.listeners(eventName).length > 0) {
          return this.emit.apply(this, arguments);
        }
        if (error3 && error3 instanceof Error) {
          console.error("[ioredis] Unhandled error event:", error3.stack);
        }
        return false;
      }
      /**
       * @ignore
       */
      recoverFromFatalError(_commandError, err, options) {
        this.flushQueue(err, options);
        this.silentEmit("error", err);
        this.disconnect(true);
      }
      /**
       * @ignore
       */
      handleReconnection(err, item) {
        var _a;
        let needReconnect = false;
        if (this.options.reconnectOnError) {
          needReconnect = this.options.reconnectOnError(err);
        }
        switch (needReconnect) {
          case 1:
          case true:
            if (this.status !== "reconnecting") {
              this.disconnect(true);
            }
            item.command.reject(err);
            break;
          case 2:
            if (this.status !== "reconnecting") {
              this.disconnect(true);
            }
            if (((_a = this.condition) === null || _a === void 0 ? void 0 : _a.select) !== item.select && item.command.name !== "select") {
              this.select(item.select);
            }
            this.sendCommand(item.command);
            break;
          default:
            item.command.reject(err);
        }
      }
      /**
       * Get description of the connection. Used for debugging.
       */
      _getDescription() {
        let description;
        if ("path" in this.options && this.options.path) {
          description = this.options.path;
        } else if (this.stream && this.stream.remoteAddress && this.stream.remotePort) {
          description = this.stream.remoteAddress + ":" + this.stream.remotePort;
        } else if ("host" in this.options && this.options.host) {
          description = this.options.host + ":" + this.options.port;
        } else {
          description = "";
        }
        if (this.options.connectionName) {
          description += ` (${this.options.connectionName})`;
        }
        return description;
      }
      resetCommandQueue() {
        this.commandQueue = new Deque();
      }
      resetOfflineQueue() {
        this.offlineQueue = new Deque();
      }
      parseOptions(...args) {
        const options = {};
        let isTls = false;
        for (let i = 0; i < args.length; ++i) {
          const arg = args[i];
          if (arg === null || typeof arg === "undefined") {
            continue;
          }
          if (typeof arg === "object") {
            (0, lodash_1.defaults)(options, arg);
          } else if (typeof arg === "string") {
            (0, lodash_1.defaults)(options, (0, utils_1.parseURL)(arg));
            if (arg.startsWith("rediss://")) {
              isTls = true;
            }
          } else if (typeof arg === "number") {
            options.port = arg;
          } else {
            throw new Error("Invalid argument " + arg);
          }
        }
        if (isTls) {
          (0, lodash_1.defaults)(options, { tls: true });
        }
        (0, lodash_1.defaults)(options, Redis2.defaultOptions);
        if (typeof options.port === "string") {
          options.port = parseInt(options.port, 10);
        }
        if (typeof options.db === "string") {
          options.db = parseInt(options.db, 10);
        }
        this.options = (0, utils_1.resolveTLSProfile)(options);
      }
      /**
       * Change instance's status
       */
      setStatus(status, arg) {
        if (debug5.enabled) {
          debug5("status[%s]: %s -> %s", this._getDescription(), this.status || "[empty]", status);
        }
        this.status = status;
        process.nextTick(this.emit.bind(this, status, arg));
      }
      createScanStream(command, { key, options = {} }) {
        return new ScanStream_1.default({
          objectMode: true,
          key,
          redis: this,
          command,
          ...options
        });
      }
      /**
       * Flush offline queue and command queue with error.
       *
       * @param error The error object to send to the commands
       * @param options options
       */
      flushQueue(error3, options) {
        options = (0, lodash_1.defaults)({}, options, {
          offlineQueue: true,
          commandQueue: true
        });
        let item;
        if (options.offlineQueue) {
          while (item = this.offlineQueue.shift()) {
            item.command.reject(error3);
          }
        }
        if (options.commandQueue) {
          if (this.commandQueue.length > 0) {
            if (this.stream) {
              this.stream.removeAllListeners("data");
            }
            while (item = this.commandQueue.shift()) {
              item.command.reject(error3);
            }
          }
        }
      }
      /**
       * Check whether Redis has finished loading the persistent data and is able to
       * process commands.
       */
      _readyCheck(callback) {
        const _this = this;
        this.info(function(err, res) {
          if (err) {
            if (err.message && err.message.includes("NOPERM")) {
              console.warn(`Skipping the ready check because INFO command fails: "${err.message}". You can disable ready check with "enableReadyCheck". More: https://github.com/luin/ioredis/wiki/Disable-ready-check.`);
              return callback(null, {});
            }
            return callback(err);
          }
          if (typeof res !== "string") {
            return callback(null, res);
          }
          const info3 = {};
          const lines = res.split("\r\n");
          for (let i = 0; i < lines.length; ++i) {
            const [fieldName, ...fieldValueParts] = lines[i].split(":");
            const fieldValue = fieldValueParts.join(":");
            if (fieldValue) {
              info3[fieldName] = fieldValue;
            }
          }
          if (!info3.loading || info3.loading === "0") {
            callback(null, info3);
          } else {
            const loadingEtaMs = (info3.loading_eta_seconds || 1) * 1e3;
            const retryTime = _this.options.maxLoadingRetryTime && _this.options.maxLoadingRetryTime < loadingEtaMs ? _this.options.maxLoadingRetryTime : loadingEtaMs;
            debug5("Redis server still loading, trying again in " + retryTime + "ms");
            setTimeout(function() {
              _this._readyCheck(callback);
            }, retryTime);
          }
        }).catch(lodash_1.noop);
      }
    };
    __name(Redis2, "Redis");
    Redis2.Cluster = cluster_1.default;
    Redis2.Command = Command_1.default;
    Redis2.defaultOptions = RedisOptions_1.DEFAULT_REDIS_OPTIONS;
    (0, applyMixin_1.default)(Redis2, events_1.EventEmitter);
    (0, transaction_1.addTransactionSupport)(Redis2.prototype);
    exports2.default = Redis2;
  }
});

// node_modules/ioredis/built/index.js
var require_built3 = __commonJS({
  "node_modules/ioredis/built/index.js"(exports2, module) {
    "use strict";
    init_modules_watch_stub();
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.print = exports2.ReplyError = exports2.SentinelIterator = exports2.SentinelConnector = exports2.AbstractConnector = exports2.Pipeline = exports2.ScanStream = exports2.Command = exports2.Cluster = exports2.Redis = exports2.default = void 0;
    exports2 = module.exports = require_Redis().default;
    var Redis_1 = require_Redis();
    Object.defineProperty(exports2, "default", { enumerable: true, get: function() {
      return Redis_1.default;
    } });
    var Redis_2 = require_Redis();
    Object.defineProperty(exports2, "Redis", { enumerable: true, get: function() {
      return Redis_2.default;
    } });
    var cluster_1 = require_cluster();
    Object.defineProperty(exports2, "Cluster", { enumerable: true, get: function() {
      return cluster_1.default;
    } });
    var Command_1 = require_Command();
    Object.defineProperty(exports2, "Command", { enumerable: true, get: function() {
      return Command_1.default;
    } });
    var ScanStream_1 = require_ScanStream();
    Object.defineProperty(exports2, "ScanStream", { enumerable: true, get: function() {
      return ScanStream_1.default;
    } });
    var Pipeline_1 = require_Pipeline();
    Object.defineProperty(exports2, "Pipeline", { enumerable: true, get: function() {
      return Pipeline_1.default;
    } });
    var AbstractConnector_1 = require_AbstractConnector();
    Object.defineProperty(exports2, "AbstractConnector", { enumerable: true, get: function() {
      return AbstractConnector_1.default;
    } });
    var SentinelConnector_1 = require_SentinelConnector();
    Object.defineProperty(exports2, "SentinelConnector", { enumerable: true, get: function() {
      return SentinelConnector_1.default;
    } });
    Object.defineProperty(exports2, "SentinelIterator", { enumerable: true, get: function() {
      return SentinelConnector_1.SentinelIterator;
    } });
    exports2.ReplyError = require_redis_errors().ReplyError;
    Object.defineProperty(exports2, "Promise", {
      get() {
        console.warn("ioredis v5 does not support plugging third-party Promise library anymore. Native Promise will be used.");
        return Promise;
      },
      set(_lib) {
        console.warn("ioredis v5 does not support plugging third-party Promise library anymore. Native Promise will be used.");
      }
    });
    function print(err, reply) {
      if (err) {
        console.log("Error: " + err);
      } else {
        console.log("Reply: " + reply);
      }
    }
    __name(print, "print");
    exports2.print = print;
  }
});

// .wrangler/tmp/bundle-NJ3g0v/middleware-loader.entry.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// .wrangler/tmp/bundle-NJ3g0v/middleware-insertion-facade.js
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// index.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// utils/parseClippings.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var BATCH_SIZE = 100;
async function generateHighlightHash(highlight, location, bookTitle, author) {
  const firstChunk = highlight[0] || "";
  const content = firstChunk + location + bookTitle + author;
  const msgUint8 = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(generateHighlightHash, "generateHighlightHash");
function splitText(text, maxLength = 2e3) {
  if (!text || text.length === 0) {
    return [];
  }
  if (text.length <= maxLength) {
    return [text];
  }
  const chunks = [];
  let currentChunk = "";
  const sentences = text.split(/(?<=[.!?](?:\s+|$))/).map((s) => s.trim()).filter((s) => s.length > 0);
  for (const sentence of sentences) {
    const potentialChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    if (potentialChunk.length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = "";
      }
      if (sentence.length > maxLength) {
        let remainingText = sentence;
        while (remainingText.length > 0) {
          let cutoff = maxLength;
          if (remainingText.length > maxLength) {
            cutoff = remainingText.lastIndexOf(" ", maxLength);
            if (cutoff === -1)
              cutoff = maxLength;
          }
          chunks.push(remainingText.substring(0, cutoff).trim());
          remainingText = remainingText.substring(cutoff).trim();
        }
      } else {
        currentChunk = sentence;
      }
    } else {
      currentChunk = potentialChunk;
    }
  }
  if (currentChunk) {
    if (currentChunk.length > maxLength) {
      const lastSpace = currentChunk.lastIndexOf(" ", maxLength);
      if (lastSpace !== -1) {
        chunks.push(currentChunk.substring(0, lastSpace).trim());
        chunks.push(currentChunk.substring(lastSpace).trim());
      } else {
        chunks.push(currentChunk.substring(0, maxLength).trim());
        if (currentChunk.length > maxLength) {
          chunks.push(currentChunk.substring(maxLength).trim());
        }
      }
    } else {
      chunks.push(currentChunk.trim());
    }
  }
  return chunks.map((chunk) => {
    if (chunk.length > maxLength) {
      console.warn(`Found chunk exceeding ${maxLength} characters, truncating...`);
      return chunk.substring(0, maxLength);
    }
    return chunk;
  });
}
__name(splitText, "splitText");
async function processBatch(entries, highlightGroups) {
  for (const entry of entries) {
    try {
      const lines = entry.split(/\r?\n/).map((line) => line.trim());
      if (lines.length < 3) {
        console.log("Skipping entry: insufficient lines", { lineCount: lines.length });
        continue;
      }
      const titleAuthorMatch = lines[0].match(/^(.*?)\s*\((.*?)\)$/);
      if (!titleAuthorMatch) {
        console.log("Skipping entry: invalid title/author format", { line: lines[0] });
        continue;
      }
      const bookTitle = titleAuthorMatch[1].trim();
      const author = titleAuthorMatch[2].trim();
      if (lines[1].includes("Your Bookmark")) {
        console.log("Skipping entry: bookmark");
        continue;
      }
      const metadataMatch = lines[1].match(/^- Your (?:Highlight|Note) (?:at|on page \d+)?\s*(?:\|?\s*(?:location(?:s)? (\d+(?:-\d+)?)|page \d+)?)?\s*(?:\|?\s*Added on (.+))?$/);
      if (!metadataMatch) {
        console.log("Skipping entry: invalid metadata format", { line: lines[1] });
        continue;
      }
      const location = metadataMatch[1];
      const dateStr = metadataMatch[2];
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log("Skipping entry: invalid date", { dateStr });
        continue;
      }
      const highlightContent = lines.slice(2).join("\n").trim();
      const invalidPatterns = [
        "You have reached the clipping limit for this item",
        "clipping limit",
        "no more items",
        "content is not available",
        "unavailable for this book"
      ];
      if (!highlightContent) {
        console.log("Skipping entry: empty highlight content");
        continue;
      }
      const hasInvalidPattern = invalidPatterns.some(
        (pattern) => highlightContent.toLowerCase().includes(pattern.toLowerCase())
      );
      if (hasInvalidPattern) {
        console.log("Skipping entry: invalid content pattern detected", {
          bookTitle,
          content: highlightContent,
          location
        });
        continue;
      }
      if (highlightContent.length < 3 || highlightContent.trim().split(/\s+/).length < 2 || /^[.,;:!?-\s]*$/.test(highlightContent)) {
        console.log("Skipping entry: content too short or invalid", {
          bookTitle,
          content: highlightContent,
          location
        });
        continue;
      }
      const highlightChunks = splitText(highlightContent);
      highlightChunks.forEach((chunk, i) => {
        if (chunk.length > 2e3) {
          console.error(`ERROR: Chunk exceeds limit: Chunk ${i + 1}/${highlightChunks.length} is ${chunk.length} characters`);
          highlightChunks[i] = chunk.substring(0, 2e3);
        } else if (chunk.length > 1900) {
          console.warn(`Warning: Chunk approaching limit: Chunk ${i + 1}/${highlightChunks.length} is ${chunk.length} characters`);
        }
      });
      if (highlightChunks.length > 10) {
        console.warn(`Warning: Large number of chunks (${highlightChunks.length}) for highlight in "${bookTitle}". Consider reviewing the content.`);
      }
      const groupKey = `${bookTitle}|${location.split("-")[0]}`;
      if (!highlightGroups.has(groupKey)) {
        highlightGroups.set(groupKey, []);
      }
      const highlight = {
        bookTitle,
        author,
        highlight: highlightChunks,
        location,
        date,
        hash: await generateHighlightHash(highlightChunks, location, bookTitle, author)
      };
      highlightGroups.get(groupKey).push(highlight);
    } catch (error3) {
      console.error("Error parsing entry:", error3);
      continue;
    }
  }
}
__name(processBatch, "processBatch");
async function parseClippings(fileContent) {
  console.log("Starting to parse clippings file");
  const entries = fileContent.split("==========").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  console.log(`Found ${entries.length} valid entries`);
  const highlightGroups = /* @__PURE__ */ new Map();
  const highlights = [];
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(entries.length / BATCH_SIZE)}`);
    await processBatch(batch, highlightGroups);
  }
  for (const [groupKey, group3] of highlightGroups.entries()) {
    console.debug(`Processing group: ${groupKey}`);
    console.debug(`Group size before deduplication: ${group3.length}`);
    const hashMap = /* @__PURE__ */ new Map();
    group3.forEach((h) => {
      if (!hashMap.has(h.hash)) {
        hashMap.set(h.hash, []);
      }
      hashMap.get(h.hash).push({
        date: h.date,
        location: h.location
      });
    });
    hashMap.forEach((entries2, hash2) => {
      if (entries2.length > 1) {
        console.warn(`Hash conflict detected in group ${groupKey}:`, {
          hash: hash2,
          conflictCount: entries2.length,
          entries: entries2.map((e) => ({
            date: e.date.toISOString(),
            location: e.location
          }))
        });
      }
    });
    group3.sort((a, b) => b.date.getTime() - a.date.getTime());
    const uniqueHighlights = /* @__PURE__ */ new Set();
    const duplicateCount = { total: 0, byHash: /* @__PURE__ */ new Map() };
    for (const highlight of group3) {
      const isDuplicate = uniqueHighlights.has(highlight.hash);
      if (isDuplicate) {
        duplicateCount.total++;
        duplicateCount.byHash.set(
          highlight.hash,
          (duplicateCount.byHash.get(highlight.hash) || 0) + 1
        );
      } else {
        uniqueHighlights.add(highlight.hash);
        highlights.push(highlight);
      }
    }
    console.debug(`Group ${groupKey} deduplication results:`, {
      originalCount: group3.length,
      uniqueCount: uniqueHighlights.size,
      duplicatesRemoved: duplicateCount.total,
      duplicatesByHash: Array.from(duplicateCount.byHash.entries())
    });
  }
  console.log(`Successfully parsed ${highlights.length} highlights`);
  highlights.forEach((h, index) => {
    console.debug(`Verifying highlight ${index + 1}/${highlights.length}`);
    if (!h.bookTitle || !h.author || !h.highlight || !h.location || !h.date) {
      console.warn("Invalid highlight structure:", h);
    }
  });
  return highlights;
}
__name(parseClippings, "parseClippings");

// lib/redis-client.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var import_ioredis = __toESM(require_built3());
var RedisClient = class {
  client;
  connectionPromise;
  constructor(options) {
    this.client = new import_ioredis.default(options.url, {
      tls: {
        rejectUnauthorized: false
      },
      retryStrategy: (times) => Math.min(times * 100, 500),
      maxRetriesPerRequest: 3,
      connectTimeout: 5e3
      // 5 second timeout
    });
    this.connectionPromise = new Promise((resolve, reject) => {
      this.client.once("ready", () => {
        console.log("Redis connection ready");
        resolve();
      });
      this.client.once("error", (err) => {
        console.error("Redis initial connection error:", err);
        reject(err);
      });
    });
    this.client.on("error", (err) => {
      console.error("Redis connection error:", err);
    });
  }
  async connect() {
    await this.connectionPromise;
  }
  async set(key, value, ...args) {
    await this.connect();
    await this.client.set(key, value, ...args);
  }
  async xgroup(command, stream, group3, id, mkstream) {
    await this.connect();
    if (command === "CREATE") {
      if (mkstream) {
        return this.client.xgroup(command, stream, group3, id, mkstream);
      }
      return this.client.xgroup(command, stream, group3, id);
    } else {
      return this.client.xgroup(command, stream, group3);
    }
  }
  async xreadgroup(groupName, consumerName, streams) {
    await this.connect();
    return this.client.xreadgroup("GROUP", groupName, consumerName, "STREAMS", ...streams.flat());
  }
  async xadd(key, id, ...args) {
    await this.connect();
    const result = await this.client.xadd(key, id, ...args);
    if (result === null) {
      throw new Error("Failed to add entry to stream");
    }
    return result;
  }
  pipeline() {
    return this.client.pipeline();
  }
  async quit() {
    try {
      await this.client.quit();
      console.log("Redis connection closed gracefully");
    } catch (error3) {
      console.error("Error while closing Redis connection:", error3);
    }
  }
};
__name(RedisClient, "RedisClient");

// index.ts
var STREAM_NAME = "kindle:jobs";
var upload_default = {
  async fetch(request, env3, ctx) {
    console.log("Upload worker received request");
    if (request.method !== "POST") {
      console.error("Invalid method:", request.method);
      return new Response("Method not allowed", { status: 405 });
    }
    let redis = null;
    try {
      if (!env3.REDIS_URL) {
        throw new Error("REDIS_URL environment variable is not set");
      }
      redis = new RedisClient({ url: env3.REDIS_URL });
      await redis.connect();
      const formData = await request.formData();
      console.log("Processing upload with params:", {
        fileKey: formData.get("fileKey"),
        userId: formData.get("userId"),
        hasDatabase: !!formData.get("databaseId")
      });
      const fileKey = formData.get("fileKey");
      const userId = formData.get("userId");
      const databaseId = formData.get("databaseId");
      if (!fileKey || !userId || !databaseId) {
        return new Response("Missing required fields", { status: 400 });
      }
      const jobId = await processFile(redis, env3.R2_BUCKET, fileKey, databaseId, userId);
      return new Response(
        JSON.stringify({
          jobId,
          message: "File processed and queued for sync"
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    } catch (error3) {
      console.error("Processing error:", {
        error: error3 instanceof Error ? error3.stack : error3,
        message: error3 instanceof Error ? error3.message : "Unknown error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      return new Response(
        JSON.stringify({
          error: "Processing failed",
          message: error3 instanceof Error ? error3.message : "Unknown error",
          details: error3 instanceof Error ? error3.stack : void 0
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );
    } finally {
      if (redis) {
        await redis.quit();
        console.log("Redis connection closed");
      }
    }
  }
};
async function processFile(redis, bucket, fileKey, databaseId, userId) {
  const jobId = `sync:${userId}:${Date.now()}`;
  try {
    await redis.set(`job:${jobId}`, JSON.stringify({
      state: "queued",
      progress: 0,
      message: "Starting file processing",
      lastProcessedIndex: 0,
      userId
    }));
    console.log(`[processFile] Starting R2 file fetch for key: ${fileKey}`);
    const file = await bucket.get(fileKey);
    if (!file) {
      throw new Error("File not found in R2");
    }
    console.log(`[processFile] File fetched from R2 successfully for key: ${fileKey}`);
    console.log("[processFile] Converting file to text");
    const fileContent = await file.text();
    console.log(`[processFile] File converted to text, length: ${fileContent.length}`);
    console.log("[processFile] Parsing highlights");
    const highlights = await parseClippings(fileContent);
    console.log(`[processFile] Highlights parsed, count: ${highlights.length}`);
    console.log("[processFile] Storing highlights in Redis pipeline");
    const pipeline = redis.pipeline();
    highlights.forEach((highlight, index) => {
      const key = `highlights:${jobId}:${index}`;
      pipeline.set(key, JSON.stringify({
        ...highlight,
        databaseId
      }), "EX", 86400);
    });
    console.log("[processFile] Executing Redis pipeline");
    await pipeline.exec();
    console.log("[processFile] Redis pipeline executed successfully");
    await redis.set(`job:${jobId}`, JSON.stringify({
      state: "parsed",
      progress: 0,
      message: "File parsed and ready for processing",
      total: highlights.length,
      lastProcessedIndex: 0,
      userId
    }));
    await redis.xadd(STREAM_NAME, "*", "jobId", jobId, "userId", userId, "type", "sync");
    console.log("[processFile] Job added to processing queue");
    return jobId;
  } catch (error3) {
    console.error("Error processing file:", error3);
    await redis.set(`job:${jobId}`, JSON.stringify({
      state: "failed",
      message: error3 instanceof Error ? error3.message : "Unknown error",
      userId
    }));
    throw error3;
  }
}
__name(processFile, "processFile");

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var drainBody = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-NJ3g0v/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = upload_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env3, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env3, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env3, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env3, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-NJ3g0v/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env3, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env3, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env3, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env3, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env3, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env3, ctx) => {
      this.env = env3;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
