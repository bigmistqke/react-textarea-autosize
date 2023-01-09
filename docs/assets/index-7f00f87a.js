true&&(function polyfill() {
    const relList = document.createElement('link').relList;
    if (relList && relList.supports && relList.supports('modulepreload')) {
        return;
    }
    for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
        processPreload(link);
    }
    new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type !== 'childList') {
                continue;
            }
            for (const node of mutation.addedNodes) {
                if (node.tagName === 'LINK' && node.rel === 'modulepreload')
                    processPreload(node);
            }
        }
    }).observe(document, { childList: true, subtree: true });
    function getFetchOpts(script) {
        const fetchOpts = {};
        if (script.integrity)
            fetchOpts.integrity = script.integrity;
        if (script.referrerpolicy)
            fetchOpts.referrerPolicy = script.referrerpolicy;
        if (script.crossorigin === 'use-credentials')
            fetchOpts.credentials = 'include';
        else if (script.crossorigin === 'anonymous')
            fetchOpts.credentials = 'omit';
        else
            fetchOpts.credentials = 'same-origin';
        return fetchOpts;
    }
    function processPreload(link) {
        if (link.ep)
            // ep marker = processed
            return;
        link.ep = true;
        // prepopulate the load record
        const fetchOpts = getFetchOpts(link);
        fetch(link.href, fetchOpts);
    }
}());

const sharedConfig$1 = {};

const equalFn$1 = (a, b) => a === b;
const signalOptions$1 = {
  equals: equalFn$1
};
let runEffects$1 = runQueue$1;
const STALE$1 = 1;
const PENDING$1 = 2;
const UNOWNED$1 = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner$1 = null;
let Transition$1 = null;
let Listener$1 = null;
let Updates$1 = null;
let Effects$1 = null;
let ExecCount$1 = 0;
function createRoot(fn, detachedOwner) {
  const listener = Listener$1,
        owner = Owner$1,
        unowned = fn.length === 0,
        root = unowned ? UNOWNED$1 : {
    owned: null,
    cleanups: null,
    context: null,
    owner: detachedOwner || owner
  },
        updateFn = unowned ? fn : () => fn(() => untrack$1(() => cleanNode$1(root)));
  Owner$1 = root;
  Listener$1 = null;
  try {
    return runUpdates$1(updateFn, true);
  } finally {
    Listener$1 = listener;
    Owner$1 = owner;
  }
}
function createSignal$1(value, options) {
  options = options ? Object.assign({}, signalOptions$1, options) : signalOptions$1;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || undefined
  };
  const setter = value => {
    if (typeof value === "function") {
      value = value(s.value);
    }
    return writeSignal$1(s, value);
  };
  return [readSignal$1.bind(s), setter];
}
function createRenderEffect$1(fn, value, options) {
  const c = createComputation$1(fn, value, false, STALE$1);
  updateComputation$1(c);
}
function untrack$1(fn) {
  const listener = Listener$1;
  Listener$1 = null;
  try {
    return fn();
  } finally {
    Listener$1 = listener;
  }
}
function readSignal$1() {
  const runningTransition = Transition$1 ;
  if (this.sources && (this.state || runningTransition )) {
    if (this.state === STALE$1 || runningTransition ) updateComputation$1(this);else {
      const updates = Updates$1;
      Updates$1 = null;
      runUpdates$1(() => lookUpstream$1(this), false);
      Updates$1 = updates;
    }
  }
  if (Listener$1) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener$1.sources) {
      Listener$1.sources = [this];
      Listener$1.sourceSlots = [sSlot];
    } else {
      Listener$1.sources.push(this);
      Listener$1.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener$1];
      this.observerSlots = [Listener$1.sources.length - 1];
    } else {
      this.observers.push(Listener$1);
      this.observerSlots.push(Listener$1.sources.length - 1);
    }
  }
  return this.value;
}
function writeSignal$1(node, value, isComp) {
  let current = node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates$1(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition$1 && Transition$1.running;
          if (TransitionRunning && Transition$1.disposed.has(o)) ;
          if (TransitionRunning && !o.tState || !TransitionRunning && !o.state) {
            if (o.pure) Updates$1.push(o);else Effects$1.push(o);
            if (o.observers) markDownstream$1(o);
          }
          if (TransitionRunning) ;else o.state = STALE$1;
        }
        if (Updates$1.length > 10e5) {
          Updates$1 = [];
          if (false) ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation$1(node) {
  if (!node.fn) return;
  cleanNode$1(node);
  const owner = Owner$1,
        listener = Listener$1,
        time = ExecCount$1;
  Listener$1 = Owner$1 = node;
  runComputation$1(node, node.value, time);
  Listener$1 = listener;
  Owner$1 = owner;
}
function runComputation$1(node, value, time) {
  let nextValue;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) node.state = STALE$1;
    handleError$1(err);
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal$1(node, nextValue);
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation$1(fn, init, pure, state = STALE$1, options) {
  const c = {
    fn,
    state: state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner$1,
    context: null,
    pure
  };
  if (Owner$1 === null) ;else if (Owner$1 !== UNOWNED$1) {
    {
      if (!Owner$1.owned) Owner$1.owned = [c];else Owner$1.owned.push(c);
    }
  }
  return c;
}
function runTop$1(node) {
  const runningTransition = Transition$1 ;
  if (node.state === 0 || runningTransition ) return;
  if (node.state === PENDING$1 || runningTransition ) return lookUpstream$1(node);
  if (node.suspense && untrack$1(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount$1)) {
    if (node.state || runningTransition ) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (node.state === STALE$1 || runningTransition ) {
      updateComputation$1(node);
    } else if (node.state === PENDING$1 || runningTransition ) {
      const updates = Updates$1;
      Updates$1 = null;
      runUpdates$1(() => lookUpstream$1(node, ancestors[0]), false);
      Updates$1 = updates;
    }
  }
}
function runUpdates$1(fn, init) {
  if (Updates$1) return fn();
  let wait = false;
  if (!init) Updates$1 = [];
  if (Effects$1) wait = true;else Effects$1 = [];
  ExecCount$1++;
  try {
    const res = fn();
    completeUpdates$1(wait);
    return res;
  } catch (err) {
    if (!Updates$1) Effects$1 = null;
    handleError$1(err);
  }
}
function completeUpdates$1(wait) {
  if (Updates$1) {
    runQueue$1(Updates$1);
    Updates$1 = null;
  }
  if (wait) return;
  const e = Effects$1;
  Effects$1 = null;
  if (e.length) runUpdates$1(() => runEffects$1(e), false);
}
function runQueue$1(queue) {
  for (let i = 0; i < queue.length; i++) runTop$1(queue[i]);
}
function lookUpstream$1(node, ignore) {
  const runningTransition = Transition$1 ;
  node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      if (source.state === STALE$1 || runningTransition ) {
        if (source !== ignore) runTop$1(source);
      } else if (source.state === PENDING$1 || runningTransition ) lookUpstream$1(source, ignore);
    }
  }
}
function markDownstream$1(node) {
  const runningTransition = Transition$1 ;
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (!o.state || runningTransition ) {
      o.state = PENDING$1;
      if (o.pure) Updates$1.push(o);else Effects$1.push(o);
      o.observers && markDownstream$1(o);
    }
  }
}
function cleanNode$1(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(),
            index = node.sourceSlots.pop(),
            obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(),
              s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.owned) {
    for (i = 0; i < node.owned.length; i++) cleanNode$1(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
    node.cleanups = null;
  }
  node.state = 0;
  node.context = null;
}
function castError$1(err) {
  if (err instanceof Error || typeof err === "string") return err;
  return new Error("Unknown error");
}
function handleError$1(err) {
  err = castError$1(err);
  throw err;
}
function createComponent(Comp, props) {
  return untrack$1(() => Comp(props || {}));
}

