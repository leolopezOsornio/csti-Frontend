// src/pages/Home/Home.tsx
import { useEffect, useState } from 'react';
import { catalogService } from '../../services/catalogService';

import Hero from '../../components/Hero/Hero';
import CategoryGrid from '../../components/CategoryGrid/CategoryGrid';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel';
import styles from './Home.module.css';

const Home = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await catalogService.getHomeSections();
        setData(response);
      } catch (error) {
        console.error('Error cargando el Home', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) {
    return <div className={styles.stateMessage}>Cargando catálogo... ⏳</div>;
  }

  if (!data) {
    return <div className={styles.stateMessage}>Error al cargar la información.</div>;
  }

  return (
    <div className={styles.homeContainer}>
      <Hero />

      <div id="catalogo-start" className={styles.catalogoStart}></div>

      <CategoryGrid categorias={data.categorias_destacadas} />

      <ProductCarousel
        titulo="Ofertas Destacadas"
        items={data.ofertas_destacadas}
        tipo="producto"
      />

      <ProductCarousel
        titulo="Más Vendidos"
        items={data.mas_vendidos}
        tipo="producto"
      />

      <ProductCarousel
        titulo="Nuevos Productos"
        items={data.nuevos_productos}
        tipo="producto"
      />

      <ProductCarousel
        titulo="Marcas Destacadas"
        items={data.marcas_destacadas}
        tipo="marca"
      />
    </div>
  );
};

export default Home;