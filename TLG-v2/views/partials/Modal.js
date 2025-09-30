export function Modal({ title, content, onClose }) {
  return `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal">
        <div class="modal__header">
          <h2 class="modal__title">${title}</h2>
          <button class="modal__close" id="modalClose">✕</button>
        </div>
        <div class="modal__body">
          ${content}
        </div>
      </div>
    </div>
  `;
}

export function showModal(title, content) {
  const modalHTML = Modal({ title, content });
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  
  const close = () => {
    overlay.remove();
  };
  
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
}
