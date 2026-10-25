import { useCallback, useEffect, useState } from 'react';
import api, { errorMessage } from '../../api/client.js';
import { Spinner, EmptyState } from '../../components/Feedback.jsx';
import { pushToast } from '../../features/ui/uiSlice.js';
import { useDispatch } from 'react-redux';
import { formatCurrency } from '../../utils/format.js';

const EMPTY = {
  name: '',
  description: '',
  shortDescription: '',
  price: '',
  compareAtPrice: '',
  stock: '',
  brand: '',
  category: '',
  sku: '',
  tags: '',
  images: '',
  isActive: true,
  isFeatured: false,
};

function ProductForm({ initial, categories, onSaved, onCancel }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState(() =>
    initial
      ? {
          ...initial,
          price: String(initial.price),
          compareAtPrice: String(initial.compareAtPrice || ''),
          stock: String(initial.stock),
          category: initial.category?._id || initial.category || '',
          tags: (initial.tags || []).join(', '),
          images: (initial.images || []).join('\n'),
        }
      : { ...EMPTY, category: categories[0]?._id || '' }
  );
  const [saving, setSaving] = useState(false);

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      shortDescription: form.shortDescription.trim(),
      price: Number(form.price),
      compareAtPrice: Number(form.compareAtPrice) || 0,
      stock: Number(form.stock),
      brand: form.brand.trim() || 'Generico',
      category: form.category,
      sku: form.sku.trim(),
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      images: form.images.split('\n').map((image) => image.trim()).filter(Boolean),
      isActive: form.isActive,
      isFeatured: form.isFeatured,
    };

    try {
      if (initial?._id) {
        await api.put(`/products/${initial._id}`, payload);
        dispatch(pushToast({ message: 'Producto actualizado.', type: 'success' }));
      } else {
        await api.post('/products', payload);
        dispatch(pushToast({ message: 'Producto creado.', type: 'success' }));
      }

      onSaved();
    } catch (error) {
      dispatch(pushToast({ message: errorMessage(error), type: 'error' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h2>{initial?._id ? `Editar: ${initial.name}` : 'Nuevo producto'}</h2>

      <div className="form-grid">
        <label className="field field--full">
          <span>Nombre *</span>
          <input name="name" required minLength={3} value={form.name} onChange={change} />
        </label>
        <label className="field field--full">
          <span>Descripción larga *</span>
          <textarea name="description" rows="4" required minLength={10} value={form.description} onChange={change} />
        </label>
        <label className="field field--full">
          <span>Descripción corta</span>
          <input name="shortDescription" maxLength={300} value={form.shortDescription} onChange={change} />
        </label>
        <label className="field">
          <span>Precio *</span>
          <input name="price" type="number" step="0.01" min="0" required value={form.price} onChange={change} />
        </label>
        <label className="field">
          <span>Precio antes de descuento</span>
          <input name="compareAtPrice" type="number" step="0.01" min="0" value={form.compareAtPrice} onChange={change} />
        </label>
        <label className="field">
          <span>Stock *</span>
          <input name="stock" type="number" min="0" required value={form.stock} onChange={change} />
        </label>
        <label className="field">
          <span>Marca</span>
          <input name="brand" value={form.brand} onChange={change} />
        </label>
        <label className="field">
          <span>Categoría *</span>
          <select name="category" required value={form.category} onChange={change}>
            {categories.map((category) => (
              <option key={category._id} value={category._id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>SKU</span>
          <input name="sku" value={form.sku} onChange={change} />
        </label>
        <label className="field field--full">
          <span>Etiquetas (separadas por coma)</span>
          <input name="tags" value={form.tags} onChange={change} />
        </label>
        <label className="field field--full">
          <span>URLs de imágenes (una por línea)</span>
          <textarea name="images" rows="3" value={form.images} onChange={change} placeholder="https://..." />
        </label>
      </div>

      <div className="checkbox-row">
        <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={change} /> Visible en tienda</label>
        <label><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={change} /> Destacado</label>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? 'Guardando...' : initial?._id ? 'Guardar cambios' : 'Crear producto'}
        </button>
        <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}

export default function AdminProductsPage() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get(`/products?search=${encodeURIComponent(query)}&page=${page}&limit=10`),
        api.get('/categories'),
      ]);

      setProducts(productsRes.data.products);
      setPages(productsRes.data.pages);
      setCategories(categoriesRes.data.categories);
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [query, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (product) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;

    try {
      await api.delete(`/products/${product._id}`);
      dispatch(pushToast({ message: 'Producto eliminado.', type: 'info' }));
      load();
    } catch (err) {
      dispatch(pushToast({ message: errorMessage(err), type: 'error' }));
    }
  };

  if (loading) return <Spinner label="Cargando productos..." />;
  if (error) return <EmptyState title="Error al cargar productos" description={error} />;

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Buscar producto..."
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Nuevo producto
        </button>
      </div>

      {showForm && (
        <ProductForm
          initial={editing}
          categories={categories}
          onCancel={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            load();
          }}
        />
      )}

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>
                  <div className="table-product">
                    <img src={product.images?.[0] || 'https://picsum.photos/seed/x/80/80'} alt="" />
                    <div>
                      <strong>{product.name}</strong>
                      <span className="muted">{product.brand}</span>
                    </div>
                  </div>
                </td>
                <td>{product.category?.name || '—'}</td>
                <td>{formatCurrency(product.price)}</td>
                <td>
                  <span className={`badge ${product.stock === 0 ? 'badge--danger' : product.stock <= 5 ? 'badge--warning' : 'badge--success'}`}>
                    {product.stock}
                  </span>
                </td>
                <td>
                  <span className={`badge ${product.isActive ? 'badge--success' : 'badge--danger'}`}>
                    {product.isActive ? 'Visible' : 'Oculto'}
                  </span>
                </td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setEditing(product);
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Editar
                  </button>
                  <button type="button" className="icon-btn icon-btn--danger" onClick={() => handleRemove(product)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {products.length === 0 && <EmptyState title="Sin productos" description="Crea tu primer producto con el botón superior." />}

      {pages > 1 && (
        <nav className="pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</button>
          <span>Página {page} de {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Siguiente</button>
        </nav>
      )}
    </div>
  );
}
