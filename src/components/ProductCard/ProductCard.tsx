import { Link } from 'react-router-dom';
import styles from '../ProductCard/ProductCard.module.css';

/**
 * COMPONENTE: ProductCard
 * UBICACIÓN: src/components/ProductCard/ProductCard.tsx
 *
 * FUNCIÓN:
 * Representa la unidad visual mínima de un producto.
 * Recibe un objeto "producto" y renderiza su imagen, título, marca y precio.
 * Si el producto tiene descuento, muestra badge de oferta y precio anterior tachado.
 */

interface ProductCardProps {
  producto: any;
}

const ProductCard = ({ producto }: ProductCardProps) => {
  const esOferta =
    producto.porcentaje_descuento && producto.porcentaje_descuento > 0;

  const titulo =
    producto.descripcion?.length > 60
      ? `${producto.descripcion.substring(0, 60)}...`
      : producto.descripcion;

  return (
    <Link to={`/producto/${producto.clave}`} className={styles.catalogoLink}>
      <article className={styles.cardProd}>
        {esOferta && (
          <div className={styles.badgeOffer}>
            -{Math.round(producto.porcentaje_descuento)}%
          </div>
        )}

        <img
          src={producto.imagen || '/img/no-image.png'}
          alt={producto.descripcion}
          className={styles.cardProdImg}
        />

        <h3 className={styles.cardProdTitle}>{titulo}</h3>

        <p className={styles.catalogoMarca}>{producto.marca}</p>

        <div className={styles.catalogoPrecioContainer}>
          {esOferta ? (
            <>
              <span className={styles.priceOld}>
                ${Number(producto.precio_regular).toFixed(2)}
              </span>
              <span className={styles.priceNew}>
                ${Number(producto.precio_oferta).toFixed(2)}
              </span>
            </>
          ) : (
            <p className={styles.catalogoPrecio}>
              ${Number(producto.precio).toFixed(2)}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;