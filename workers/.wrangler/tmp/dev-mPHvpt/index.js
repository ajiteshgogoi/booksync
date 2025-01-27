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
var __export = (target, all3) => {
  for (var name in all3)
    __defProp(target, name, { get: all3[name], enumerable: true });
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
        this._entries = markName ? this._entries.filter((e2) => e2.name !== markName) : this._entries.filter((e2) => e2.entryType !== "mark");
      }
      clearMeasures(measureName) {
        this._entries = measureName ? this._entries.filter((e2) => e2.name !== measureName) : this._entries.filter((e2) => e2.entryType !== "measure");
      }
      clearResourceTimings() {
        this._entries = this._entries.filter(
          (e2) => e2.entryType !== "resource" || e2.entryType !== "navigation"
        );
      }
      getEntries() {
        return this._entries;
      }
      getEntriesByName(name, type) {
        return this._entries.filter(
          (e2) => e2.name === name && (!type || e2.entryType === type)
        );
      }
      getEntriesByType(type) {
        return this._entries.filter(
          (e2) => e2.entryType === type
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
var Socket;
var init_socket = __esm({
  "node_modules/unenv/runtime/node/net/internal/socket.mjs"() {
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
  }
});

// node_modules/unenv/runtime/node/net/index.mjs
var createServer, BlockList, connect, createConnection, getDefaultAutoSelectFamily, setDefaultAutoSelectFamily, getDefaultAutoSelectFamilyAttemptTimeout, setDefaultAutoSelectFamilyAttemptTimeout, _createServerHandle, _normalizeArgs, _setSimultaneousAccepts;
var init_net = __esm({
  "node_modules/unenv/runtime/node/net/index.mjs"() {
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_utils();
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
    _createServerHandle = notImplemented("net._createServerHandle");
    _normalizeArgs = notImplemented("net._normalizeArgs");
    _setSimultaneousAccepts = notImplemented(
      "net._setSimultaneousAccepts"
    );
  }
});

// node_modules/unenv/runtime/node/tty/internal/read-stream.mjs
var ReadStream;
var init_read_stream = __esm({
  "node_modules/unenv/runtime/node/tty/internal/read-stream.mjs"() {
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

// ../shared/node_modules/@notionhq/client/build/src/utils.js
var require_utils = __commonJS({
  "../shared/node_modules/@notionhq/client/build/src/utils.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isObject = exports.pick = exports.assertNever = void 0;
    function assertNever(value) {
      throw new Error(`Unexpected value should never occur: ${value}`);
    }
    __name(assertNever, "assertNever");
    exports.assertNever = assertNever;
    function pick(base, keys) {
      const entries = keys.map((key) => [key, base === null || base === void 0 ? void 0 : base[key]]);
      return Object.fromEntries(entries);
    }
    __name(pick, "pick");
    exports.pick = pick;
    function isObject2(o) {
      return typeof o === "object" && o !== null;
    }
    __name(isObject2, "isObject");
    exports.isObject = isObject2;
  }
});

// ../shared/node_modules/@notionhq/client/build/src/logging.js
var require_logging = __commonJS({
  "../shared/node_modules/@notionhq/client/build/src/logging.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.logLevelSeverity = exports.makeConsoleLogger = exports.LogLevel = void 0;
    var utils_1 = require_utils();
    var LogLevel;
    (function(LogLevel2) {
      LogLevel2["DEBUG"] = "debug";
      LogLevel2["INFO"] = "info";
      LogLevel2["WARN"] = "warn";
      LogLevel2["ERROR"] = "error";
    })(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
    function makeConsoleLogger(name) {
      return (level, message, extraInfo) => {
        console[level](`${name} ${level}:`, message, extraInfo);
      };
    }
    __name(makeConsoleLogger, "makeConsoleLogger");
    exports.makeConsoleLogger = makeConsoleLogger;
    function logLevelSeverity(level) {
      switch (level) {
        case LogLevel.DEBUG:
          return 20;
        case LogLevel.INFO:
          return 40;
        case LogLevel.WARN:
          return 60;
        case LogLevel.ERROR:
          return 80;
        default:
          return (0, utils_1.assertNever)(level);
      }
    }
    __name(logLevelSeverity, "logLevelSeverity");
    exports.logLevelSeverity = logLevelSeverity;
  }
});

// ../shared/node_modules/@notionhq/client/build/src/errors.js
var require_errors = __commonJS({
  "../shared/node_modules/@notionhq/client/build/src/errors.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.buildRequestError = exports.APIResponseError = exports.UnknownHTTPResponseError = exports.isHTTPResponseError = exports.RequestTimeoutError = exports.isNotionClientError = exports.ClientErrorCode = exports.APIErrorCode = void 0;
    var utils_1 = require_utils();
    var APIErrorCode;
    (function(APIErrorCode2) {
      APIErrorCode2["Unauthorized"] = "unauthorized";
      APIErrorCode2["RestrictedResource"] = "restricted_resource";
      APIErrorCode2["ObjectNotFound"] = "object_not_found";
      APIErrorCode2["RateLimited"] = "rate_limited";
      APIErrorCode2["InvalidJSON"] = "invalid_json";
      APIErrorCode2["InvalidRequestURL"] = "invalid_request_url";
      APIErrorCode2["InvalidRequest"] = "invalid_request";
      APIErrorCode2["ValidationError"] = "validation_error";
      APIErrorCode2["ConflictError"] = "conflict_error";
      APIErrorCode2["InternalServerError"] = "internal_server_error";
      APIErrorCode2["ServiceUnavailable"] = "service_unavailable";
    })(APIErrorCode = exports.APIErrorCode || (exports.APIErrorCode = {}));
    var ClientErrorCode;
    (function(ClientErrorCode2) {
      ClientErrorCode2["RequestTimeout"] = "notionhq_client_request_timeout";
      ClientErrorCode2["ResponseError"] = "notionhq_client_response_error";
    })(ClientErrorCode = exports.ClientErrorCode || (exports.ClientErrorCode = {}));
    var NotionClientErrorBase = class extends Error {
    };
    __name(NotionClientErrorBase, "NotionClientErrorBase");
    function isNotionClientError(error3) {
      return (0, utils_1.isObject)(error3) && error3 instanceof NotionClientErrorBase;
    }
    __name(isNotionClientError, "isNotionClientError");
    exports.isNotionClientError = isNotionClientError;
    function isNotionClientErrorWithCode(error3, codes) {
      return isNotionClientError(error3) && error3.code in codes;
    }
    __name(isNotionClientErrorWithCode, "isNotionClientErrorWithCode");
    var RequestTimeoutError = class extends NotionClientErrorBase {
      constructor(message = "Request to Notion API has timed out") {
        super(message);
        this.code = ClientErrorCode.RequestTimeout;
        this.name = "RequestTimeoutError";
      }
      static isRequestTimeoutError(error3) {
        return isNotionClientErrorWithCode(error3, {
          [ClientErrorCode.RequestTimeout]: true
        });
      }
      static rejectAfterTimeout(promise, timeoutMS) {
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new RequestTimeoutError());
          }, timeoutMS);
          promise.then(resolve).catch(reject).then(() => clearTimeout(timeoutId));
        });
      }
    };
    __name(RequestTimeoutError, "RequestTimeoutError");
    exports.RequestTimeoutError = RequestTimeoutError;
    var HTTPResponseError = class extends NotionClientErrorBase {
      constructor(args) {
        super(args.message);
        this.name = "HTTPResponseError";
        const { code, status, headers, rawBodyText } = args;
        this.code = code;
        this.status = status;
        this.headers = headers;
        this.body = rawBodyText;
      }
    };
    __name(HTTPResponseError, "HTTPResponseError");
    var httpResponseErrorCodes = {
      [ClientErrorCode.ResponseError]: true,
      [APIErrorCode.Unauthorized]: true,
      [APIErrorCode.RestrictedResource]: true,
      [APIErrorCode.ObjectNotFound]: true,
      [APIErrorCode.RateLimited]: true,
      [APIErrorCode.InvalidJSON]: true,
      [APIErrorCode.InvalidRequestURL]: true,
      [APIErrorCode.InvalidRequest]: true,
      [APIErrorCode.ValidationError]: true,
      [APIErrorCode.ConflictError]: true,
      [APIErrorCode.InternalServerError]: true,
      [APIErrorCode.ServiceUnavailable]: true
    };
    function isHTTPResponseError(error3) {
      if (!isNotionClientErrorWithCode(error3, httpResponseErrorCodes)) {
        return false;
      }
      return true;
    }
    __name(isHTTPResponseError, "isHTTPResponseError");
    exports.isHTTPResponseError = isHTTPResponseError;
    var UnknownHTTPResponseError = class extends HTTPResponseError {
      constructor(args) {
        var _a;
        super({
          ...args,
          code: ClientErrorCode.ResponseError,
          message: (_a = args.message) !== null && _a !== void 0 ? _a : `Request to Notion API failed with status: ${args.status}`
        });
        this.name = "UnknownHTTPResponseError";
      }
      static isUnknownHTTPResponseError(error3) {
        return isNotionClientErrorWithCode(error3, {
          [ClientErrorCode.ResponseError]: true
        });
      }
    };
    __name(UnknownHTTPResponseError, "UnknownHTTPResponseError");
    exports.UnknownHTTPResponseError = UnknownHTTPResponseError;
    var apiErrorCodes = {
      [APIErrorCode.Unauthorized]: true,
      [APIErrorCode.RestrictedResource]: true,
      [APIErrorCode.ObjectNotFound]: true,
      [APIErrorCode.RateLimited]: true,
      [APIErrorCode.InvalidJSON]: true,
      [APIErrorCode.InvalidRequestURL]: true,
      [APIErrorCode.InvalidRequest]: true,
      [APIErrorCode.ValidationError]: true,
      [APIErrorCode.ConflictError]: true,
      [APIErrorCode.InternalServerError]: true,
      [APIErrorCode.ServiceUnavailable]: true
    };
    var APIResponseError = class extends HTTPResponseError {
      constructor() {
        super(...arguments);
        this.name = "APIResponseError";
      }
      static isAPIResponseError(error3) {
        return isNotionClientErrorWithCode(error3, apiErrorCodes);
      }
    };
    __name(APIResponseError, "APIResponseError");
    exports.APIResponseError = APIResponseError;
    function buildRequestError(response, bodyText) {
      const apiErrorResponseBody = parseAPIErrorResponseBody(bodyText);
      if (apiErrorResponseBody !== void 0) {
        return new APIResponseError({
          code: apiErrorResponseBody.code,
          message: apiErrorResponseBody.message,
          headers: response.headers,
          status: response.status,
          rawBodyText: bodyText
        });
      }
      return new UnknownHTTPResponseError({
        message: void 0,
        headers: response.headers,
        status: response.status,
        rawBodyText: bodyText
      });
    }
    __name(buildRequestError, "buildRequestError");
    exports.buildRequestError = buildRequestError;
    function parseAPIErrorResponseBody(body) {
      if (typeof body !== "string") {
        return;
      }
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (parseError) {
        return;
      }
      if (!(0, utils_1.isObject)(parsed) || typeof parsed["message"] !== "string" || !isAPIErrorCode(parsed["code"])) {
        return;
      }
      return {
        ...parsed,
        code: parsed["code"],
        message: parsed["message"]
      };
    }
    __name(parseAPIErrorResponseBody, "parseAPIErrorResponseBody");
    function isAPIErrorCode(code) {
      return typeof code === "string" && code in apiErrorCodes;
    }
    __name(isAPIErrorCode, "isAPIErrorCode");
  }
});

// ../shared/node_modules/@notionhq/client/build/src/api-endpoints.js
var require_api_endpoints = __commonJS({
  "../shared/node_modules/@notionhq/client/build/src/api-endpoints.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.oauthToken = exports.listComments = exports.createComment = exports.search = exports.createDatabase = exports.listDatabases = exports.queryDatabase = exports.updateDatabase = exports.getDatabase = exports.appendBlockChildren = exports.listBlockChildren = exports.deleteBlock = exports.updateBlock = exports.getBlock = exports.getPageProperty = exports.updatePage = exports.getPage = exports.createPage = exports.listUsers = exports.getUser = exports.getSelf = void 0;
    exports.getSelf = {
      method: "get",
      pathParams: [],
      queryParams: [],
      bodyParams: [],
      path: () => `users/me`
    };
    exports.getUser = {
      method: "get",
      pathParams: ["user_id"],
      queryParams: [],
      bodyParams: [],
      path: (p) => `users/${p.user_id}`
    };
    exports.listUsers = {
      method: "get",
      pathParams: [],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: () => `users`
    };
    exports.createPage = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["parent", "properties", "icon", "cover", "content", "children"],
      path: () => `pages`
    };
    exports.getPage = {
      method: "get",
      pathParams: ["page_id"],
      queryParams: ["filter_properties"],
      bodyParams: [],
      path: (p) => `pages/${p.page_id}`
    };
    exports.updatePage = {
      method: "patch",
      pathParams: ["page_id"],
      queryParams: [],
      bodyParams: ["properties", "icon", "cover", "archived", "in_trash"],
      path: (p) => `pages/${p.page_id}`
    };
    exports.getPageProperty = {
      method: "get",
      pathParams: ["page_id", "property_id"],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: (p) => `pages/${p.page_id}/properties/${p.property_id}`
    };
    exports.getBlock = {
      method: "get",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: [],
      path: (p) => `blocks/${p.block_id}`
    };
    exports.updateBlock = {
      method: "patch",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: [
        "embed",
        "type",
        "archived",
        "in_trash",
        "bookmark",
        "image",
        "video",
        "pdf",
        "file",
        "audio",
        "code",
        "equation",
        "divider",
        "breadcrumb",
        "table_of_contents",
        "link_to_page",
        "table_row",
        "heading_1",
        "heading_2",
        "heading_3",
        "paragraph",
        "bulleted_list_item",
        "numbered_list_item",
        "quote",
        "to_do",
        "toggle",
        "template",
        "callout",
        "synced_block",
        "table"
      ],
      path: (p) => `blocks/${p.block_id}`
    };
    exports.deleteBlock = {
      method: "delete",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: [],
      path: (p) => `blocks/${p.block_id}`
    };
    exports.listBlockChildren = {
      method: "get",
      pathParams: ["block_id"],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: (p) => `blocks/${p.block_id}/children`
    };
    exports.appendBlockChildren = {
      method: "patch",
      pathParams: ["block_id"],
      queryParams: [],
      bodyParams: ["children", "after"],
      path: (p) => `blocks/${p.block_id}/children`
    };
    exports.getDatabase = {
      method: "get",
      pathParams: ["database_id"],
      queryParams: [],
      bodyParams: [],
      path: (p) => `databases/${p.database_id}`
    };
    exports.updateDatabase = {
      method: "patch",
      pathParams: ["database_id"],
      queryParams: [],
      bodyParams: [
        "title",
        "description",
        "icon",
        "cover",
        "properties",
        "is_inline",
        "archived",
        "in_trash"
      ],
      path: (p) => `databases/${p.database_id}`
    };
    exports.queryDatabase = {
      method: "post",
      pathParams: ["database_id"],
      queryParams: ["filter_properties"],
      bodyParams: [
        "sorts",
        "filter",
        "start_cursor",
        "page_size",
        "archived",
        "in_trash"
      ],
      path: (p) => `databases/${p.database_id}/query`
    };
    exports.listDatabases = {
      method: "get",
      pathParams: [],
      queryParams: ["start_cursor", "page_size"],
      bodyParams: [],
      path: () => `databases`
    };
    exports.createDatabase = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: [
        "parent",
        "properties",
        "icon",
        "cover",
        "title",
        "description",
        "is_inline"
      ],
      path: () => `databases`
    };
    exports.search = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["sort", "query", "start_cursor", "page_size", "filter"],
      path: () => `search`
    };
    exports.createComment = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["parent", "rich_text", "discussion_id"],
      path: () => `comments`
    };
    exports.listComments = {
      method: "get",
      pathParams: [],
      queryParams: ["block_id", "start_cursor", "page_size"],
      bodyParams: [],
      path: () => `comments`
    };
    exports.oauthToken = {
      method: "post",
      pathParams: [],
      queryParams: [],
      bodyParams: ["grant_type", "code", "redirect_uri", "external_account"],
      path: () => `oauth/token`
    };
  }
});

// node_modules/unenv/runtime/npm/node-fetch.mjs
var node_fetch_exports = {};
__export(node_fetch_exports, {
  AbortController: () => AbortController2,
  AbortError: () => AbortError,
  FetchError: () => FetchError,
  Headers: () => Headers,
  Request: () => Request2,
  Response: () => Response2,
  default: () => node_fetch_default,
  fetch: () => fetch2,
  isRedirect: () => isRedirect
});
var fetch2, Headers, Request2, Response2, AbortController2, FetchError, AbortError, redirectStatus, isRedirect, node_fetch_default;
var init_node_fetch = __esm({
  "node_modules/unenv/runtime/npm/node-fetch.mjs"() {
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    fetch2 = /* @__PURE__ */ __name((...args) => globalThis.fetch(...args), "fetch");
    Headers = globalThis.Headers;
    Request2 = globalThis.Request;
    Response2 = globalThis.Response;
    AbortController2 = globalThis.AbortController;
    FetchError = Error;
    AbortError = Error;
    redirectStatus = /* @__PURE__ */ new Set([301, 302, 303, 307, 308]);
    isRedirect = /* @__PURE__ */ __name((code) => redirectStatus.has(code), "isRedirect");
    fetch2.Promise = globalThis.Promise;
    fetch2.isRedirect = isRedirect;
    node_fetch_default = fetch2;
  }
});

// required-unenv-alias:node-fetch
var require_node_fetch = __commonJS({
  "required-unenv-alias:node-fetch"(exports, module) {
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    init_node_fetch();
    module.exports = __cf_cjs(node_fetch_exports);
  }
});

// ../shared/node_modules/@notionhq/client/build/package.json
var require_package = __commonJS({
  "../shared/node_modules/@notionhq/client/build/package.json"(exports, module) {
    module.exports = {
      name: "@notionhq/client",
      version: "2.2.15",
      description: "A simple and easy to use client for the Notion API",
      engines: {
        node: ">=12"
      },
      homepage: "https://developers.notion.com/docs/getting-started",
      bugs: {
        url: "https://github.com/makenotion/notion-sdk-js/issues"
      },
      repository: {
        type: "git",
        url: "https://github.com/makenotion/notion-sdk-js/"
      },
      keywords: [
        "notion",
        "notionapi",
        "rest",
        "notion-api"
      ],
      main: "./build/src",
      types: "./build/src/index.d.ts",
      scripts: {
        prepare: "npm run build",
        prepublishOnly: "npm run checkLoggedIn && npm run lint && npm run test",
        build: "tsc",
        prettier: "prettier --write .",
        lint: "prettier --check . && eslint . --ext .ts && cspell '**/*' ",
        test: "jest ./test",
        "check-links": "git ls-files | grep md$ | xargs -n 1 markdown-link-check",
        prebuild: "npm run clean",
        clean: "rm -rf ./build",
        checkLoggedIn: "./scripts/verifyLoggedIn.sh"
      },
      author: "",
      license: "MIT",
      files: [
        "build/package.json",
        "build/src/**"
      ],
      dependencies: {
        "@types/node-fetch": "^2.5.10",
        "node-fetch": "^2.6.1"
      },
      devDependencies: {
        "@types/jest": "^28.1.4",
        "@typescript-eslint/eslint-plugin": "^5.39.0",
        "@typescript-eslint/parser": "^5.39.0",
        cspell: "^5.4.1",
        eslint: "^7.24.0",
        jest: "^28.1.2",
        "markdown-link-check": "^3.8.7",
        prettier: "^2.8.8",
        "ts-jest": "^28.0.5",
        typescript: "^4.8.4"
      }
    };
  }
});

