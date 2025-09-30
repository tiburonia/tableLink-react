export const getItem = (k) => { 
  try { 
    return JSON.parse(localStorage.getItem(k)); 
  } catch { 
    return null; 
  } 
};

export const setItem = (k, v) => localStorage.setItem(k, JSON.stringify(v));

export const removeItem = (k) => localStorage.removeItem(k);

export const clear = () => localStorage.clear();

export const sessionGetItem = (k) => { 
  try { 
    return JSON.parse(sessionStorage.getItem(k)); 
  } catch { 
    return null; 
  } 
};

export const sessionSetItem = (k, v) => sessionStorage.setItem(k, JSON.stringify(v));

export const sessionRemoveItem = (k) => sessionStorage.removeItem(k);
