// File: src/pages/ProductList/components/TopBar.tsx
const TopBar = () => {
  return (
    <div className="pl-topbar">
      <div className="pl-breadcrumb">
        Inicio &gt; Cómputo &gt; <strong>Laptops</strong>
      </div>
      
      <div className="pl-topbar-actions">
        <span>
          Ordenar por: 
          <select className="pl-sort-select" style={{ marginLeft: '8px' }}>
            <option>Precio más bajo</option>
            <option>Precio más alto</option>
            <option>Novedades</option>
          </select>
        </span>
        <span>Mostrando 1-12 de 45 productos</span>
      </div>
    </div>
  );
};

export default TopBar;