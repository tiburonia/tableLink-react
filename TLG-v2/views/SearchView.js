import { StoreCard } from './partials/StoreCard.js';

export function renderSearchPage(root) {
  root.innerHTML = `
    <section class="search-page">
      <div class="search-page__header">
        <button id="backBtn" class="back-btn">←</button>
        <div class="search-page__bar">
          <input 
            id="searchInput" 
            class="search-input"
            placeholder="매장명, 카테고리, 위치"
            autofocus
          />
          <button id="searchBtn" class="search-btn">검색</button>
        </div>
      </div>
      <div id="searchResult" class="search-page__result">
        <div class="search-page__placeholder">
          검색어를 입력해주세요
        </div>
      </div>
    </section>
  `;
  
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.hash = '#/';
  });
  
  document.getElementById('searchBtn').addEventListener('click', () => {
    const q = document.getElementById('searchInput').value.trim();
    if (q) {
      const evt = new CustomEvent('tlg:search', { detail: { q } });
      window.dispatchEvent(evt);
    }
  });
  
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('searchBtn').click();
    }
  });
}

export function renderSearchResults({ stores, error }) {
  const box = document.getElementById('searchResult');
  if (!box) return;
  
  if (error) {
    box.innerHTML = `<div class="search-page__error">${error}</div>`;
    return;
  }
  
  if (!stores?.length) {
    box.innerHTML = `<div class="search-page__empty">검색 결과가 없습니다</div>`;
    return;
  }
  
  box.innerHTML = `
    <div class="search-page__count">${stores.length}개의 매장</div>
    <div class="search-page__list">
      ${stores.map(StoreCard).join('')}
    </div>
  `;
  
  document.querySelectorAll('.store-card').forEach(card => {
    card.addEventListener('click', () => {
      const storeId = card.dataset.id;
      console.log('Navigate to store:', storeId);
    });
  });
}
