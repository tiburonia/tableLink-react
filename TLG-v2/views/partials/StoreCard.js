export function StoreCard(store) {
  return `
    <div class="store-card" data-id="${store.id}">
      <div class="store-card__title">🏪 ${store.name}</div>
      <div class="store-card__meta">
        ${store.category ?? ''} • ★${store.ratingAverage ?? '0.0'}
      </div>
      ${store.address ? `<div class="store-card__address">${store.address}</div>` : ''}
    </div>
  `;
}