function reconcileArrays$1(parentNode, a, b) {
  let bLength = b.length,
      aEnd = a.length,
      bEnd = bLength,
      aStart = 0,
      bStart = 0,
      after = a[aEnd - 1].nextSibling,
      map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart,
              sequence = 1,
              t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}

const $$EVENTS$1 = "_$DX_DELEGATE";
function render(code, element, init, options = {}) {
  let disposer;
  createRoot(dispose => {
    disposer = dispose;
    element === document ? code() : insert(element, code(), element.firstChild ? null : undefined, init);
  }, options.owner);
  return () => {
    disposer();
    element.textContent = "";
  };
}
function template$1(html, check, isSVG) {
  const t = document.createElement("template");
  t.innerHTML = html;
  let node = t.content.firstChild;
  if (isSVG) node = node.firstChild;
  return node;
}
function delegateEvents$1(eventNames, document = window.document) {
  const e = document[$$EVENTS$1] || (document[$$EVENTS$1] = new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document.addEventListener(name, eventHandler$1);
    }
  }
}
function insert(parent, accessor, marker, initial) {
  if (marker !== undefined && !initial) initial = [];
  if (typeof accessor !== "function") return insertExpression$1(parent, accessor, initial, marker);
  createRenderEffect$1(current => insertExpression$1(parent, accessor(), current, marker), initial);
}
function eventHandler$1(e) {
  const key = `$$${e.type}`;
  let node = e.composedPath && e.composedPath()[0] || e.target;
  if (e.target !== node) {
    Object.defineProperty(e, "target", {
      configurable: true,
      value: node
    });
  }
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  if (sharedConfig$1.registry && !sharedConfig$1.done) {
    sharedConfig$1.done = true;
    document.querySelectorAll("[id^=pl-]").forEach(elem => elem.remove());
  }
  while (node) {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node = node._$host || node.parentNode || node.host;
  }
}
function insertExpression$1(parent, value, current, marker, unwrapArray) {
  if (sharedConfig$1.context && !current) current = [...parent.childNodes];
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value,
        multi = marker !== undefined;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string" || t === "number") {
    if (sharedConfig$1.context) return current;
    if (t === "number") value = value.toString();
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data = value;
      } else node = document.createTextNode(value);
      current = cleanChildren$1(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    if (sharedConfig$1.context) return current;
    current = cleanChildren$1(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect$1(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression$1(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray$1(array, value, current, unwrapArray)) {
      createRenderEffect$1(() => current = insertExpression$1(parent, array, current, marker, true));
      return () => current;
    }
    if (sharedConfig$1.context) {
      if (!array.length) return current;
      for (let i = 0; i < array.length; i++) {
        if (array[i].parentNode) return current = array;
      }
    }
    if (array.length === 0) {
      current = cleanChildren$1(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes$1(parent, array, marker);
      } else reconcileArrays$1(parent, current, array);
    } else {
      current && cleanChildren$1(parent);
      appendNodes$1(parent, array);
    }
    current = array;
  } else if (value instanceof Node) {
    if (sharedConfig$1.context && value.parentNode) return current = multi ? [value] : value;
    if (Array.isArray(current)) {
      if (multi) return current = cleanChildren$1(parent, current, marker, value);
      cleanChildren$1(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else ;
  return current;
}
function normalizeIncomingArray$1(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i],
        prev = current && current[i];
    if (item instanceof Node) {
      normalized.push(item);
    } else if (item == null || item === true || item === false) ; else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray$1(normalized, item, prev) || dynamic;
    } else if ((typeof item) === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic = normalizeIncomingArray$1(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) {
        normalized.push(prev);
      } else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes$1(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren$1(parent, current, marker, replacement) {
  if (marker === undefined) return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}

const sharedConfig = {};
function setHydrateContext(context) {
  sharedConfig.context = context;
}

const equalFn = (a, b) => a === b;
const $PROXY = Symbol("solid-proxy");
const signalOptions = {
  equals: equalFn
};
let runEffects = runQueue;
const STALE = 1;
const PENDING = 2;
const UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var Owner = null;
let Transition = null;
let Listener = null;
let Updates = null;
let Effects = null;
let ExecCount = 0;
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || undefined
  };
  const setter = value => {
    if (typeof value === "function") {
      value = value(s.value);
    }
    return writeSignal(s, value);
  };
  return [readSignal.bind(s), setter];
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE);
  updateComputation(c);
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects;
  const c = createComputation(fn, value, false, STALE),
        s = SuspenseContext && lookup(Owner, SuspenseContext.id);
  if (s) c.suspense = s;
  c.user = true;
  Effects ? Effects.push(c) : updateComputation(c);
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions;
  const c = createComputation(fn, value, true, 0);
  c.observers = null;
  c.observerSlots = null;
  c.comparator = options.equals || undefined;
  updateComputation(c);
  return readSignal.bind(c);
}
function untrack(fn) {
  const listener = Listener;
  Listener = null;
  try {
    return fn();
  } finally {
    Listener = listener;
  }
}
function onCleanup(fn) {
  if (Owner === null) ;else if (Owner.cleanups === null) Owner.cleanups = [fn];else Owner.cleanups.push(fn);
  return fn;
}
let SuspenseContext;
function readSignal() {
  const runningTransition = Transition ;
  if (this.sources && (this.state || runningTransition )) {
    if (this.state === STALE || runningTransition ) updateComputation(this);else {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(this), false);
      Updates = updates;
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0;
    if (!Listener.sources) {
      Listener.sources = [this];
      Listener.sourceSlots = [sSlot];
    } else {
      Listener.sources.push(this);
      Listener.sourceSlots.push(sSlot);
    }
    if (!this.observers) {
      this.observers = [Listener];
      this.observerSlots = [Listener.sources.length - 1];
    } else {
      this.observers.push(Listener);
      this.observerSlots.push(Listener.sources.length - 1);
    }
  }
  return this.value;
}
function writeSignal(node, value, isComp) {
  let current = node.value;
  if (!node.comparator || !node.comparator(current, value)) {
    node.value = value;
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i];
          const TransitionRunning = Transition && Transition.running;
          if (TransitionRunning && Transition.disposed.has(o)) ;
          if (TransitionRunning && !o.tState || !TransitionRunning && !o.state) {
            if (o.pure) Updates.push(o);else Effects.push(o);
            if (o.observers) markDownstream(o);
          }
          if (TransitionRunning) ;else o.state = STALE;
        }
        if (Updates.length > 10e5) {
          Updates = [];
          if (false) ;
          throw new Error();
        }
      }, false);
    }
  }
  return value;
}
function updateComputation(node) {
  if (!node.fn) return;
  cleanNode(node);
  const owner = Owner,
        listener = Listener,
        time = ExecCount;
  Listener = Owner = node;
  runComputation(node, node.value, time);
  Listener = listener;
  Owner = owner;
}
function runComputation(node, value, time) {
  let nextValue;
  try {
    nextValue = node.fn(value);
  } catch (err) {
    if (node.pure) node.state = STALE;
    handleError(err);
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && "observers" in node) {
      writeSignal(node, nextValue);
    } else node.value = nextValue;
    node.updatedAt = time;
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state: state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: null,
    pure
  };
  if (Owner === null) ;else if (Owner !== UNOWNED) {
    {
      if (!Owner.owned) Owner.owned = [c];else Owner.owned.push(c);
    }
  }
  return c;
}
function runTop(node) {
  const runningTransition = Transition ;
  if (node.state === 0 || runningTransition ) return;
  if (node.state === PENDING || runningTransition ) return lookUpstream(node);
  if (node.suspense && untrack(node.suspense.inFallback)) return node.suspense.effects.push(node);
  const ancestors = [node];
  while ((node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)) {
    if (node.state || runningTransition ) ancestors.push(node);
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i];
    if (node.state === STALE || runningTransition ) {
      updateComputation(node);
    } else if (node.state === PENDING || runningTransition ) {
      const updates = Updates;
      Updates = null;
      runUpdates(() => lookUpstream(node, ancestors[0]), false);
      Updates = updates;
    }
  }
}
function runUpdates(fn, init) {
  if (Updates) return fn();
  let wait = false;
  if (!init) Updates = [];
  if (Effects) wait = true;else Effects = [];
  ExecCount++;
  try {
    const res = fn();
    completeUpdates(wait);
    return res;
  } catch (err) {
    if (!Updates) Effects = null;
    handleError(err);
  }
}
function completeUpdates(wait) {
  if (Updates) {
    runQueue(Updates);
    Updates = null;
  }
  if (wait) return;
  const e = Effects;
  Effects = null;
  if (e.length) runUpdates(() => runEffects(e), false);
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) runTop(queue[i]);
}
function runUserEffects(queue) {
  let i,
      userLength = 0;
  for (i = 0; i < queue.length; i++) {
    const e = queue[i];
    if (!e.user) runTop(e);else queue[userLength++] = e;
  }
  if (sharedConfig.context) setHydrateContext();
  for (i = 0; i < userLength; i++) runTop(queue[i]);
}
function lookUpstream(node, ignore) {
  const runningTransition = Transition ;
  node.state = 0;
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i];
    if (source.sources) {
      if (source.state === STALE || runningTransition ) {
        if (source !== ignore) runTop(source);
      } else if (source.state === PENDING || runningTransition ) lookUpstream(source, ignore);
    }
  }
}
function markDownstream(node) {
  const runningTransition = Transition ;
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i];
    if (!o.state || runningTransition ) {
      o.state = PENDING;
      if (o.pure) Updates.push(o);else Effects.push(o);
      o.observers && markDownstream(o);
    }
  }
}
function cleanNode(node) {
  let i;
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(),
            index = node.sourceSlots.pop(),
            obs = source.observers;
      if (obs && obs.length) {
        const n = obs.pop(),
              s = source.observerSlots.pop();
        if (index < obs.length) {
          n.sourceSlots[s] = index;
          obs[index] = n;
          source.observerSlots[index] = s;
        }
      }
    }
  }
  if (node.owned) {
    for (i = 0; i < node.owned.length; i++) cleanNode(node.owned[i]);
    node.owned = null;
  }
  if (node.cleanups) {
    for (i = 0; i < node.cleanups.length; i++) node.cleanups[i]();
    node.cleanups = null;
  }
  node.state = 0;
  node.context = null;
}
function castError(err) {
  if (err instanceof Error || typeof err === "string") return err;
  return new Error("Unknown error");
}
function handleError(err) {
  err = castError(err);
  throw err;
}
function lookup(owner, key) {
  return owner ? owner.context && owner.context[key] !== undefined ? owner.context[key] : lookup(owner.owner, key) : undefined;
}
function trueFn() {
  return true;
}
const propTraps = {
  get(_, property, receiver) {
    if (property === $PROXY) return receiver;
    return _.get(property);
  },
  has(_, property) {
    if (property === $PROXY) return true;
    return _.has(property);
  },
  set: trueFn,
  deleteProperty: trueFn,
  getOwnPropertyDescriptor(_, property) {
    return {
      configurable: true,
      enumerable: true,
      get() {
        return _.get(property);
      },
      set: trueFn,
      deleteProperty: trueFn
    };
  },
  ownKeys(_) {
    return _.keys();
  }
};
function resolveSource(s) {
  return !(s = typeof s === "function" ? s() : s) ? {} : s;
}
function mergeProps(...sources) {
  let proxy = false;
  for (let i = 0; i < sources.length; i++) {
    const s = sources[i];
    proxy = proxy || !!s && $PROXY in s;
    sources[i] = typeof s === "function" ? (proxy = true, createMemo(s)) : s;
  }
  if (proxy) {
    return new Proxy({
      get(property) {
        for (let i = sources.length - 1; i >= 0; i--) {
          const v = resolveSource(sources[i])[property];
          if (v !== undefined) return v;
        }
      },
      has(property) {
        for (let i = sources.length - 1; i >= 0; i--) {
          if (property in resolveSource(sources[i])) return true;
        }
        return false;
      },
      keys() {
        const keys = [];
        for (let i = 0; i < sources.length; i++) keys.push(...Object.keys(resolveSource(sources[i])));
        return [...new Set(keys)];
      }
    }, propTraps);
  }
  const target = {};
  for (let i = sources.length - 1; i >= 0; i--) {
    if (sources[i]) {
      const descriptors = Object.getOwnPropertyDescriptors(sources[i]);
      for (const key in descriptors) {
        if (key in target) continue;
        Object.defineProperty(target, key, {
          enumerable: true,
          get() {
            for (let i = sources.length - 1; i >= 0; i--) {
              const v = (sources[i] || {})[key];
              if (v !== undefined) return v;
            }
          }
        });
      }
    }
  }
  return target;
}

