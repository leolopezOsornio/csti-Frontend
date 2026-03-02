// File: src/pages/ProductList/components/Pagination.tsx
const Pagination = () => {
  return (
    <div className="pl-pagination">
      <button className="pl-page-btn active">1</button>
      <button className="pl-page-btn">2</button>
      <button className="pl-page-btn">3</button>
      <span style={{ color: '#00b4d8' }}>...</span>
      <button className="pl-page-btn">&gt;</button>
    </div>
  );
};

export default Pagination;