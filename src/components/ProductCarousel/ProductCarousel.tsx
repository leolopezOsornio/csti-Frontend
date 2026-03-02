// src/components/ProductCarousel/ProductCarousel.tsx
import { useRef } from 'react';
import ProductCard from '../ProductCard/ProductCard';
import BrandCard from '../BrandCard/BrandCard'; // <-- Importamos la nueva tarjeta
import './ProductCarousel.css';

/**
 * COMPONENTE: ProductCarousel
 * UBICACIÓN: src/components/ProductCarousel/ProductCarousel.tsx
 * * FUNCIÓN: 
 * Contenedor horizontal deslizable (slider). Utiliza el hook useRef para acceder 
 * directamente al elemento del DOM y permitir el scroll horizontal mediante botones.
 * Es un componente altamente reutilizable: dependiendo del prop "tipo" ('producto' o 'marca'), 
 * decide qué componente hijo iterar (ProductCard o BrandCard) para llenar la cinta.
 */

interface ProductCarouselProps {
  titulo: string;
  items: any[];
  tipo?: 'producto' | 'marca';
}

const ProductCarousel = ({ titulo, items, tipo = 'producto' }: ProductCarouselProps) => {
  const cintaRef = useRef<HTMLDivElement>(null);

  const scroll = (direccion: 'izq' | 'der') => {
    if (cintaRef.current) {
      const scrollAmount = 260 * 3 * (direccion === 'der' ? 1 : -1);
      cintaRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="bloque">
      <div className="bloque__header">
        <h2 className="bloque__titulo">{titulo.toUpperCase()}</h2>
      </div>

      <button className="ctrl flecha izq" onClick={() => scroll('izq')}>&#10094;</button>
      <button className="ctrl flecha der" onClick={() => scroll('der')}>&#10095;</button>

      <div className="cinta" ref={cintaRef}>
        {items.map((item, idx) => (
          tipo === 'producto' ? (
            <ProductCard key={item.clave || idx} producto={item} />
          ) : (
            // Usamos nuestro componente dedicado
            <BrandCard key={item.id || idx} brand={item} />
          )
        ))}
      </div>
    </section>
  );
};

export default ProductCarousel;