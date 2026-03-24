// src/pages/ProductList/components/FilterSidebar.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogService } from '../../../../services/catalogService';
import styles from '../FilterSidebar/Filtersidebar.module.css';

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtros, setFiltros] = useState<any>(null);

  const [localPrice, setLocalPrice] = useState(50000);
  const [showAllCats, setShowAllCats] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  useEffect(() => {
    catalogService.getFilters().then((data) => {
      setFiltros(data);
      const currentMaxPrice = searchParams.get('max_price');
      setLocalPrice(currentMaxPrice ? Number(currentMaxPrice) : data.precio_maximo);
    });
  }, []);

  const updateSearchParam = (key: string, value: string | null) => {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);

    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  const handleMarcaToggle = (marcaSlug: string) => {
    const currentMarcas = searchParams.get('marcas')?.split(',') || [];
    const newMarcas = currentMarcas.includes(marcaSlug)
      ? currentMarcas.filter((m) => m !== marcaSlug)
      : [...currentMarcas, marcaSlug];

    updateSearchParam('marcas', newMarcas.length > 0 ? newMarcas.join(',') : null);
  };

  if (!filtros) {
    return <aside className={styles.sidebar}>Cargando filtros...</aside>;
  }

  const categoriasAMostrar = showAllCats
    ? filtros.categorias
    : filtros.categorias.slice(0, 5);

  const marcasAMostrar = showAllBrands
    ? filtros.marcas
    : filtros.marcas.slice(0, 6);

  return (
    <aside className={styles.sidebar}>
      <h2 className={styles.sidebarTitle}>Filtrar por</h2>

      <div className={styles.filterGroup}>
        <h3 className={styles.filterTitle}>Categorías</h3>
        <ul className={styles.filterList}>
          {categoriasAMostrar.map((c: any) => {
            const isActive = searchParams.get('grupo') === c.slug;

            return (
              <li
                key={c.id}
                className={styles.filterItem}
                onClick={() => updateSearchParam('grupo', c.slug)}
              >
                <span className={isActive ? styles.activeText : ''}>
                  › {c.name}
                </span>
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
        <h3 className={styles.filterTitle}>Precio</h3>
        <input
          type="range"
          min="0"
          max={filtros.precio_maximo}
          value={localPrice}
          onChange={(e) => setLocalPrice(Number(e.target.value))}
          onMouseUp={(e) =>
            updateSearchParam('max_price', (e.target as HTMLInputElement).value)
          }
          onTouchEnd={(e) =>
            updateSearchParam('max_price', (e.target as HTMLInputElement).value)
          }
          className={styles.priceRange}
        />
        <div className={styles.priceLabels}>
          <span>Min: $0</span>
          <span>Max: ${localPrice.toLocaleString()}</span>
        </div>
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
                {m.name}
              </li>
            );
          })}
        </ul>

        {filtros.marcas.length > 6 && (
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