const booleans = ["allowfullscreen", "async", "autofocus", "autoplay", "checked", "controls", "default", "disabled", "formnovalidate", "hidden", "indeterminate", "ismap", "loop", "multiple", "muted", "nomodule", "novalidate", "open", "playsinline", "readonly", "required", "reversed", "seamless", "selected"];
const Properties = /*#__PURE__*/new Set(["className", "value", "readOnly", "formNoValidate", "isMap", "noModule", "playsInline", ...booleans]);
const ChildProperties = /*#__PURE__*/new Set(["innerHTML", "textContent", "innerText", "children"]);
const Aliases = /*#__PURE__*/Object.assign(Object.create(null), {
  className: "class",
  htmlFor: "for"
});
const PropAliases = /*#__PURE__*/Object.assign(Object.create(null), {
  class: "className",
  formnovalidate: "formNoValidate",
  ismap: "isMap",
  nomodule: "noModule",
  playsinline: "playsInline",
  readonly: "readOnly"
});
const DelegatedEvents = /*#__PURE__*/new Set(["beforeinput", "click", "dblclick", "contextmenu", "focusin", "focusout", "input", "keydown", "keyup", "mousedown", "mousemove", "mouseout", "mouseover", "mouseup", "pointerdown", "pointermove", "pointerout", "pointerover", "pointerup", "touchend", "touchmove", "touchstart"]);
const SVGNamespace = {
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace"
};

