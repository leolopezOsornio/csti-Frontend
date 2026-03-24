// src/pages/BrandDetail/BrandDetail.tsx
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { catalogService } from '../../services/catalogService';
import ProductCard from '../../components/ProductCard/ProductCard';
import styles from './BrandDetail.module.css';

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
        setError('No se encontraron productos para esta marca o la marca no existe.');
      } finally {
        setLoading(false);
      }
    };

    fetchBrand();
  }, [slug, page]);

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        Cargando marca... ⏳
      </div>
    );
  }

  if (error) return <p className="catalogo-error">{error}</p>;
  if (!data) return null;

  const { marca, productos, paginacion } = data;

  return (
    <section className={styles['marca-page']}>
      <header className={styles['marca-header']}>
        {marca.logo_url && (
          <img
            src={marca.logo_url}
            alt={marca.name}
            className={styles['marca-header__logo']}
          />
        )}

        <div>
          <h1 className={styles['marca-header__title']}>{marca.name}</h1>
          <p className={styles['marca-header__sub']}>
            Productos de esta marca en FastClick
          </p>
        </div>
      </header>

      {productos && productos.length > 0 ? (
        <section>
          <div>
            <h2>Todos los productos</h2>
          </div>

          <div className={styles['grid-marca']}>
            {productos.map((p: any) => (
              <ProductCard key={p.clave} producto={p} />
            ))}
          </div>
        </section>
      ) : (
        <p className="catalogo-error">No se encontraron productos para esta marca.</p>
      )}

      {paginacion && paginacion.total_paginas > 1 && (
        <div className={styles.paginacion}>
          {paginacion.pagina_actual > 1 && (
            <button
              className={styles['btn-pag']}
              onClick={() => handlePageChange(paginacion.pagina_actual - 1)}
            >
              ← Anterior
            </button>
          )}

          <span className={styles['pagina-info']}>
            Página {paginacion.pagina_actual} de {paginacion.total_paginas}
          </span>

          {paginacion.pagina_actual < paginacion.total_paginas && (
            <button
              className={styles['btn-pag']}
              onClick={() => handlePageChange(paginacion.pagina_actual + 1)}
            >
              Siguiente →
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default BrandDetail;