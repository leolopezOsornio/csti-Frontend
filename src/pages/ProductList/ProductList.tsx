// src/pages/ProductList/ProductList.tsx
import { useState } from 'react'; // <-- 1. Importar useState
import { useSearchParams } from 'react-router-dom';
import FilterSidebar from './components/FilterSidebar';
import TopBar from './components/TopBar';
import ProductItem from './components/ProductItem';
import Pagination from './components/Pagination';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'; // <-- 2. Importamos el icono
import { faFilter } from '@fortawesome/free-solid-svg-icons';
import './ProductList.css';

// Datos falsos basados en tu imagen para maquetar
const mockProducts = [
  { clave: 'P1', marca: 'HP', descripcion: 'Laptop HP Spectre x360 14-ea1000la 13.5" OLED, Intel Core i7, 16GB RAM...', precio: 22499.00, imagen: '/img/laptop.png' },
  { clave: 'P2', marca: 'DELL', descripcion: 'Desktop Dell XPS 8940 Intel Core i9-11900K, 32GB RAM, NVIDIA RTX 3070...', precio: 29999.00, imagen: '/img/laptop.png' },
  { clave: 'P3', marca: 'LENOVO', descripcion: 'Laptop Lenovo ThinkPad X1 Carbon Gen 9 14" Intel Core i7, 16GB RAM...', precio: 19999.00, imagen: '/img/laptop.png' },
  { clave: 'P4', marca: 'ASUS', descripcion: 'Laptop ASUS ROG Zephyrus G14 14" AMD Ryzen 9, 32GB RAM, NVIDIA RTX 3080...', precio: 34999.00, imagen: '/img/laptop.png' },
  { clave: 'P5', marca: 'APPLE', descripcion: 'Apple MacBook Pro 16" M1 Max chip, 32GB RAM, 1TB SSD, Silver...', precio: 45499.00, imagen: '/img/laptop.png' },
  { clave: 'P6', marca: 'SAMSUNG', descripcion: 'Monitor Samsung Odyssey G9 Gaming Monitor 49" Dual QHD, 240Hz...', precio: 17999.00, imagen: '/img/laptop.png' },
  { clave: 'P7', marca: 'HP', descripcion: 'Impresora Multifuncional HP LaserJet Pro MFP M428fdw Láser...', precio: 5999.00, imagen: '/img/laptop.png' },
  { clave: 'P8', marca: 'DELL', descripcion: 'Laptop Dell Latitude 7420 14" Intel Core i5, 8GB RAM, 256GB SSD...', precio: 14999.00, imagen: '/img/laptop.png' },
];

const ProductList = () => {
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('desc');
  
  // 3. Nuevo estado para controlar la visibilidad en móviles
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  return (
    <div className="pl-page-container">
      
      {/* 4. Contenedor de filtros con clase dinámica */}
      <div className="pl-sidebar-section">
        {/* Botón exclusivo para móviles */}
        <button 
          className="pl-mobile-filter-btn"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <FontAwesomeIcon icon={faFilter} /> 
          {isFilterOpen ? ' Ocultar Filtros' : ' Mostrar Filtros'}
        </button>

        {/* Envolvemos el sidebar para controlarlo con CSS */}
        <div className={`pl-sidebar-wrapper ${isFilterOpen ? 'open' : ''}`}>
          <FilterSidebar />
        </div>
      </div>

      {/* Columna Derecha: Contenido */}
      <div className="pl-content">
        
        {searchTerm && (
          <h2 style={{ marginBottom: '15px', color: '#333' }}>
            Resultados para: "{searchTerm}"
          </h2>
        )}

        <TopBar />

        <div className="pl-grid">
          {mockProducts.map((prod) => (
            <ProductItem key={prod.clave} product={prod} />
          ))}
        </div>

        <Pagination />
      </div>

    </div>
  );
};

export default ProductList;