function reconcileArrays(parentNode, a, b) {
  let bLength = b.length,
      aEnd = a.length,
      bEnd = bLength,
      aStart = 0,
      bStart = 0,
      after = a[aEnd - 1].nextSibling,
      map = null;
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++;
      bStart++;
      continue;
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--;
      bEnd--;
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart] : after;
      while (bStart < bEnd) parentNode.insertBefore(b[bStart++], node);
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) a[aStart].remove();
        aStart++;
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling;
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling);
      parentNode.insertBefore(b[--bEnd], node);
      a[aEnd] = b[bEnd];
    } else {
      if (!map) {
        map = new Map();
        let i = bStart;
        while (i < bEnd) map.set(b[i], i++);
      }
      const index = map.get(a[aStart]);
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart,
              sequence = 1,
              t;
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) break;
            sequence++;
          }
          if (sequence > index - bStart) {
            const node = a[aStart];
            while (bStart < index) parentNode.insertBefore(b[bStart++], node);
          } else parentNode.replaceChild(b[bStart++], a[aStart++]);
        } else aStart++;
      } else a[aStart++].remove();
    }
  }
}

const $$EVENTS = "_$DX_DELEGATE";
function template(html, check, isSVG) {
  const t = document.createElement("template");
  t.innerHTML = html;
  let node = t.content.firstChild;
  if (isSVG) node = node.firstChild;
  return node;
}
function delegateEvents(eventNames, document = window.document) {
  const e = document[$$EVENTS] || (document[$$EVENTS] = new Set());
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i];
    if (!e.has(name)) {
      e.add(name);
      document.addEventListener(name, eventHandler);
    }
  }
}
function setAttribute(node, name, value) {
  if (value == null) node.removeAttribute(name);else node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
  if (value == null) node.removeAttributeNS(namespace, name);else node.setAttributeNS(namespace, name, value);
}
function className(node, value) {
  if (value == null) node.removeAttribute("class");else node.className = value;
}
function addEventListener(node, name, handler, delegate) {
  if (delegate) {
    if (Array.isArray(handler)) {
      node[`$$${name}`] = handler[0];
      node[`$$${name}Data`] = handler[1];
    } else node[`$$${name}`] = handler;
  } else if (Array.isArray(handler)) {
    const handlerFn = handler[0];
    node.addEventListener(name, handler[0] = e => handlerFn.call(node, handler[1], e));
  } else node.addEventListener(name, handler);
}
function classList(node, value, prev = {}) {
  const classKeys = Object.keys(value || {}),
        prevKeys = Object.keys(prev);
  let i, len;
  for (i = 0, len = prevKeys.length; i < len; i++) {
    const key = prevKeys[i];
    if (!key || key === "undefined" || value[key]) continue;
    toggleClassKey(node, key, false);
    delete prev[key];
  }
  for (i = 0, len = classKeys.length; i < len; i++) {
    const key = classKeys[i],
          classValue = !!value[key];
    if (!key || key === "undefined" || prev[key] === classValue || !classValue) continue;
    toggleClassKey(node, key, true);
    prev[key] = classValue;
  }
  return prev;
}
function style(node, value, prev) {
  if (!value) return prev ? setAttribute(node, "style") : value;
  const nodeStyle = node.style;
  if (typeof value === "string") return nodeStyle.cssText = value;
  typeof prev === "string" && (nodeStyle.cssText = prev = undefined);
  prev || (prev = {});
  value || (value = {});
  let v, s;
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s);
    delete prev[s];
  }
  for (s in value) {
    v = value[s];
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v);
      prev[s] = v;
    }
  }
  return prev;
}
function spread(node, props = {}, isSVG, skipChildren) {
  const prevProps = {};
  if (!skipChildren) {
    createRenderEffect(() => prevProps.children = insertExpression(node, props.children, prevProps.children));
  }
  createRenderEffect(() => props.ref && props.ref(node));
  createRenderEffect(() => assign(node, props, isSVG, true, prevProps, true));
  return prevProps;
}
function use(fn, element, arg) {
  return untrack(() => fn(element, arg));
}
function assign(node, props, isSVG, skipChildren, prevProps = {}, skipRef = false) {
  props || (props = {});
  for (const prop in prevProps) {
    if (!(prop in props)) {
      if (prop === "children") continue;
      prevProps[prop] = assignProp(node, prop, null, prevProps[prop], isSVG, skipRef);
    }
  }
  for (const prop in props) {
    if (prop === "children") {
      if (!skipChildren) insertExpression(node, props.children);
      continue;
    }
    const value = props[prop];
    prevProps[prop] = assignProp(node, prop, value, prevProps[prop], isSVG, skipRef);
  }
}
function toPropertyName(name) {
  return name.toLowerCase().replace(/-([a-z])/g, (_, w) => w.toUpperCase());
}
function toggleClassKey(node, key, value) {
  const classNames = key.trim().split(/\s+/);
  for (let i = 0, nameLen = classNames.length; i < nameLen; i++) node.classList.toggle(classNames[i], value);
}
function assignProp(node, prop, value, prev, isSVG, skipRef) {
  let isCE, isProp, isChildProp;
  if (prop === "style") return style(node, value, prev);
  if (prop === "classList") return classList(node, value, prev);
  if (value === prev) return prev;
  if (prop === "ref") {
    if (!skipRef) value(node);
  } else if (prop.slice(0, 3) === "on:") {
    const e = prop.slice(3);
    prev && node.removeEventListener(e, prev);
    value && node.addEventListener(e, value);
  } else if (prop.slice(0, 10) === "oncapture:") {
    const e = prop.slice(10);
    prev && node.removeEventListener(e, prev, true);
    value && node.addEventListener(e, value, true);
  } else if (prop.slice(0, 2) === "on") {
    const name = prop.slice(2).toLowerCase();
    const delegate = DelegatedEvents.has(name);
    if (!delegate && prev) {
      const h = Array.isArray(prev) ? prev[0] : prev;
      node.removeEventListener(name, h);
    }
    if (delegate || value) {
      addEventListener(node, name, value, delegate);
      delegate && delegateEvents([name]);
    }
  } else if ((isChildProp = ChildProperties.has(prop)) || !isSVG && (PropAliases[prop] || (isProp = Properties.has(prop))) || (isCE = node.nodeName.includes("-"))) {
    if (prop === "class" || prop === "className") className(node, value);else if (isCE && !isProp && !isChildProp) node[toPropertyName(prop)] = value;else node[PropAliases[prop] || prop] = value;
  } else {
    const ns = isSVG && prop.indexOf(":") > -1 && SVGNamespace[prop.split(":")[0]];
    if (ns) setAttributeNS(node, ns, prop, value);else setAttribute(node, Aliases[prop] || prop, value);
  }
  return value;
}
function eventHandler(e) {
  const key = `$$${e.type}`;
  let node = e.composedPath && e.composedPath()[0] || e.target;
  if (e.target !== node) {
    Object.defineProperty(e, "target", {
      configurable: true,
      value: node
    });
  }
  Object.defineProperty(e, "currentTarget", {
    configurable: true,
    get() {
      return node || document;
    }
  });
  if (sharedConfig.registry && !sharedConfig.done) {
    sharedConfig.done = true;
    document.querySelectorAll("[id^=pl-]").forEach(elem => elem.remove());
  }
  while (node) {
    const handler = node[key];
    if (handler && !node.disabled) {
      const data = node[`${key}Data`];
      data !== undefined ? handler.call(node, data, e) : handler.call(node, e);
      if (e.cancelBubble) return;
    }
    node = node._$host || node.parentNode || node.host;
  }
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  if (sharedConfig.context && !current) current = [...parent.childNodes];
  while (typeof current === "function") current = current();
  if (value === current) return current;
  const t = typeof value,
        multi = marker !== undefined;
  parent = multi && current[0] && current[0].parentNode || parent;
  if (t === "string" || t === "number") {
    if (sharedConfig.context) return current;
    if (t === "number") value = value.toString();
    if (multi) {
      let node = current[0];
      if (node && node.nodeType === 3) {
        node.data = value;
      } else node = document.createTextNode(value);
      current = cleanChildren(parent, current, marker, node);
    } else {
      if (current !== "" && typeof current === "string") {
        current = parent.firstChild.data = value;
      } else current = parent.textContent = value;
    }
  } else if (value == null || t === "boolean") {
    if (sharedConfig.context) return current;
    current = cleanChildren(parent, current, marker);
  } else if (t === "function") {
    createRenderEffect(() => {
      let v = value();
      while (typeof v === "function") v = v();
      current = insertExpression(parent, v, current, marker);
    });
    return () => current;
  } else if (Array.isArray(value)) {
    const array = [];
    const currentArray = current && Array.isArray(current);
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() => current = insertExpression(parent, array, current, marker, true));
      return () => current;
    }
    if (sharedConfig.context) {
      if (!array.length) return current;
      for (let i = 0; i < array.length; i++) {
        if (array[i].parentNode) return current = array;
      }
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker);
      if (multi) return current;
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker);
      } else reconcileArrays(parent, current, array);
    } else {
      current && cleanChildren(parent);
      appendNodes(parent, array);
    }
    current = array;
  } else if (value instanceof Node) {
    if (sharedConfig.context && value.parentNode) return current = multi ? [value] : value;
    if (Array.isArray(current)) {
      if (multi) return current = cleanChildren(parent, current, marker, value);
      cleanChildren(parent, current, null, value);
    } else if (current == null || current === "" || !parent.firstChild) {
      parent.appendChild(value);
    } else parent.replaceChild(value, parent.firstChild);
    current = value;
  } else ;
  return current;
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false;
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i],
        prev = current && current[i];
    if (item instanceof Node) {
      normalized.push(item);
    } else if (item == null || item === true || item === false) ; else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic;
    } else if ((typeof item) === "function") {
      if (unwrap) {
        while (typeof item === "function") item = item();
        dynamic = normalizeIncomingArray(normalized, Array.isArray(item) ? item : [item], Array.isArray(prev) ? prev : [prev]) || dynamic;
      } else {
        normalized.push(item);
        dynamic = true;
      }
    } else {
      const value = String(item);
      if (prev && prev.nodeType === 3 && prev.data === value) {
        normalized.push(prev);
      } else normalized.push(document.createTextNode(value));
    }
  }
  return dynamic;
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) parent.insertBefore(array[i], marker);
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === undefined) return parent.textContent = "";
  const node = replacement || document.createTextNode("");
  if (current.length) {
    let inserted = false;
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i];
      if (node !== el) {
        const isParent = el.parentNode === parent;
        if (!inserted && !i) isParent ? parent.replaceChild(node, el) : parent.insertBefore(node, marker);else isParent && el.remove();
      } else inserted = true;
    }
  } else parent.insertBefore(node, marker);
  return [node];
}

