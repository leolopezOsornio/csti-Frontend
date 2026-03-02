// src/pages/BrandDetail/BrandDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import ProductCard from '../../components/ProductCard/ProductCard';
import './BrandDetail.css';

/**
 * PÁGINA: BrandDetail
 * UBICACIÓN: src/pages/BrandDetail/BrandDetail.tsx
 * * FUNCIÓN:
 * Renderiza la vista de una marca específica. Usa useParams() para leer
 * el 'slug' de la URL y useSearchParams() para leer la página actual.
 * Pide al backend la información de la marca y la lista de sus productos,
 * renderizándolos en una cuadrícula (grid) y manejando la paginación.
 */

const BrandDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!slug) return;
      setLoading(true);
      setError(null);
      try {
        const response = await catalogService.getBrandDetail(slug, page);
        setData(response);
      } catch (err) {
        setError("No se encontraron productos para esta marca o la marca no existe.");
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [slug, page]); // Se vuelve a ejecutar si cambia el slug o la página

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo(0, 0); // Sube la pantalla al cambiar de página
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando marca... ⏳</div>;
  if (error) return <p className="catalogo-error">{error}</p>;
  if (!data) return null;

  const { marca, productos, paginacion } = data;

  return (
    <section className="catalogo-container marca-page">
      <header className="marca-header">
        {marca.logo_url && (
          <img src={marca.logo_url} alt={marca.name} className="marca-header__logo" />
        )}
        <div>
          <h1 className="marca-header__title">{marca.name}</h1>
          <p className="marca-header__sub">Productos de esta marca en CSTI</p>
        </div>
      </header>

      {productos && productos.length > 0 ? (
        <section className="bloque">
          <div className="bloque__header">
            <h2 className="bloque__titulo">TODOS LOS PRODUCTOS</h2>
          </div>

          <div className="grid-marca">
            {productos.map((p: any) => (
              // Reutilizamos nuestro componente modular
              <ProductCard key={p.clave} producto={p} />
            ))}
          </div>
        </section>
      ) : (
        <p className="catalogo-error">No se encontraron productos para esta marca.</p>
      )}

      {/* PAGINACIÓN */}
      {paginacion && paginacion.total_paginas > 1 && (
        <div className="paginacion">
          {paginacion.pagina_actual > 1 && (
            <button className="btn-pag" onClick={() => handlePageChange(paginacion.pagina_actual - 1)}>
              ← Anterior
            </button>
          )}

          <span className="pagina-info">
            Página {paginacion.pagina_actual} de {paginacion.total_paginas}
          </span>

          {paginacion.pagina_actual < paginacion.total_paginas && (
            <button className="btn-pag" onClick={() => handlePageChange(paginacion.pagina_actual + 1)}>
              Siguiente →
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default BrandDetail;