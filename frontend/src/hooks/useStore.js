
import { useQuery } from '@tanstack/react-query';

export const useStore = (storeId) => {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${storeId}`);
      if (!response.ok) throw new Error('매장 정보를 불러올 수 없습니다');
      const data = await response.json();
      return data.store;
    },
    enabled: !!storeId,
  });
};
