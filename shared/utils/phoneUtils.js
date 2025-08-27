
/**
 * 전화번호 관련 유틸리티 함수들
 */

/**
 * 전화번호를 표준 형식(010-1234-5678)으로 변환
 * @param {string} phone - 원본 전화번호
 * @returns {string|null} - 정규화된 전화번호 또는 null
 */
function normalizePhone(phone) {
  if (!phone) return null;
  
  // 숫자만 추출
  const digits = phone.replace(/\D/g, '');
  
  // 010으로 시작하는 11자리 번호만 처리
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }
  
  return null;
}

/**
 * 전화번호 형식 검증
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} - 유효성 여부
 */
function validatePhone(phone) {
  if (!phone) return false;
  return /^010-\d{4}-\d{4}$/.test(phone);
}

/**
 * 전화번호를 마스킹 처리 (010-1234-**** 형태)
 * @param {string} phone - 마스킹할 전화번호
 * @returns {string} - 마스킹된 전화번호
 */
function maskPhone(phone) {
  if (!validatePhone(phone)) return phone;
  
  const parts = phone.split('-');
  return `${parts[0]}-${parts[1]}-****`;
}

/**
 * 전화번호에서 숫자만 추출
 * @param {string} phone - 전화번호
 * @returns {string} - 숫자만 포함된 문자열
 */
function getPhoneDigits(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

module.exports = {
  normalizePhone,
  validatePhone,
  maskPhone,
  getPhoneDigits
};
