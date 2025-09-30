import { searchService } from '../services/searchService.js';
import { renderSearchResults } from '../views/SearchView.js';

export async function handleSearch(keyword, mapCenter) {
  try {
    const result = await searchService.combined(keyword, mapCenter);
    renderSearchResults(result);
    return result;
  } catch (error) {
    console.error('Search failed:', error);
    renderSearchResults({ stores: [], error: '검색 중 오류가 발생했습니다.' });
    throw error;
  }
}

export async function handleNearbySearch(lat, lng, radius) {
  try {
    const stores = await searchService.nearby(lat, lng, radius);
    renderSearchResults({ stores });
    return stores;
  } catch (error) {
    console.error('Nearby search failed:', error);
    renderSearchResults({ stores: [], error: '주변 검색 중 오류가 발생했습니다.' });
    throw error;
  }
}
