
/**
 * 입력 검증 유틸리티 (celebrate/Joi 없이 수동 검증)
 */

/**
 * 필수 필드 검증
 */
function validateRequired(data, fields) {
  const missing = [];
  
  for (const field of fields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(field);
    }
  }
  
  if (missing.length > 0) {
    const error = new Error(`필수 필드가 누락되었습니다: ${missing.join(', ')}`);
    error.code = 'VALIDATION_ERROR';
    error.details = { missing };
    throw error;
  }
}

/**
 * 타입 검증
 */
function validateTypes(data, schema) {
  const errors = [];
  
  for (const [field, expectedType] of Object.entries(schema)) {
    const value = data[field];
    
    if (value !== undefined && value !== null) {
      const actualType = typeof value;
      
      if (expectedType === 'number' && isNaN(Number(value))) {
        errors.push(`${field}는 숫자여야 합니다`);
      } else if (expectedType === 'string' && actualType !== 'string') {
        errors.push(`${field}는 문자열이어야 합니다`);
      } else if (expectedType === 'boolean' && actualType !== 'boolean') {
        errors.push(`${field}는 불린값이어야 합니다`);
      } else if (expectedType === 'array' && !Array.isArray(value)) {
        errors.push(`${field}는 배열이어야 합니다`);
      }
    }
  }
  
  if (errors.length > 0) {
    const error = new Error('타입 검증 실패');
    error.code = 'TYPE_VALIDATION_ERROR';
    error.details = { errors };
    throw error;
  }
}

/**
 * 숫자 범위 검증
 */
function validateRange(value, min, max, fieldName) {
  const num = Number(value);
  
  if (isNaN(num)) {
    const error = new Error(`${fieldName}는 유효한 숫자여야 합니다`);
    error.code = 'INVALID_NUMBER';
    throw error;
  }
  
  if (num < min || num > max) {
    const error = new Error(`${fieldName}는 ${min}~${max} 범위여야 합니다`);
    error.code = 'OUT_OF_RANGE';
    throw error;
  }
  
  return num;
}

/**
 * 문자열 길이 검증
 */
function validateLength(value, min, max, fieldName) {
  if (typeof value !== 'string') {
    const error = new Error(`${fieldName}는 문자열이어야 합니다`);
    error.code = 'INVALID_STRING';
    throw error;
  }
  
  if (value.length < min || value.length > max) {
    const error = new Error(`${fieldName}는 ${min}~${max}자여야 합니다`);
    error.code = 'INVALID_LENGTH';
    throw error;
  }
  
  return value.trim();
}

/**
 * Enum 값 검증
 */
function validateEnum(value, allowedValues, fieldName) {
  if (!allowedValues.includes(value)) {
    const error = new Error(`${fieldName}는 다음 값 중 하나여야 합니다: ${allowedValues.join(', ')}`);
    error.code = 'INVALID_ENUM';
    throw error;
  }
  
  return value;
}

module.exports = {
  validateRequired,
  validateTypes,
  validateRange,
  validateLength,
  validateEnum
};
