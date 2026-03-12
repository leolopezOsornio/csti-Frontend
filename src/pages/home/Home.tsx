// src/pages/Home/Home.tsx
import { useEffect, useState } from 'react';
import { catalogService } from '../../services/catalogService';

// Importamos nuestros bloques modulares
import Hero from '../../components/Hero/Hero';
import CategoryGrid from '../../components/CategoryGrid/CategoryGrid';
import ProductCarousel from '../../components/ProductCarousel/ProductCarousel';

/**
 * PÁGINA: Home
 * UBICACIÓN: src/pages/Home/Home.tsx
 * * FUNCIÓN: 
 * Actúa como el "Controlador" o "Padre" de la vista principal. 
 * Su única responsabilidad lógica es hacer la petición HTTP al backend (Django) mediante 
 * el catalogService para obtener el JSON con todas las secciones. 
 * Maneja el estado de carga (loading) y, una vez que tiene los datos, los distribuye 
 * pasándolos como "props" (propiedades) a los componentes modulares hijos 
 * (Hero, CategoryGrid, ProductCarousel) para que ellos se encarguen de dibujarlos.
 */

const Home = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const response = await catalogService.getHomeSections();
        setData(response);
      } catch (error) {
        console.error("Error cargando el Home", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando catálogo... ⏳</div>;
  if (!data) return <div style={{ textAlign: 'center', padding: '50px' }}>Error al cargar la información.</div>;

  return (
    <div className="home-container">
      {/* 1. Hero Banners */}
      <Hero />
      
      <div id="catalogo-start" style={{ paddingTop: '40px' }}></div>
      
      {/* 2. Categorías */}
      <CategoryGrid categorias={data.categorias_destacadas} />

      {/* 3. Ofertas (Productos) */}
      <ProductCarousel 
        titulo="Ofertas Destacadas" 
        items={data.ofertas_destacadas} 
        tipo="producto"
      />
      
      {/* 4. Más Vendidos (Productos) */}
      <ProductCarousel 
        titulo="Más Vendidos" 
        items={data.mas_vendidos} 
        tipo="producto"
      />

      {/* 5. Novedades (Productos) */}
      <ProductCarousel 
        titulo="Nuevos Productos" 
        items={data.nuevos_productos} 
        tipo="producto"
      />

      {/* 6. Marcas */}
      <ProductCarousel 
        titulo="Marcas Destacadas" 
        items={data.marcas_destacadas} 
        tipo="marca"
      />
    </div>
  );
};

export default Home;