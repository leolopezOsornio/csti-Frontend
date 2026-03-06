// src/pages/Profile/components/Wishlist/Wishlist.tsx
const Wishlist = () => {
  return (
    <>
      <h1>Lista de Deseos</h1>
      <p>Tus productos favoritos guardados.</p>
      <div className="empty-cart" style={{ padding: '20px' }}>
        <p>Aún no tienes productos en tu lista de deseos.</p>
      </div>
    </>
  );
};

export default Wishlist;