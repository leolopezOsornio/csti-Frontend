// src/components/CategoryGrid/CategoryGrid.tsx
import { Link } from 'react-router-dom';
import './CategoryGrid.css';

/**
 * COMPONENTE: CategoryGrid
 * UBICACIÓN: src/components/CategoryGrid/CategoryGrid.tsx
 * * FUNCIÓN: 
 * Componente de presentación puro. Recibe como prop un arreglo de objetos "categorias" 
 * y se encarga de iterarlos (.map) para renderizar una cuadrícula visual. 
 * Cada elemento generado es un enlace (Link de react-router-dom) que redirigirá 
 * al usuario a la página de listado aplicando el filtro de esa categoría en específico.
 */

interface Category {
  id: number;
  name: string;
  slug: string;
  image_url: string;
}

interface CategoryGridProps {
  categorias: Category[];
}

const CategoryGrid = ({ categorias }: CategoryGridProps) => {
  // Si no hay categorías, no renderizamos el bloque vacío
  if (!categorias || categorias.length === 0) return null;

  return (
    <section className="bloque">
      <div className="bloque__header">
        <h2 className="bloque__titulo">CATEGORÍAS POPULARES</h2>
      </div>
      
      <div className="cat-grid">
        {categorias.map((cat) => (
          // Usamos Link de React Router en lugar de la etiqueta <a> de HTML
          <Link to={`/listado?categoria=${cat.slug}`} key={cat.id} className="cat-card">
            <img 
              src={cat.image_url || '/img/category-placeholder.png'} 
              alt={cat.name} 
              className="cat-img" 
            />
            <div className="cat-title">{cat.name}</div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default CategoryGrid;