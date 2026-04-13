// src/pages/ProductDetail/ProductDetail.tsx
import { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart as faHeartSolid } from '@fortawesome/free-solid-svg-icons';
import { faHeart as faHeartRegular } from '@fortawesome/free-regular-svg-icons';
import { catalogService } from '../../services/catalogService';
import { cartService } from '../../services/cartService';
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import { WishlistContext } from '../../contexts/WishlistContext';
import styles from '../ProductDetail/ProductDetail.module.css';

const ProductDetail = () => {
  const { clave } = useParams<{ clave: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);
  const { refreshCart } = useContext(CartContext);
  const { wishlistIds, toggleWishlist } = useContext(WishlistContext);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'specs' | 'warranty'>('specs');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!clave) return;

      try {
        const response = await catalogService.getProductDetail(clave);
        setData(response);

        if (response.cva_data.imagenes_hd && response.cva_data.imagenes_hd.length > 0) {
          setMainImage(response.cva_data.imagenes_hd[0]);
        } else {
          setMainImage(response.producto_local.imagen || '/img/no-image.png');
        }
      } catch (err) {
        setError('Este producto no está disponible actualmente o no existe.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [clave]);

  const handleQtyChange = (change: number) => {
    setQty((prev) => Math.max(1, prev + change));
  };

  const handleAddToCart = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      Swal.fire({
        title: '¡Inicia sesión!',
        text: 'Debes iniciar sesión para agregar productos al carrito.',
        icon: 'warning',
        confirmButtonColor: '#00b4d8',
      });
      return;
    }

    try {
      await cartService.addToCart(data.producto_local.id, qty);
      await refreshCart();

      Swal.fire({
        title: '¡Añadido al carrito!',
        text: `Agregaste ${qty} unidad(es) de ${data.producto_local.descripcion.substring(0, 30)}...`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#00b4d8',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ir a mi carrito',
        cancelButtonText: 'Seguir comprando',
      }).then((result) => {
        if (result.isConfirmed) {
          navigate('/carrito');
        }
      });
    } catch (error: any) {
      Swal.fire('Error', error.response?.data?.error || 'No se pudo agregar al carrito', 'error');
    }
  };

  const handleToggleFav = async () => {
    if (!isAuthenticated) {
      Swal.fire({
        title: '¡Inicia sesión!',
        text: 'Debes iniciar sesión para usar la lista de deseos.',
        icon: 'warning',
        confirmButtonColor: '#00b4d8',
      });
      return;
    }

    try {
      const added = await toggleWishlist(data.producto_local.id);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: added ? 'success' : 'info',
        title: added ? 'Agregado a favoritos ❤️' : 'Quitado de favoritos 🤍',
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Cargando producto... ⏳</div>;
  }

  if (error) {
    return (
      <div className={styles.detalleError}>
        <i className="fa-solid fa-triangle-exclamation"></i> {error}
      </div>
    );
  }

  if (!data) return null;

  const { producto_local, cva_data } = data;

  const stock =
    cva_data.inventario?.length > 0
      ? cva_data.inventario[cva_data.inventario.length - 1].disponible
      : producto_local.disponible;

  const isFav = wishlistIds.includes(producto_local.id);

  return (
    <section className={styles.productoDetalle}>
      <button
        onClick={() => navigate(-1)}
        className={styles.detalleVolver}
        type="button"
      >
        <img src="/img/atras.png" alt="Volver" />
      </button>

      <div className={styles.pdpTopGrid}>
        <div className={styles.galleryContainer}>
          <div className={styles.mainImageWrapper}>
            <img
              id="mainImage"
              src={mainImage}
              alt={producto_local.clave}
              className={styles.mainImage}
            />
          </div>

          {cva_data.imagenes_hd && cva_data.imagenes_hd.length > 1 && (
            <div className={styles.thumbsRow}>
              {cva_data.imagenes_hd.slice(0, 4).map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  className={`${styles.thumbBtn} ${mainImage === img ? styles.active : ''}`}
                  onClick={() => setMainImage(img)}
                >
                  <img src={img} className={styles.thumbImg} alt="Thumbnail" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={styles.productInfoCol}>
          <div className={styles.brandKicker}>{producto_local.marca || 'MARCA'}</div>

          <h1 className={styles.productTitle}>
            {producto_local.descripcion}
          </h1>

          <div className={styles.metaData}>
            <span>Modelo: {cva_data.codigo_fabricante || 'N/A'}</span>
            <span className={styles.metaSeparator}>|</span>
            <span>Clave: {producto_local.clave}</span>
            <span className={styles.metaSeparator}>|</span>
            <span className={styles.stockStatus}>
              Disponibilidad: {stock > 0 ? `${stock} Pzas` : 'Consultar'}
            </span>
          </div>

          <div className={styles.priceTag}>
            ${Number(cva_data.precio_exacto).toFixed(2)} {cva_data.moneda}
          </div>

          <div className={styles.buyBox}>
            <button
              type="button"
              className={`${styles.btnFavLg} ${isFav ? styles.isFav : ''}`}
              onClick={handleToggleFav}
            >
              <FontAwesomeIcon icon={isFav ? faHeartSolid : faHeartRegular} />
              {isFav ? ' En Deseos' : ' Favorito'}
            </button>

            <form onSubmit={handleAddToCart} className={styles.cartForm}>
              <div className={styles.quantitySelector}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => handleQtyChange(-1)}
                >
                  -
                </button>

                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className={styles.qtyInput}
                />

                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => handleQtyChange(1)}
                >
                  +
                </button>
              </div>

              <button
                type="submit"
                className={styles.btnAddCartLg}
                disabled={stock <= 0}
              >
                <i className="fa-solid fa-cart-shopping"></i> Agregar
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className={styles.pdpTabsWrapper}>
        <div className={styles.tabsNav}>
          <button
            type="button"
            className={`${styles.tabLink} ${activeTab === 'desc' ? styles.active : ''}`}
            onClick={() => setActiveTab('desc')}
          >
            Descripción General
          </button>

          <button
            type="button"
            className={`${styles.tabLink} ${activeTab === 'specs' ? styles.active : ''}`}
            onClick={() => setActiveTab('specs')}
          >
            Especificaciones Técnicas
          </button>

          <button
            type="button"
            className={`${styles.tabLink} ${activeTab === 'warranty' ? styles.active : ''}`}
            onClick={() => setActiveTab('warranty')}
          >
            Garantía
          </button>
        </div>

        <div className={`${styles.tabContent} ${activeTab === 'desc' ? styles.active : ''}`}>
          <p className={styles.textMuted}>
            No hay descripción detallada disponible para este producto por el momento.
          </p>
        </div>

        <div className={`${styles.tabContent} ${activeTab === 'specs' ? styles.active : ''}`}>
          {cva_data.especificaciones && cva_data.especificaciones.length > 0 ? (
            <table className={styles.specsTable}>
              <tbody>
                {cva_data.especificaciones.map((spec: any, idx: number) => (
                  <tr key={idx}>
                    <td className={styles.specLabel}>{spec.nombre}</td>
                    <td className={styles.specValue}>{spec.valor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No hay especificaciones técnicas disponibles.</p>
          )}
        </div>

        <div className={`${styles.tabContent} ${activeTab === 'warranty' ? styles.active : ''}`}>
          <p className={styles.textMuted}>
            Todos nuestros productos cuentan con garantía directa de fabricante.
            Para más información, consulte nuestra política de devoluciones y garantías.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProductDetail;