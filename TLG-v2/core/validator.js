export const validator = {
  isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  isPhone: (phone) => /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/.test(phone),
  
  isPassword: (pwd) => pwd && pwd.length >= 6,
  
  isEmpty: (val) => !val || val.trim() === '',
  
  isLength: (val, min, max) => {
    const len = val?.length || 0;
    return len >= min && len <= max;
  },
  
  isNumber: (val) => !isNaN(val) && isFinite(val),
  
  isPositive: (val) => !isNaN(val) && val > 0,
  
  isInRange: (val, min, max) => {
    const num = Number(val);
    return !isNaN(num) && num >= min && num <= max;
  }
};
