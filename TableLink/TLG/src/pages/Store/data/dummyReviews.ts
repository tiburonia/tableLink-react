import type { ReviewData } from '@/features/store-review'

// 리뷰 내용 템플릿
const reviewContents = [
  '음식이 정말 맛있었어요! 다음에 또 올게요.',
  '분위기도 좋고 서비스도 친절했습니다.',
  '가격 대비 훌륭한 음식이었어요.',
  '재방문 의사 100%입니다!',
  '메뉴가 다양하고 맛도 좋았습니다.',
  '직원분들이 매우 친절하셨어요.',
  '깨끗하고 쾌적한 환경이었습니다.',
  '가족들과 함께 즐거운 시간 보냈어요.',
  '특별한 날 방문하기 좋은 곳입니다.',
  '음식 나오는 속도도 빠르고 맛있었어요.',
  '조용하고 편안한 분위기가 좋았습니다.',
  '음식이 신선하고 맛있었어요.',
  '포장도 가능해서 편리했습니다.',
  '주차도 편하고 접근성이 좋아요.',
  '인테리어가 세련되고 깔끔했습니다.',
  '양도 푸짐하고 맛도 최고였어요.',
  '친구들과 방문했는데 모두 만족했어요.',
  '가성비가 정말 좋은 곳이에요.',
  '메뉴 설명도 자세하고 친절했습니다.',
  '다음엔 다른 메뉴도 먹어보고 싶어요.',
  '평일 점심시간에 방문했는데 괜찮았어요.',
  '아이들과 함께 가기 좋은 곳입니다.',
  '위생 상태가 매우 좋았어요.',
  '예약 시스템이 편리했습니다.',
  '직원 교육이 잘 되어있는 것 같아요.',
  '음식 플레이팅도 예뻤습니다.',
  '재료가 신선한 게 느껴졌어요.',
  '합리적인 가격에 맛있는 음식!',
  '조리 시간이 적당했어요.',
  '메뉴판이 보기 편하고 이해하기 쉬웠어요.',
  '음료도 맛있었습니다.',
  '반찬도 다 맛있었어요.',
  '테이블 간격이 넓어서 좋았습니다.',
  '화장실도 깨끗하게 관리되고 있어요.',
  '온도 조절이 잘 되어 있었습니다.',
  '음악 볼륨도 적당해서 대화하기 좋았어요.',
  '단체 손님 받기도 좋을 것 같아요.',
  '포토존이 있어서 사진 찍기 좋았어요.',
  '특별 이벤트가 있어서 더 좋았습니다.',
  '소스가 특별하고 맛있었어요.',
  '디저트도 훌륭했습니다.',
  '와인 리스트가 다양했어요.',
  '맥주 종류도 많아서 선택하기 좋았습니다.',
  '테라스 자리가 특히 좋았어요.',
  '뷰가 정말 멋진 곳이에요.',
  '데이트 코스로 추천합니다.',
  '혼밥하기에도 부담 없는 분위기예요.',
  '주말에 방문했는데 웨이팅이 있었지만 그만한 가치가 있어요.',
  '재료 본연의 맛을 살린 요리였어요.',
  '셰프님의 정성이 느껴졌습니다.'
]

// 사용자 이름 템플릿
const userNames = [
  '김민수', '이영희', '박지훈', '최수연', '정대현',
  '강서연', '윤준호', '임지원', '오세훈', '한예진',
  '송민재', '안지혜', '조현우', '신아름', '배준영',
  '류지민', '홍수빈', '권태양', '서하은', '문준서'
]

// 이미지 URL 생성 (30% 확률)
const generateImages = (storeId: number, reviewIndex: number): string[] | null => {
  if (Math.random() > 0.3) return null
  
  const imageCount = Math.floor(Math.random() * 3) + 1 // 1~3개
  return Array.from({ length: imageCount }, (_, i) => 
    `https://picsum.photos/400/300?random=${storeId}-${reviewIndex}-${i}`
  )
}

// 날짜 생성 (최근 90일 이내)
const generateDate = (): string => {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 90)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return date.toISOString()
}

// 더미 리뷰 데이터 생성 함수
export const generateDummyReviews = (storeId: number, count: number = 20): ReviewData[] => {
  const reviews: ReviewData[] = []
  
  for (let i = 0; i < count; i++) {
    const createdAt = generateDate()
    const updatedAt = createdAt
    const score = Math.random() < 0.7 ? (Math.random() < 0.5 ? 5 : 4) : Math.floor(Math.random() * 2) + 3 // 70%는 4-5점
    
    reviews.push({
      id: 1000 + i,
      order_id: 10000 + storeId * 100 + i,
      store_id: storeId,
      score,
      rating: score, // 하위 호환성
      content: reviewContents[Math.floor(Math.random() * reviewContents.length)],
      images: generateImages(storeId, i),
      status: 'VISIBLE',
      created_at: createdAt,
      updated_at: updatedAt,
      user_id: Math.floor(Math.random() * 100) + 1,
      user_name: userNames[Math.floor(Math.random() * userNames.length)],
      user_avatar: null
    })
  }
  
  // 최신순 정렬
  return reviews.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
}

// Store ID 2번에 대한 기본 더미 데이터
export const DUMMY_REVIEWS: ReviewData[] = generateDummyReviews(2, 20)

// 평균 평점 계산
export const calculateAverageRating = (reviews: ReviewData[]): number => {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, review) => acc + (review.score || review.rating || 0), 0)
  return Math.round((sum / reviews.length) * 10) / 10
}

// 평점별 개수
export const getRatingCounts = (reviews: ReviewData[]): Record<number, number> => {
  const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  reviews.forEach(review => {
    const rating = review.score || review.rating || 0
    counts[rating] = (counts[rating] || 0) + 1
  })
  return counts
}