const HIDDEN_TEXTAREA_STYLE = {
  "min-height": "0",
  "max-height": "none",
  height: "0",
  visibility: "hidden",
  overflow: "hidden",
  position: "absolute",
  "z-index": "-1000",
  top: "0",
  right: "0"
};
const forceHiddenStyles = (node) => {
  Object.keys(HIDDEN_TEXTAREA_STYLE).forEach((key) => {
    node.style.setProperty(
      key,
      HIDDEN_TEXTAREA_STYLE[key],
      "important"
    );
  });
};

let hiddenTextarea = null;
const getHeight = (node, sizingData) => {
  const height = node.scrollHeight;
  if (sizingData.sizingStyle.boxSizing === "border-box") {
    return height + sizingData.borderSize;
  }
  return height - sizingData.paddingSize;
};
function calculateNodeHeight(sizingData, value, minRows = 1, maxRows = Infinity) {
  if (!hiddenTextarea) {
    hiddenTextarea = document.createElement("textarea");
    hiddenTextarea.setAttribute("tabindex", "-1");
    hiddenTextarea.setAttribute("aria-hidden", "true");
    forceHiddenStyles(hiddenTextarea);
  }
  if (hiddenTextarea.parentNode === null) {
    document.body.appendChild(hiddenTextarea);
  }
  const { paddingSize, borderSize, sizingStyle } = sizingData;
  const { boxSizing } = sizingStyle;
  Object.keys(sizingStyle).forEach((_key) => {
    const key = _key;
    hiddenTextarea.style[key] = sizingStyle[key];
  });
  forceHiddenStyles(hiddenTextarea);
  hiddenTextarea.value = value;
  let height = getHeight(hiddenTextarea, sizingData);
  hiddenTextarea.value = "x";
  const rowHeight = hiddenTextarea.scrollHeight - paddingSize;
  let minHeight = rowHeight * minRows;
  if (boxSizing === "border-box") {
    minHeight = minHeight + paddingSize + borderSize;
  }
  height = Math.max(minHeight, height);
  let maxHeight = rowHeight * maxRows;
  if (boxSizing === "border-box") {
    maxHeight = maxHeight + paddingSize + borderSize;
  }
  height = Math.min(maxHeight, height);
  return [height, rowHeight];
}

