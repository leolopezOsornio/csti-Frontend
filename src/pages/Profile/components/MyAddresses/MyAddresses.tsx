// src/pages/Profile/components/MyAddresses/MyAddresses.tsx
const MyAddresses = () => {
  return (
    <>
      <h1>Mis Direcciones</h1>
      <div className="order-card" style={{ padding: '20px' }}>
        <p>Aquí se listarán tus direcciones de envío guardadas.</p>
        <button className="btn-add-cart-lg" style={{ width: 'auto', marginTop: '10px' }}>
          + Nueva Dirección
        </button>
      </div>
    </>
  );
};

export default MyAddresses;