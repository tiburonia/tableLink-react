export type FeedTab = 'all' | 'following' | 'event' | 'menu';

export const feedTabs = [
  { id: 'all' as FeedTab, label: '전체', icon: '📢' },
  { id: 'following' as FeedTab, label: '내 단골', icon: '❤️' },
  { id: 'event' as FeedTab, label: '이벤트', icon: '🎉' },
  { id: 'menu' as FeedTab, label: '신메뉴', icon: '🍽️' }
];