const pick = (props, obj) => props.reduce((acc, prop) => {
  acc[prop] = obj[prop];
  return acc;
}, {});

const SIZING_STYLE = [
  "borderBottomWidth",
  "borderLeftWidth",
  "borderRightWidth",
  "borderTopWidth",
  "boxSizing",
  "fontFamily",
  "fontSize",
  "fontStyle",
  "fontWeight",
  "letterSpacing",
  "lineHeight",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "paddingTop",
  // non-standard
  "tabSize",
  "textIndent",
  // non-standard
  "textRendering",
  "textTransform",
  "width",
  "wordBreak"
];
const isIE = typeof document !== "undefined" ? !!document.documentElement.currentStyle : false;
const getSizingData = (node) => {
  const style = window.getComputedStyle(node);
  if (style === null) {
    return null;
  }
  const sizingStyle = pick(SIZING_STYLE, style);
  const { boxSizing } = sizingStyle;
  if (boxSizing === "") {
    return null;
  }
  if (isIE && boxSizing === "border-box") {
    sizingStyle.width = parseFloat(sizingStyle.width) + parseFloat(sizingStyle.borderRightWidth) + parseFloat(sizingStyle.borderLeftWidth) + parseFloat(sizingStyle.paddingRight) + parseFloat(sizingStyle.paddingLeft) + "px";
  }
  const paddingSize = parseFloat(sizingStyle.paddingBottom) + parseFloat(sizingStyle.paddingTop);
  const borderSize = parseFloat(sizingStyle.borderBottomWidth) + parseFloat(sizingStyle.borderTopWidth);
  return {
    sizingStyle,
    paddingSize,
    borderSize
  };
};

