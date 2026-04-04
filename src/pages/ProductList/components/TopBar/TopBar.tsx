// src/pages/ProductList/components/TopBar.tsx
import { Link, useSearchParams } from 'react-router-dom';
import styles from '../TopBar/TopBar.module.css';

interface TopBarProps {
  totalItems: number;
  currentPage: number;
}

const TopBar = ({ totalItems, currentPage }: TopBarProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort') || 'novedades';

  const pageSize = 24;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
    searchParams.set('sort', e.target.value);
    searchParams.set('page', '1');
    setSearchParams(searchParams);
  };

  return (
    <div className={styles.topbar}>
      <div className={styles.breadcrumb}>
        <Link to="/home" style={{ textDecoration: 'none', color: 'inherit' }}>
          Inicio
        </Link>
        {' '} &gt; {' '}
        <Link to="/listado" style={{ textDecoration: 'none', color: 'inherit' }}>
          Catálogo
        </Link>

        {searchParams.get('categoria') && (
          <span>
            {' '} &gt; <strong>{searchParams.get('categoria')?.replace(/-/g, ' ').toUpperCase()}</strong>
          </span>
        )}

        {searchParams.get('grupo') && (
          <span>
            {' '} &gt; <strong>{searchParams.get('grupo')?.toUpperCase()}</strong>
          </span>
        )}
      </div>

      <div className={styles.topbarActions}>
        <span>
          Ordenar por:
          <select
            className={styles.sortSelect}
            value={sort}
            onChange={handleSort}
          >
            <option value="novedades">Novedades</option>
            <option value="precio_asc">Precio: de menor a mayor</option>
            <option value="precio_desc">Precio: de mayor a menor</option>
          </select>
        </span>

        <span>
          Mostrando {startItem}-{endItem} de {totalItems} productos
        </span>
      </div>
    </div>
  );
};

export default TopBar;