// ../shared/node_modules/@notionhq/client/build/src/Client.js
var require_Client = __commonJS({
  "../shared/node_modules/@notionhq/client/build/src/Client.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    var __classPrivateFieldSet = exports && exports.__classPrivateFieldSet || function(receiver, state, value, kind, f) {
      if (kind === "m")
        throw new TypeError("Private method is not writable");
      if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a setter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot write private member to an object whose class did not declare it");
      return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
    };
    var __classPrivateFieldGet = exports && exports.__classPrivateFieldGet || function(receiver, state, kind, f) {
      if (kind === "a" && !f)
        throw new TypeError("Private accessor was defined without a getter");
      if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver))
        throw new TypeError("Cannot read private member from an object whose class did not declare it");
      return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
    };
    var _Client_auth;
    var _Client_logLevel;
    var _Client_logger;
    var _Client_prefixUrl;
    var _Client_timeoutMs;
    var _Client_notionVersion;
    var _Client_fetch;
    var _Client_agent;
    var _Client_userAgent;
    Object.defineProperty(exports, "__esModule", { value: true });
    var logging_1 = require_logging();
    var errors_1 = require_errors();
    var utils_1 = require_utils();
    var api_endpoints_1 = require_api_endpoints();
    var node_fetch_1 = require_node_fetch();
    var package_json_1 = require_package();
    var Client3 = class {
      constructor(options) {
        var _a, _b, _c, _d, _e, _f;
        _Client_auth.set(this, void 0);
        _Client_logLevel.set(this, void 0);
        _Client_logger.set(this, void 0);
        _Client_prefixUrl.set(this, void 0);
        _Client_timeoutMs.set(this, void 0);
        _Client_notionVersion.set(this, void 0);
        _Client_fetch.set(this, void 0);
        _Client_agent.set(this, void 0);
        _Client_userAgent.set(this, void 0);
        this.blocks = {
          /**
           * Retrieve block
           */
          retrieve: (args) => {
            return this.request({
              path: api_endpoints_1.getBlock.path(args),
              method: api_endpoints_1.getBlock.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getBlock.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getBlock.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Update block
           */
          update: (args) => {
            return this.request({
              path: api_endpoints_1.updateBlock.path(args),
              method: api_endpoints_1.updateBlock.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.updateBlock.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.updateBlock.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Delete block
           */
          delete: (args) => {
            return this.request({
              path: api_endpoints_1.deleteBlock.path(args),
              method: api_endpoints_1.deleteBlock.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.deleteBlock.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.deleteBlock.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          children: {
            /**
             * Append block children
             */
            append: (args) => {
              return this.request({
                path: api_endpoints_1.appendBlockChildren.path(args),
                method: api_endpoints_1.appendBlockChildren.method,
                query: (0, utils_1.pick)(args, api_endpoints_1.appendBlockChildren.queryParams),
                body: (0, utils_1.pick)(args, api_endpoints_1.appendBlockChildren.bodyParams),
                auth: args === null || args === void 0 ? void 0 : args.auth
              });
            },
            /**
             * Retrieve block children
             */
            list: (args) => {
              return this.request({
                path: api_endpoints_1.listBlockChildren.path(args),
                method: api_endpoints_1.listBlockChildren.method,
                query: (0, utils_1.pick)(args, api_endpoints_1.listBlockChildren.queryParams),
                body: (0, utils_1.pick)(args, api_endpoints_1.listBlockChildren.bodyParams),
                auth: args === null || args === void 0 ? void 0 : args.auth
              });
            }
          }
        };
        this.databases = {
          /**
           * List databases
           *
           * @deprecated Please use `search`
           */
          list: (args) => {
            return this.request({
              path: api_endpoints_1.listDatabases.path(),
              method: api_endpoints_1.listDatabases.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.listDatabases.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.listDatabases.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Retrieve a database
           */
          retrieve: (args) => {
            return this.request({
              path: api_endpoints_1.getDatabase.path(args),
              method: api_endpoints_1.getDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Query a database
           */
          query: (args) => {
            return this.request({
              path: api_endpoints_1.queryDatabase.path(args),
              method: api_endpoints_1.queryDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.queryDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.queryDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Create a database
           */
          create: (args) => {
            return this.request({
              path: api_endpoints_1.createDatabase.path(),
              method: api_endpoints_1.createDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.createDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.createDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Update a database
           */
          update: (args) => {
            return this.request({
              path: api_endpoints_1.updateDatabase.path(args),
              method: api_endpoints_1.updateDatabase.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.updateDatabase.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.updateDatabase.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }
        };
        this.pages = {
          /**
           * Create a page
           */
          create: (args) => {
            return this.request({
              path: api_endpoints_1.createPage.path(),
              method: api_endpoints_1.createPage.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.createPage.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.createPage.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Retrieve a page
           */
          retrieve: (args) => {
            return this.request({
              path: api_endpoints_1.getPage.path(args),
              method: api_endpoints_1.getPage.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getPage.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getPage.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Update page properties
           */
          update: (args) => {
            return this.request({
              path: api_endpoints_1.updatePage.path(args),
              method: api_endpoints_1.updatePage.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.updatePage.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.updatePage.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          properties: {
            /**
             * Retrieve page property
             */
            retrieve: (args) => {
              return this.request({
                path: api_endpoints_1.getPageProperty.path(args),
                method: api_endpoints_1.getPageProperty.method,
                query: (0, utils_1.pick)(args, api_endpoints_1.getPageProperty.queryParams),
                body: (0, utils_1.pick)(args, api_endpoints_1.getPageProperty.bodyParams),
                auth: args === null || args === void 0 ? void 0 : args.auth
              });
            }
          }
        };
        this.users = {
          /**
           * Retrieve a user
           */
          retrieve: (args) => {
            return this.request({
              path: api_endpoints_1.getUser.path(args),
              method: api_endpoints_1.getUser.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getUser.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getUser.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * List all users
           */
          list: (args) => {
            return this.request({
              path: api_endpoints_1.listUsers.path(),
              method: api_endpoints_1.listUsers.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.listUsers.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.listUsers.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * Get details about bot
           */
          me: (args) => {
            return this.request({
              path: api_endpoints_1.getSelf.path(),
              method: api_endpoints_1.getSelf.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.getSelf.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.getSelf.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }
        };
        this.comments = {
          /**
           * Create a comment
           */
          create: (args) => {
            return this.request({
              path: api_endpoints_1.createComment.path(),
              method: api_endpoints_1.createComment.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.createComment.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.createComment.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          },
          /**
           * List comments
           */
          list: (args) => {
            return this.request({
              path: api_endpoints_1.listComments.path(),
              method: api_endpoints_1.listComments.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.listComments.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.listComments.bodyParams),
              auth: args === null || args === void 0 ? void 0 : args.auth
            });
          }
        };
        this.search = (args) => {
          return this.request({
            path: api_endpoints_1.search.path(),
            method: api_endpoints_1.search.method,
            query: (0, utils_1.pick)(args, api_endpoints_1.search.queryParams),
            body: (0, utils_1.pick)(args, api_endpoints_1.search.bodyParams),
            auth: args === null || args === void 0 ? void 0 : args.auth
          });
        };
        this.oauth = {
          /**
           * Get token
           */
          token: (args) => {
            return this.request({
              path: api_endpoints_1.oauthToken.path(),
              method: api_endpoints_1.oauthToken.method,
              query: (0, utils_1.pick)(args, api_endpoints_1.oauthToken.queryParams),
              body: (0, utils_1.pick)(args, api_endpoints_1.oauthToken.bodyParams),
              auth: {
                client_id: args.client_id,
                client_secret: args.client_secret
              }
            });
          }
        };
        __classPrivateFieldSet(this, _Client_auth, options === null || options === void 0 ? void 0 : options.auth, "f");
        __classPrivateFieldSet(this, _Client_logLevel, (_a = options === null || options === void 0 ? void 0 : options.logLevel) !== null && _a !== void 0 ? _a : logging_1.LogLevel.WARN, "f");
        __classPrivateFieldSet(this, _Client_logger, (_b = options === null || options === void 0 ? void 0 : options.logger) !== null && _b !== void 0 ? _b : (0, logging_1.makeConsoleLogger)(package_json_1.name), "f");
        __classPrivateFieldSet(this, _Client_prefixUrl, ((_c = options === null || options === void 0 ? void 0 : options.baseUrl) !== null && _c !== void 0 ? _c : "https://api.notion.com") + "/v1/", "f");
        __classPrivateFieldSet(this, _Client_timeoutMs, (_d = options === null || options === void 0 ? void 0 : options.timeoutMs) !== null && _d !== void 0 ? _d : 6e4, "f");
        __classPrivateFieldSet(this, _Client_notionVersion, (_e = options === null || options === void 0 ? void 0 : options.notionVersion) !== null && _e !== void 0 ? _e : Client3.defaultNotionVersion, "f");
        __classPrivateFieldSet(this, _Client_fetch, (_f = options === null || options === void 0 ? void 0 : options.fetch) !== null && _f !== void 0 ? _f : node_fetch_1.default, "f");
        __classPrivateFieldSet(this, _Client_agent, options === null || options === void 0 ? void 0 : options.agent, "f");
        __classPrivateFieldSet(this, _Client_userAgent, `notionhq-client/${package_json_1.version}`, "f");
      }
      /**
       * Sends a request.
       *
       * @param path
       * @param method
       * @param query
       * @param body
       * @returns
       */
      async request({ path, method, query, body, auth }) {
        this.log(logging_1.LogLevel.INFO, "request start", { method, path });
        const bodyAsJsonString = !body || Object.entries(body).length === 0 ? void 0 : JSON.stringify(body);
        const url = new URL(`${__classPrivateFieldGet(this, _Client_prefixUrl, "f")}${path}`);
        if (query) {
          for (const [key, value] of Object.entries(query)) {
            if (value !== void 0) {
              if (Array.isArray(value)) {
                value.forEach((val) => url.searchParams.append(key, decodeURIComponent(val)));
              } else {
                url.searchParams.append(key, String(value));
              }
            }
          }
        }
        let authorizationHeader;
        if (typeof auth === "object") {
          const unencodedCredential = `${auth.client_id}:${auth.client_secret}`;
          const encodedCredential = Buffer.from(unencodedCredential).toString("base64");
          authorizationHeader = { authorization: `Basic ${encodedCredential}` };
        } else {
          authorizationHeader = this.authAsHeaders(auth);
        }
        const headers = {
          ...authorizationHeader,
          "Notion-Version": __classPrivateFieldGet(this, _Client_notionVersion, "f"),
          "user-agent": __classPrivateFieldGet(this, _Client_userAgent, "f")
        };
        if (bodyAsJsonString !== void 0) {
          headers["content-type"] = "application/json";
        }
        try {
          const response = await errors_1.RequestTimeoutError.rejectAfterTimeout(__classPrivateFieldGet(this, _Client_fetch, "f").call(this, url.toString(), {
            method: method.toUpperCase(),
            headers,
            body: bodyAsJsonString,
            agent: __classPrivateFieldGet(this, _Client_agent, "f")
          }), __classPrivateFieldGet(this, _Client_timeoutMs, "f"));
          const responseText = await response.text();
          if (!response.ok) {
            throw (0, errors_1.buildRequestError)(response, responseText);
          }
          const responseJson = JSON.parse(responseText);
          this.log(logging_1.LogLevel.INFO, `request success`, { method, path });
          return responseJson;
        } catch (error3) {
          if (!(0, errors_1.isNotionClientError)(error3)) {
            throw error3;
          }
          this.log(logging_1.LogLevel.WARN, `request fail`, {
            code: error3.code,
            message: error3.message
          });
          if ((0, errors_1.isHTTPResponseError)(error3)) {
            this.log(logging_1.LogLevel.DEBUG, `failed response body`, {
              body: error3.body
            });
          }
          throw error3;
        }
      }
      /**
       * Emits a log message to the console.
       *
       * @param level The level for this message
       * @param args Arguments to send to the console
       */
      log(level, message, extraInfo) {
        if ((0, logging_1.logLevelSeverity)(level) >= (0, logging_1.logLevelSeverity)(__classPrivateFieldGet(this, _Client_logLevel, "f"))) {
          __classPrivateFieldGet(this, _Client_logger, "f").call(this, level, message, extraInfo);
        }
      }
      /**
       * Transforms an API key or access token into a headers object suitable for an HTTP request.
       *
       * This method uses the instance's value as the default when the input is undefined. If neither are defined, it returns
       * an empty object
       *
       * @param auth API key or access token
       * @returns headers key-value object
       */
      authAsHeaders(auth) {
        const headers = {};
        const authHeaderValue = auth !== null && auth !== void 0 ? auth : __classPrivateFieldGet(this, _Client_auth, "f");
        if (authHeaderValue !== void 0) {
          headers["authorization"] = `Bearer ${authHeaderValue}`;
        }
        return headers;
      }
    };
    __name(Client3, "Client");
    exports.default = Client3;
    _Client_auth = /* @__PURE__ */ new WeakMap(), _Client_logLevel = /* @__PURE__ */ new WeakMap(), _Client_logger = /* @__PURE__ */ new WeakMap(), _Client_prefixUrl = /* @__PURE__ */ new WeakMap(), _Client_timeoutMs = /* @__PURE__ */ new WeakMap(), _Client_notionVersion = /* @__PURE__ */ new WeakMap(), _Client_fetch = /* @__PURE__ */ new WeakMap(), _Client_agent = /* @__PURE__ */ new WeakMap(), _Client_userAgent = /* @__PURE__ */ new WeakMap();
    Client3.defaultNotionVersion = "2022-06-28";
  }
});

// ../shared/node_modules/@notionhq/client/build/src/helpers.js
var require_helpers = __commonJS({
  "../shared/node_modules/@notionhq/client/build/src/helpers.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isMentionRichTextItemResponse = exports.isEquationRichTextItemResponse = exports.isTextRichTextItemResponse = exports.isFullComment = exports.isFullUser = exports.isFullPageOrDatabase = exports.isFullDatabase = exports.isFullPage = exports.isFullBlock = exports.collectPaginatedAPI = exports.iteratePaginatedAPI = void 0;
    async function* iteratePaginatedAPI(listFn, firstPageArgs) {
      let nextCursor = firstPageArgs.start_cursor;
      do {
        const response = await listFn({
          ...firstPageArgs,
          start_cursor: nextCursor
        });
        yield* response.results;
        nextCursor = response.next_cursor;
      } while (nextCursor);
    }
    __name(iteratePaginatedAPI, "iteratePaginatedAPI");
    exports.iteratePaginatedAPI = iteratePaginatedAPI;
    async function collectPaginatedAPI(listFn, firstPageArgs) {
      const results = [];
      for await (const item of iteratePaginatedAPI(listFn, firstPageArgs)) {
        results.push(item);
      }
      return results;
    }
    __name(collectPaginatedAPI, "collectPaginatedAPI");
    exports.collectPaginatedAPI = collectPaginatedAPI;
    function isFullBlock(response) {
      return response.object === "block" && "type" in response;
    }
    __name(isFullBlock, "isFullBlock");
    exports.isFullBlock = isFullBlock;
    function isFullPage3(response) {
      return response.object === "page" && "url" in response;
    }
    __name(isFullPage3, "isFullPage");
    exports.isFullPage = isFullPage3;
    function isFullDatabase(response) {
      return response.object === "database" && "title" in response;
    }
    __name(isFullDatabase, "isFullDatabase");
    exports.isFullDatabase = isFullDatabase;
    function isFullPageOrDatabase(response) {
      if (response.object === "database") {
        return isFullDatabase(response);
      } else {
        return isFullPage3(response);
      }
    }
    __name(isFullPageOrDatabase, "isFullPageOrDatabase");
    exports.isFullPageOrDatabase = isFullPageOrDatabase;
    function isFullUser(response) {
      return "type" in response;
    }
    __name(isFullUser, "isFullUser");
    exports.isFullUser = isFullUser;
    function isFullComment(response) {
      return "created_by" in response;
    }
    __name(isFullComment, "isFullComment");
    exports.isFullComment = isFullComment;
    function isTextRichTextItemResponse(richText) {
      return richText.type === "text";
    }
    __name(isTextRichTextItemResponse, "isTextRichTextItemResponse");
    exports.isTextRichTextItemResponse = isTextRichTextItemResponse;
    function isEquationRichTextItemResponse(richText) {
      return richText.type === "equation";
    }
    __name(isEquationRichTextItemResponse, "isEquationRichTextItemResponse");
    exports.isEquationRichTextItemResponse = isEquationRichTextItemResponse;
    function isMentionRichTextItemResponse(richText) {
      return richText.type === "mention";
    }
    __name(isMentionRichTextItemResponse, "isMentionRichTextItemResponse");
    exports.isMentionRichTextItemResponse = isMentionRichTextItemResponse;
  }
});

// ../shared/node_modules/@notionhq/client/build/src/index.js
var require_src = __commonJS({
  "../shared/node_modules/@notionhq/client/build/src/index.js"(exports) {
    "use strict";
    init_virtual_unenv_global_polyfill_process();
    init_virtual_unenv_global_polyfill_performance();
    init_virtual_unenv_global_polyfill_console();
    init_virtual_unenv_global_polyfill_set_immediate();
    init_virtual_unenv_global_polyfill_clear_immediate();
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isFullPageOrDatabase = exports.isFullComment = exports.isFullUser = exports.isFullPage = exports.isFullDatabase = exports.isFullBlock = exports.iteratePaginatedAPI = exports.collectPaginatedAPI = exports.isNotionClientError = exports.RequestTimeoutError = exports.UnknownHTTPResponseError = exports.APIResponseError = exports.ClientErrorCode = exports.APIErrorCode = exports.LogLevel = exports.Client = void 0;
    var Client_1 = require_Client();
    Object.defineProperty(exports, "Client", { enumerable: true, get: function() {
      return Client_1.default;
    } });
    var logging_1 = require_logging();
    Object.defineProperty(exports, "LogLevel", { enumerable: true, get: function() {
      return logging_1.LogLevel;
    } });
    var errors_1 = require_errors();
    Object.defineProperty(exports, "APIErrorCode", { enumerable: true, get: function() {
      return errors_1.APIErrorCode;
    } });
    Object.defineProperty(exports, "ClientErrorCode", { enumerable: true, get: function() {
      return errors_1.ClientErrorCode;
    } });
    Object.defineProperty(exports, "APIResponseError", { enumerable: true, get: function() {
      return errors_1.APIResponseError;
    } });
    Object.defineProperty(exports, "UnknownHTTPResponseError", { enumerable: true, get: function() {
      return errors_1.UnknownHTTPResponseError;
    } });
    Object.defineProperty(exports, "RequestTimeoutError", { enumerable: true, get: function() {
      return errors_1.RequestTimeoutError;
    } });
    Object.defineProperty(exports, "isNotionClientError", { enumerable: true, get: function() {
      return errors_1.isNotionClientError;
    } });
    var helpers_1 = require_helpers();
    Object.defineProperty(exports, "collectPaginatedAPI", { enumerable: true, get: function() {
      return helpers_1.collectPaginatedAPI;
    } });
    Object.defineProperty(exports, "iteratePaginatedAPI", { enumerable: true, get: function() {
      return helpers_1.iteratePaginatedAPI;
    } });
    Object.defineProperty(exports, "isFullBlock", { enumerable: true, get: function() {
      return helpers_1.isFullBlock;
    } });
    Object.defineProperty(exports, "isFullDatabase", { enumerable: true, get: function() {
      return helpers_1.isFullDatabase;
    } });
    Object.defineProperty(exports, "isFullPage", { enumerable: true, get: function() {
      return helpers_1.isFullPage;
    } });
    Object.defineProperty(exports, "isFullUser", { enumerable: true, get: function() {
      return helpers_1.isFullUser;
    } });
    Object.defineProperty(exports, "isFullComment", { enumerable: true, get: function() {
      return helpers_1.isFullComment;
    } });
    Object.defineProperty(exports, "isFullPageOrDatabase", { enumerable: true, get: function() {
      return helpers_1.isFullPageOrDatabase;
    } });
  }
});

// .wrangler/tmp/bundle-b47iRy/middleware-loader.entry.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// .wrangler/tmp/bundle-b47iRy/middleware-insertion-facade.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// src/index.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// node_modules/itty-router/dist/itty-router.mjs
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var e = /* @__PURE__ */ __name(({ base: e2 = "", routes: r = [] } = {}) => ({ __proto__: new Proxy({}, { get: (a, o, t) => (a2, ...p) => r.push([o.toUpperCase(), RegExp(`^${(e2 + a2).replace(/(\/?)\*/g, "($1.*)?").replace(/(\/$)|((?<=\/)\/)/, "").replace(/(:(\w+)\+)/, "(?<$2>.*)").replace(/:(\w+)(\?)?(\.)?/g, "$2(?<$1>[^/]+)$2$3").replace(/\.(?=[\w(])/, "\\.").replace(/\)\.\?\(([^\[]+)\[\^/g, "?)\\.?($1(?<=\\.)[^\\.")}/*$`), p]) && t }), routes: r, async handle(e3, ...a) {
  let o, t, p = new URL(e3.url), l = e3.query = {};
  for (let [e4, r2] of p.searchParams)
    l[e4] = void 0 === l[e4] ? r2 : [l[e4], r2].flat();
  for (let [l2, s, c] of r)
    if ((l2 === e3.method || "ALL" === l2) && (t = p.pathname.match(s))) {
      e3.params = t.groups || {};
      for (let r2 of c)
        if (void 0 !== (o = await r2(e3.proxy || e3, ...a)))
          return o;
    }
} }), "e");

// ../shared/src/index.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/src/utils/parseClippings.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// node_modules/unenv/runtime/node/crypto/$cloudflare.mjs
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// node_modules/unenv/runtime/node/crypto/internal/node.mjs
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
init_utils();
var webcrypto = new Proxy(
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
var checkPrime = notImplemented("crypto.checkPrime");
var checkPrimeSync = notImplemented(
  "crypto.checkPrimeSync"
);
var createCipher = notImplemented("crypto.createCipher");
var createDecipher = notImplemented("crypto.createDecipher");
var pseudoRandomBytes = notImplemented("crypto.pseudoRandomBytes");
var createCipheriv = notImplemented(
  "crypto.createCipheriv"
);
var createDecipheriv = notImplemented("crypto.createDecipheriv");
var createDiffieHellman = notImplemented("crypto.createDiffieHellman");
var createDiffieHellmanGroup = notImplemented("crypto.createDiffieHellmanGroup");
var createECDH = notImplemented("crypto.createECDH");
var createHash = notImplemented("crypto.createHash");
var createHmac = notImplemented("crypto.createHmac");
var createPrivateKey = notImplemented("crypto.createPrivateKey");
var createPublicKey = notImplemented("crypto.createPublicKey");
var createSecretKey = notImplemented("crypto.createSecretKey");
var createSign = notImplemented("crypto.createSign");
var createVerify = notImplemented(
  "crypto.createVerify"
);
var diffieHellman = notImplemented(
  "crypto.diffieHellman"
);
var generatePrime = notImplemented(
  "crypto.generatePrime"
);
var generatePrimeSync = notImplemented("crypto.generatePrimeSync");
var getCiphers = notImplemented("crypto.getCiphers");
var getCipherInfo = notImplemented(
  "crypto.getCipherInfo"
);
var getCurves = notImplemented("crypto.getCurves");
var getDiffieHellman = notImplemented("crypto.getDiffieHellman");
var getHashes = notImplemented("crypto.getHashes");
var hkdf = notImplemented("crypto.hkdf");
var hkdfSync = notImplemented("crypto.hkdfSync");
var pbkdf2 = notImplemented("crypto.pbkdf2");
var pbkdf2Sync = notImplemented("crypto.pbkdf2Sync");
var generateKeyPair = notImplemented("crypto.generateKeyPair");
var generateKeyPairSync = notImplemented("crypto.generateKeyPairSync");
var generateKey = notImplemented("crypto.generateKey");
var generateKeySync = notImplemented("crypto.generateKeySync");
var privateDecrypt = notImplemented(
  "crypto.privateDecrypt"
);
var privateEncrypt = notImplemented(
  "crypto.privateEncrypt"
);
var publicDecrypt = notImplemented(
  "crypto.publicDecrypt"
);
var publicEncrypt = notImplemented(
  "crypto.publicEncrypt"
);
var randomFill = notImplemented("crypto.randomFill");
var randomFillSync = notImplemented(
  "crypto.randomFillSync"
);
var randomInt = notImplemented("crypto.randomInt");
var scrypt = notImplemented("crypto.scrypt");
var scryptSync = notImplemented("crypto.scryptSync");
var sign = notImplemented("crypto.sign");
var setEngine = notImplemented("crypto.setEngine");
var timingSafeEqual = notImplemented("crypto.timingSafeEqual");
var getFips = notImplemented("crypto.getFips");
var setFips = notImplemented("crypto.setFips");
var verify = notImplemented("crypto.verify");
var secureHeapUsed = notImplemented(
  "crypto.secureHeapUsed"
);
var hash = notImplemented("crypto.hash");
var Certificate = notImplementedClass(
  "crypto.Certificate"
);
var Cipher = notImplementedClass(
  "crypto.Cipher"
);
var Cipheriv = notImplementedClass(
  "crypto.Cipheriv"
  // @ts-expect-error not typed yet
);
var Decipher = notImplementedClass(
  "crypto.Decipher"
);
var Decipheriv = notImplementedClass(
  "crypto.Decipheriv"
  // @ts-expect-error not typed yet
);
var DiffieHellman = notImplementedClass(
  "crypto.DiffieHellman"
);
var DiffieHellmanGroup = notImplementedClass(
  "crypto.DiffieHellmanGroup"
);
var ECDH = notImplementedClass(
  "crypto.ECDH"
);
var Hash = notImplementedClass(
  "crypto.Hash"
);
var Hmac = notImplementedClass(
  "crypto.Hmac"
);
var KeyObject = notImplementedClass(
  "crypto.KeyObject"
);
var Sign = notImplementedClass(
  "crypto.Sign"
);
var Verify = notImplementedClass(
  "crypto.Verify"
);
var X509Certificate = notImplementedClass(
  "crypto.X509Certificate"
);

// node_modules/unenv/runtime/node/crypto/$cloudflare.mjs
var workerdCrypto = process.getBuiltinModule("node:crypto");
var {
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
  randomBytes,
  randomFill: randomFill2,
  randomFillSync: randomFillSync2,
  randomInt: randomInt2,
  randomUUID,
  scrypt: scrypt2,
  scryptSync: scryptSync2,
  secureHeapUsed: secureHeapUsed2,
  setEngine: setEngine2,
  setFips: setFips2,
  subtle,
  timingSafeEqual: timingSafeEqual2
} = workerdCrypto;
var getRandomValues = workerdCrypto.getRandomValues.bind(
  workerdCrypto.webcrypto
);
var webcrypto2 = {
  CryptoKey: webcrypto.CryptoKey,
  getRandomValues,
  randomUUID,
  subtle
};
var fips = workerdCrypto.fips;

// ../shared/src/utils/parseClippings.ts
var BATCH_SIZE = 100;
function generateHighlightHash(highlight, location, bookTitle, author) {
  const firstChunk = highlight[0] || "";
  const content = firstChunk + location + bookTitle + author;
  return createHash2("sha256").update(content).digest("hex");
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
          console.error(`ERROR: Chunk exceeds Notion limit in "${bookTitle}": Chunk ${i + 1}/${highlightChunks.length} is ${chunk.length} characters`);
          highlightChunks[i] = chunk.substring(0, 2e3);
        } else if (chunk.length > 1900) {
          console.warn(`Warning: Chunk approaching Notion limit in "${bookTitle}": Chunk ${i + 1}/${highlightChunks.length} is ${chunk.length} characters`);
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
        hash: generateHighlightHash(highlightChunks, location, bookTitle, author)
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
          entries: entries2.map((e2) => ({
            date: e2.date.toISOString(),
            location: e2.location
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
  if (highlights.length > 0) {
    console.debug("Sample highlight:", JSON.stringify(highlights[0], null, 2));
  }
  highlights.forEach((h, index) => {
    console.debug(`Verifying highlight ${index + 1}/${highlights.length}`);
    if (!h.bookTitle || !h.author || !h.highlight || !h.location || !h.date) {
      console.warn("Invalid highlight structure:", h);
    }
  });
  return highlights;
}
__name(parseClippings, "parseClippings");

// ../shared/src/services/notionStore.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var TOKEN_KEY_PREFIX = "notion_token:";
var DB_KEY_PREFIX = "notion_db:";
var NotionStore = class {
  constructor(kvStore) {
    this.kvStore = kvStore;
  }
  getTokenKey(workspaceId) {
    return `${TOKEN_KEY_PREFIX}${workspaceId}`;
  }
  getDbKey(workspaceId) {
    return `${DB_KEY_PREFIX}${workspaceId}`;
  }
  async getToken(workspaceId) {
    const tokenJson = await this.kvStore.get(this.getTokenKey(workspaceId));
    return tokenJson ? JSON.parse(tokenJson) : null;
  }
  async setToken(token) {
    console.log("[NotionStore] Setting token...", {
      hasAccessToken: !!token.access_token,
      tokenType: token.token_type,
      hasBotId: !!token.bot_id,
      workspaceName: token.workspace_name,
      workspaceId: token.workspace_id,
      ownerType: token.owner?.type
    });
    if (!token.access_token) {
      throw new Error("Invalid token data - missing access_token");
    }
    if (token.token_type !== "bearer") {
      throw new Error('Invalid token data - token_type must be "bearer"');
    }
    if (!token.bot_id) {
      throw new Error("Invalid token data - missing bot_id");
    }
    if (!token.workspace_name) {
      throw new Error("Invalid token data - missing workspace_name");
    }
    if (!token.workspace_id) {
      throw new Error("Invalid token data - missing workspace_id");
    }
    if (!token.owner?.type) {
      throw new Error("Invalid token data - missing owner.type");
    }
    if (!this.kvStore) {
      throw new Error("KVStore is not initialized");
    }
    const key = this.getTokenKey(token.workspace_id);
    const tokenJson = JSON.stringify(token);
    console.log("[NotionStore] Preparing to store token:", {
      key,
      tokenLength: tokenJson.length,
      workspaceId: token.workspace_id,
      hasKVStore: !!this.kvStore,
      kvStoreType: this.kvStore.constructor.name
    });
    try {
      await this.kvStore.set(key, tokenJson);
      console.log("[NotionStore] Token stored successfully");
    } catch (error3) {
      console.error("[NotionStore] Failed to store token:", error3);
      throw error3;
    }
  }
  async deleteToken(workspaceId) {
    await this.kvStore.delete(this.getTokenKey(workspaceId));
  }
  async getDatabaseId(workspaceId) {
    return this.kvStore.get(this.getDbKey(workspaceId));
  }
  async setDatabaseId(workspaceId, databaseId) {
    await this.kvStore.set(this.getDbKey(workspaceId), databaseId);
  }
};
__name(NotionStore, "NotionStore");

// ../shared/src/services/notionClient.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var import_client2 = __toESM(require_src(), 1);

// ../shared/node_modules/axios/index.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/axios.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/utils.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/bind.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function bind(fn2, thisArg) {
  return /* @__PURE__ */ __name(function wrap() {
    return fn2.apply(thisArg, arguments);
  }, "wrap");
}
__name(bind, "bind");

// ../shared/node_modules/axios/lib/utils.js
var { toString } = Object.prototype;
var { getPrototypeOf } = Object;
var kindOf = ((cache) => (thing) => {
  const str = toString.call(thing);
  return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(/* @__PURE__ */ Object.create(null));
var kindOfTest = /* @__PURE__ */ __name((type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type;
}, "kindOfTest");
var typeOfTest = /* @__PURE__ */ __name((type) => (thing) => typeof thing === type, "typeOfTest");
var { isArray } = Array;
var isUndefined = typeOfTest("undefined");
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor) && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
__name(isBuffer, "isBuffer");
var isArrayBuffer = kindOfTest("ArrayBuffer");
function isArrayBufferView(val) {
  let result;
  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
    result = ArrayBuffer.isView(val);
  } else {
    result = val && val.buffer && isArrayBuffer(val.buffer);
  }
  return result;
}
__name(isArrayBufferView, "isArrayBufferView");
var isString = typeOfTest("string");
var isFunction = typeOfTest("function");
var isNumber = typeOfTest("number");
var isObject = /* @__PURE__ */ __name((thing) => thing !== null && typeof thing === "object", "isObject");
var isBoolean = /* @__PURE__ */ __name((thing) => thing === true || thing === false, "isBoolean");
var isPlainObject = /* @__PURE__ */ __name((val) => {
  if (kindOf(val) !== "object") {
    return false;
  }
  const prototype3 = getPrototypeOf(val);
  return (prototype3 === null || prototype3 === Object.prototype || Object.getPrototypeOf(prototype3) === null) && !(Symbol.toStringTag in val) && !(Symbol.iterator in val);
}, "isPlainObject");
var isDate = kindOfTest("Date");
var isFile = kindOfTest("File");
var isBlob = kindOfTest("Blob");
var isFileList = kindOfTest("FileList");
var isStream = /* @__PURE__ */ __name((val) => isObject(val) && isFunction(val.pipe), "isStream");
var isFormData = /* @__PURE__ */ __name((thing) => {
  let kind;
  return thing && (typeof FormData === "function" && thing instanceof FormData || isFunction(thing.append) && ((kind = kindOf(thing)) === "formdata" || // detect form-data instance
  kind === "object" && isFunction(thing.toString) && thing.toString() === "[object FormData]"));
}, "isFormData");
var isURLSearchParams = kindOfTest("URLSearchParams");
var [isReadableStream, isRequest, isResponse, isHeaders] = ["ReadableStream", "Request", "Response", "Headers"].map(kindOfTest);
var trim = /* @__PURE__ */ __name((str) => str.trim ? str.trim() : str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""), "trim");
function forEach(obj, fn2, { allOwnKeys = false } = {}) {
  if (obj === null || typeof obj === "undefined") {
    return;
  }
  let i;
  let l;
  if (typeof obj !== "object") {
    obj = [obj];
  }
  if (isArray(obj)) {
    for (i = 0, l = obj.length; i < l; i++) {
      fn2.call(null, obj[i], i, obj);
    }
  } else {
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;
    for (i = 0; i < len; i++) {
      key = keys[i];
      fn2.call(null, obj[key], key, obj);
    }
  }
}
__name(forEach, "forEach");
function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
__name(findKey, "findKey");
var _global = (() => {
  if (typeof globalThis !== "undefined")
    return globalThis;
  return typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : global;
})();
var isContextDefined = /* @__PURE__ */ __name((context2) => !isUndefined(context2) && context2 !== _global, "isContextDefined");
function merge() {
  const { caseless } = isContextDefined(this) && this || {};
  const result = {};
  const assignValue = /* @__PURE__ */ __name((val, key) => {
    const targetKey = caseless && findKey(result, key) || key;
    if (isPlainObject(result[targetKey]) && isPlainObject(val)) {
      result[targetKey] = merge(result[targetKey], val);
    } else if (isPlainObject(val)) {
      result[targetKey] = merge({}, val);
    } else if (isArray(val)) {
      result[targetKey] = val.slice();
    } else {
      result[targetKey] = val;
    }
  }, "assignValue");
  for (let i = 0, l = arguments.length; i < l; i++) {
    arguments[i] && forEach(arguments[i], assignValue);
  }
  return result;
}
__name(merge, "merge");
var extend = /* @__PURE__ */ __name((a, b, thisArg, { allOwnKeys } = {}) => {
  forEach(b, (val, key) => {
    if (thisArg && isFunction(val)) {
      a[key] = bind(val, thisArg);
    } else {
      a[key] = val;
    }
  }, { allOwnKeys });
  return a;
}, "extend");
var stripBOM = /* @__PURE__ */ __name((content) => {
  if (content.charCodeAt(0) === 65279) {
    content = content.slice(1);
  }
  return content;
}, "stripBOM");
var inherits = /* @__PURE__ */ __name((constructor, superConstructor, props, descriptors2) => {
  constructor.prototype = Object.create(superConstructor.prototype, descriptors2);
  constructor.prototype.constructor = constructor;
  Object.defineProperty(constructor, "super", {
    value: superConstructor.prototype
  });
  props && Object.assign(constructor.prototype, props);
}, "inherits");
var toFlatObject = /* @__PURE__ */ __name((sourceObj, destObj, filter2, propFilter) => {
  let props;
  let i;
  let prop;
  const merged = {};
  destObj = destObj || {};
  if (sourceObj == null)
    return destObj;
  do {
    props = Object.getOwnPropertyNames(sourceObj);
    i = props.length;
    while (i-- > 0) {
      prop = props[i];
      if ((!propFilter || propFilter(prop, sourceObj, destObj)) && !merged[prop]) {
        destObj[prop] = sourceObj[prop];
        merged[prop] = true;
      }
    }
    sourceObj = filter2 !== false && getPrototypeOf(sourceObj);
  } while (sourceObj && (!filter2 || filter2(sourceObj, destObj)) && sourceObj !== Object.prototype);
  return destObj;
}, "toFlatObject");
var endsWith = /* @__PURE__ */ __name((str, searchString, position) => {
  str = String(str);
  if (position === void 0 || position > str.length) {
    position = str.length;
  }
  position -= searchString.length;
  const lastIndex = str.indexOf(searchString, position);
  return lastIndex !== -1 && lastIndex === position;
}, "endsWith");
var toArray = /* @__PURE__ */ __name((thing) => {
  if (!thing)
    return null;
  if (isArray(thing))
    return thing;
  let i = thing.length;
  if (!isNumber(i))
    return null;
  const arr = new Array(i);
  while (i-- > 0) {
    arr[i] = thing[i];
  }
  return arr;
}, "toArray");
var isTypedArray = ((TypedArray) => {
  return (thing) => {
    return TypedArray && thing instanceof TypedArray;
  };
})(typeof Uint8Array !== "undefined" && getPrototypeOf(Uint8Array));
var forEachEntry = /* @__PURE__ */ __name((obj, fn2) => {
  const generator = obj && obj[Symbol.iterator];
  const iterator = generator.call(obj);
  let result;
  while ((result = iterator.next()) && !result.done) {
    const pair = result.value;
    fn2.call(obj, pair[0], pair[1]);
  }
}, "forEachEntry");
var matchAll = /* @__PURE__ */ __name((regExp, str) => {
  let matches;
  const arr = [];
  while ((matches = regExp.exec(str)) !== null) {
    arr.push(matches);
  }
  return arr;
}, "matchAll");
var isHTMLForm = kindOfTest("HTMLFormElement");
var toCamelCase = /* @__PURE__ */ __name((str) => {
  return str.toLowerCase().replace(
    /[-_\s]([a-z\d])(\w*)/g,
    /* @__PURE__ */ __name(function replacer(m, p1, p2) {
      return p1.toUpperCase() + p2;
    }, "replacer")
  );
}, "toCamelCase");
var hasOwnProperty = (({ hasOwnProperty: hasOwnProperty2 }) => (obj, prop) => hasOwnProperty2.call(obj, prop))(Object.prototype);
var isRegExp = kindOfTest("RegExp");
var reduceDescriptors = /* @__PURE__ */ __name((obj, reducer) => {
  const descriptors2 = Object.getOwnPropertyDescriptors(obj);
  const reducedDescriptors = {};
  forEach(descriptors2, (descriptor, name) => {
    let ret;
    if ((ret = reducer(descriptor, name, obj)) !== false) {
      reducedDescriptors[name] = ret || descriptor;
    }
  });
  Object.defineProperties(obj, reducedDescriptors);
}, "reduceDescriptors");
var freezeMethods = /* @__PURE__ */ __name((obj) => {
  reduceDescriptors(obj, (descriptor, name) => {
    if (isFunction(obj) && ["arguments", "caller", "callee"].indexOf(name) !== -1) {
      return false;
    }
    const value = obj[name];
    if (!isFunction(value))
      return;
    descriptor.enumerable = false;
    if ("writable" in descriptor) {
      descriptor.writable = false;
      return;
    }
    if (!descriptor.set) {
      descriptor.set = () => {
        throw Error("Can not rewrite read-only method '" + name + "'");
      };
    }
  });
}, "freezeMethods");
var toObjectSet = /* @__PURE__ */ __name((arrayOrString, delimiter) => {
  const obj = {};
  const define = /* @__PURE__ */ __name((arr) => {
    arr.forEach((value) => {
      obj[value] = true;
    });
  }, "define");
  isArray(arrayOrString) ? define(arrayOrString) : define(String(arrayOrString).split(delimiter));
  return obj;
}, "toObjectSet");
var noop2 = /* @__PURE__ */ __name(() => {
}, "noop");
var toFiniteNumber = /* @__PURE__ */ __name((value, defaultValue) => {
  return value != null && Number.isFinite(value = +value) ? value : defaultValue;
}, "toFiniteNumber");
var ALPHA = "abcdefghijklmnopqrstuvwxyz";
var DIGIT = "0123456789";
var ALPHABET = {
  DIGIT,
  ALPHA,
  ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
};
var generateString = /* @__PURE__ */ __name((size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
  let str = "";
  const { length } = alphabet;
  while (size--) {
    str += alphabet[Math.random() * length | 0];
  }
  return str;
}, "generateString");
function isSpecCompliantForm(thing) {
  return !!(thing && isFunction(thing.append) && thing[Symbol.toStringTag] === "FormData" && thing[Symbol.iterator]);
}
__name(isSpecCompliantForm, "isSpecCompliantForm");
var toJSONObject = /* @__PURE__ */ __name((obj) => {
  const stack = new Array(10);
  const visit = /* @__PURE__ */ __name((source, i) => {
    if (isObject(source)) {
      if (stack.indexOf(source) >= 0) {
        return;
      }
      if (!("toJSON" in source)) {
        stack[i] = source;
        const target = isArray(source) ? [] : {};
        forEach(source, (value, key) => {
          const reducedValue = visit(value, i + 1);
          !isUndefined(reducedValue) && (target[key] = reducedValue);
        });
        stack[i] = void 0;
        return target;
      }
    }
    return source;
  }, "visit");
  return visit(obj, 0);
}, "toJSONObject");
var isAsyncFn = kindOfTest("AsyncFunction");
var isThenable = /* @__PURE__ */ __name((thing) => thing && (isObject(thing) || isFunction(thing)) && isFunction(thing.then) && isFunction(thing.catch), "isThenable");
var _setImmediate = ((setImmediateSupported, postMessageSupported) => {
  if (setImmediateSupported) {
    return setImmediate;
  }
  return postMessageSupported ? ((token, callbacks) => {
    _global.addEventListener("message", ({ source, data }) => {
      if (source === _global && data === token) {
        callbacks.length && callbacks.shift()();
      }
    }, false);
    return (cb) => {
      callbacks.push(cb);
      _global.postMessage(token, "*");
    };
  })(`axios@${Math.random()}`, []) : (cb) => setTimeout(cb);
})(
  typeof setImmediate === "function",
  isFunction(_global.postMessage)
);
var asap = typeof queueMicrotask !== "undefined" ? queueMicrotask.bind(_global) : typeof process !== "undefined" && process.nextTick || _setImmediate;
var utils_default = {
  isArray,
  isArrayBuffer,
  isBuffer,
  isFormData,
  isArrayBufferView,
  isString,
  isNumber,
  isBoolean,
  isObject,
  isPlainObject,
  isReadableStream,
  isRequest,
  isResponse,
  isHeaders,
  isUndefined,
  isDate,
  isFile,
  isBlob,
  isRegExp,
  isFunction,
  isStream,
  isURLSearchParams,
  isTypedArray,
  isFileList,
  forEach,
  merge,
  extend,
  trim,
  stripBOM,
  inherits,
  toFlatObject,
  kindOf,
  kindOfTest,
  endsWith,
  toArray,
  forEachEntry,
  matchAll,
  isHTMLForm,
  hasOwnProperty,
  hasOwnProp: hasOwnProperty,
  // an alias to avoid ESLint no-prototype-builtins detection
  reduceDescriptors,
  freezeMethods,
  toObjectSet,
  toCamelCase,
  noop: noop2,
  toFiniteNumber,
  findKey,
  global: _global,
  isContextDefined,
  ALPHABET,
  generateString,
  isSpecCompliantForm,
  toJSONObject,
  isAsyncFn,
  isThenable,
  setImmediate: _setImmediate,
  asap
};

// ../shared/node_modules/axios/lib/core/Axios.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/buildURL.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/AxiosURLSearchParams.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/toFormData.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/core/AxiosError.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function AxiosError(message, code, config2, request, response) {
  Error.call(this);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, this.constructor);
  } else {
    this.stack = new Error().stack;
  }
  this.message = message;
  this.name = "AxiosError";
  code && (this.code = code);
  config2 && (this.config = config2);
  request && (this.request = request);
  if (response) {
    this.response = response;
    this.status = response.status ? response.status : null;
  }
}
__name(AxiosError, "AxiosError");
utils_default.inherits(AxiosError, Error, {
  toJSON: /* @__PURE__ */ __name(function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: utils_default.toJSONObject(this.config),
      code: this.code,
      status: this.status
    };
  }, "toJSON")
});
var prototype = AxiosError.prototype;
var descriptors = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL"
  // eslint-disable-next-line func-names
].forEach((code) => {
  descriptors[code] = { value: code };
});
Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, "isAxiosError", { value: true });
AxiosError.from = (error3, code, config2, request, response, customProps) => {
  const axiosError = Object.create(prototype);
  utils_default.toFlatObject(error3, axiosError, /* @__PURE__ */ __name(function filter2(obj) {
    return obj !== Error.prototype;
  }, "filter"), (prop) => {
    return prop !== "isAxiosError";
  });
  AxiosError.call(axiosError, error3.message, code, config2, request, response);
  axiosError.cause = error3;
  axiosError.name = error3.name;
  customProps && Object.assign(axiosError, customProps);
  return axiosError;
};
var AxiosError_default = AxiosError;

// ../shared/node_modules/axios/lib/helpers/null.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var null_default = null;

// ../shared/node_modules/axios/lib/helpers/toFormData.js
function isVisitable(thing) {
  return utils_default.isPlainObject(thing) || utils_default.isArray(thing);
}
__name(isVisitable, "isVisitable");
function removeBrackets(key) {
  return utils_default.endsWith(key, "[]") ? key.slice(0, -2) : key;
}
__name(removeBrackets, "removeBrackets");
function renderKey(path, key, dots) {
  if (!path)
    return key;
  return path.concat(key).map(/* @__PURE__ */ __name(function each(token, i) {
    token = removeBrackets(token);
    return !dots && i ? "[" + token + "]" : token;
  }, "each")).join(dots ? "." : "");
}
__name(renderKey, "renderKey");
function isFlatArray(arr) {
  return utils_default.isArray(arr) && !arr.some(isVisitable);
}
__name(isFlatArray, "isFlatArray");
var predicates = utils_default.toFlatObject(utils_default, {}, null, /* @__PURE__ */ __name(function filter(prop) {
  return /^is[A-Z]/.test(prop);
}, "filter"));
function toFormData(obj, formData, options) {
  if (!utils_default.isObject(obj)) {
    throw new TypeError("target must be an object");
  }
  formData = formData || new (null_default || FormData)();
  options = utils_default.toFlatObject(options, {
    metaTokens: true,
    dots: false,
    indexes: false
  }, false, /* @__PURE__ */ __name(function defined(option, source) {
    return !utils_default.isUndefined(source[option]);
  }, "defined"));
  const metaTokens = options.metaTokens;
  const visitor = options.visitor || defaultVisitor;
  const dots = options.dots;
  const indexes = options.indexes;
  const _Blob = options.Blob || typeof Blob !== "undefined" && Blob;
  const useBlob = _Blob && utils_default.isSpecCompliantForm(formData);
  if (!utils_default.isFunction(visitor)) {
    throw new TypeError("visitor must be a function");
  }
  function convertValue(value) {
    if (value === null)
      return "";
    if (utils_default.isDate(value)) {
      return value.toISOString();
    }
    if (!useBlob && utils_default.isBlob(value)) {
      throw new AxiosError_default("Blob is not supported. Use a Buffer instead.");
    }
    if (utils_default.isArrayBuffer(value) || utils_default.isTypedArray(value)) {
      return useBlob && typeof Blob === "function" ? new Blob([value]) : Buffer.from(value);
    }
    return value;
  }
  __name(convertValue, "convertValue");
  function defaultVisitor(value, key, path) {
    let arr = value;
    if (value && !path && typeof value === "object") {
      if (utils_default.endsWith(key, "{}")) {
        key = metaTokens ? key : key.slice(0, -2);
        value = JSON.stringify(value);
      } else if (utils_default.isArray(value) && isFlatArray(value) || (utils_default.isFileList(value) || utils_default.endsWith(key, "[]")) && (arr = utils_default.toArray(value))) {
        key = removeBrackets(key);
        arr.forEach(/* @__PURE__ */ __name(function each(el, index) {
          !(utils_default.isUndefined(el) || el === null) && formData.append(
            // eslint-disable-next-line no-nested-ternary
            indexes === true ? renderKey([key], index, dots) : indexes === null ? key : key + "[]",
            convertValue(el)
          );
        }, "each"));
        return false;
      }
    }
    if (isVisitable(value)) {
      return true;
    }
    formData.append(renderKey(path, key, dots), convertValue(value));
    return false;
  }
  __name(defaultVisitor, "defaultVisitor");
  const stack = [];
  const exposedHelpers = Object.assign(predicates, {
    defaultVisitor,
    convertValue,
    isVisitable
  });
  function build(value, path) {
    if (utils_default.isUndefined(value))
      return;
    if (stack.indexOf(value) !== -1) {
      throw Error("Circular reference detected in " + path.join("."));
    }
    stack.push(value);
    utils_default.forEach(value, /* @__PURE__ */ __name(function each(el, key) {
      const result = !(utils_default.isUndefined(el) || el === null) && visitor.call(
        formData,
        el,
        utils_default.isString(key) ? key.trim() : key,
        path,
        exposedHelpers
      );
      if (result === true) {
        build(el, path ? path.concat(key) : [key]);
      }
    }, "each"));
    stack.pop();
  }
  __name(build, "build");
  if (!utils_default.isObject(obj)) {
    throw new TypeError("data must be an object");
  }
  build(obj);
  return formData;
}
__name(toFormData, "toFormData");
var toFormData_default = toFormData;

// ../shared/node_modules/axios/lib/helpers/AxiosURLSearchParams.js
function encode(str) {
  const charMap = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0"
  };
  return encodeURIComponent(str).replace(/[!'()~]|%20|%00/g, /* @__PURE__ */ __name(function replacer(match) {
    return charMap[match];
  }, "replacer"));
}
__name(encode, "encode");
function AxiosURLSearchParams(params, options) {
  this._pairs = [];
  params && toFormData_default(params, this, options);
}
__name(AxiosURLSearchParams, "AxiosURLSearchParams");
var prototype2 = AxiosURLSearchParams.prototype;
prototype2.append = /* @__PURE__ */ __name(function append(name, value) {
  this._pairs.push([name, value]);
}, "append");
prototype2.toString = /* @__PURE__ */ __name(function toString2(encoder) {
  const _encode = encoder ? function(value) {
    return encoder.call(this, value, encode);
  } : encode;
  return this._pairs.map(/* @__PURE__ */ __name(function each(pair) {
    return _encode(pair[0]) + "=" + _encode(pair[1]);
  }, "each"), "").join("&");
}, "toString");
var AxiosURLSearchParams_default = AxiosURLSearchParams;

// ../shared/node_modules/axios/lib/helpers/buildURL.js
function encode2(val) {
  return encodeURIComponent(val).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
__name(encode2, "encode");
function buildURL(url, params, options) {
  if (!params) {
    return url;
  }
  const _encode = options && options.encode || encode2;
  if (utils_default.isFunction(options)) {
    options = {
      serialize: options
    };
  }
  const serializeFn = options && options.serialize;
  let serializedParams;
  if (serializeFn) {
    serializedParams = serializeFn(params, options);
  } else {
    serializedParams = utils_default.isURLSearchParams(params) ? params.toString() : new AxiosURLSearchParams_default(params, options).toString(_encode);
  }
  if (serializedParams) {
    const hashmarkIndex = url.indexOf("#");
    if (hashmarkIndex !== -1) {
      url = url.slice(0, hashmarkIndex);
    }
    url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
  }
  return url;
}
__name(buildURL, "buildURL");

// ../shared/node_modules/axios/lib/core/InterceptorManager.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var InterceptorManager = class {
  constructor() {
    this.handlers = [];
  }
  /**
   * Add a new interceptor to the stack
   *
   * @param {Function} fulfilled The function to handle `then` for a `Promise`
   * @param {Function} rejected The function to handle `reject` for a `Promise`
   *
   * @return {Number} An ID used to remove interceptor later
   */
  use(fulfilled, rejected, options) {
    this.handlers.push({
      fulfilled,
      rejected,
      synchronous: options ? options.synchronous : false,
      runWhen: options ? options.runWhen : null
    });
    return this.handlers.length - 1;
  }
  /**
   * Remove an interceptor from the stack
   *
   * @param {Number} id The ID that was returned by `use`
   *
   * @returns {Boolean} `true` if the interceptor was removed, `false` otherwise
   */
  eject(id) {
    if (this.handlers[id]) {
      this.handlers[id] = null;
    }
  }
  /**
   * Clear all interceptors from the stack
   *
   * @returns {void}
   */
  clear() {
    if (this.handlers) {
      this.handlers = [];
    }
  }
  /**
   * Iterate over all the registered interceptors
   *
   * This method is particularly useful for skipping over any
   * interceptors that may have become `null` calling `eject`.
   *
   * @param {Function} fn The function to call for each interceptor
   *
   * @returns {void}
   */
  forEach(fn2) {
    utils_default.forEach(this.handlers, /* @__PURE__ */ __name(function forEachHandler(h) {
      if (h !== null) {
        fn2(h);
      }
    }, "forEachHandler"));
  }
};
__name(InterceptorManager, "InterceptorManager");
var InterceptorManager_default = InterceptorManager;

// ../shared/node_modules/axios/lib/core/dispatchRequest.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/core/transformData.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/defaults/index.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/defaults/transitional.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var transitional_default = {
  silentJSONParsing: true,
  forcedJSONParsing: true,
  clarifyTimeoutError: false
};

// ../shared/node_modules/axios/lib/helpers/toURLEncodedForm.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/platform/index.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/platform/browser/index.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/platform/browser/classes/URLSearchParams.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var URLSearchParams_default = typeof URLSearchParams !== "undefined" ? URLSearchParams : AxiosURLSearchParams_default;

// ../shared/node_modules/axios/lib/platform/browser/classes/FormData.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var FormData_default = typeof FormData !== "undefined" ? FormData : null;

// ../shared/node_modules/axios/lib/platform/browser/classes/Blob.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var Blob_default = typeof Blob !== "undefined" ? Blob : null;

// ../shared/node_modules/axios/lib/platform/browser/index.js
var browser_default = {
  isBrowser: true,
  classes: {
    URLSearchParams: URLSearchParams_default,
    FormData: FormData_default,
    Blob: Blob_default
  },
  protocols: ["http", "https", "file", "blob", "url", "data"]
};

// ../shared/node_modules/axios/lib/platform/common/utils.js
var utils_exports = {};
__export(utils_exports, {
  hasBrowserEnv: () => hasBrowserEnv,
  hasStandardBrowserEnv: () => hasStandardBrowserEnv,
  hasStandardBrowserWebWorkerEnv: () => hasStandardBrowserWebWorkerEnv,
  navigator: () => _navigator,
  origin: () => origin
});
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var hasBrowserEnv = typeof window !== "undefined" && typeof document !== "undefined";
var _navigator = typeof navigator === "object" && navigator || void 0;
var hasStandardBrowserEnv = hasBrowserEnv && (!_navigator || ["ReactNative", "NativeScript", "NS"].indexOf(_navigator.product) < 0);
var hasStandardBrowserWebWorkerEnv = (() => {
  return typeof WorkerGlobalScope !== "undefined" && // eslint-disable-next-line no-undef
  self instanceof WorkerGlobalScope && typeof self.importScripts === "function";
})();
var origin = hasBrowserEnv && window.location.href || "http://localhost";

// ../shared/node_modules/axios/lib/platform/index.js
var platform_default = {
  ...utils_exports,
  ...browser_default
};

// ../shared/node_modules/axios/lib/helpers/toURLEncodedForm.js
function toURLEncodedForm(data, options) {
  return toFormData_default(data, new platform_default.classes.URLSearchParams(), Object.assign({
    visitor: function(value, key, path, helpers) {
      if (platform_default.isNode && utils_default.isBuffer(value)) {
        this.append(key, value.toString("base64"));
        return false;
      }
      return helpers.defaultVisitor.apply(this, arguments);
    }
  }, options));
}
__name(toURLEncodedForm, "toURLEncodedForm");

// ../shared/node_modules/axios/lib/helpers/formDataToJSON.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function parsePropPath(name) {
  return utils_default.matchAll(/\w+|\[(\w*)]/g, name).map((match) => {
    return match[0] === "[]" ? "" : match[1] || match[0];
  });
}
__name(parsePropPath, "parsePropPath");
function arrayToObject(arr) {
  const obj = {};
  const keys = Object.keys(arr);
  let i;
  const len = keys.length;
  let key;
  for (i = 0; i < len; i++) {
    key = keys[i];
    obj[key] = arr[key];
  }
  return obj;
}
__name(arrayToObject, "arrayToObject");
function formDataToJSON(formData) {
  function buildPath(path, value, target, index) {
    let name = path[index++];
    if (name === "__proto__")
      return true;
    const isNumericKey = Number.isFinite(+name);
    const isLast = index >= path.length;
    name = !name && utils_default.isArray(target) ? target.length : name;
    if (isLast) {
      if (utils_default.hasOwnProp(target, name)) {
        target[name] = [target[name], value];
      } else {
        target[name] = value;
      }
      return !isNumericKey;
    }
    if (!target[name] || !utils_default.isObject(target[name])) {
      target[name] = [];
    }
    const result = buildPath(path, value, target[name], index);
    if (result && utils_default.isArray(target[name])) {
      target[name] = arrayToObject(target[name]);
    }
    return !isNumericKey;
  }
  __name(buildPath, "buildPath");
  if (utils_default.isFormData(formData) && utils_default.isFunction(formData.entries)) {
    const obj = {};
    utils_default.forEachEntry(formData, (name, value) => {
      buildPath(parsePropPath(name), value, obj, 0);
    });
    return obj;
  }
  return null;
}
__name(formDataToJSON, "formDataToJSON");
var formDataToJSON_default = formDataToJSON;

// ../shared/node_modules/axios/lib/defaults/index.js
function stringifySafely(rawValue, parser, encoder) {
  if (utils_default.isString(rawValue)) {
    try {
      (parser || JSON.parse)(rawValue);
      return utils_default.trim(rawValue);
    } catch (e2) {
      if (e2.name !== "SyntaxError") {
        throw e2;
      }
    }
  }
  return (encoder || JSON.stringify)(rawValue);
}
__name(stringifySafely, "stringifySafely");
var defaults = {
  transitional: transitional_default,
  adapter: ["xhr", "http", "fetch"],
  transformRequest: [/* @__PURE__ */ __name(function transformRequest(data, headers) {
    const contentType = headers.getContentType() || "";
    const hasJSONContentType = contentType.indexOf("application/json") > -1;
    const isObjectPayload = utils_default.isObject(data);
    if (isObjectPayload && utils_default.isHTMLForm(data)) {
      data = new FormData(data);
    }
    const isFormData2 = utils_default.isFormData(data);
    if (isFormData2) {
      return hasJSONContentType ? JSON.stringify(formDataToJSON_default(data)) : data;
    }
    if (utils_default.isArrayBuffer(data) || utils_default.isBuffer(data) || utils_default.isStream(data) || utils_default.isFile(data) || utils_default.isBlob(data) || utils_default.isReadableStream(data)) {
      return data;
    }
    if (utils_default.isArrayBufferView(data)) {
      return data.buffer;
    }
    if (utils_default.isURLSearchParams(data)) {
      headers.setContentType("application/x-www-form-urlencoded;charset=utf-8", false);
      return data.toString();
    }
    let isFileList2;
    if (isObjectPayload) {
      if (contentType.indexOf("application/x-www-form-urlencoded") > -1) {
        return toURLEncodedForm(data, this.formSerializer).toString();
      }
      if ((isFileList2 = utils_default.isFileList(data)) || contentType.indexOf("multipart/form-data") > -1) {
        const _FormData = this.env && this.env.FormData;
        return toFormData_default(
          isFileList2 ? { "files[]": data } : data,
          _FormData && new _FormData(),
          this.formSerializer
        );
      }
    }
    if (isObjectPayload || hasJSONContentType) {
      headers.setContentType("application/json", false);
      return stringifySafely(data);
    }
    return data;
  }, "transformRequest")],
  transformResponse: [/* @__PURE__ */ __name(function transformResponse(data) {
    const transitional2 = this.transitional || defaults.transitional;
    const forcedJSONParsing = transitional2 && transitional2.forcedJSONParsing;
    const JSONRequested = this.responseType === "json";
    if (utils_default.isResponse(data) || utils_default.isReadableStream(data)) {
      return data;
    }
    if (data && utils_default.isString(data) && (forcedJSONParsing && !this.responseType || JSONRequested)) {
      const silentJSONParsing = transitional2 && transitional2.silentJSONParsing;
      const strictJSONParsing = !silentJSONParsing && JSONRequested;
      try {
        return JSON.parse(data);
      } catch (e2) {
        if (strictJSONParsing) {
          if (e2.name === "SyntaxError") {
            throw AxiosError_default.from(e2, AxiosError_default.ERR_BAD_RESPONSE, this, null, this.response);
          }
          throw e2;
        }
      }
    }
    return data;
  }, "transformResponse")],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: platform_default.classes.FormData,
    Blob: platform_default.classes.Blob
  },
  validateStatus: /* @__PURE__ */ __name(function validateStatus(status) {
    return status >= 200 && status < 300;
  }, "validateStatus"),
  headers: {
    common: {
      "Accept": "application/json, text/plain, */*",
      "Content-Type": void 0
    }
  }
};
utils_default.forEach(["delete", "get", "head", "post", "put", "patch"], (method) => {
  defaults.headers[method] = {};
});
var defaults_default = defaults;

// ../shared/node_modules/axios/lib/core/AxiosHeaders.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/parseHeaders.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var ignoreDuplicateOf = utils_default.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent"
]);
var parseHeaders_default = /* @__PURE__ */ __name((rawHeaders) => {
  const parsed = {};
  let key;
  let val;
  let i;
  rawHeaders && rawHeaders.split("\n").forEach(/* @__PURE__ */ __name(function parser(line) {
    i = line.indexOf(":");
    key = line.substring(0, i).trim().toLowerCase();
    val = line.substring(i + 1).trim();
    if (!key || parsed[key] && ignoreDuplicateOf[key]) {
      return;
    }
    if (key === "set-cookie") {
      if (parsed[key]) {
        parsed[key].push(val);
      } else {
        parsed[key] = [val];
      }
    } else {
      parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
    }
  }, "parser"));
  return parsed;
}, "default");

// ../shared/node_modules/axios/lib/core/AxiosHeaders.js
var $internals = Symbol("internals");
function normalizeHeader(header) {
  return header && String(header).trim().toLowerCase();
}
__name(normalizeHeader, "normalizeHeader");
function normalizeValue(value) {
  if (value === false || value == null) {
    return value;
  }
  return utils_default.isArray(value) ? value.map(normalizeValue) : String(value);
}
__name(normalizeValue, "normalizeValue");
function parseTokens(str) {
  const tokens = /* @__PURE__ */ Object.create(null);
  const tokensRE = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
  let match;
  while (match = tokensRE.exec(str)) {
    tokens[match[1]] = match[2];
  }
  return tokens;
}
__name(parseTokens, "parseTokens");
var isValidHeaderName = /* @__PURE__ */ __name((str) => /^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(str.trim()), "isValidHeaderName");
function matchHeaderValue(context2, value, header, filter2, isHeaderNameFilter) {
  if (utils_default.isFunction(filter2)) {
    return filter2.call(this, value, header);
  }
  if (isHeaderNameFilter) {
    value = header;
  }
  if (!utils_default.isString(value))
    return;
  if (utils_default.isString(filter2)) {
    return value.indexOf(filter2) !== -1;
  }
  if (utils_default.isRegExp(filter2)) {
    return filter2.test(value);
  }
}
__name(matchHeaderValue, "matchHeaderValue");
function formatHeader(header) {
  return header.trim().toLowerCase().replace(/([a-z\d])(\w*)/g, (w, char, str) => {
    return char.toUpperCase() + str;
  });
}
__name(formatHeader, "formatHeader");
function buildAccessors(obj, header) {
  const accessorName = utils_default.toCamelCase(" " + header);
  ["get", "set", "has"].forEach((methodName) => {
    Object.defineProperty(obj, methodName + accessorName, {
      value: function(arg1, arg2, arg3) {
        return this[methodName].call(this, header, arg1, arg2, arg3);
      },
      configurable: true
    });
  });
}
__name(buildAccessors, "buildAccessors");
var AxiosHeaders = class {
  constructor(headers) {
    headers && this.set(headers);
  }
  set(header, valueOrRewrite, rewrite) {
    const self2 = this;
    function setHeader(_value, _header, _rewrite) {
      const lHeader = normalizeHeader(_header);
      if (!lHeader) {
        throw new Error("header name must be a non-empty string");
      }
      const key = utils_default.findKey(self2, lHeader);
      if (!key || self2[key] === void 0 || _rewrite === true || _rewrite === void 0 && self2[key] !== false) {
        self2[key || _header] = normalizeValue(_value);
      }
    }
    __name(setHeader, "setHeader");
    const setHeaders = /* @__PURE__ */ __name((headers, _rewrite) => utils_default.forEach(headers, (_value, _header) => setHeader(_value, _header, _rewrite)), "setHeaders");
    if (utils_default.isPlainObject(header) || header instanceof this.constructor) {
      setHeaders(header, valueOrRewrite);
    } else if (utils_default.isString(header) && (header = header.trim()) && !isValidHeaderName(header)) {
      setHeaders(parseHeaders_default(header), valueOrRewrite);
    } else if (utils_default.isHeaders(header)) {
      for (const [key, value] of header.entries()) {
        setHeader(value, key, rewrite);
      }
    } else {
      header != null && setHeader(valueOrRewrite, header, rewrite);
    }
    return this;
  }
  get(header, parser) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      if (key) {
        const value = this[key];
        if (!parser) {
          return value;
        }
        if (parser === true) {
          return parseTokens(value);
        }
        if (utils_default.isFunction(parser)) {
          return parser.call(this, value, key);
        }
        if (utils_default.isRegExp(parser)) {
          return parser.exec(value);
        }
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(header, matcher) {
    header = normalizeHeader(header);
    if (header) {
      const key = utils_default.findKey(this, header);
      return !!(key && this[key] !== void 0 && (!matcher || matchHeaderValue(this, this[key], key, matcher)));
    }
    return false;
  }
  delete(header, matcher) {
    const self2 = this;
    let deleted = false;
    function deleteHeader(_header) {
      _header = normalizeHeader(_header);
      if (_header) {
        const key = utils_default.findKey(self2, _header);
        if (key && (!matcher || matchHeaderValue(self2, self2[key], key, matcher))) {
          delete self2[key];
          deleted = true;
        }
      }
    }
    __name(deleteHeader, "deleteHeader");
    if (utils_default.isArray(header)) {
      header.forEach(deleteHeader);
    } else {
      deleteHeader(header);
    }
    return deleted;
  }
  clear(matcher) {
    const keys = Object.keys(this);
    let i = keys.length;
    let deleted = false;
    while (i--) {
      const key = keys[i];
      if (!matcher || matchHeaderValue(this, this[key], key, matcher, true)) {
        delete this[key];
        deleted = true;
      }
    }
    return deleted;
  }
  normalize(format) {
    const self2 = this;
    const headers = {};
    utils_default.forEach(this, (value, header) => {
      const key = utils_default.findKey(headers, header);
      if (key) {
        self2[key] = normalizeValue(value);
        delete self2[header];
        return;
      }
      const normalized = format ? formatHeader(header) : String(header).trim();
      if (normalized !== header) {
        delete self2[header];
      }
      self2[normalized] = normalizeValue(value);
      headers[normalized] = true;
    });
    return this;
  }
  concat(...targets) {
    return this.constructor.concat(this, ...targets);
  }
  toJSON(asStrings) {
    const obj = /* @__PURE__ */ Object.create(null);
    utils_default.forEach(this, (value, header) => {
      value != null && value !== false && (obj[header] = asStrings && utils_default.isArray(value) ? value.join(", ") : value);
    });
    return obj;
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON()).map(([header, value]) => header + ": " + value).join("\n");
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(thing) {
    return thing instanceof this ? thing : new this(thing);
  }
  static concat(first, ...targets) {
    const computed = new this(first);
    targets.forEach((target) => computed.set(target));
    return computed;
  }
  static accessor(header) {
    const internals = this[$internals] = this[$internals] = {
      accessors: {}
    };
    const accessors = internals.accessors;
    const prototype3 = this.prototype;
    function defineAccessor(_header) {
      const lHeader = normalizeHeader(_header);
      if (!accessors[lHeader]) {
        buildAccessors(prototype3, _header);
        accessors[lHeader] = true;
      }
    }
    __name(defineAccessor, "defineAccessor");
    utils_default.isArray(header) ? header.forEach(defineAccessor) : defineAccessor(header);
    return this;
  }
};
__name(AxiosHeaders, "AxiosHeaders");
AxiosHeaders.accessor(["Content-Type", "Content-Length", "Accept", "Accept-Encoding", "User-Agent", "Authorization"]);
utils_default.reduceDescriptors(AxiosHeaders.prototype, ({ value }, key) => {
  let mapped = key[0].toUpperCase() + key.slice(1);
  return {
    get: () => value,
    set(headerValue) {
      this[mapped] = headerValue;
    }
  };
});
utils_default.freezeMethods(AxiosHeaders);
var AxiosHeaders_default = AxiosHeaders;

// ../shared/node_modules/axios/lib/core/transformData.js
function transformData(fns, response) {
  const config2 = this || defaults_default;
  const context2 = response || config2;
  const headers = AxiosHeaders_default.from(context2.headers);
  let data = context2.data;
  utils_default.forEach(fns, /* @__PURE__ */ __name(function transform(fn2) {
    data = fn2.call(config2, data, headers.normalize(), response ? response.status : void 0);
  }, "transform"));
  headers.normalize();
  return data;
}
__name(transformData, "transformData");

// ../shared/node_modules/axios/lib/cancel/isCancel.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function isCancel(value) {
  return !!(value && value.__CANCEL__);
}
__name(isCancel, "isCancel");

// ../shared/node_modules/axios/lib/cancel/CanceledError.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function CanceledError(message, config2, request) {
  AxiosError_default.call(this, message == null ? "canceled" : message, AxiosError_default.ERR_CANCELED, config2, request);
  this.name = "CanceledError";
}
__name(CanceledError, "CanceledError");
utils_default.inherits(CanceledError, AxiosError_default, {
  __CANCEL__: true
});
var CanceledError_default = CanceledError;

// ../shared/node_modules/axios/lib/adapters/adapters.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/adapters/xhr.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/core/settle.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function settle(resolve, reject, response) {
  const validateStatus2 = response.config.validateStatus;
  if (!response.status || !validateStatus2 || validateStatus2(response.status)) {
    resolve(response);
  } else {
    reject(new AxiosError_default(
      "Request failed with status code " + response.status,
      [AxiosError_default.ERR_BAD_REQUEST, AxiosError_default.ERR_BAD_RESPONSE][Math.floor(response.status / 100) - 4],
      response.config,
      response.request,
      response
    ));
  }
}
__name(settle, "settle");

// ../shared/node_modules/axios/lib/helpers/parseProtocol.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function parseProtocol(url) {
  const match = /^([-+\w]{1,25})(:?\/\/|:)/.exec(url);
  return match && match[1] || "";
}
__name(parseProtocol, "parseProtocol");

// ../shared/node_modules/axios/lib/helpers/progressEventReducer.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/speedometer.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function speedometer(samplesCount, min) {
  samplesCount = samplesCount || 10;
  const bytes = new Array(samplesCount);
  const timestamps = new Array(samplesCount);
  let head = 0;
  let tail = 0;
  let firstSampleTS;
  min = min !== void 0 ? min : 1e3;
  return /* @__PURE__ */ __name(function push(chunkLength) {
    const now = Date.now();
    const startedAt = timestamps[tail];
    if (!firstSampleTS) {
      firstSampleTS = now;
    }
    bytes[head] = chunkLength;
    timestamps[head] = now;
    let i = tail;
    let bytesCount = 0;
    while (i !== head) {
      bytesCount += bytes[i++];
      i = i % samplesCount;
    }
    head = (head + 1) % samplesCount;
    if (head === tail) {
      tail = (tail + 1) % samplesCount;
    }
    if (now - firstSampleTS < min) {
      return;
    }
    const passed = startedAt && now - startedAt;
    return passed ? Math.round(bytesCount * 1e3 / passed) : void 0;
  }, "push");
}
__name(speedometer, "speedometer");
var speedometer_default = speedometer;

// ../shared/node_modules/axios/lib/helpers/throttle.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function throttle(fn2, freq) {
  let timestamp = 0;
  let threshold = 1e3 / freq;
  let lastArgs;
  let timer;
  const invoke = /* @__PURE__ */ __name((args, now = Date.now()) => {
    timestamp = now;
    lastArgs = null;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    fn2.apply(null, args);
  }, "invoke");
  const throttled = /* @__PURE__ */ __name((...args) => {
    const now = Date.now();
    const passed = now - timestamp;
    if (passed >= threshold) {
      invoke(args, now);
    } else {
      lastArgs = args;
      if (!timer) {
        timer = setTimeout(() => {
          timer = null;
          invoke(lastArgs);
        }, threshold - passed);
      }
    }
  }, "throttled");
  const flush = /* @__PURE__ */ __name(() => lastArgs && invoke(lastArgs), "flush");
  return [throttled, flush];
}
__name(throttle, "throttle");
var throttle_default = throttle;

// ../shared/node_modules/axios/lib/helpers/progressEventReducer.js
var progressEventReducer = /* @__PURE__ */ __name((listener, isDownloadStream, freq = 3) => {
  let bytesNotified = 0;
  const _speedometer = speedometer_default(50, 250);
  return throttle_default((e2) => {
    const loaded = e2.loaded;
    const total = e2.lengthComputable ? e2.total : void 0;
    const progressBytes = loaded - bytesNotified;
    const rate = _speedometer(progressBytes);
    const inRange = loaded <= total;
    bytesNotified = loaded;
    const data = {
      loaded,
      total,
      progress: total ? loaded / total : void 0,
      bytes: progressBytes,
      rate: rate ? rate : void 0,
      estimated: rate && total && inRange ? (total - loaded) / rate : void 0,
      event: e2,
      lengthComputable: total != null,
      [isDownloadStream ? "download" : "upload"]: true
    };
    listener(data);
  }, freq);
}, "progressEventReducer");
var progressEventDecorator = /* @__PURE__ */ __name((total, throttled) => {
  const lengthComputable = total != null;
  return [(loaded) => throttled[0]({
    lengthComputable,
    total,
    loaded
  }), throttled[1]];
}, "progressEventDecorator");
var asyncDecorator = /* @__PURE__ */ __name((fn2) => (...args) => utils_default.asap(() => fn2(...args)), "asyncDecorator");

// ../shared/node_modules/axios/lib/helpers/resolveConfig.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/isURLSameOrigin.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var isURLSameOrigin_default = platform_default.hasStandardBrowserEnv ? ((origin2, isMSIE) => (url) => {
  url = new URL(url, platform_default.origin);
  return origin2.protocol === url.protocol && origin2.host === url.host && (isMSIE || origin2.port === url.port);
})(
  new URL(platform_default.origin),
  platform_default.navigator && /(msie|trident)/i.test(platform_default.navigator.userAgent)
) : () => true;

// ../shared/node_modules/axios/lib/helpers/cookies.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var cookies_default = platform_default.hasStandardBrowserEnv ? (
  // Standard browser envs support document.cookie
  {
    write(name, value, expires, path, domain2, secure) {
      const cookie = [name + "=" + encodeURIComponent(value)];
      utils_default.isNumber(expires) && cookie.push("expires=" + new Date(expires).toGMTString());
      utils_default.isString(path) && cookie.push("path=" + path);
      utils_default.isString(domain2) && cookie.push("domain=" + domain2);
      secure === true && cookie.push("secure");
      document.cookie = cookie.join("; ");
    },
    read(name) {
      const match = document.cookie.match(new RegExp("(^|;\\s*)(" + name + ")=([^;]*)"));
      return match ? decodeURIComponent(match[3]) : null;
    },
    remove(name) {
      this.write(name, "", Date.now() - 864e5);
    }
  }
) : (
  // Non-standard browser env (web workers, react-native) lack needed support.
  {
    write() {
    },
    read() {
      return null;
    },
    remove() {
    }
  }
);

// ../shared/node_modules/axios/lib/core/buildFullPath.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/isAbsoluteURL.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function isAbsoluteURL(url) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url);
}
__name(isAbsoluteURL, "isAbsoluteURL");

// ../shared/node_modules/axios/lib/helpers/combineURLs.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function combineURLs(baseURL, relativeURL) {
  return relativeURL ? baseURL.replace(/\/?\/$/, "") + "/" + relativeURL.replace(/^\/+/, "") : baseURL;
}
__name(combineURLs, "combineURLs");

// ../shared/node_modules/axios/lib/core/buildFullPath.js
function buildFullPath(baseURL, requestedURL) {
  if (baseURL && !isAbsoluteURL(requestedURL)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
__name(buildFullPath, "buildFullPath");

// ../shared/node_modules/axios/lib/core/mergeConfig.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var headersToObject = /* @__PURE__ */ __name((thing) => thing instanceof AxiosHeaders_default ? { ...thing } : thing, "headersToObject");
function mergeConfig(config1, config2) {
  config2 = config2 || {};
  const config3 = {};
  function getMergedValue(target, source, prop, caseless) {
    if (utils_default.isPlainObject(target) && utils_default.isPlainObject(source)) {
      return utils_default.merge.call({ caseless }, target, source);
    } else if (utils_default.isPlainObject(source)) {
      return utils_default.merge({}, source);
    } else if (utils_default.isArray(source)) {
      return source.slice();
    }
    return source;
  }
  __name(getMergedValue, "getMergedValue");
  function mergeDeepProperties(a, b, prop, caseless) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(a, b, prop, caseless);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a, prop, caseless);
    }
  }
  __name(mergeDeepProperties, "mergeDeepProperties");
  function valueFromConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    }
  }
  __name(valueFromConfig2, "valueFromConfig2");
  function defaultToConfig2(a, b) {
    if (!utils_default.isUndefined(b)) {
      return getMergedValue(void 0, b);
    } else if (!utils_default.isUndefined(a)) {
      return getMergedValue(void 0, a);
    }
  }
  __name(defaultToConfig2, "defaultToConfig2");
  function mergeDirectKeys(a, b, prop) {
    if (prop in config2) {
      return getMergedValue(a, b);
    } else if (prop in config1) {
      return getMergedValue(void 0, a);
    }
  }
  __name(mergeDirectKeys, "mergeDirectKeys");
  const mergeMap = {
    url: valueFromConfig2,
    method: valueFromConfig2,
    data: valueFromConfig2,
    baseURL: defaultToConfig2,
    transformRequest: defaultToConfig2,
    transformResponse: defaultToConfig2,
    paramsSerializer: defaultToConfig2,
    timeout: defaultToConfig2,
    timeoutMessage: defaultToConfig2,
    withCredentials: defaultToConfig2,
    withXSRFToken: defaultToConfig2,
    adapter: defaultToConfig2,
    responseType: defaultToConfig2,
    xsrfCookieName: defaultToConfig2,
    xsrfHeaderName: defaultToConfig2,
    onUploadProgress: defaultToConfig2,
    onDownloadProgress: defaultToConfig2,
    decompress: defaultToConfig2,
    maxContentLength: defaultToConfig2,
    maxBodyLength: defaultToConfig2,
    beforeRedirect: defaultToConfig2,
    transport: defaultToConfig2,
    httpAgent: defaultToConfig2,
    httpsAgent: defaultToConfig2,
    cancelToken: defaultToConfig2,
    socketPath: defaultToConfig2,
    responseEncoding: defaultToConfig2,
    validateStatus: mergeDirectKeys,
    headers: (a, b, prop) => mergeDeepProperties(headersToObject(a), headersToObject(b), prop, true)
  };
  utils_default.forEach(Object.keys(Object.assign({}, config1, config2)), /* @__PURE__ */ __name(function computeConfigValue(prop) {
    const merge2 = mergeMap[prop] || mergeDeepProperties;
    const configValue = merge2(config1[prop], config2[prop], prop);
    utils_default.isUndefined(configValue) && merge2 !== mergeDirectKeys || (config3[prop] = configValue);
  }, "computeConfigValue"));
  return config3;
}
__name(mergeConfig, "mergeConfig");

// ../shared/node_modules/axios/lib/helpers/resolveConfig.js
var resolveConfig_default = /* @__PURE__ */ __name((config2) => {
  const newConfig = mergeConfig({}, config2);
  let { data, withXSRFToken, xsrfHeaderName, xsrfCookieName, headers, auth } = newConfig;
  newConfig.headers = headers = AxiosHeaders_default.from(headers);
  newConfig.url = buildURL(buildFullPath(newConfig.baseURL, newConfig.url), config2.params, config2.paramsSerializer);
  if (auth) {
    headers.set(
      "Authorization",
      "Basic " + btoa((auth.username || "") + ":" + (auth.password ? unescape(encodeURIComponent(auth.password)) : ""))
    );
  }
  let contentType;
  if (utils_default.isFormData(data)) {
    if (platform_default.hasStandardBrowserEnv || platform_default.hasStandardBrowserWebWorkerEnv) {
      headers.setContentType(void 0);
    } else if ((contentType = headers.getContentType()) !== false) {
      const [type, ...tokens] = contentType ? contentType.split(";").map((token) => token.trim()).filter(Boolean) : [];
      headers.setContentType([type || "multipart/form-data", ...tokens].join("; "));
    }
  }
  if (platform_default.hasStandardBrowserEnv) {
    withXSRFToken && utils_default.isFunction(withXSRFToken) && (withXSRFToken = withXSRFToken(newConfig));
    if (withXSRFToken || withXSRFToken !== false && isURLSameOrigin_default(newConfig.url)) {
      const xsrfValue = xsrfHeaderName && xsrfCookieName && cookies_default.read(xsrfCookieName);
      if (xsrfValue) {
        headers.set(xsrfHeaderName, xsrfValue);
      }
    }
  }
  return newConfig;
}, "default");

// ../shared/node_modules/axios/lib/adapters/xhr.js
var isXHRAdapterSupported = typeof XMLHttpRequest !== "undefined";
var xhr_default = isXHRAdapterSupported && function(config2) {
  return new Promise(/* @__PURE__ */ __name(function dispatchXhrRequest(resolve, reject) {
    const _config = resolveConfig_default(config2);
    let requestData = _config.data;
    const requestHeaders = AxiosHeaders_default.from(_config.headers).normalize();
    let { responseType, onUploadProgress, onDownloadProgress } = _config;
    let onCanceled;
    let uploadThrottled, downloadThrottled;
    let flushUpload, flushDownload;
    function done() {
      flushUpload && flushUpload();
      flushDownload && flushDownload();
      _config.cancelToken && _config.cancelToken.unsubscribe(onCanceled);
      _config.signal && _config.signal.removeEventListener("abort", onCanceled);
    }
    __name(done, "done");
    let request = new XMLHttpRequest();
    request.open(_config.method.toUpperCase(), _config.url, true);
    request.timeout = _config.timeout;
    function onloadend() {
      if (!request) {
        return;
      }
      const responseHeaders = AxiosHeaders_default.from(
        "getAllResponseHeaders" in request && request.getAllResponseHeaders()
      );
      const responseData = !responseType || responseType === "text" || responseType === "json" ? request.responseText : request.response;
      const response = {
        data: responseData,
        status: request.status,
        statusText: request.statusText,
        headers: responseHeaders,
        config: config2,
        request
      };
      settle(/* @__PURE__ */ __name(function _resolve(value) {
        resolve(value);
        done();
      }, "_resolve"), /* @__PURE__ */ __name(function _reject(err) {
        reject(err);
        done();
      }, "_reject"), response);
      request = null;
    }
    __name(onloadend, "onloadend");
    if ("onloadend" in request) {
      request.onloadend = onloadend;
    } else {
      request.onreadystatechange = /* @__PURE__ */ __name(function handleLoad() {
        if (!request || request.readyState !== 4) {
          return;
        }
        if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf("file:") === 0)) {
          return;
        }
        setTimeout(onloadend);
      }, "handleLoad");
    }
    request.onabort = /* @__PURE__ */ __name(function handleAbort() {
      if (!request) {
        return;
      }
      reject(new AxiosError_default("Request aborted", AxiosError_default.ECONNABORTED, config2, request));
      request = null;
    }, "handleAbort");
    request.onerror = /* @__PURE__ */ __name(function handleError() {
      reject(new AxiosError_default("Network Error", AxiosError_default.ERR_NETWORK, config2, request));
      request = null;
    }, "handleError");
    request.ontimeout = /* @__PURE__ */ __name(function handleTimeout() {
      let timeoutErrorMessage = _config.timeout ? "timeout of " + _config.timeout + "ms exceeded" : "timeout exceeded";
      const transitional2 = _config.transitional || transitional_default;
      if (_config.timeoutErrorMessage) {
        timeoutErrorMessage = _config.timeoutErrorMessage;
      }
      reject(new AxiosError_default(
        timeoutErrorMessage,
        transitional2.clarifyTimeoutError ? AxiosError_default.ETIMEDOUT : AxiosError_default.ECONNABORTED,
        config2,
        request
      ));
      request = null;
    }, "handleTimeout");
    requestData === void 0 && requestHeaders.setContentType(null);
    if ("setRequestHeader" in request) {
      utils_default.forEach(requestHeaders.toJSON(), /* @__PURE__ */ __name(function setRequestHeader(val, key) {
        request.setRequestHeader(key, val);
      }, "setRequestHeader"));
    }
    if (!utils_default.isUndefined(_config.withCredentials)) {
      request.withCredentials = !!_config.withCredentials;
    }
    if (responseType && responseType !== "json") {
      request.responseType = _config.responseType;
    }
    if (onDownloadProgress) {
      [downloadThrottled, flushDownload] = progressEventReducer(onDownloadProgress, true);
      request.addEventListener("progress", downloadThrottled);
    }
    if (onUploadProgress && request.upload) {
      [uploadThrottled, flushUpload] = progressEventReducer(onUploadProgress);
      request.upload.addEventListener("progress", uploadThrottled);
      request.upload.addEventListener("loadend", flushUpload);
    }
    if (_config.cancelToken || _config.signal) {
      onCanceled = /* @__PURE__ */ __name((cancel) => {
        if (!request) {
          return;
        }
        reject(!cancel || cancel.type ? new CanceledError_default(null, config2, request) : cancel);
        request.abort();
        request = null;
      }, "onCanceled");
      _config.cancelToken && _config.cancelToken.subscribe(onCanceled);
      if (_config.signal) {
        _config.signal.aborted ? onCanceled() : _config.signal.addEventListener("abort", onCanceled);
      }
    }
    const protocol = parseProtocol(_config.url);
    if (protocol && platform_default.protocols.indexOf(protocol) === -1) {
      reject(new AxiosError_default("Unsupported protocol " + protocol + ":", AxiosError_default.ERR_BAD_REQUEST, config2));
      return;
    }
    request.send(requestData || null);
  }, "dispatchXhrRequest"));
};

// ../shared/node_modules/axios/lib/adapters/fetch.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/helpers/composeSignals.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var composeSignals = /* @__PURE__ */ __name((signals, timeout) => {
  const { length } = signals = signals ? signals.filter(Boolean) : [];
  if (timeout || length) {
    let controller = new AbortController();
    let aborted;
    const onabort = /* @__PURE__ */ __name(function(reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(err instanceof AxiosError_default ? err : new CanceledError_default(err instanceof Error ? err.message : err));
      }
    }, "onabort");
    let timer = timeout && setTimeout(() => {
      timer = null;
      onabort(new AxiosError_default(`timeout ${timeout} of ms exceeded`, AxiosError_default.ETIMEDOUT));
    }, timeout);
    const unsubscribe = /* @__PURE__ */ __name(() => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach((signal2) => {
          signal2.unsubscribe ? signal2.unsubscribe(onabort) : signal2.removeEventListener("abort", onabort);
        });
        signals = null;
      }
    }, "unsubscribe");
    signals.forEach((signal2) => signal2.addEventListener("abort", onabort));
    const { signal } = controller;
    signal.unsubscribe = () => utils_default.asap(unsubscribe);
    return signal;
  }
}, "composeSignals");
var composeSignals_default = composeSignals;

// ../shared/node_modules/axios/lib/helpers/trackStream.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var streamChunk = /* @__PURE__ */ __name(function* (chunk, chunkSize) {
  let len = chunk.byteLength;
  if (!chunkSize || len < chunkSize) {
    yield chunk;
    return;
  }
  let pos = 0;
  let end;
  while (pos < len) {
    end = pos + chunkSize;
    yield chunk.slice(pos, end);
    pos = end;
  }
}, "streamChunk");
var readBytes = /* @__PURE__ */ __name(async function* (iterable, chunkSize) {
  for await (const chunk of readStream(iterable)) {
    yield* streamChunk(chunk, chunkSize);
  }
}, "readBytes");
var readStream = /* @__PURE__ */ __name(async function* (stream) {
  if (stream[Symbol.asyncIterator]) {
    yield* stream;
    return;
  }
  const reader = stream.getReader();
  try {
    for (; ; ) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      yield value;
    }
  } finally {
    await reader.cancel();
  }
}, "readStream");
var trackStream = /* @__PURE__ */ __name((stream, chunkSize, onProgress, onFinish) => {
  const iterator = readBytes(stream, chunkSize);
  let bytes = 0;
  let done;
  let _onFinish = /* @__PURE__ */ __name((e2) => {
    if (!done) {
      done = true;
      onFinish && onFinish(e2);
    }
  }, "_onFinish");
  return new ReadableStream({
    async pull(controller) {
      try {
        const { done: done2, value } = await iterator.next();
        if (done2) {
          _onFinish();
          controller.close();
          return;
        }
        let len = value.byteLength;
        if (onProgress) {
          let loadedBytes = bytes += len;
          onProgress(loadedBytes);
        }
        controller.enqueue(new Uint8Array(value));
      } catch (err) {
        _onFinish(err);
        throw err;
      }
    },
    cancel(reason) {
      _onFinish(reason);
      return iterator.return();
    }
  }, {
    highWaterMark: 2
  });
}, "trackStream");

// ../shared/node_modules/axios/lib/adapters/fetch.js
var isFetchSupported = typeof fetch === "function" && typeof Request === "function" && typeof Response === "function";
var isReadableStreamSupported = isFetchSupported && typeof ReadableStream === "function";
var encodeText = isFetchSupported && (typeof TextEncoder === "function" ? ((encoder) => (str) => encoder.encode(str))(new TextEncoder()) : async (str) => new Uint8Array(await new Response(str).arrayBuffer()));
var test = /* @__PURE__ */ __name((fn2, ...args) => {
  try {
    return !!fn2(...args);
  } catch (e2) {
    return false;
  }
}, "test");
var supportsRequestStream = isReadableStreamSupported && test(() => {
  let duplexAccessed = false;
  const hasContentType = new Request(platform_default.origin, {
    body: new ReadableStream(),
    method: "POST",
    get duplex() {
      duplexAccessed = true;
      return "half";
    }
  }).headers.has("Content-Type");
  return duplexAccessed && !hasContentType;
});
var DEFAULT_CHUNK_SIZE = 64 * 1024;
var supportsResponseStream = isReadableStreamSupported && test(() => utils_default.isReadableStream(new Response("").body));
var resolvers = {
  stream: supportsResponseStream && ((res) => res.body)
};
isFetchSupported && ((res) => {
  ["text", "arrayBuffer", "blob", "formData", "stream"].forEach((type) => {
    !resolvers[type] && (resolvers[type] = utils_default.isFunction(res[type]) ? (res2) => res2[type]() : (_, config2) => {
      throw new AxiosError_default(`Response type '${type}' is not supported`, AxiosError_default.ERR_NOT_SUPPORT, config2);
    });
  });
})(new Response());
var getBodyLength = /* @__PURE__ */ __name(async (body) => {
  if (body == null) {
    return 0;
  }
  if (utils_default.isBlob(body)) {
    return body.size;
  }
  if (utils_default.isSpecCompliantForm(body)) {
    const _request = new Request(platform_default.origin, {
      method: "POST",
      body
    });
    return (await _request.arrayBuffer()).byteLength;
  }
  if (utils_default.isArrayBufferView(body) || utils_default.isArrayBuffer(body)) {
    return body.byteLength;
  }
  if (utils_default.isURLSearchParams(body)) {
    body = body + "";
  }
  if (utils_default.isString(body)) {
    return (await encodeText(body)).byteLength;
  }
}, "getBodyLength");
var resolveBodyLength = /* @__PURE__ */ __name(async (headers, body) => {
  const length = utils_default.toFiniteNumber(headers.getContentLength());
  return length == null ? getBodyLength(body) : length;
}, "resolveBodyLength");
var fetch_default = isFetchSupported && (async (config2) => {
  let {
    url,
    method,
    data,
    signal,
    cancelToken,
    timeout,
    onDownloadProgress,
    onUploadProgress,
    responseType,
    headers,
    withCredentials = "same-origin",
    fetchOptions
  } = resolveConfig_default(config2);
  responseType = responseType ? (responseType + "").toLowerCase() : "text";
  let composedSignal = composeSignals_default([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
  let request;
  const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
    composedSignal.unsubscribe();
  });
  let requestContentLength;
  try {
    if (onUploadProgress && supportsRequestStream && method !== "get" && method !== "head" && (requestContentLength = await resolveBodyLength(headers, data)) !== 0) {
      let _request = new Request(url, {
        method: "POST",
        body: data,
        duplex: "half"
      });
      let contentTypeHeader;
      if (utils_default.isFormData(data) && (contentTypeHeader = _request.headers.get("content-type"))) {
        headers.setContentType(contentTypeHeader);
      }
      if (_request.body) {
        const [onProgress, flush] = progressEventDecorator(
          requestContentLength,
          progressEventReducer(asyncDecorator(onUploadProgress))
        );
        data = trackStream(_request.body, DEFAULT_CHUNK_SIZE, onProgress, flush);
      }
    }
    if (!utils_default.isString(withCredentials)) {
      withCredentials = withCredentials ? "include" : "omit";
    }
    const isCredentialsSupported = "credentials" in Request.prototype;
    request = new Request(url, {
      ...fetchOptions,
      signal: composedSignal,
      method: method.toUpperCase(),
      headers: headers.normalize().toJSON(),
      body: data,
      duplex: "half",
      credentials: isCredentialsSupported ? withCredentials : void 0
    });
    let response = await fetch(request);
    const isStreamResponse = supportsResponseStream && (responseType === "stream" || responseType === "response");
    if (supportsResponseStream && (onDownloadProgress || isStreamResponse && unsubscribe)) {
      const options = {};
      ["status", "statusText", "headers"].forEach((prop) => {
        options[prop] = response[prop];
      });
      const responseContentLength = utils_default.toFiniteNumber(response.headers.get("content-length"));
      const [onProgress, flush] = onDownloadProgress && progressEventDecorator(
        responseContentLength,
        progressEventReducer(asyncDecorator(onDownloadProgress), true)
      ) || [];
      response = new Response(
        trackStream(response.body, DEFAULT_CHUNK_SIZE, onProgress, () => {
          flush && flush();
          unsubscribe && unsubscribe();
        }),
        options
      );
    }
    responseType = responseType || "text";
    let responseData = await resolvers[utils_default.findKey(resolvers, responseType) || "text"](response, config2);
    !isStreamResponse && unsubscribe && unsubscribe();
    return await new Promise((resolve, reject) => {
      settle(resolve, reject, {
        data: responseData,
        headers: AxiosHeaders_default.from(response.headers),
        status: response.status,
        statusText: response.statusText,
        config: config2,
        request
      });
    });
  } catch (err) {
    unsubscribe && unsubscribe();
    if (err && err.name === "TypeError" && /fetch/i.test(err.message)) {
      throw Object.assign(
        new AxiosError_default("Network Error", AxiosError_default.ERR_NETWORK, config2, request),
        {
          cause: err.cause || err
        }
      );
    }
    throw AxiosError_default.from(err, err && err.code, config2, request);
  }
});

// ../shared/node_modules/axios/lib/adapters/adapters.js
var knownAdapters = {
  http: null_default,
  xhr: xhr_default,
  fetch: fetch_default
};
utils_default.forEach(knownAdapters, (fn2, value) => {
  if (fn2) {
    try {
      Object.defineProperty(fn2, "name", { value });
    } catch (e2) {
    }
    Object.defineProperty(fn2, "adapterName", { value });
  }
});
var renderReason = /* @__PURE__ */ __name((reason) => `- ${reason}`, "renderReason");
var isResolvedHandle = /* @__PURE__ */ __name((adapter) => utils_default.isFunction(adapter) || adapter === null || adapter === false, "isResolvedHandle");
var adapters_default = {
  getAdapter: (adapters) => {
    adapters = utils_default.isArray(adapters) ? adapters : [adapters];
    const { length } = adapters;
    let nameOrAdapter;
    let adapter;
    const rejectedReasons = {};
    for (let i = 0; i < length; i++) {
      nameOrAdapter = adapters[i];
      let id;
      adapter = nameOrAdapter;
      if (!isResolvedHandle(nameOrAdapter)) {
        adapter = knownAdapters[(id = String(nameOrAdapter)).toLowerCase()];
        if (adapter === void 0) {
          throw new AxiosError_default(`Unknown adapter '${id}'`);
        }
      }
      if (adapter) {
        break;
      }
      rejectedReasons[id || "#" + i] = adapter;
    }
    if (!adapter) {
      const reasons = Object.entries(rejectedReasons).map(
        ([id, state]) => `adapter ${id} ` + (state === false ? "is not supported by the environment" : "is not available in the build")
      );
      let s = length ? reasons.length > 1 ? "since :\n" + reasons.map(renderReason).join("\n") : " " + renderReason(reasons[0]) : "as no adapter specified";
      throw new AxiosError_default(
        `There is no suitable adapter to dispatch the request ` + s,
        "ERR_NOT_SUPPORT"
      );
    }
    return adapter;
  },
  adapters: knownAdapters
};

// ../shared/node_modules/axios/lib/core/dispatchRequest.js
function throwIfCancellationRequested(config2) {
  if (config2.cancelToken) {
    config2.cancelToken.throwIfRequested();
  }
  if (config2.signal && config2.signal.aborted) {
    throw new CanceledError_default(null, config2);
  }
}
__name(throwIfCancellationRequested, "throwIfCancellationRequested");
function dispatchRequest(config2) {
  throwIfCancellationRequested(config2);
  config2.headers = AxiosHeaders_default.from(config2.headers);
  config2.data = transformData.call(
    config2,
    config2.transformRequest
  );
  if (["post", "put", "patch"].indexOf(config2.method) !== -1) {
    config2.headers.setContentType("application/x-www-form-urlencoded", false);
  }
  const adapter = adapters_default.getAdapter(config2.adapter || defaults_default.adapter);
  return adapter(config2).then(/* @__PURE__ */ __name(function onAdapterResolution(response) {
    throwIfCancellationRequested(config2);
    response.data = transformData.call(
      config2,
      config2.transformResponse,
      response
    );
    response.headers = AxiosHeaders_default.from(response.headers);
    return response;
  }, "onAdapterResolution"), /* @__PURE__ */ __name(function onAdapterRejection(reason) {
    if (!isCancel(reason)) {
      throwIfCancellationRequested(config2);
      if (reason && reason.response) {
        reason.response.data = transformData.call(
          config2,
          config2.transformResponse,
          reason.response
        );
        reason.response.headers = AxiosHeaders_default.from(reason.response.headers);
      }
    }
    return Promise.reject(reason);
  }, "onAdapterRejection"));
}
__name(dispatchRequest, "dispatchRequest");

// ../shared/node_modules/axios/lib/helpers/validator.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();

// ../shared/node_modules/axios/lib/env/data.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var VERSION = "1.7.9";

// ../shared/node_modules/axios/lib/helpers/validator.js
var validators = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach((type, i) => {
  validators[type] = /* @__PURE__ */ __name(function validator(thing) {
    return typeof thing === type || "a" + (i < 1 ? "n " : " ") + type;
  }, "validator");
});
var deprecatedWarnings = {};
validators.transitional = /* @__PURE__ */ __name(function transitional(validator, version2, message) {
  function formatMessage(opt, desc) {
    return "[Axios v" + VERSION + "] Transitional option '" + opt + "'" + desc + (message ? ". " + message : "");
  }
  __name(formatMessage, "formatMessage");
  return (value, opt, opts) => {
    if (validator === false) {
      throw new AxiosError_default(
        formatMessage(opt, " has been removed" + (version2 ? " in " + version2 : "")),
        AxiosError_default.ERR_DEPRECATED
      );
    }
    if (version2 && !deprecatedWarnings[opt]) {
      deprecatedWarnings[opt] = true;
      console.warn(
        formatMessage(
          opt,
          " has been deprecated since v" + version2 + " and will be removed in the near future"
        )
      );
    }
    return validator ? validator(value, opt, opts) : true;
  };
}, "transitional");
validators.spelling = /* @__PURE__ */ __name(function spelling(correctSpelling) {
  return (value, opt) => {
    console.warn(`${opt} is likely a misspelling of ${correctSpelling}`);
    return true;
  };
}, "spelling");
function assertOptions(options, schema, allowUnknown) {
  if (typeof options !== "object") {
    throw new AxiosError_default("options must be an object", AxiosError_default.ERR_BAD_OPTION_VALUE);
  }
  const keys = Object.keys(options);
  let i = keys.length;
  while (i-- > 0) {
    const opt = keys[i];
    const validator = schema[opt];
    if (validator) {
      const value = options[opt];
      const result = value === void 0 || validator(value, opt, options);
      if (result !== true) {
        throw new AxiosError_default("option " + opt + " must be " + result, AxiosError_default.ERR_BAD_OPTION_VALUE);
      }
      continue;
    }
    if (allowUnknown !== true) {
      throw new AxiosError_default("Unknown option " + opt, AxiosError_default.ERR_BAD_OPTION);
    }
  }
}
__name(assertOptions, "assertOptions");
var validator_default = {
  assertOptions,
  validators
};

// ../shared/node_modules/axios/lib/core/Axios.js
var validators2 = validator_default.validators;
var Axios = class {
  constructor(instanceConfig) {
    this.defaults = instanceConfig;
    this.interceptors = {
      request: new InterceptorManager_default(),
      response: new InterceptorManager_default()
    };
  }
  /**
   * Dispatch a request
   *
   * @param {String|Object} configOrUrl The config specific for this request (merged with this.defaults)
   * @param {?Object} config
   *
   * @returns {Promise} The Promise to be fulfilled
   */
  async request(configOrUrl, config2) {
    try {
      return await this._request(configOrUrl, config2);
    } catch (err) {
      if (err instanceof Error) {
        let dummy = {};
        Error.captureStackTrace ? Error.captureStackTrace(dummy) : dummy = new Error();
        const stack = dummy.stack ? dummy.stack.replace(/^.+\n/, "") : "";
        try {
          if (!err.stack) {
            err.stack = stack;
          } else if (stack && !String(err.stack).endsWith(stack.replace(/^.+\n.+\n/, ""))) {
            err.stack += "\n" + stack;
          }
        } catch (e2) {
        }
      }
      throw err;
    }
  }
  _request(configOrUrl, config2) {
    if (typeof configOrUrl === "string") {
      config2 = config2 || {};
      config2.url = configOrUrl;
    } else {
      config2 = configOrUrl || {};
    }
    config2 = mergeConfig(this.defaults, config2);
    const { transitional: transitional2, paramsSerializer, headers } = config2;
    if (transitional2 !== void 0) {
      validator_default.assertOptions(transitional2, {
        silentJSONParsing: validators2.transitional(validators2.boolean),
        forcedJSONParsing: validators2.transitional(validators2.boolean),
        clarifyTimeoutError: validators2.transitional(validators2.boolean)
      }, false);
    }
    if (paramsSerializer != null) {
      if (utils_default.isFunction(paramsSerializer)) {
        config2.paramsSerializer = {
          serialize: paramsSerializer
        };
      } else {
        validator_default.assertOptions(paramsSerializer, {
          encode: validators2.function,
          serialize: validators2.function
        }, true);
      }
    }
    validator_default.assertOptions(config2, {
      baseUrl: validators2.spelling("baseURL"),
      withXsrfToken: validators2.spelling("withXSRFToken")
    }, true);
    config2.method = (config2.method || this.defaults.method || "get").toLowerCase();
    let contextHeaders = headers && utils_default.merge(
      headers.common,
      headers[config2.method]
    );
    headers && utils_default.forEach(
      ["delete", "get", "head", "post", "put", "patch", "common"],
      (method) => {
        delete headers[method];
      }
    );
    config2.headers = AxiosHeaders_default.concat(contextHeaders, headers);
    const requestInterceptorChain = [];
    let synchronousRequestInterceptors = true;
    this.interceptors.request.forEach(/* @__PURE__ */ __name(function unshiftRequestInterceptors(interceptor) {
      if (typeof interceptor.runWhen === "function" && interceptor.runWhen(config2) === false) {
        return;
      }
      synchronousRequestInterceptors = synchronousRequestInterceptors && interceptor.synchronous;
      requestInterceptorChain.unshift(interceptor.fulfilled, interceptor.rejected);
    }, "unshiftRequestInterceptors"));
    const responseInterceptorChain = [];
    this.interceptors.response.forEach(/* @__PURE__ */ __name(function pushResponseInterceptors(interceptor) {
      responseInterceptorChain.push(interceptor.fulfilled, interceptor.rejected);
    }, "pushResponseInterceptors"));
    let promise;
    let i = 0;
    let len;
    if (!synchronousRequestInterceptors) {
      const chain = [dispatchRequest.bind(this), void 0];
      chain.unshift.apply(chain, requestInterceptorChain);
      chain.push.apply(chain, responseInterceptorChain);
      len = chain.length;
      promise = Promise.resolve(config2);
      while (i < len) {
        promise = promise.then(chain[i++], chain[i++]);
      }
      return promise;
    }
    len = requestInterceptorChain.length;
    let newConfig = config2;
    i = 0;
    while (i < len) {
      const onFulfilled = requestInterceptorChain[i++];
      const onRejected = requestInterceptorChain[i++];
      try {
        newConfig = onFulfilled(newConfig);
      } catch (error3) {
        onRejected.call(this, error3);
        break;
      }
    }
    try {
      promise = dispatchRequest.call(this, newConfig);
    } catch (error3) {
      return Promise.reject(error3);
    }
    i = 0;
    len = responseInterceptorChain.length;
    while (i < len) {
      promise = promise.then(responseInterceptorChain[i++], responseInterceptorChain[i++]);
    }
    return promise;
  }
  getUri(config2) {
    config2 = mergeConfig(this.defaults, config2);
    const fullPath = buildFullPath(config2.baseURL, config2.url);
    return buildURL(fullPath, config2.params, config2.paramsSerializer);
  }
};
__name(Axios, "Axios");
utils_default.forEach(["delete", "get", "head", "options"], /* @__PURE__ */ __name(function forEachMethodNoData(method) {
  Axios.prototype[method] = function(url, config2) {
    return this.request(mergeConfig(config2 || {}, {
      method,
      url,
      data: (config2 || {}).data
    }));
  };
}, "forEachMethodNoData"));
utils_default.forEach(["post", "put", "patch"], /* @__PURE__ */ __name(function forEachMethodWithData(method) {
  function generateHTTPMethod(isForm) {
    return /* @__PURE__ */ __name(function httpMethod(url, data, config2) {
      return this.request(mergeConfig(config2 || {}, {
        method,
        headers: isForm ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url,
        data
      }));
    }, "httpMethod");
  }
  __name(generateHTTPMethod, "generateHTTPMethod");
  Axios.prototype[method] = generateHTTPMethod();
  Axios.prototype[method + "Form"] = generateHTTPMethod(true);
}, "forEachMethodWithData"));
var Axios_default = Axios;

// ../shared/node_modules/axios/lib/cancel/CancelToken.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var CancelToken = class {
  constructor(executor) {
    if (typeof executor !== "function") {
      throw new TypeError("executor must be a function.");
    }
    let resolvePromise;
    this.promise = new Promise(/* @__PURE__ */ __name(function promiseExecutor(resolve) {
      resolvePromise = resolve;
    }, "promiseExecutor"));
    const token = this;
    this.promise.then((cancel) => {
      if (!token._listeners)
        return;
      let i = token._listeners.length;
      while (i-- > 0) {
        token._listeners[i](cancel);
      }
      token._listeners = null;
    });
    this.promise.then = (onfulfilled) => {
      let _resolve;
      const promise = new Promise((resolve) => {
        token.subscribe(resolve);
        _resolve = resolve;
      }).then(onfulfilled);
      promise.cancel = /* @__PURE__ */ __name(function reject() {
        token.unsubscribe(_resolve);
      }, "reject");
      return promise;
    };
    executor(/* @__PURE__ */ __name(function cancel(message, config2, request) {
      if (token.reason) {
        return;
      }
      token.reason = new CanceledError_default(message, config2, request);
      resolvePromise(token.reason);
    }, "cancel"));
  }
  /**
   * Throws a `CanceledError` if cancellation has been requested.
   */
  throwIfRequested() {
    if (this.reason) {
      throw this.reason;
    }
  }
  /**
   * Subscribe to the cancel signal
   */
  subscribe(listener) {
    if (this.reason) {
      listener(this.reason);
      return;
    }
    if (this._listeners) {
      this._listeners.push(listener);
    } else {
      this._listeners = [listener];
    }
  }
  /**
   * Unsubscribe from the cancel signal
   */
  unsubscribe(listener) {
    if (!this._listeners) {
      return;
    }
    const index = this._listeners.indexOf(listener);
    if (index !== -1) {
      this._listeners.splice(index, 1);
    }
  }
  toAbortSignal() {
    const controller = new AbortController();
    const abort2 = /* @__PURE__ */ __name((err) => {
      controller.abort(err);
    }, "abort");
    this.subscribe(abort2);
    controller.signal.unsubscribe = () => this.unsubscribe(abort2);
    return controller.signal;
  }
  /**
   * Returns an object that contains a new `CancelToken` and a function that, when called,
   * cancels the `CancelToken`.
   */
  static source() {
    let cancel;
    const token = new CancelToken(/* @__PURE__ */ __name(function executor(c) {
      cancel = c;
    }, "executor"));
    return {
      token,
      cancel
    };
  }
};
__name(CancelToken, "CancelToken");
var CancelToken_default = CancelToken;

// ../shared/node_modules/axios/lib/helpers/spread.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function spread(callback) {
  return /* @__PURE__ */ __name(function wrap(arr) {
    return callback.apply(null, arr);
  }, "wrap");
}
__name(spread, "spread");

