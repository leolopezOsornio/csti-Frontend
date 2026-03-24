import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import styles from './CartItem.module.css';

interface CartItemProps {
  item: any;
  onUpdateQty: (itemId: number, newQty: number) => void;
  onRemove: (itemId: number) => void;
}

const CartItem = ({ item, onUpdateQty, onRemove }: CartItemProps) => {
  const { producto, id, cantidad, subtotal, precio_unitario } = item;

  const handleQtyChange = (change: number) => {
    const newQty = cantidad + change;

    if (newQty < 1) {
      handleRemove();
      return;
    }

    if (newQty > producto.disponible) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: `Solo hay ${producto.disponible} unidades disponibles`,
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    onUpdateQty(id, newQty);
  };

  const handleRemove = () => {
    Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Se quitará este artículo de tu carrito.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        onRemove(id);
      }
    });
  };

  return (
    <article className={styles.cartItemCard}>
      <div className={styles.itemImgWrapper}>
        <img
          src={producto.imagen || '/img/no-image.png'}
          alt={producto.clave}
          className={styles.itemImg}
        />
      </div>

      <div className={styles.itemDetails}>
        <div className={styles.itemBrand}>{producto.marca || 'MARCA'}</div>
        <h3 className={styles.itemTitle}>
          {producto.descripcion.substring(0, 80)}...
        </h3>

        <div className={styles.itemControls}>
          <div className={styles.qtySelectorSm}>
            <button
              type="button"
              className={styles.qtyBtnSm}
              onClick={() => handleQtyChange(-1)}
            >
              -
            </button>

            <input
              type="number"
              value={cantidad}
              className={styles.qtyInputSm}
              readOnly
            />

            <button
              type="button"
              className={styles.qtyBtnSm}
              onClick={() => handleQtyChange(1)}
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            className={styles.btnDelete}
            title="Eliminar artículo"
            type="button"
          >
            <FontAwesomeIcon icon={faTrashCan} />
          </button>
        </div>
      </div>

      <div className={styles.itemPriceCol}>
        <div className={styles.itemPrice}>
          ${Number(subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>

        <small className={styles.itemUnitPrice}>
          Unit: ${Number(precio_unitario).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </small>
      </div>
    </article>
  );
};

export default CartItem;