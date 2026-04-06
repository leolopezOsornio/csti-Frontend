// src/pages/ProductList/components/FilterSidebar.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogService } from '../../../../services/catalogService';
import styles from '../FilterSidebar/Filtersidebar.module.css';

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtros, setFiltros] = useState<any>(null);

  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const [showAllCats, setShowAllCats] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  useEffect(() => {
    // Cada vez que cambia la URL (searchParams), recargamos los filtros para obtener marcas dinámicas y contadores
    catalogService.getFilters(searchParams.toString()).then((data) => {
      setFiltros(data);
      // Sincronizamos los inputs locales de precio con la URL
      setMinPrice(searchParams.get('min_price') || '');
      setMaxPrice(searchParams.get('max_price') || '');
    });
  }, [searchParams]);

  const updateSearchParam = (key: string, value: string | null) => {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);

    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleApplyPrice = () => {
    if (minPrice) searchParams.set('min_price', minPrice);
    else searchParams.delete('min_price');

    if (maxPrice) searchParams.set('max_price', maxPrice);
    else searchParams.delete('max_price');

    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleMarcaToggle = (marcaName: string) => {
    const currentMarcas = searchParams.get('marcas')?.split(',') || [];
    const newMarcas = currentMarcas.includes(marcaName)
      ? currentMarcas.filter((m) => m !== marcaName)
      : [...currentMarcas, marcaName];

    updateSearchParam('marcas', newMarcas.length > 0 ? newMarcas.join(',') : null);
  };

  const handleCategoryClick = (slug: string) => {
    // Lógica visual del acordeón
    setExpandedCats((prev) => 
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );

    // Lógica de URL existente
    searchParams.set('categoria', slug);
    searchParams.delete('grupo');
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleSubCategoryClick = (grupoCva: string, parentSlug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    searchParams.set('grupo', grupoCva);
    searchParams.set('categoria', parentSlug);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  if (!filtros) {
    return <aside className={styles.sidebar}>Cargando filtros...</aside>;
  }

  const categoriasAMostrar = showAllCats
    ? filtros.categorias
    : filtros.categorias.slice(0, 5);

  const marcasAMostrar = showAllBrands
    ? filtros.marcas
    : filtros.marcas.slice(0, 8);

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>Filtrar por</h2>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Categorías</h3>
        <ul className={styles.filterList}>
          {categoriasAMostrar.map((c: any) => {
            const isActive = searchParams.get('categoria') === c.slug;

            return (
              <li key={c.id} className={styles.categoryItemContainer}>
                <div
                  className={`${styles.filterItem} ${isActive ? styles.activeText : ''}`}
                  onClick={() => handleCategoryClick(c.slug)}
                >
                  {expandedCats.includes(c.slug) ? '▾' : '›'} {c.name}
                </div>
                
                {/* Renderizado de Subcategorías (Acordeón) */}
                {expandedCats.includes(c.slug) && c.subcategorias && c.subcategorias.length > 0 && (
                  <ul style={{ marginLeft: '1.2rem', padding: '4px 0', listStyle: 'none' }}>
                    {c.subcategorias.map((sub: any) => {
                      const subActive = searchParams.get('grupo') === sub.grupo;
                      return (
                        <li 
                          key={sub.id} 
                          className={`${styles.filterItem} ${subActive ? styles.activeText : ''}`}
                          style={{ fontSize: '0.85rem', marginBottom: '4px' }}
                          onClick={(e) => handleSubCategoryClick(sub.grupo, c.slug, e)}
                        >
                          - {sub.name}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {filtros.categorias.length > 5 && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowAllCats(!showAllCats)}
          >
            {showAllCats ? 'Ver menos' : '+ Ver más'}
          </button>
        )}
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Rango de Precio</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          <input
            type="number"
            placeholder="Min"
            className={styles.priceInput}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #eee' }}
          />
          <span style={{ color: '#ccc' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            className={styles.priceInput}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #eee' }}
          />
        </div>
        <button 
          onClick={handleApplyPrice}
          style={{ 
            width: '100%', 
            padding: '10px', 
            background: '#00b4d8', 
            color: 'white', 
            border: 'none', 
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'opacity 0.2s'
          }}
        >
          Aplicar Rango
        </button>
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Marcas</h3>
        <ul className={styles.filterList}>
          {marcasAMostrar.map((m: any) => {
            const isChecked = (searchParams.get('marcas')?.split(',') || []).includes(
              m.name.toUpperCase()
            );

            return (
              <li key={m.id} className={styles.filterItem}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isChecked}
                  onChange={() => handleMarcaToggle(m.name.toUpperCase())}
                />
                <span className={isChecked ? styles.activeText : ''}>
                  {m.name} ({m.count})
                </span>
              </li>
            );
          })}
        </ul>

        {filtros.marcas.length > 8 && (
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => setShowAllBrands(!showAllBrands)}
          >
            {showAllBrands ? 'Ver menos' : '+ Ver más'}
          </button>
        )}
      </div>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Disponibilidad</h3>
        <ul className={styles.filterList}>
          <li className={styles.filterItem}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={searchParams.get('in_stock') === 'true'}
              onChange={(e) =>
                updateSearchParam('in_stock', e.target.checked ? 'true' : null)
              }
            />
            Solo en stock
          </li>
        </ul>
      </div>

      {Array.from(searchParams.keys()).length > 0 && (
        <button
          type="button"
          className={styles.clearBtn}
          onClick={() => setSearchParams({})}
        >
          Limpiar todos los filtros
        </button>
      )}
    </aside>
  );
};

export default FilterSidebar;