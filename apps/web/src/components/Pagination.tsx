interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter((p) => {
    if (totalPages <= 7) return true;
    if (p === 1 || p === totalPages) return true;
    if (p >= currentPage - 1 && p <= currentPage + 1) return true;
    return false;
  });

  const renderPage = (page: number) => (
    <button
      key={page}
      onClick={() => onPageChange(page)}
      className={`w-8 h-8 text-sm rounded-lg transition-colors ${
        page === currentPage
          ? 'bg-[var(--color-ink-soft)] text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {page}
    </button>
  );

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-8 h-8 text-sm rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ‹
      </button>

      {visiblePages[0] > 1 && (
        <>
          {renderPage(1)}
          {visiblePages[0] > 2 && <span className="text-slate-300">...</span>}
        </>
      )}

      {visiblePages.map(renderPage)}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="text-slate-300">...</span>
          )}
          {renderPage(totalPages)}
        </>
      )}

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-8 h-8 text-sm rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        ›
      </button>
    </div>
  );
}