const useWindowResizeListener = (listener) => {
  const handler = (event) => listener(event);
  window.addEventListener("resize", handler);
  onCleanup(() => window.removeEventListener("resize", handler));
};

const _tmpl$$1 = /*#__PURE__*/template(`<textarea></textarea>`);
function TextareaAutosize(props) {
  const [textarea, setTextarea] = createSignal();
  let heightRef = 0;
  let measurementsCacheRef = undefined;
  const resizeTextarea = () => {
    const node = textarea();
    if (!node) return;
    const nodeSizingData = props.cacheMeasurements && measurementsCacheRef ? measurementsCacheRef : getSizingData(node);
    if (!nodeSizingData) {
      return;
    }
    measurementsCacheRef = nodeSizingData;
    const [height, rowHeight] = calculateNodeHeight(nodeSizingData, node.value || node.placeholder || "x", props.minRows, props.maxRows);
    if (heightRef !== height) {
      heightRef = height;
      node.style.setProperty("height", `${height}px`, "important");
      props.onHeightChange?.(height, {
        rowHeight
      });
    }
  };
  const handleChange = event => {
    resizeTextarea();
    props.oninput?.(event);
  };
  createEffect(() => {
    if (typeof document !== "undefined" && textarea()) {
      resizeTextarea();
      useWindowResizeListener(resizeTextarea);
    }
  });
  return (() => {
    const _el$ = _tmpl$$1.cloneNode(true);
    use(element => setTextarea(element), _el$);
    spread(_el$, mergeProps(props, {
      "oninput": handleChange
    }), false, false);
    return _el$;
  })();
}

const _tmpl$ = /*#__PURE__*/template$1(`<div></div>`),
  _tmpl$2 = /*#__PURE__*/template$1(`<div><h2>Component with maxRows and minRows</h2><pre>
  &lt;TextareaAutosize
    minRows={3}
    maxRows={6}
    value="Just a single line..."
    />
</pre></div>`),
  _tmpl$3 = /*#__PURE__*/template$1(`<div><h2>Component with maxRows and minRows (box-sizing: border-box)</h2><pre>
  &lt;TextareaAutosize
    style={{boxSizing: 'border-box'}}
    minRows={3}
    maxRows={6}
    value="Just a single line..."
    />
</pre></div>`),
  _tmpl$4 = /*#__PURE__*/template$1(`<div><h2>Component with maxRows</h2><pre>
  &lt;TextareaAutosize
    maxRows={5}
    value="Just a single line..."
    />
</pre></div>`),
  _tmpl$5 = /*#__PURE__*/template$1(`<div><h2>Component with rows set</h2><pre>
  &lt;TextareaAutosize
    rows={4}
    value="Just a single line..."
    />
</pre></div>`),
  _tmpl$6 = /*#__PURE__*/template$1(`<div><h2>Controlled mode</h2><pre>
  &lt;TextareaAutosize
    cacheMeasurements
    value={value}
    onChange={ev => setValue(ev.target.value)}
    />
</pre><button>Change value programatically</button></div>`),
  _tmpl$7 = /*#__PURE__*/template$1(`<div><h2>Uncontrolled mode</h2><pre>
  &lt;TextareaAutosize
    value={new Array(15).join('
Line.')}
    />
</pre></div>`),
  _tmpl$8 = /*#__PURE__*/template$1(`<div><h2>Receive message on height change.</h2><pre>
  &lt;TextareaAutosize
    cacheMeasurements
    onHeightChange={(height) => console.log(height)}
    />
</pre></div>`),
  _tmpl$9 = /*#__PURE__*/template$1(`<div><h2>Multiple textareas updated at the same time.</h2><div>This one controls the rest.</div><div>Those get controlled by the one above.</div></div>`);
