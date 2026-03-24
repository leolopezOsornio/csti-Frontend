// src/pages/ProductList/ProductList.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import FilterSidebar from './components/FilterSidebar/FilterSidebar';
import TopBar from './components/TopBar/TopBar';
import ProductItem from './components/ProductItem/ProductItem';
import Pagination from './components/Pagination/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import styles from './ProductList.module.css';

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [productos, setProductos] = useState<any[]>([]);
  const [paginacion, setPaginacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await catalogService.getProductsList(searchParams.toString());
        setProductos(data.resultados);
        setPaginacion(data.paginacion);
      } catch (error) {
        console.error('Error al cargar la lista de productos', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.sidebarSection}>
        <button
          className={styles.mobileFilterBtn}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          type="button"
        >
          <FontAwesomeIcon icon={faFilter} />
          {isFilterOpen ? ' Ocultar Filtros' : ' Mostrar Filtros'}
        </button>

        <div className={`${styles.sidebarWrapper} ${isFilterOpen ? styles.open : ''}`}>
          <FilterSidebar />
        </div>
      </div>

      <div className={styles.content}>
        {searchTerm && (
          <h2 className={styles.searchTitle}>
            Resultados para: "{searchTerm}"
          </h2>
        )}

        <TopBar
          totalItems={paginacion?.total_productos || 0}
          currentPage={paginacion?.pagina_actual || 1}
        />

        {loading ? (
          <div className={styles.loadingState}>
            Buscando productos... ⏳
          </div>
        ) : productos.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No se encontraron productos</h3>
            <p>Intenta con otros filtros o términos de búsqueda.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {productos.map((prod) => (
              <ProductItem key={prod.clave} product={prod} />
            ))}
          </div>
        )}

        {paginacion && !loading && (
          <Pagination
            totalPages={paginacion.total_paginas}
            currentPage={paginacion.pagina_actual}
          />
        )}
      </div>
    </div>
  );
};

export default ProductList;