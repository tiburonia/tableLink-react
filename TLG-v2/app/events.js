const bus = new Map();

export function on(event, fn) {
  if (!bus.has(event)) {
    bus.set(event, new Set());
  }
  bus.get(event).add(fn);
  
  return () => {
    bus.get(event).delete(fn);
    if (bus.get(event).size === 0) {
      bus.delete(event);
    }
  };
}

export function emit(event, payload) {
  const handlers = bus.get(event);
  if (handlers) {
    handlers.forEach(fn => {
      try {
        fn(payload);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }
}

export function once(event, fn) {
  const unsubscribe = on(event, (payload) => {
    unsubscribe();
    fn(payload);
  });
  return unsubscribe;
}

export function clear(event) {
  if (event) {
    bus.delete(event);
  } else {
    bus.clear();
  }
}
