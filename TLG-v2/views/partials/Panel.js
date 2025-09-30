export function Panel({ title, content, className = '' }) {
  return `
    <div class="panel ${className}">
      ${title ? `<div class="panel__header">${title}</div>` : ''}
      <div class="panel__body">${content}</div>
    </div>
  `;
}