// ../shared/node_modules/axios/lib/helpers/isAxiosError.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function isAxiosError(payload) {
  return utils_default.isObject(payload) && payload.isAxiosError === true;
}
__name(isAxiosError, "isAxiosError");

// ../shared/node_modules/axios/lib/helpers/HttpStatusCode.js
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var HttpStatusCode = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511
};
Object.entries(HttpStatusCode).forEach(([key, value]) => {
  HttpStatusCode[value] = key;
});
var HttpStatusCode_default = HttpStatusCode;

// ../shared/node_modules/axios/lib/axios.js
function createInstance(defaultConfig) {
  const context2 = new Axios_default(defaultConfig);
  const instance = bind(Axios_default.prototype.request, context2);
  utils_default.extend(instance, Axios_default.prototype, context2, { allOwnKeys: true });
  utils_default.extend(instance, context2, null, { allOwnKeys: true });
  instance.create = /* @__PURE__ */ __name(function create(instanceConfig) {
    return createInstance(mergeConfig(defaultConfig, instanceConfig));
  }, "create");
  return instance;
}
__name(createInstance, "createInstance");
var axios = createInstance(defaults_default);
axios.Axios = Axios_default;
axios.CanceledError = CanceledError_default;
axios.CancelToken = CancelToken_default;
axios.isCancel = isCancel;
axios.VERSION = VERSION;
axios.toFormData = toFormData_default;
axios.AxiosError = AxiosError_default;
axios.Cancel = axios.CanceledError;
axios.all = /* @__PURE__ */ __name(function all(promises) {
  return Promise.all(promises);
}, "all");
axios.spread = spread;
axios.isAxiosError = isAxiosError;
axios.mergeConfig = mergeConfig;
axios.AxiosHeaders = AxiosHeaders_default;
axios.formToJSON = (thing) => formDataToJSON_default(utils_default.isHTMLForm(thing) ? new FormData(thing) : thing);
axios.getAdapter = adapters_default.getAdapter;
axios.HttpStatusCode = HttpStatusCode_default;
axios.default = axios;
var axios_default = axios;

