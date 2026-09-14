export function renderPagination(totalItems, currentPage, itemsPerPage) {
  if (totalItems <= itemsPerPage) return '';

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  let pagesHtml = '';
  // Show at most 7 page buttons (e.g., 1 2 3 ... 10) to avoid overflow
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pagesHtml += `<button class="fin-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
  } else {
    // Basic windowing
    if (currentPage <= 4) {
      for (let i = 1; i <= 5; i++) pagesHtml += `<button class="fin-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      pagesHtml += `<span class="fin-page-ellipsis">...</span>`;
      pagesHtml += `<button class="fin-page-btn" data-page="${totalPages}">${totalPages}</button>`;
    } else if (currentPage >= totalPages - 3) {
      pagesHtml += `<button class="fin-page-btn" data-page="1">1</button>`;
      pagesHtml += `<span class="fin-page-ellipsis">...</span>`;
      for (let i = totalPages - 4; i <= totalPages; i++) pagesHtml += `<button class="fin-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else {
      pagesHtml += `<button class="fin-page-btn" data-page="1">1</button>`;
      pagesHtml += `<span class="fin-page-ellipsis">...</span>`;
      for (let i = currentPage - 1; i <= currentPage + 1; i++) pagesHtml += `<button class="fin-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
      pagesHtml += `<span class="fin-page-ellipsis">...</span>`;
      pagesHtml += `<button class="fin-page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }
  }

  return `
    <div class="fin-pagination-container">
      <div class="fin-pagination-info">Showing ${startItem}–${endItem} of ${totalItems}</div>
      <div class="fin-pagination-controls">
        <button class="fin-page-btn fin-page-prev" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled aria-disabled="true"' : ''}>&larr; Previous</button>
        ${pagesHtml}
        <button class="fin-page-btn fin-page-next" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled aria-disabled="true"' : ''}>Next &rarr;</button>
      </div>
    </div>
  `;
}

export function setupPaginationListeners(container, onPageChange) {
  const controls = container.querySelector('.fin-pagination-controls');
  if (!controls) return;

  controls.addEventListener('click', (e) => {
    const btn = e.target.closest('.fin-page-btn');
    if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
    
    const page = parseInt(btn.dataset.page, 10);
    if (!isNaN(page)) {
      onPageChange(page);
    }
  });
}
