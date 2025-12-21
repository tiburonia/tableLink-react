/**
 * Level helpers - 등급 관련 유틸리티 함수
 * 
 * FSD 원칙: features 레이어에서 UI 도우미 함수 관리
 */

export function getLevelEmoji(level: string): string {
  const emojis: Record<string, string> = {
    PLATINUM: '💎',
    GOLD: '👑',
    SILVER: '⭐',
    BRONZE: '🥉',
  }
  return emojis[level] || '🏅'
}

export function getLevelGradient(level: string): string {
  const gradients: Record<string, string> = {
    PLATINUM: 'linear-gradient(135deg, #e5e4e2 0%, #f8f9fa 100%)',
    GOLD: 'linear-gradient(135deg, #ffd700 0%, #fff5e7 100%)',
    SILVER: 'linear-gradient(135deg, #c0c0c0 0%, #f1f3f5 100%)',
    BRONZE: 'linear-gradient(135deg, #cd7f32 0%, #fff5eb 100%)',
  }
  return gradients[level] || 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)'
}
