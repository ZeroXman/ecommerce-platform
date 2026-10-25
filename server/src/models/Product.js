import mongoose from 'mongoose';
import slugify from 'slugify';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 160 },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: [true, 'La descripción es obligatoria'] },
    shortDescription: { type: String, default: '', maxlength: 300 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: 0, min: 0 },
    images: { type: [String], default: [] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: String, default: 'Generico' },
    tags: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    isFeatured: { type: Boolean, default: false },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });

productSchema.virtual('inStock').get(function inStock() {
  return this.stock > 0;
});

productSchema.virtual('discountPercent').get(function discountPercent() {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

productSchema.pre('validate', function ensureSlug(next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name || 'producto', { lower: true, strict: true, locale: 'es' });
    this.slug = `${base}-${Math.random().toString(36).slice(2, 7)}`;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;
