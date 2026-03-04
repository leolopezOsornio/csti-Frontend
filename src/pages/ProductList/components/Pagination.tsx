// src/pages/ProductList/components/Pagination.tsx
import { useSearchParams } from 'react-router-dom';

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
    window.scrollTo(0, 0); // Regresa al inicio al cambiar página
  };

  // Generamos un arreglo simple de páginas [1, 2, 3...]
  const pagesArray = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="pl-pagination">
      {currentPage > 1 && (
        <button className="pl-page-btn" onClick={() => handlePageChange(currentPage - 1)}>
          &lt;
        </button>
      )}

      {pagesArray.map(page => (
        <button 
          key={page}
          className={`pl-page-btn ${page === currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </button>
      ))}

      {currentPage < totalPages && (
        <button className="pl-page-btn" onClick={() => handlePageChange(currentPage + 1)}>
          &gt;
        </button>
      )}
    </div>
  );
};

export default Pagination;