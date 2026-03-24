// src/pages/ProductList/components/Pagination.tsx
import { useSearchParams } from 'react-router-dom';
import styles from './Pagination.module.css';

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

  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className={styles.pagination}>
      {currentPage > 1 && (
        <button className={styles.pageBtn} onClick={() => handlePageChange(currentPage - 1)} type="button">
          &lt;
        </button>
      )}

      {pagesArray.map((page) => (
        <button
          key={page}
          className={`${styles.pageBtn} ${page === currentPage ? styles.active : ''}`}
          onClick={() => handlePageChange(page)}
          type="button"
        >
          {page}
        </button>
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