const range = n => Array.from({
  length: n
}, (_, i) => i);
const Basic = () => {
  return (() => {
    const _el$ = _tmpl$.cloneNode(true);
    insert(_el$, createComponent(TextareaAutosize, {
      maxRows: 3,
      style: {
        "line-height": 1,
        "font-size": "10px",
        border: 0,
        "box-sizing": "border-box"
      }
    }));
    return _el$;
  })();
};
const MinMaxRows = () => {
  return (() => {
    const _el$2 = _tmpl$2.cloneNode(true),
      _el$3 = _el$2.firstChild;
      _el$3.nextSibling;
    insert(_el$2, createComponent(TextareaAutosize, {
      minRows: 3,
      maxRows: 6,
      value: "Just a single line..."
    }), null);
    return _el$2;
  })();
};
const MinMaxRowsBorderBox = () => {
  return (() => {
    const _el$5 = _tmpl$3.cloneNode(true),
      _el$6 = _el$5.firstChild;
      _el$6.nextSibling;
    insert(_el$5, createComponent(TextareaAutosize, {
      style: {
        boxSizing: "border-box"
      },
      minRows: 3,
      maxRows: 6,
      value: "Just a single line..."
    }), null);
    return _el$5;
  })();
};
const MaxRows = () => {
  return (() => {
    const _el$8 = _tmpl$4.cloneNode(true),
      _el$9 = _el$8.firstChild;
      _el$9.nextSibling;
    insert(_el$8, createComponent(TextareaAutosize, {
      maxRows: 5,
      value: "Just a single line..."
    }), null);
    return _el$8;
  })();
};
const SetRows = () => {
  return (() => {
    const _el$11 = _tmpl$5.cloneNode(true),
      _el$12 = _el$11.firstChild;
      _el$12.nextSibling;
    insert(_el$11, createComponent(TextareaAutosize, {
      rows: 4,
      value: "Just a single line..."
    }), null);
    return _el$11;
  })();
};
const ControlledMode = () => {
  const [value, setValue] = createSignal$1(new Array(15).join("\nLine."));
  return (() => {
    const _el$14 = _tmpl$6.cloneNode(true),
      _el$15 = _el$14.firstChild,
      _el$16 = _el$15.nextSibling,
      _el$17 = _el$16.nextSibling;
    insert(_el$14, createComponent(TextareaAutosize, {
      cacheMeasurements: true,
      get value() {
        return value();
      },
      onChange: ev => setValue(ev.target.value)
    }), _el$17);
    _el$17.$$click = () => setValue("This value was set programatically");
    return _el$14;
  })();
};
const UncontrolledMode = () => {
  return (() => {
    const _el$18 = _tmpl$7.cloneNode(true),
      _el$19 = _el$18.firstChild;
      _el$19.nextSibling;
    insert(_el$18, createComponent(TextareaAutosize, {
      get value() {
        return new Array(15).join("\nLine.");
      }
    }), null);
    return _el$18;
  })();
};
const OnHeightChangeCallback = () => {
  return (() => {
    const _el$21 = _tmpl$8.cloneNode(true),
      _el$22 = _el$21.firstChild;
      _el$22.nextSibling;
    insert(_el$21, createComponent(TextareaAutosize, {
      cacheMeasurements: true,
      onHeightChange: height => {
        // eslint-disable-next-line no-console
        console.log(height);
      }
    }), null);
    return _el$21;
  })();
};
const MultipleTextareas = () => {
  const [value, setValue] = createSignal$1("");
  return (() => {
    const _el$24 = _tmpl$9.cloneNode(true),
      _el$25 = _el$24.firstChild,
      _el$26 = _el$25.nextSibling,
      _el$27 = _el$26.nextSibling;
    insert(_el$24, createComponent(TextareaAutosize, {
      get value() {
        return value();
      },
      onChange: ev => setValue(ev.target.value)
    }), _el$27);
    insert(_el$24, () => range(15).map(i => createComponent(TextareaAutosize, {
      get value() {
        return value();
      }
    })), null);
    return _el$24;
  })();
};
const Demo = () => {
  console.log("hu");
  return (() => {
    const _el$28 = _tmpl$.cloneNode(true);
    insert(_el$28, createComponent(Basic, {}), null);
    insert(_el$28, createComponent(MinMaxRows, {}), null);
    insert(_el$28, createComponent(MinMaxRowsBorderBox, {}), null);
    insert(_el$28, createComponent(MaxRows, {}), null);
    insert(_el$28, createComponent(SetRows, {}), null);
    insert(_el$28, createComponent(ControlledMode, {}), null);
    insert(_el$28, createComponent(UncontrolledMode, {}), null);
    insert(_el$28, createComponent(OnHeightChangeCallback, {}), null);
    insert(_el$28, createComponent(MultipleTextareas, {}), null);
    return _el$28;
  })();
};
render(() => createComponent(Demo, {}), document.getElementById("main"));
delegateEvents$1(["click"]);
