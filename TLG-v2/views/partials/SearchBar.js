export function SearchBar(placeholder = '매장명, 카테고리, 위치') {
  return `
    <div class="search-bar">
      <input 
        type="text" 
        id="searchInput" 
        class="search-bar__input" 
        placeholder="${placeholder}"
      />
      <button id="searchBtn" class="search-bar__button">검색</button>
    </div>
  `;
}
