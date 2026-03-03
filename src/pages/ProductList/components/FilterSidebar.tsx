// src/pages/ProductList/components/FilterSidebar.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { catalogService } from '../../../services/catalogService';

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtros, setFiltros] = useState<any>(null);

  // Estados locales
  const [localPrice, setLocalPrice] = useState(50000);
  const [showAllCats, setShowAllCats] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  // 1. Cargar filtros disponibles al montar el componente
  useEffect(() => {
    catalogService.getFilters().then(data => {
      setFiltros(data);
      // Sincronizar el slider con el precio máximo inicial o el de la URL
      const currentMaxPrice = searchParams.get('max_price');
      setLocalPrice(currentMaxPrice ? Number(currentMaxPrice) : data.precio_maximo);
    });
  }, []);

  // 2. Manejadores de cambios en los filtros
  const updateSearchParam = (key: string, value: string | null) => {
    if (value) searchParams.set(key, value);
    else searchParams.delete(key);
    searchParams.set('page', '1'); // Resetear a pag 1 al filtrar
    setSearchParams(searchParams);
  };

  const handleMarcaToggle = (marcaSlug: string) => {
    const currentMarcas = searchParams.get('marcas')?.split(',') || [];
    const newMarcas = currentMarcas.includes(marcaSlug)
      ? currentMarcas.filter(m => m !== marcaSlug)
      : [...currentMarcas, marcaSlug];
    updateSearchParam('marcas', newMarcas.length > 0 ? newMarcas.join(',') : null);
  };

  if (!filtros) return <aside className="pl-sidebar">Cargando filtros...</aside>;

  // Variables para la vista "Ver más"
  const categoriasAMostrar = showAllCats ? filtros.categorias : filtros.categorias.slice(0, 5);
  const marcasAMostrar = showAllBrands ? filtros.marcas : filtros.marcas.slice(0, 6);

  return (
    <aside className="pl-sidebar">
      <h2>Filtrar por</h2>

      {/* CATEGORÍAS */}
      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Categorías</h3>
        <ul className="pl-filter-list">
          {categoriasAMostrar.map((c: any) => (
            <li key={c.id} onClick={() => updateSearchParam('grupo', c.slug)}>
              <span style={{ color: searchParams.get('grupo') === c.slug ? '#00b4d8' : 'inherit' }}>
                › {c.name}
              </span>
            </li>
          ))}
        </ul>
        {filtros.categorias.length > 5 && (
          <button style={btnVerMasEstilo} onClick={() => setShowAllCats(!showAllCats)}>
            {showAllCats ? 'Ver menos' : '+ Ver más'}
          </button>
        )}
      </div>

      {/* PRECIO (Slider) */}
      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Precio</h3>
        <input 
          type="range" 
          min="0" 
          max={filtros.precio_maximo} 
          value={localPrice} 
          onChange={(e) => setLocalPrice(Number(e.target.value))}
          onMouseUp={(e) => updateSearchParam('max_price', (e.target as HTMLInputElement).value)}
          onTouchEnd={(e) => updateSearchParam('max_price', (e.target as HTMLInputElement).value)}
          className="pl-price-range"
        />
        <div className="pl-price-labels">
          <span>Min: $0</span>
          <span>Max: ${localPrice.toLocaleString()}</span>
        </div>
      </div>

      {/* MARCAS */}
      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Marcas</h3>
        <ul className="pl-filter-list">
          {marcasAMostrar.map((m: any) => {
            const isChecked = (searchParams.get('marcas')?.split(',') || []).includes(m.name.toUpperCase());
            return (
              <li key={m.id}>
                <input 
                  type="checkbox" 
                  className="pl-checkbox" 
                  checked={isChecked}
                  onChange={() => handleMarcaToggle(m.name.toUpperCase())}
                /> 
                {m.name}
              </li>
            );
          })}
        </ul>
        {filtros.marcas.length > 6 && (
          <button style={btnVerMasEstilo} onClick={() => setShowAllBrands(!showAllBrands)}>
            {showAllBrands ? 'Ver menos' : '+ Ver más'}
          </button>
        )}
      </div>

      {/* DISPONIBILIDAD */}
      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Disponibilidad</h3>
        <ul className="pl-filter-list">
          <li>
            <input 
              type="checkbox" 
              className="pl-checkbox" 
              checked={searchParams.get('in_stock') === 'true'}
              onChange={(e) => updateSearchParam('in_stock', e.target.checked ? 'true' : null)}
            /> 
            Solo en stock
          </li>
        </ul>
      </div>

      {/* BOTÓN LIMPIAR FILTROS */}
      {Array.from(searchParams.keys()).length > 0 && (
        <button 
            style={{...btnVerMasEstilo, color: '#dc3545', textDecoration: 'none', border: '1px solid #dc3545', padding: '5px', borderRadius: '5px'}} 
            onClick={() => setSearchParams({})}
        >
            Limpiar todos los filtros
        </button>
      )}
    </aside>
  );
};

const btnVerMasEstilo = { background: 'none', border: 'none', color: '#00b4d8', cursor: 'pointer', fontSize: '0.85rem', marginTop: '8px', padding: 0, textDecoration: 'underline' };

export default FilterSidebar;