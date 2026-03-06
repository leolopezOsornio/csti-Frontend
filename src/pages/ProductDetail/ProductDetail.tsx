// src/pages/ProductDetail/ProductDetail.tsx
import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { catalogService } from '../../services/catalogService';
import { cartService } from '../../services/cartService';
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import './ProductDetail.css';

/**
 * PÁGINA: ProductDetail
 * UBICACIÓN: src/pages/ProductDetail/ProductDetail.tsx
 * * FUNCIÓN:
 * Renderiza la ficha técnica completa de un producto. Lee la 'clave' de la URL.
 * Mantiene estados locales para manejar el carrusel de imágenes (mainImage),
 * el selector de cantidad (qty), y las pestañas de información (activeTab).
 */

const ProductDetail = () => {
  const { clave } = useParams<{ clave: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { refreshCart } = useContext(CartContext);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados visuales interactivos
  const [mainImage, setMainImage] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'warranty'>('specs');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!clave) return;
      try {
        const response = await catalogService.getProductDetail(clave);
        setData(response);
        // Setear la primera imagen como principal si existen imágenes HD, si no, usa el placeholder
        if (response.cva_data.imagenes_hd && response.cva_data.imagenes_hd.length > 0) {
          setMainImage(response.cva_data.imagenes_hd[0]);
        } else {
          setMainImage(response.producto_local.imagen || '/img/no-image.png');
        }
      } catch (err) {
        setError("Este producto no está disponible actualmente o no existe.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [clave]);

  const handleQtyChange = (change: number) => {
    setQty((prev) => Math.max(1, prev + change)); // Evita que baje de 1
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      Swal.fire({
        title: '¡Inicia sesión!',
        text: 'Debes iniciar sesión para agregar productos al carrito.',
        icon: 'warning',
        confirmButtonColor: '#00b4d8'
      });
      return;
    }

    try {
      // Usamos el ID del producto_local y la cantidad (qty) seleccionada
      await cartService.addToCart(data.producto_local.id, qty);
      await refreshCart(); // Actualizamos el badge del Navbar

      Swal.fire({
        title: '¡Añadido al carrito!',
        text: `Agregaste ${qty} unidad(es) de ${data.producto_local.descripcion.substring(0, 30)}...`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#00b4d8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ir a mi carrito',
        cancelButtonText: 'Seguir comprando'
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/carrito');
        }
      });
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo agregar al carrito', 'error');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Cargando producto... ⏳</div>;
  if (error) return <div className="detalle-error"><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>;
  if (!data) return null;

  const { producto_local, cva_data } = data;
  // Obtener stock seguro (el array de inventario manda el total al final usualmente, o podemos usar el local como fallback)
  const stock = cva_data.inventario?.length > 0
    ? cva_data.inventario[cva_data.inventario.length - 1].disponible
    : producto_local.disponible;

  return (
    <section className="producto-detalle">
      <button onClick={() => navigate(-1)} className="detalle-volver" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
        <img src="/img/atras.png" alt="Volver" />
      </button>

      <div className="pdp-top-grid">

        {/* GALERÍA DE IMÁGENES */}
        <div className="gallery-container">
          <div className="main-image-wrapper">
            <img id="mainImage" src={mainImage} alt={producto_local.clave} className="main-image" />
          </div>

          {cva_data.imagenes_hd && cva_data.imagenes_hd.length > 1 && (
            <div className="thumbs-row">
              {cva_data.imagenes_hd.slice(0, 4).map((img: string, idx: number) => (
                <div
                  key={idx}
                  className={`thumb-btn ${mainImage === img ? 'active' : ''}`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} className="thumb-img" alt="Thumbnail" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INFO Y COMPRA */}
        <div className="product-info-col">
          <div className="brand-kicker">{producto_local.marca || "MARCA"}</div>

          <h1 className="product-title" style={{ fontSize: '1.5rem', marginBottom: '15px' }}>
            {producto_local.descripcion}
          </h1>

          <div className="meta-data">
            <span>Modelo: {cva_data.codigo_fabricante || 'N/A'}</span>
            <span className="meta-separator">|</span>
            <span>Clave: {producto_local.clave}</span>
            <span className="meta-separator">|</span>
            <span style={{ color: '#2e7d32', fontWeight: 600 }}>
              Disponibilidad: {stock > 0 ? `${stock} Pzas` : 'Consultar'}
            </span>
          </div>

          <div className="price-tag">
            ${Number(cva_data.precio_exacto).toFixed(2)} {cva_data.moneda}
          </div>

          <div className="buy-box">
            <button type="button" className="btn-fav-lg">
              <i className="fa-regular fa-heart"></i> Favorito
            </button>

            <form onSubmit={handleAddToCart} className="cart-form">
              <div className="quantity-selector">
                <button type="button" className="qty-btn" onClick={() => handleQtyChange(-1)}>-</button>
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="qty-input"
                />
                <button type="button" className="qty-btn" onClick={() => handleQtyChange(1)}>+</button>
              </div>

              <button type="submit" className="btn-add-cart-lg" disabled={stock <= 0}>
                <i className="fa-solid fa-cart-shopping"></i> Agregar
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* PESTAÑAS (TABS) */}
      <div className="pdp-tabs-wrapper">
        <div className="tabs-nav">
          <div className={`tab-link ${activeTab === 'desc' ? 'active' : ''}`} onClick={() => setActiveTab('desc')}>Descripción General</div>
          <div className={`tab-link ${activeTab === 'specs' ? 'active' : ''}`} onClick={() => setActiveTab('specs')}>Especificaciones Técnicas</div>
          <div className={`tab-link ${activeTab === 'warranty' ? 'active' : ''}`} onClick={() => setActiveTab('warranty')}>Garantía</div>
        </div>

        <div className={`tab-content ${activeTab === 'desc' ? 'active' : ''}`}>
          <p style={{ color: '#555', lineHeight: 1.6 }}>
            No hay descripción detallada disponible para este producto por el momento.
          </p>
        </div>

        <div className={`tab-content ${activeTab === 'specs' ? 'active' : ''}`}>
          {cva_data.especificaciones && cva_data.especificaciones.length > 0 ? (
            <table className="specs-table">
              <tbody>
                {cva_data.especificaciones.map((spec: any, idx: number) => (
                  <tr key={idx}>
                    <td className="spec-label">{spec.nombre}</td>
                    <td className="spec-value">{spec.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay especificaciones técnicas disponibles.</p>
          )}
        </div>

        <div className={`tab-content ${activeTab === 'warranty' ? 'active' : ''}`}>
          <p style={{ color: '#555' }}>
            Todos nuestros productos cuentan con garantía directa de fabricante.
            Para más información, consulte nuestra política de devoluciones y garantías.
          </p>
        </div>
      </div>

    </section>
  );
};

export default ProductDetail;