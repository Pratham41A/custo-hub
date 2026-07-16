import React from 'react';

export function PaginationControls({
  isLoading = false,
  hasMore = false,
  totalCount = 0,
  label = 'records',
  currentPage = 1,
  totalPages = 1,
  onPrev,
  onNext,
}) {
  const hasNextHandler = typeof onNext === 'function';
  const canGoNext = hasNextHandler && (hasMore || currentPage < totalPages);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 0 4px',
      marginTop: '12px',
      fontSize: '12px',
      color: '#64748b',
      flexWrap: 'wrap',
    }}>
      {isLoading ? (
        <>
          <span>Loading {label}...</span>
          <span className="spinner" />
        </>
      ) : hasNextHandler ? (
        <>
          <span>
            Page {currentPage} of {Math.max(totalPages, 1)}
          </span>

          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            style={{
              border: '1px solid #cbd5e1',
              background: canGoNext ? '#fff' : '#f8fafc',
              color: canGoNext ? '#0f172a' : '#94a3b8',
              borderRadius: '6px',
              padding: '6px 10px',
              cursor: canGoNext ? 'pointer' : 'not-allowed',
              fontSize: '12px',
            }}
          >
            Next →
          </button>
        </>
      ) : hasMore ? (
        <span>More {label} available</span>
      ) : totalCount === 0 ? (
        <span>No {label} found</span>
      ) : (
        <span>All {label} loaded</span>
      )}
    </div>
  );
}
