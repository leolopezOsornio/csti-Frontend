// src/pages/ProductList/ProductList.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';

import FilterSidebar from './components/FilterSidebar';
import TopBar from './components/TopBar';
import ProductItem from './components/ProductItem';
import Pagination from './components/Pagination';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import './ProductList.css';

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Estados reales para almacenar los datos del backend
  const [productos, setProductos] = useState<any[]>([]);
  const [paginacion, setPaginacion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Cada vez que cambia la URL (búsqueda, filtro, paginación), se ejecuta este useEffect
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await catalogService.getProductsList(searchParams.toString());
        setProductos(data.resultados);
        setPaginacion(data.paginacion);
      } catch (error) {
        console.error("Error al cargar la lista de productos", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  return (
    <div className="pl-page-container">
      
      <div className="pl-sidebar-section">
        <button 
          className="pl-mobile-filter-btn"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <FontAwesomeIcon icon={faFilter} /> 
          {isFilterOpen ? ' Ocultar Filtros' : ' Mostrar Filtros'}
        </button>

        <div className={`pl-sidebar-wrapper ${isFilterOpen ? 'open' : ''}`}>
          <FilterSidebar />
        </div>
      </div>

      <div className="pl-content">
        
        {searchTerm && (
          <h2 style={{ marginBottom: '15px', color: '#333' }}>
            Resultados para: "{searchTerm}"
          </h2>
        )}

        <TopBar 
          totalItems={paginacion?.total_productos || 0} 
          currentPage={paginacion?.pagina_actual || 1} 
        />

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#666' }}>
            Buscando productos... ⏳
          </div>
        ) : productos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#dc3545' }}>
            <h3>No se encontraron productos</h3>
            <p>Intenta con otros filtros o términos de búsqueda.</p>
          </div>
        ) : (
          <div className="pl-grid">
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