import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchProducts, fetchCategories } from '../features/products/productsSlice.js';
import ProductCard from '../components/ProductCard.jsx';
import { Spinner, EmptyState, Pagination } from '../components/Feedback.jsx';

const SORT_LABELS = {
  newest: 'Más recientes',
  price_asc: 'Precio: menor a mayor',
  price_desc: 'Precio: mayor a menor',
  rating: 'Mejor valorados',
  popular: 'Más vendidos',
};

export default function CatalogPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, categories, page, pages, total, status, error } = useSelector((state) => state.products);

  const [search, setSearch] = useState(searchParams.get('search') || '');

  const filters = useMemo(
    () => ({
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      sort: searchParams.get('sort') || 'newest',
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      page: searchParams.get('page') || 1,
      limit: 12,
    }),
    [searchParams]
  );

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const submitSearch = (event) => {
    event.preventDefault();
    updateParam('search', search.trim());
  };

  return (
    <div className="page container">
      <header className="page-head">
        <h1>Catálogo</h1>
        <p>{total} productos disponibles</p>
      </header>

      <div className="catalog">
        <aside className="filters card">
          <form onSubmit={submitSearch}>
            <label className="field">
              <span>Buscar</span>
              <input
                type="search"
                value={search}
                placeholder="Nombre, marca, etiqueta..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <button type="submit" className="btn btn--primary btn--block btn--sm">Aplicar</button>
          </form>

          <div className="field">
            <span>Categoría</span>
            <div className="filter-list">
              <button
                type="button"
                className={!filters.category ? 'is-active' : ''}
                onClick={() => updateParam('category', '')}
              >
                Todas
              </button>
              {categories.map((category) => (
                <button
                  key={category._id}
                  type="button"
                  className={filters.category === category.slug ? 'is-active' : ''}
                  onClick={() => updateParam('category', category.slug)}
                >
                  {category.name}
                  <small>{category.productCount}</small>
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Precio</span>
            <div className="price-range">
              <input
                type="number"
                min="0"
                placeholder="Mín"
                defaultValue={filters.minPrice}
                onBlur={(event) => updateParam('minPrice', event.target.value)}
              />
              <input
                type="number"
                min="0"
                placeholder="Máx"
                defaultValue={filters.maxPrice}
                onBlur={(event) => updateParam('maxPrice', event.target.value)}
              />
            </div>
          </div>

          <label className="field">
            <span>Ordenar por</span>
            <select value={filters.sort} onChange={(event) => updateParam('sort', event.target.value)}>
              {Object.entries(SORT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="btn btn--ghost btn--block btn--sm"
            onClick={() => {
              setSearch('');
              setSearchParams({});
            }}
          >
            Limpiar filtros
          </button>
        </aside>

        <section className="catalog__results">
          {status === 'loading' && <Spinner label="Buscando productos..." />}

          {status === 'failed' && (
            <EmptyState title="No se pudieron cargar los productos" description={error} />
          )}

          {status === 'succeeded' && items.length === 0 && (
            <EmptyState
              title="Sin resultados"
              description="Prueba con otros filtros o términos de búsqueda."
            />
          )}

          {items.length > 0 && (
            <>
              <div className="product-grid">
                {items.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <Pagination
                page={Number(page)}
                pages={Number(pages)}
                onChange={(nextPage) => updateParam('page', String(nextPage))}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