// ../shared/node_modules/axios/index.js
var {
  Axios: Axios2,
  AxiosError: AxiosError2,
  CanceledError: CanceledError2,
  isCancel: isCancel2,
  CancelToken: CancelToken2,
  VERSION: VERSION2,
  all: all2,
  Cancel,
  isAxiosError: isAxiosError2,
  spread: spread2,
  toFormData: toFormData2,
  AxiosHeaders: AxiosHeaders2,
  HttpStatusCode: HttpStatusCode2,
  formToJSON,
  getAdapter,
  mergeConfig: mergeConfig2
} = axios_default;

// ../shared/src/utils/retry.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
async function withRetry(operation, maxRetries = 3, baseDelay = 1e3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error3) {
      lastError = error3;
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt) * (0.5 + Math.random());
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
}
__name(withRetry, "withRetry");

// ../shared/src/utils/notionUtils.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var import_client = __toESM(require_src(), 1);
function truncateHash(hash2) {
  return hash2.slice(0, 8);
}
__name(truncateHash, "truncateHash");

// ../shared/src/services/notionClient.ts
async function getBookCoverUrl(title2, author) {
  try {
    const openLibraryCover = await withRetry(async () => {
      const response = await axios_default.get(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(title2)}+${encodeURIComponent(author)}&limit=1`
      );
      if (response.data?.docs?.[0]?.cover_i) {
        return `https://covers.openlibrary.org/b/id/${response.data.docs[0].cover_i}-L.jpg`;
      }
      return null;
    }, 3, 1e3);
    if (openLibraryCover) {
      return openLibraryCover;
    }
    return await withRetry(async () => {
      const response = await axios_default.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(title2)}+inauthor:${encodeURIComponent(author)}&maxResults=1`
      );
      if (response.data?.items?.[0]?.volumeInfo?.imageLinks?.thumbnail) {
        return response.data.items[0].volumeInfo.imageLinks.thumbnail.replace("zoom=1", "zoom=2");
      }
      return null;
    }, 3, 1e3);
  } catch (error3) {
    console.error("Error fetching book cover:", error3);
    return null;
  }
}
__name(getBookCoverUrl, "getBookCoverUrl");
function generateHighlightHash2(highlight, location, bookTitle, author) {
  const firstChunk = highlight[0] || "";
  const content = firstChunk + location + bookTitle + author;
  return createHash2("sha256").update(content).digest("hex").slice(0, 8);
}
__name(generateHighlightHash2, "generateHighlightHash");
function storeHashes(hashes) {
  const uniqueHashes = Array.from(new Set(
    hashes.map((h) => truncateHash(h))
  ));
  let hashString = "";
  for (const hash2 of uniqueHashes) {
    const newLength = hashString.length + hash2.length + 1;
    if (newLength > 2e3) {
      console.warn("Truncating hash list at 2000 characters");
      break;
    }
    hashString += (hashString ? "," : "") + hash2;
  }
  console.debug("Stored hashes info:", {
    originalCount: hashes.length,
    uniqueCount: uniqueHashes.length,
    storedLength: hashString.length,
    sampleHashes: uniqueHashes.slice(0, 3)
  });
  return hashString;
}
__name(storeHashes, "storeHashes");
var _client = null;
var _databaseId = null;
var _store = null;
async function setOAuthToken(store, tokenData) {
  if (!store) {
    throw new Error("[OAuth] NotionStore is required");
  }
  try {
    console.log("[OAuth] Validating token data...", {
      hasWorkspaceId: !!tokenData?.workspace_id,
      hasAccessToken: !!tokenData?.access_token,
      hasOwner: !!tokenData?.owner,
      ownerType: tokenData?.owner?.type,
      hasUserId: !!tokenData?.owner?.user?.id
    });
    if (!tokenData?.workspace_id || !tokenData?.access_token) {
      throw new Error("Invalid token data - missing required fields");
    }
    const workspaceId = tokenData.workspace_id;
    const userId = tokenData.owner?.user?.id || "";
    console.log("[OAuth] Preparing to store token...", {
      workspaceId,
      userId,
      hasDatabaseId: !!_databaseId,
      hasStore: !!store,
      storeType: store.constructor.name
    });
    console.log("[OAuth] Storing token data...");
    await store.setToken(tokenData);
    console.log("[OAuth] Updating global store reference...");
    _store = store;
    console.log("[OAuth] Initializing Notion client...");
    _client = new import_client2.Client({
      auth: tokenData.access_token
    });
    console.log("[OAuth] Searching for Kindle Highlights database...");
    await findKindleHighlightsDatabase();
    if (_databaseId) {
      console.log("[OAuth] Found database ID:", _databaseId);
      try {
        console.log("[OAuth] Storing database ID...");
        await store.setDatabaseId(workspaceId, _databaseId);
        console.log("[OAuth] Database ID storage updated");
      } catch (dbError) {
        console.error("[OAuth] Failed to store database ID:", dbError);
      }
    } else {
      console.log("[OAuth] No database ID found - continuing with token storage only");
    }
    console.log("[OAuth] OAuth flow completed successfully");
  } catch (error3) {
    const errorDetails = {
      message: error3 instanceof Error ? error3.message : "Unknown error",
      stack: error3 instanceof Error ? error3.stack : void 0,
      type: error3?.constructor?.name
    };
    console.error("[OAuth] Failed to set OAuth token:", errorDetails);
    throw error3;
  }
}
__name(setOAuthToken, "setOAuthToken");
async function getClient() {
  try {
    if (!_client && _store) {
      const workspaceId = process.env.NOTION_WORKSPACE_ID;
      if (!workspaceId) {
        throw new Error("No workspace ID configured");
      }
      const token = await _store.getToken(workspaceId);
      if (!token) {
        throw new Error("No OAuth token available");
      }
      _client = new import_client2.Client({
        auth: token.access_token
      });
      _databaseId = await _store.getDatabaseId(workspaceId);
    }
    if (!_client) {
      throw new Error("Notion client not initialized and no store available");
    }
    return _client;
  } catch (error3) {
    console.error("Failed to get Notion client:", error3);
    throw error3;
  }
}
__name(getClient, "getClient");
async function findKindleHighlightsDatabase() {
  if (!_client)
    throw new Error("Notion client not initialized");
  try {
    const response = await _client.search({
      filter: {
        property: "object",
        value: "database"
      }
    });
    for (const result of response.results) {
      if (result.object !== "database")
        continue;
      try {
        const db = await _client.databases.retrieve({ database_id: result.id });
        const props = db.properties;
        if (props.Title?.type === "title" && props.Author?.type === "rich_text" && props.Highlights?.type === "number" && props["Last Highlighted"]?.type === "date" && props["Last Synced"]?.type === "date" && props["Highlight Hash"]?.type === "rich_text") {
          _databaseId = result.id;
          break;
        }
      } catch (error3) {
        console.error("Error checking database:", error3);
      }
    }
    if (!_databaseId) {
      throw new Error("Could not find a compatible Kindle Highlights database. Please ensure you have copied the template to your workspace.");
    }
  } catch (error3) {
    console.error("Error finding database:", error3);
    throw error3;
  }
}
__name(findKindleHighlightsDatabase, "findKindleHighlightsDatabase");
async function getExistingHighlightHashes(pageId) {
  try {
    const client = await getClient();
    const page = await client.pages.retrieve({ page_id: pageId });
    if (!(0, import_client2.isFullPage)(page)) {
      return /* @__PURE__ */ new Set();
    }
    const hashProperty = page.properties["Highlight Hash"];
    if (hashProperty?.type !== "rich_text") {
      console.debug("Hash property is not rich_text type", {
        pageId,
        actualType: hashProperty?.type
      });
      return /* @__PURE__ */ new Set();
    }
    const richTextProperty = hashProperty;
    console.debug("Retrieved hash property:", {
      pageId,
      propertyType: richTextProperty.type,
      hasRichText: Array.isArray(richTextProperty.rich_text),
      firstTextType: richTextProperty.rich_text[0]?.type,
      rawContent: richTextProperty.rich_text[0]?.plain_text
    });
    if (richTextProperty.rich_text[0]?.type === "text" && richTextProperty.rich_text[0].plain_text) {
      const hashString = hashProperty.rich_text[0].plain_text;
      const hashes = new Set(hashString.split(",").filter((h) => h.trim()));
      console.debug("Parsed existing hashes:", {
        pageId,
        hashCount: hashes.size,
        sampleHashes: Array.from(hashes).slice(0, 5),
        totalHashString: hashString.length,
        hashStringPreview: hashString.substring(0, 100) + "..."
      });
      return hashes;
    }
    console.debug("No existing hashes found", { pageId });
    return /* @__PURE__ */ new Set();
  } catch (error3) {
    console.error("Error getting existing highlight hashes:", error3);
    throw error3;
  }
}
__name(getExistingHighlightHashes, "getExistingHighlightHashes");
function splitAtSentences(text, maxLength) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let currentChunk = "";
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += (currentChunk ? " " : "") + sentence;
    } else {
      if (currentChunk)
        chunks.push(currentChunk);
      currentChunk = sentence;
    }
  }
  if (currentChunk)
    chunks.push(currentChunk);
  return chunks;
}
__name(splitAtSentences, "splitAtSentences");
var NotionClient = class {
  store;
  clientId;
  clientSecret;
  redirectUri;
  constructor(config2) {
    this.store = config2.store;
    this.clientId = config2.clientId;
    this.clientSecret = config2.clientSecret;
    this.redirectUri = config2.redirectUri;
    _store = config2.store;
  }
  async exchangeCodeForToken(code) {
    if (!code) {
      throw new Error("No authorization code provided");
    }
    console.log("[NotionClient] Exchanging code for token...", {
      hasCode: !!code,
      redirectUri: this.redirectUri,
      hasClientId: !!this.clientId,
      hasClientSecret: !!this.clientSecret
    });
    try {
      const response = await axios_default.post("https://api.notion.com/v1/oauth/token", {
        grant_type: "authorization_code",
        code,
        redirect_uri: this.redirectUri
      }, {
        auth: {
          username: this.clientId,
          password: this.clientSecret
        }
      });
      console.log("[NotionClient] Received OAuth response:", {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : []
      });
      console.log("[NotionClient] Full OAuth response:", JSON.stringify(response.data, null, 2));
      const tokenData = response.data;
      const requiredFields = [
        "access_token",
        "workspace_id",
        "bot_id",
        "workspace_name",
        ["owner", "type"]
      ];
      for (const field of requiredFields) {
        if (Array.isArray(field)) {
          const [parent, child] = field;
          if (!tokenData?.[parent]?.[child]) {
            throw new Error(`Missing ${parent}.${child} in response`);
          }
        } else if (!tokenData?.[field]) {
          throw new Error(`Missing ${field} in response`);
        }
      }
      const token = {
        access_token: tokenData.access_token,
        token_type: "bearer",
        bot_id: tokenData.bot_id,
        workspace_name: tokenData.workspace_name,
        workspace_icon: tokenData.workspace_icon || null,
        workspace_id: tokenData.workspace_id,
        owner: {
          type: tokenData.owner.type,
          workspace: tokenData.owner.workspace,
          user: tokenData.owner.user
        },
        duplicated_template_id: tokenData.duplicated_template_id || null,
        request_id: tokenData.request_id,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in
      };
      console.log("[NotionClient] Constructed token object:", {
        hasAccessToken: !!token.access_token,
        workspaceId: token.workspace_id,
        workspaceName: token.workspace_name,
        ownerType: token.owner.type
      });
      console.log("[NotionClient] Storing token...");
      await setOAuthToken(this.store, token);
      console.log("[NotionClient] Token stored successfully");
      return token;
    } catch (error3) {
      console.error("Failed to exchange code for token:", error3);
      throw error3;
    }
  }
  async updateNotionDatabase(highlights, workspaceId, onProgress) {
    try {
      const client = await getClient();
      if (!_databaseId) {
        console.log("Finding Kindle Highlights database...");
        await findKindleHighlightsDatabase();
        if (!_databaseId) {
          throw new Error("Could not find Kindle Highlights database. Please ensure you have copied the template to your workspace.");
        }
        console.log("Found Kindle Highlights database:", _databaseId);
      }
      const books = highlights.reduce((acc, highlight) => {
        try {
          const highlightDate = highlight.date instanceof Date ? highlight.date : new Date(highlight.date);
          if (!acc[highlight.bookTitle]) {
            acc[highlight.bookTitle] = {
              title: highlight.bookTitle,
              author: highlight.author,
              highlights: [],
              lastHighlighted: highlightDate,
              lastSynced: /* @__PURE__ */ new Date()
            };
          }
          acc[highlight.bookTitle].highlights.push({
            ...highlight,
            date: highlightDate
          });
          if (highlightDate > acc[highlight.bookTitle].lastHighlighted) {
            acc[highlight.bookTitle].lastHighlighted = highlightDate;
          }
        } catch (error3) {
          console.error("Error processing highlight:", error3);
        }
        return acc;
      }, {});
      for (const book of Object.values(books)) {
        try {
          const { results } = await client.databases.query({
            database_id: _databaseId,
            filter: {
              property: "Title",
              title: {
                equals: book.title
              }
            }
          });
          const existingPageId = results.length > 0 ? results[0].id : void 0;
          const existingHashes = existingPageId ? await getExistingHighlightHashes(existingPageId) : /* @__PURE__ */ new Set();
          const coverUrl = await getBookCoverUrl(book.title, book.author);
          if (existingPageId) {
            const existingPage = await client.pages.retrieve({ page_id: existingPageId });
            let currentCount = 0;
            if ((0, import_client2.isFullPage)(existingPage) && existingPage.properties.Highlights.type === "number") {
              currentCount = existingPage.properties.Highlights.number || 0;
            }
            await client.pages.update({
              page_id: existingPageId,
              icon: coverUrl ? {
                type: "external",
                external: { url: coverUrl }
              } : void 0,
              properties: {
                Title: {
                  title: [{ text: { content: book.title } }]
                },
                Author: {
                  rich_text: [{ text: { content: book.author } }]
                },
                Highlights: {
                  number: currentCount + book.highlights.filter((h) => !existingHashes.has(h.hash)).length
                },
                "Last Highlighted": {
                  date: { start: book.lastHighlighted.toISOString() }
                },
                "Last Synced": {
                  date: { start: (/* @__PURE__ */ new Date()).toISOString() }
                },
                "Highlight Hash": {
                  rich_text: [{
                    text: {
                      content: (existingHashes.size > 0 ? [...existingHashes] : []).concat(book.highlights.map((h) => {
                        const truncatedHash = h.hash.slice(0, 8);
                        console.debug("Adding new hash:", {
                          fullHash: h.hash,
                          truncatedHash,
                          location: h.location,
                          bookTitle: book.title
                        });
                        return truncatedHash;
                      })).filter((h, i, arr) => arr.indexOf(h) === i).join(",").substring(0, 1900)
                      // Leave some buffer for Notion's limit
                    }
                  }]
                }
              }
            });
            console.debug("Deduplication check:", {
              bookTitle: book.title,
              totalHighlights: book.highlights.length,
              existingHashCount: existingHashes.size,
              sampleExistingHashes: Array.from(existingHashes).slice(0, 5)
            });
            const hashConflicts = /* @__PURE__ */ new Map();
            book.highlights.forEach((h) => {
              if (hashConflicts.has(h.hash)) {
                hashConflicts.get(h.hash).push({ location: h.location });
              } else {
                hashConflicts.set(h.hash, [{ location: h.location }]);
              }
            });
            hashConflicts.forEach((locations, hash2) => {
              if (locations.length > 1) {
                console.warn("Hash conflict in current batch:", {
                  hash: hash2,
                  bookTitle: book.title,
                  conflictCount: locations.length,
                  locations
                });
              }
            });
            const newHighlights = book.highlights.filter((h) => {
              const truncatedHash = h.hash.slice(0, 8);
              const isDuplicate = existingHashes.has(truncatedHash);
              if (isDuplicate) {
                console.debug("Found duplicate:", {
                  fullHash: h.hash,
                  truncatedHash,
                  location: h.location,
                  bookTitle: book.title
                });
              }
              if (isDuplicate) {
                console.debug("Skipping duplicate highlight:", {
                  hash: h.hash,
                  location: h.location,
                  bookTitle: book.title
                });
              }
              return !isDuplicate;
            });
            console.debug("Deduplication results:", {
              bookTitle: book.title,
              originalCount: book.highlights.length,
              newCount: newHighlights.length,
              duplicatesSkipped: book.highlights.length - newHighlights.length
            });
            const batchSize = 100;
            for (let i = 0; i < newHighlights.length; i += batchSize) {
              onProgress?.();
              const batchHighlights = newHighlights.slice(i, i + batchSize);
              const blocks = batchHighlights.flatMap((highlight) => {
                const highlightText = Array.isArray(highlight.highlight) ? highlight.highlight.join("\n\n") : highlight.highlight;
                const chunks = splitAtSentences(highlightText, 2e3);
                return [
                  ...chunks.map((chunk, index) => ({
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                      rich_text: [
                        {
                          type: "text",
                          text: { content: chunk }
                        },
                        ...index === chunks.length - 1 ? [{
                          type: "text",
                          text: {
                            content: `
\u{1F4CD} Location: ${highlight.location} | \u{1F4C5} Added: ${highlight.date.toLocaleString()}`
                          },
                          annotations: {
                            color: "gray"
                          }
                        }] : []
                      ]
                    }
                  })),
                  {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                      rich_text: []
                    }
                  }
                ];
              });
              if (blocks.length > 0) {
                await client.blocks.children.append({
                  block_id: existingPageId,
                  children: blocks
                });
              }
            }
          } else {
            const newPage = await client.pages.create({
              parent: { database_id: _databaseId },
              icon: coverUrl ? {
                type: "external",
                external: { url: coverUrl }
              } : void 0,
              properties: {
                Title: {
                  title: [{ text: { content: book.title } }]
                },
                Author: {
                  rich_text: [{ text: { content: book.author } }]
                },
                Highlights: {
                  number: book.highlights.length
                },
                "Last Highlighted": {
                  date: { start: book.lastHighlighted.toISOString() }
                },
                "Last Synced": {
                  date: { start: (/* @__PURE__ */ new Date()).toISOString() }
                },
                "Highlight Hash": {
                  rich_text: [{
                    text: {
                      content: storeHashes(
                        book.highlights.map((h) => {
                          const fullHash = h.hash || generateHighlightHash2(h.highlight, h.location, h.bookTitle, h.author);
                          return fullHash.slice(0, 8);
                        })
                      )
                    }
                  }]
                }
              }
            });
            const blocks = book.highlights.flatMap((highlight) => {
              const highlightText = Array.isArray(highlight.highlight) ? highlight.highlight.join("\n\n") : highlight.highlight;
              const chunks = splitAtSentences(highlightText, 2e3);
              return [
                ...chunks.map((chunk, index) => ({
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: [
                      {
                        type: "text",
                        text: { content: chunk }
                      },
                      ...index === chunks.length - 1 ? [{
                        type: "text",
                        text: {
                          content: `
\u{1F4CD} Location: ${highlight.location} | \u{1F4C5} Added: ${highlight.date.toLocaleString()}`
                        },
                        annotations: {
                          color: "gray"
                        }
                      }] : []
                    ]
                  }
                })),
                {
                  object: "block",
                  type: "paragraph",
                  paragraph: {
                    rich_text: []
                  }
                }
              ];
            });
            if (blocks.length > 0) {
              await client.blocks.children.append({
                block_id: newPage.id,
                children: blocks
              });
            }
          }
        } catch (error3) {
          console.error("Error processing book:", book.title, error3);
        }
      }
    } catch (error3) {
      console.error("Error updating Notion database:", error3);
      throw error3;
    }
  }
};
__name(NotionClient, "NotionClient");

// ../shared/src/services/kvStore.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var KVStoreError = class extends Error {
  constructor(message, operation, key, cause) {
    super(message);
    this.operation = operation;
    this.key = key;
    this.cause = cause;
    this.name = "KVStoreError";
  }
};
__name(KVStoreError, "KVStoreError");
var MemoryKVStore = class {
  store = /* @__PURE__ */ new Map();
  expirations = /* @__PURE__ */ new Map();
  async get(key) {
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.store.delete(key);
      this.expirations.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }
  async set(key, value, options) {
    this.store.set(key, value);
    if (options?.expirationTtl) {
      this.expirations.set(key, Date.now() + options.expirationTtl * 1e3);
    }
  }
  async delete(key) {
    this.store.delete(key);
    this.expirations.delete(key);
  }
  async increment(key) {
    const value = await this.get(key);
    const newValue = (parseInt(value || "0", 10) + 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }
  async decrement(key) {
    const value = await this.get(key);
    const newValue = Math.max(0, parseInt(value || "0", 10) - 1).toString();
    await this.set(key, newValue);
    return parseInt(newValue, 10);
  }
};
__name(MemoryKVStore, "MemoryKVStore");
var CloudflareKVStore = class {
  constructor(kv) {
    this.kv = kv;
  }
  async get(key) {
    if (!this.kv || typeof this.kv.get !== "function") {
      console.error("[KVStore] KV namespace is invalid:", this.kv);
      throw new KVStoreError("Invalid KV namespace", "get", key);
    }
    try {
      console.log("[KVStore] Getting value for key:", key);
      const value = await this.kv.get(key);
      console.log("[KVStore] Retrieved value:", {
        key,
        hasValue: value !== null,
        valueLength: value?.length
      });
      return value;
    } catch (error3) {
      const message = error3 instanceof Error ? error3.message : "Unknown error";
      console.error(`[KVStore] Error getting key ${key}:`, message);
      throw new KVStoreError(`Failed to get KV value: ${message}`, "get", key, error3);
    }
  }
  async set(key, value, options) {
    if (!this.kv || typeof this.kv.put !== "function") {
      console.error("[KVStore] KV namespace is invalid:", this.kv);
      throw new KVStoreError("Invalid KV namespace", "set", key);
    }
    try {
      console.log("[KVStore] Setting value:", { key, valueLength: value.length });
      await this.kv.put(key, value, options);
      console.log("[KVStore] Successfully set value for key:", key);
    } catch (error3) {
      const message = error3 instanceof Error ? error3.message : "Unknown error";
      console.error(`[KVStore] Error setting key ${key}:`, message);
      throw new KVStoreError(`Failed to set KV value: ${message}`, "set", key, error3);
    }
  }
  async delete(key) {
    try {
      await this.kv.delete(key);
    } catch (error3) {
      const message = error3 instanceof Error ? error3.message : "Unknown error";
      console.error(`[KVStore] Error deleting key ${key}:`, message);
      throw new KVStoreError(`Failed to delete KV value: ${message}`, "delete", key, error3);
    }
  }
  async increment(key) {
    try {
      const value = await this.get(key);
      const newValue = (parseInt(value || "0", 10) + 1).toString();
      await this.set(key, newValue);
      return parseInt(newValue, 10);
    } catch (error3) {
      const message = error3 instanceof Error ? error3.message : "Unknown error";
      throw new KVStoreError(`Failed to increment KV value: ${message}`, "increment", key, error3);
    }
  }
  async decrement(key) {
    try {
      const value = await this.get(key);
      const newValue = Math.max(0, parseInt(value || "0", 10) - 1).toString();
      await this.set(key, newValue);
      return parseInt(newValue, 10);
    } catch (error3) {
      const message = error3 instanceof Error ? error3.message : "Unknown error";
      throw new KVStoreError(`Failed to decrement KV value: ${message}`, "decrement", key, error3);
    }
  }
};
__name(CloudflareKVStore, "CloudflareKVStore");
function createKVStore(kv) {
  console.log("[KVStore] Creating KV store:", {
    hasKV: !!kv,
    type: kv ? "CloudflareKVStore" : "MemoryKVStore"
  });
  if (kv && (!kv.get || !kv.put || !kv.delete)) {
    console.error("[KVStore] Invalid KV namespace provided:", kv);
    throw new Error("Invalid KV namespace: missing required methods");
  }
  const store = kv ? new CloudflareKVStore(kv) : new MemoryKVStore();
  console.log("[KVStore] Successfully created store");
  return store;
}
__name(createKVStore, "createKVStore");

// ../shared/src/services/syncService.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var DEFAULT_CONFIG = {
  batchSize: 10,
  batchDelay: 200,
  maxRetries: 3,
  maxHighlightsPerRun: 1e3,
  onProgress: async () => {
  }
};
var SyncService = class {
  config;
  notionClient;
  constructor(notionClient, config2 = {}) {
    this.notionClient = notionClient;
    this.config = { ...DEFAULT_CONFIG, ...config2 };
  }
  async deduplicateHighlights(highlights, workspaceId) {
    const bookHighlights = /* @__PURE__ */ new Map();
    for (const highlight of highlights) {
      if (!bookHighlights.has(highlight.bookTitle)) {
        bookHighlights.set(highlight.bookTitle, []);
      }
      bookHighlights.get(highlight.bookTitle).push(highlight);
    }
    const uniqueHighlights = [];
    for (const [bookTitle, bookHighlightList] of bookHighlights.entries()) {
      const newHighlightHashes = new Set(
        bookHighlightList.map((h) => truncateHash(h.hash))
      );
      uniqueHighlights.push(...bookHighlightList);
    }
    return uniqueHighlights;
  }
  async processHighlights(highlights, workspaceId, signal) {
    const total = highlights.length;
    if (total === 0)
      return;
    for (let i = 0; i < highlights.length; i += this.config.batchSize) {
      if (signal?.aborted) {
        throw new Error("Processing aborted");
      }
      const batch = highlights.slice(i, Math.min(i + this.config.batchSize, highlights.length));
      await withRetry(async () => {
        await this.notionClient.updateNotionDatabase(batch, workspaceId);
        const processed = i + batch.length;
        const progress = Math.round(processed / total * 100);
        await this.config.onProgress(
          progress,
          `Processing ${processed}/${total} highlights`
        );
      }, this.config.maxRetries);
      await new Promise((resolve) => setTimeout(resolve, this.config.batchDelay));
    }
  }
  async parseAndValidateContent(fileContent) {
    const highlights = await parseClippings(fileContent);
    if (highlights.length === 0) {
      throw new Error("No highlights found in file");
    }
    return highlights;
  }
  async syncHighlights(fileContent, workspaceId, signal) {
    const highlights = await this.parseAndValidateContent(fileContent);
    const uniqueHighlights = await this.deduplicateHighlights(highlights, workspaceId);
    await this.processHighlights(uniqueHighlights, workspaceId, signal);
    return {
      processed: uniqueHighlights.length,
      total: highlights.length,
      message: `Processed ${uniqueHighlights.length} unique highlights out of ${highlights.length} total`
    };
  }
};
__name(SyncService, "SyncService");

// src/services/kvJobStore.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var KVJobStore = class {
  constructor(jobStore) {
    this.jobStore = jobStore;
    if (!jobStore) {
      throw new Error("KVJobStore requires a valid KVNamespace");
    }
  }
  async createJob(params) {
    try {
      console.log("Creating new job...", {
        userId: params.userId,
        workspaceId: params.workspaceId,
        fileKey: params.fileKey
      });
      if (!params.userId || !params.workspaceId || !params.fileKey) {
        throw new Error("Missing required job parameters");
      }
      const jobId = crypto.randomUUID();
      const job = {
        id: jobId,
        userId: params.userId,
        workspaceId: params.workspaceId,
        fileKey: params.fileKey,
        status: "pending",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        expiresAt: params.expiresAt
      };
      console.log("Storing job data...", { jobId });
      await this.jobStore.put(jobId, JSON.stringify(job));
      const userJobListKey = `user:${params.userId}:jobs`;
      console.log("Updating user job list...", { userJobListKey });
      const userJobs = await this.getUserJobs(params.userId);
      userJobs.push(jobId);
      await this.jobStore.put(userJobListKey, JSON.stringify(userJobs));
      console.log("Job created successfully", { jobId });
      return job;
    } catch (error3) {
      console.error("Failed to create job:", {
        error: error3 instanceof Error ? error3.message : "Unknown error",
        stack: error3 instanceof Error ? error3.stack : void 0,
        params
      });
      throw error3;
    }
  }
  async getJob(jobId) {
    try {
      console.log("Fetching job...", { jobId });
      if (!jobId) {
        throw new Error("Job ID is required");
      }
      const jobStr = await this.jobStore.get(jobId);
      if (!jobStr) {
        console.log("Job not found", { jobId });
        return null;
      }
      try {
        const job = JSON.parse(jobStr);
        console.log("Job fetched successfully", {
          jobId,
          status: job.status,
          updatedAt: new Date(job.updatedAt).toISOString()
        });
        return job;
      } catch (parseError) {
        console.error("Failed to parse job data:", {
          jobId,
          error: parseError instanceof Error ? parseError.message : "Unknown error",
          jobStr
        });
        throw new Error("Invalid job data format");
      }
    } catch (error3) {
      console.error("Error fetching job:", {
        jobId,
        error: error3 instanceof Error ? error3.message : "Unknown error",
        stack: error3 instanceof Error ? error3.stack : void 0
      });
      throw error3;
    }
  }
  async updateJob(jobId, updates) {
    try {
      console.log("Updating job...", { jobId, updates });
      const job = await this.getJob(jobId);
      if (!job) {
        console.log("Job not found for update", { jobId });
        return null;
      }
      const updatedJob = {
        ...job,
        ...updates,
        updatedAt: Date.now()
      };
      await this.jobStore.put(jobId, JSON.stringify(updatedJob));
      console.log("Job updated successfully", { jobId, status: updatedJob.status });
      return updatedJob;
    } catch (error3) {
      console.error("Failed to update job:", {
        jobId,
        error: error3 instanceof Error ? error3.message : "Unknown error",
        stack: error3 instanceof Error ? error3.stack : void 0,
        updates
      });
      throw error3;
    }
  }
  async listJobs(userId, status) {
    try {
      console.log("Listing jobs...", { userId, status });
      const userJobs = await this.getUserJobs(userId);
      const jobs = [];
      for (const jobId of userJobs) {
        try {
          const job = await this.getJob(jobId);
          if (job && (!status || job.status === status)) {
            jobs.push(job);
          }
        } catch (error3) {
          console.error("Error fetching job in list:", { jobId, error: error3 });
          continue;
        }
      }
      console.log("Jobs listed successfully", {
        userId,
        status,
        count: jobs.length
      });
      return jobs;
    } catch (error3) {
      console.error("Failed to list jobs:", {
        userId,
        error: error3 instanceof Error ? error3.message : "Unknown error",
        stack: error3 instanceof Error ? error3.stack : void 0
      });
      throw error3;
    }
  }
  async cleanupJobs() {
    try {
      console.log("Starting job cleanup...");
      const { keys } = await this.jobStore.list();
      const now = Date.now();
      let cleanedCount = 0;
      for (const key of keys) {
        try {
          if (key.name.startsWith("user:"))
            continue;
          const jobStr = await this.jobStore.get(key.name);
          if (!jobStr)
            continue;
          const job = JSON.parse(jobStr);
          if (job.expiresAt && job.expiresAt < now || (job.status === "completed" || job.status === "failed") && job.updatedAt < now - 24 * 60 * 60 * 1e3) {
            await this.jobStore.delete(key.name);
            const userJobListKey = `user:${job.userId}:jobs`;
            const userJobs = await this.getUserJobs(job.userId);
            const updatedJobs = userJobs.filter((id) => id !== job.id);
            await this.jobStore.put(userJobListKey, JSON.stringify(updatedJobs));
            cleanedCount++;
          }
        } catch (error3) {
          console.error("Error cleaning up job:", {
            key: key.name,
            error: error3 instanceof Error ? error3.message : "Unknown error"
          });
          continue;
        }
      }
      console.log("Job cleanup completed", { cleanedCount });
      return cleanedCount;
    } catch (error3) {
      console.error("Failed to cleanup jobs:", {
        error: error3 instanceof Error ? error3.message : "Unknown error",
        stack: error3 instanceof Error ? error3.stack : void 0
      });
      throw error3;
    }
  }
  async getUserJobs(userId) {
    try {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const userJobListKey = `user:${userId}:jobs`;
      const jobList = await this.jobStore.get(userJobListKey);
      return jobList ? JSON.parse(jobList) : [];
    } catch (error3) {
      console.error("Failed to get user jobs:", {
        userId,
        error: error3 instanceof Error ? error3.message : "Unknown error",
        stack: error3 instanceof Error ? error3.stack : void 0
      });
      throw error3;
    }
  }
};
__name(KVJobStore, "KVJobStore");

// src/services/oauthCallbackService.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var OAuthCallbackService = class {
  jobStore;
  notionClient;
  env;
  constructor(env3) {
    this.env = env3;
    if (!env3.OAUTH_STORE) {
      throw new Error("OAUTH_STORE KV namespace is not bound");
    }
    if (!env3.JOB_STORE) {
      throw new Error("JOB_STORE KV namespace is not bound");
    }
    if (!env3.NOTION_CLIENT_ID) {
      throw new Error("NOTION_CLIENT_ID is not configured");
    }
    if (!env3.NOTION_CLIENT_SECRET) {
      throw new Error("NOTION_CLIENT_SECRET is not configured");
    }
    if (!env3.NOTION_REDIRECT_URI) {
      throw new Error("NOTION_REDIRECT_URI is not configured");
    }
    console.log("Initializing OAuthCallbackService...", {
      hasOauthStore: !!env3.OAUTH_STORE,
      hasJobStore: !!env3.JOB_STORE,
      redirectUri: env3.NOTION_REDIRECT_URI
    });
    try {
      this.jobStore = new KVJobStore(env3.JOB_STORE);
      if (!env3.OAUTH_STORE) {
        throw new Error("OAUTH_STORE is undefined");
      }
      const kvStore = createKVStore(env3.OAUTH_STORE);
      if (!kvStore) {
        throw new Error("Failed to create KV store");
      }
      const notionStore = new NotionStore(kvStore);
      if (!notionStore) {
        throw new Error("Failed to create Notion store");
      }
      this.notionClient = new NotionClient({
        store: notionStore,
        clientId: env3.NOTION_CLIENT_ID,
        clientSecret: env3.NOTION_CLIENT_SECRET,
        redirectUri: env3.NOTION_REDIRECT_URI
      });
      console.log("OAuthCallbackService initialized successfully");
    } catch (error3) {
      console.error("Failed to initialize OAuthCallbackService:", error3);
      throw error3;
    }
  }
  async handleCallback(code) {
    try {
      console.log("Starting OAuth callback handling...");
      console.log("Exchanging code for token...");
      const tokenData = await this.notionClient.exchangeCodeForToken(code);
      console.log("Validating token data...");
      if (!tokenData?.access_token) {
        throw new Error("Missing access_token in token data");
      }
      if (!tokenData?.workspace_id) {
        throw new Error("Missing workspace_id in token data");
      }
      if (!tokenData?.owner) {
        throw new Error("Missing owner in token data");
      }
      console.log("Extracting user ID...");
      let userId = "unknown";
      if (tokenData.owner.type === "user" && tokenData.owner.user?.id) {
        userId = tokenData.owner.user.id;
      } else {
        console.log("No user ID found in token data, using default:", userId);
      }
      console.log("Creating sync job...");
      const jobParams = {
        userId,
        workspaceId: tokenData.workspace_id,
        fileKey: `pending-${tokenData.workspace_id}`,
        expiresAt: Date.now() + 24 * 60 * 60 * 1e3
        // 24 hours
      };
      const job = await this.jobStore.createJob(jobParams);
      console.log("Job created:", job.id);
      console.log("Building redirect URL...");
      const clientUrl = new URL(this.env.CLIENT_URL || "http://localhost:5173");
      clientUrl.searchParams.set("syncStatus", "queued");
      clientUrl.searchParams.set("jobId", job.id);
      const redirectUrl = clientUrl.toString();
      console.log("Redirecting to:", redirectUrl);
      return { redirectUrl };
    } catch (error3) {
      console.error("OAuth callback error:", {
        error: error3 instanceof Error ? error3.message : "Unknown error",
        stack: error3 instanceof Error ? error3.stack : void 0
      });
      throw error3;
    }
  }
};
__name(OAuthCallbackService, "OAuthCallbackService");

// src/services/jobStore.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
var JobStore = class {
  state;
  jobs;
  constructor(state) {
    this.state = state;
    this.jobs = /* @__PURE__ */ new Map();
    this.initialize();
  }
  // Initialize state from storage
  async initialize() {
    const stored = await this.state.storage.list();
    for (const [key, value] of stored) {
      this.jobs.set(key, value);
    }
  }
  async fetch(request) {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/create":
        return this.handleCreateJob(request);
      case "/status":
        return this.handleGetStatus(request);
      case "/update":
        return this.handleUpdateJob(request);
      case "/list":
        return this.handleListJobs(request);
      case "/cleanup":
        return this.handleCleanupJobs();
      default:
        return new Response("Not found", { status: 404 });
    }
  }
  async handleCreateJob(request) {
    const { userId, workspaceId, fileKey, expiresAt } = await request.json();
    const jobId = crypto.randomUUID();
    const job = {
      id: jobId,
      userId,
      workspaceId,
      fileKey,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      expiresAt
    };
    this.jobs.set(jobId, job);
    await this.state.storage.put(jobId, job);
    return new Response(JSON.stringify(job), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async handleGetStatus(request) {
    const jobId = new URL(request.url).searchParams.get("id");
    if (!jobId) {
      return new Response("Missing job ID", { status: 400 });
    }
    const job = await this.state.storage.get(jobId);
    if (!job) {
      return new Response("Job not found", { status: 404 });
    }
    return new Response(JSON.stringify(job), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async handleUpdateJob(request) {
    const { id, status, progress, error: error3 } = await request.json();
    if (!id) {
      return new Response("Missing job ID", { status: 400 });
    }
    const job = await this.state.storage.get(id);
    if (!job) {
      return new Response("Job not found", { status: 404 });
    }
    const updatedJob = {
      ...job,
      status: status || job.status,
      progress: progress ?? job.progress,
      error: error3 ?? job.error,
      updatedAt: Date.now()
    };
    this.jobs.set(id, updatedJob);
    await this.state.storage.put(id, updatedJob);
    return new Response(JSON.stringify(updatedJob), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async handleListJobs(request) {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let filteredJobs = Array.from(this.jobs.values());
    if (status) {
      filteredJobs = filteredJobs.filter((job) => job.status === status);
    }
    return new Response(JSON.stringify(filteredJobs), {
      headers: { "Content-Type": "application/json" }
    });
  }
  async handleCleanupJobs() {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.expiresAt && job.expiresAt < now || (job.status === "completed" || job.status === "failed") && job.updatedAt < now - 24 * 60 * 60 * 1e3) {
        this.jobs.delete(jobId);
        await this.state.storage.delete(jobId);
        cleanedCount++;
      }
    }
    return new Response(JSON.stringify({ cleaned: cleanedCount }), {
      headers: { "Content-Type": "application/json" }
    });
  }
};
__name(JobStore, "JobStore");

// src/index.ts
var BATCH_SIZE2 = 10;
var JOB_EXPIRY = 24 * 60 * 60 * 1e3;
var router = e();
var validateApiKey = /* @__PURE__ */ __name((request, env3) => {
  const apiKey = request instanceof Request ? request.headers.get("x-api-key") : request.headers["x-api-key"];
  if (!apiKey || apiKey !== env3.WORKER_API_KEY) {
    return errorResponse("Invalid or missing API key", 401);
  }
}, "validateApiKey");
var errorResponse = /* @__PURE__ */ __name((message, status = 500) => new Response(JSON.stringify({ error: message }), {
  status,
  headers: { "Content-Type": "application/json" }
}), "errorResponse");
var successResponse = /* @__PURE__ */ __name((data) => new Response(JSON.stringify(data), {
  headers: { "Content-Type": "application/json" }
}), "successResponse");
function validateEnvironment(env3) {
  const errors = [];
  const required = [
    "NOTION_CLIENT_ID",
    "NOTION_CLIENT_SECRET",
    "NOTION_REDIRECT_URI"
  ];
  for (const key of required) {
    if (!env3[key]) {
      errors.push(`Missing ${key}`);
    }
  }
  return errors;
}
__name(validateEnvironment, "validateEnvironment");
router.get("/health", (_, env3) => {
  const envErrors = validateEnvironment(env3);
  const r2Status = env3.HIGHLIGHTS_BUCKET ? "connected" : "error";
  const kvStatus = env3.OAUTH_STORE ? "connected" : "error";
  return successResponse({
    status: "ok",
    time: (/* @__PURE__ */ new Date()).toISOString(),
    services: {
      r2: r2Status,
      kv: kvStatus,
      doStatus: "connected"
    },
    envStatus: envErrors.length === 0 ? "valid" : "invalid",
    envErrors
  });
});
router.post("/test-webhook", async (request) => {
  try {
    const data = await request.json();
    return successResponse({
      received: true,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      payload: data
    });
  } catch (error3) {
    return errorResponse("Invalid JSON payload");
  }
});
router.post("/upload", async (request, env3) => {
  console.log("Processing upload request...");
  const authError = validateApiKey(request, env3);
  if (authError)
    return authError;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const userId = formData.get("userId");
    const workspaceId = formData.get("workspaceId");
    console.log("Received upload request:", {
      fileName: file?.name,
      userId,
      workspaceId
    });
    if (!file || !userId || !workspaceId) {
      return errorResponse("Missing required fields: file, userId, or workspaceId", 400);
    }
    if (!file.name.endsWith(".txt")) {
      return errorResponse("Invalid file type. Only .txt files are allowed.", 400);
    }
    const fileKey = `uploads/${userId}/${crypto.randomUUID()}.txt`;
    console.log("Storing file in R2:", fileKey);
    await env3.HIGHLIGHTS_BUCKET.put(fileKey, file.stream(), {
      customMetadata: {
        userId,
        workspaceId,
        originalName: file.name,
        uploadTime: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    console.log("File stored successfully, creating job...");
    const jobStore = new KVJobStore(env3.JOB_STORE);
    const job = await jobStore.createJob({
      userId,
      fileKey,
      workspaceId,
      expiresAt: Date.now() + JOB_EXPIRY
    });
    console.log("Job created successfully:", job.id);
    return successResponse(job);
  } catch (error3) {
    console.error("Upload error:", error3);
    return errorResponse("Upload failed: " + (error3 instanceof Error ? error3.message : "Unknown error"));
  }
});
router.post("/sync", async (request, env3) => {
  console.log("Processing sync request...");
  try {
    const { jobId, userId } = await request.json();
    if (!jobId || !userId) {
      return errorResponse("Missing jobId or userId", 400);
    }
    console.log("Processing sync for job:", jobId, "user:", userId);
    const jobStore = new KVJobStore(env3.JOB_STORE);
    const kvStore = createKVStore(env3.OAUTH_STORE);
    const notionStore = new NotionStore(kvStore);
    console.log("Fetching job status...");
    const job = await jobStore.getJob(jobId);
    if (!job) {
      return errorResponse("Job not found", 404);
    }
    if (!job.fileKey || !job.workspaceId) {
      return errorResponse("Invalid job state", 400);
    }
    console.log("Job details:", {
      id: job.id,
      status: job.status,
      progress: job.progress
    });
    const authError = validateApiKey(request, env3);
    if (authError)
      return authError;
    if (job.expiresAt && job.expiresAt < Date.now()) {
      console.log("Job expired:", job.id);
      await jobStore.updateJob(jobId, { status: "expired" });
      return errorResponse("Job has expired", 400);
    }
    try {
      console.log("Updating job status to processing...");
      await jobStore.updateJob(jobId, { status: "processing" });
      console.log("Fetching file from R2:", job.fileKey);
      const file = await env3.HIGHLIGHTS_BUCKET.get(job.fileKey);
      if (!file) {
        throw new Error("File not found in R2");
      }
      console.log("Parsing highlights...");
      const text = await file.text();
      const highlights = await parseClippings(text);
      console.log(`Found ${highlights.length} highlights`);
      if (highlights.length === 0) {
        throw new Error("No highlights found in file");
      }
      console.log("Initializing services...");
      const notionClient = new NotionClient({
        store: notionStore,
        clientId: env3.NOTION_CLIENT_ID,
        clientSecret: env3.NOTION_CLIENT_SECRET,
        redirectUri: env3.NOTION_REDIRECT_URI
      });
      const syncService = new SyncService(notionClient, {
        batchSize: BATCH_SIZE2,
        batchDelay: 100,
        onProgress: async (progress, message) => {
          console.log(message);
          await jobStore.updateJob(jobId, { progress: Math.min(progress, 100) });
        }
      });
      console.log("Processing highlights...");
      await syncService.syncHighlights(text, job.workspaceId);
      console.log("Marking job as completed...");
      await jobStore.updateJob(jobId, {
        status: "completed",
        completedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return successResponse({
        status: "success",
        jobId,
        totalHighlights: highlights.length
      });
    } catch (error3) {
      console.error("Sync error:", error3);
      await jobStore.updateJob(jobId, {
        status: "failed",
        error: error3 instanceof Error ? error3.message : "Unknown error"
      });
      return errorResponse("Sync failed: " + (error3 instanceof Error ? error3.message : "Unknown error"));
    }
  } catch (error3) {
    console.error("Request error:", error3);
    return errorResponse("Invalid request");
  }
});
router.get("/oauth/callback", async (request, env3) => {
  const code = Array.isArray(request.query?.code) ? request.query.code[0] : request.query?.code;
  const state = Array.isArray(request.query?.state) ? request.query.state[0] : request.query?.state;
  if (!code || !state) {
    return errorResponse("Missing code or state parameter", 400);
  }
  try {
    const oauthService = new OAuthCallbackService(env3);
    const { redirectUrl } = await oauthService.handleCallback(code);
    return new Response(null, {
      status: 302,
      headers: {
        "Location": redirectUrl
      }
    });
  } catch (error3) {
    console.error("OAuth callback error:", error3);
    return errorResponse("OAuth callback failed: " + (error3 instanceof Error ? error3.message : "Unknown error"));
  }
});
var errorHandler = /* @__PURE__ */ __name(async (error3) => {
  console.error("Unhandled error:", error3);
  return errorResponse("Internal server error");
}, "errorHandler");
async function handleScheduled(env3, ctx, type) {
  console.log(`Running scheduled ${type}...`);
  const jobStore = new KVJobStore(env3.JOB_STORE);
  if (type === "sync") {
    console.log("Fetching pending jobs...");
    const jobs = await jobStore.listJobs("", "pending");
    console.log(`Found ${jobs.length} pending jobs`);
    for (const job of jobs) {
      console.log(`Scheduling job ${job.id} for processing...`);
      ctx.waitUntil(
        fetch(`https://${env3.WORKER_HOST}/sync`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobId: job.id,
            userId: job.userId
          })
        })
      );
    }
  } else if (type === "cleanup") {
    console.log("Running job cleanup...");
    const cleanedCount = await jobStore.cleanupJobs();
    console.log("Cleanup complete:", { cleaned: cleanedCount });
  }
}
__name(handleScheduled, "handleScheduled");
var src_default = {
  async fetch(request, env3, ctx) {
    try {
      return await router.handle(request, env3, ctx);
    } catch (error3) {
      return errorHandler(error3);
    }
  },
  // Handle scheduled events
  async scheduled(controller, env3, ctx) {
    const cronPattern = controller.cron;
    const taskType = cronPattern === "0 0 * * *" ? "cleanup" : "sync";
    await handleScheduled(env3, ctx, taskType);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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
    } catch (e2) {
      console.error("Failed to drain the unused request body.", e2);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_virtual_unenv_global_polyfill_process();
init_virtual_unenv_global_polyfill_performance();
init_virtual_unenv_global_polyfill_console();
init_virtual_unenv_global_polyfill_set_immediate();
init_virtual_unenv_global_polyfill_clear_immediate();
function reduceError(e2) {
  return {
    name: e2?.name,
    message: e2?.message ?? String(e2),
    stack: e2?.stack,
    cause: e2?.cause === void 0 ? void 0 : reduceError(e2.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env3, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env3);
  } catch (e2) {
    const error3 = reduceError(e2);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-b47iRy/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-b47iRy/middleware-loader.entry.ts
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
  JobStore,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
