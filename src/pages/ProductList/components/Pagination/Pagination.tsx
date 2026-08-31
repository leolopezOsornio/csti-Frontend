import { useSearchParams } from 'react-router-dom';
import styles from '../Pagination/Pagination.module.css';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
}

const Pagination = ({ totalPages, currentPage }: PaginationProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    searchParams.set('page', page.toString());
    setSearchParams(searchParams);
    window.scrollTo(0, 0);
  };

  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);

    return pages;
  };

  const pagesArray = getVisiblePages();

  return (
    <div className={styles.pagination}>
      {currentPage > 1 && (
        <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage - 1)} type="button">
          &lt;
        </button>
      )}

      {pagesArray.map((page, idx) => (
        page === '...' ? (
          <span key={`dots-${idx}`} className={styles.dots}>...</span>
        ) : (
          <button
            key={page}
            className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
            onClick={() => handlePageChange(page as number)}
            type="button"
          >
            {page}
          </button>
        )
      ))}

      {currentPage < totalPages && (
        <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage + 1)} type="button">
          &gt;
        </button>
      )}
    </div>
  );
};

export default Pagination;
