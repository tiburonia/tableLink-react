import type { ReviewData } from './components/ReviewItem'
import type { MenuItemData } from './components/MenuItem'

export interface Photo {
  id: string
  url: string
  caption?: string
}

export interface HourItem {
  day: string
  hours: string
}

export const DUMMY_REVIEWS: ReviewData[] = [
  {
    id: '1',
    author: '김민수',
    rating: 5,
    date: '2024-12-10',
    content: '음식도 맛있고 분위기도 너무 좋았어요! 특히 파스타가 정말 맛있었습니다. 다음에 또 오고 싶네요.',
    avatar: '👨'
  },
  {
    id: '2',
    author: '이지은',
    rating: 4,
    date: '2024-12-08',
    content: '서비스가 친절하고 음식이 깔끔했어요. 가격대비 만족스러웠습니다.',
    avatar: '👩'
  },
  {
    id: '3',
    author: '박준형',
    rating: 5,
    date: '2024-12-05',
    content: '회식으로 방문했는데 모두가 만족했습니다. 룸도 있어서 좋았어요.',
    avatar: '👨‍💼'
  }
]

export const DUMMY_MENU: MenuItemData[] = [
  {
    id: '1',
    name: '시그니처 파스타',
    price: 18000,
    description: '신선한 해산물과 토마토 소스의 조화',
    image: '🍝',
    popular: true
  },
  {
    id: '2',
    name: '트러플 리조또',
    price: 22000,
    description: '이탈리아산 트러플이 들어간 고급 리조또',
    image: '🍚',
    popular: true
  },
  {
    id: '3',
    name: '마르게리타 피자',
    price: 16000,
    description: '화덕에 구운 정통 이탈리안 피자',
    image: '🍕'
  },
  {
    id: '4',
    name: '시저 샐러드',
    price: 12000,
    description: '신선한 로메인과 크리미한 드레싱',
    image: '🥗'
  }
]

export const DUMMY_PHOTOS: Photo[] = [
  { id: '1', url: 'https://via.placeholder.com/400x300/667eea/ffffff?text=Interior', caption: '내부 전경' },
  { id: '2', url: 'https://via.placeholder.com/400x300/764ba2/ffffff?text=Dish1', caption: '시그니처 메뉴' },
  { id: '3', url: 'https://via.placeholder.com/400x300/f093fb/ffffff?text=Dish2', caption: '인기 메뉴' },
  { id: '4', url: 'https://via.placeholder.com/400x300/4facfe/ffffff?text=Exterior', caption: '외부 전경' }
]

export const DUMMY_HOURS: HourItem[] = [
  { day: '월요일', hours: '11:00 - 22:00' },
  { day: '화요일', hours: '11:00 - 22:00' },
  { day: '수요일', hours: '11:00 - 22:00' },
  { day: '목요일', hours: '11:00 - 22:00' },
  { day: '금요일', hours: '11:00 - 23:00' },
  { day: '토요일', hours: '11:00 - 23:00' },
  { day: '일요일', hours: '휴무' }
]
