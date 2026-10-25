export function Spinner({ label = 'Cargando...' }) {
  return (
    <div className="spinner-wrap">
      <span className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="page-loader">
      <span className="spinner" aria-hidden="true" />
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function Stars({ rating = 0, count }) {
  const rounded = Math.round(rating);

  return (
    <span className="stars" title={`${Number(rating).toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= rounded ? 'star star--on' : 'star'}>
          ★
        </span>
      ))}
      {count !== undefined && <span className="stars__count">({count})</span>}
    </span>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;

  const numbers = [];

  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) {
      numbers.push(i);
    } else if (numbers[numbers.length - 1] !== '...') {
      numbers.push('...');
    }
  }

  return (
    <nav className="pagination" aria-label="Paginación">
      <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Anterior
      </button>
      {numbers.map((item, index) =>
        item === '...' ? (
          <span key={`gap-${index}`} className="pagination__gap">…</span>
        ) : (
          <button
            key={item}
            type="button"
            className={item === page ? 'is-active' : ''}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        )
      )}
      <button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Siguiente
      </button>
    </nav>
  );
}
