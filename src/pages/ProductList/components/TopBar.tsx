// src/pages/ProductList/components/TopBar.tsx
import { useSearchParams } from 'react-router-dom';

interface TopBarProps {
  totalItems: number;
  currentPage: number;
}

const TopBar = ({ totalItems, currentPage }: TopBarProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort') || 'novedades';

  // Calculamos qué rango estamos viendo (ej. 1-24)
  const pageSize = 24;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    searchParams.set('sort', e.target.value);
    searchParams.set('page', '1'); // Reseteamos paginación
    setSearchParams(searchParams);
  };

  return (
    <div className="pl-topbar">
      <div className="pl-breadcrumb">
        Inicio &gt; Catálogo 
        {searchParams.get('grupo') && <span> &gt; <strong>{searchParams.get('grupo')}</strong></span>}
      </div>
      
      <div className="pl-topbar-actions">
        <span>
          Ordenar por: 
          <select className="pl-sort-select" style={{ marginLeft: '8px' }} value={sort} onChange={handleSort}>
            <option value="novedades">Novedades</option>
            <option value="precio_asc">Precio: de menor a mayor</option>
            <option value="precio_desc">Precio: de mayor a menor</option>
          </select>
        </span>
        <span>Mostrando {startItem}-{endItem} de {totalItems} productos</span>
      </div>
    </div>
  );
};

export default TopBar;