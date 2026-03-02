// File: src/pages/ProductList/components/FilterSidebar.tsx
import { useState } from 'react';

const FilterSidebar = () => {
  const [price, setPrice] = useState(25000);

  return (
    <aside className="pl-sidebar">
      <h2>Filtrar por</h2>

      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Categorías</h3>
        <ul className="pl-filter-list">
          <li>› Laptops</li>
          <li>› Desktops</li>
          <li>› Servidores</li>
          <li>› Accesorios</li>
          <li>› Componentes</li>
        </ul>
      </div>

      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Precio</h3>
        <input 
          type="range" 
          min="2000" 
          max="50000" 
          value={price} 
          onChange={(e) => setPrice(Number(e.target.value))}
          className="pl-price-range"
        />
        <div className="pl-price-labels">
          <span>Min: $2,000</span>
          <span>Max: ${price.toLocaleString()}</span>
        </div>
      </div>

      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Marcas</h3>
        <ul className="pl-filter-list">
          <li><input type="checkbox" className="pl-checkbox" defaultChecked /> HP</li>
          <li><input type="checkbox" className="pl-checkbox" /> Dell</li>
          <li><input type="checkbox" className="pl-checkbox" /> Lenovo</li>
          <li><input type="checkbox" className="pl-checkbox" /> Asus</li>
          <li><input type="checkbox" className="pl-checkbox" /> Samsung</li>
          <li><input type="checkbox" className="pl-checkbox" /> Apple</li>
        </ul>
      </div>

      <div className="pl-filter-group">
        <h3 className="pl-filter-title">Disponibilidad</h3>
        <ul className="pl-filter-list">
          <li><input type="checkbox" className="pl-checkbox" /> Solo en stock</li>
        </ul>
      </div>
    </aside>
  );
};

export default FilterSidebar;