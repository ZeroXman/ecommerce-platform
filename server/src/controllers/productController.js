import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Review from '../models/Review.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const SORT_OPTIONS = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  rating: { rating: -1, numReviews: -1 },
  popular: { sold: -1 },
  name: { name: 1 },
};

export const listProducts = asyncHandler(async (req, res) => {
  const {
    search = '',
    category = '',
    brand = '',
    minPrice,
    maxPrice,
    sort = 'newest',
    featured,
    page = 1,
    limit = 12,
  } = req.query;

  const filter = { isActive: true };

  if (search.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
      { brand: { $regex: search.trim(), $options: 'i' } },
      { tags: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  if (category) {
    const found = await Category.findOne({ slug: category });

    if (!found) {
      throw ApiError.notFound(`No existe la categoría "${category}".`);
    }

    filter.category = found._id;
  }

  if (brand) {
    filter.brand = { $regex: brand, $options: 'i' };
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};

    if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
  }

  if (featured === 'true') {
    filter.isFeatured = true;
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 60);
  const safePage = Math.max(Number(page) || 1, 1);
  const sortBy = SORT_OPTIONS[sort] || SORT_OPTIONS.newest;

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .sort(sortBy)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Product.countDocuments(filter),
  ]);

  res.json({
    ok: true,
    products,
    page: safePage,
    pages: Math.ceil(total / safeLimit) || 1,
    total,
    limit: safeLimit,
  });
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ isActive: true, isFeatured: true })
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(8);

  res.json({ ok: true, products });
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).populate('category', 'name slug');

  if (!product) {
    throw ApiError.notFound('Producto no encontrado.');
  }

  const [reviews, related] = await Promise.all([
    Review.find({ product: product._id }).sort({ createdAt: -1 }).limit(20),
    Product.find({ _id: { $ne: product._id }, category: product.category?._id, isActive: true })
      .populate('category', 'name slug')
      .limit(4),
  ]);

  res.json({ ok: true, product, reviews, related });
});

export const createProduct = asyncHandler(async (req, res) => {
  const payload = { ...req.body };

  const category = await Category.findById(payload.category);

  if (!category) {
    throw ApiError.badRequest('La categoría indicada no existe.');
  }

  const product = await Product.create(payload);
  await product.populate('category', 'name slug');

  res.status(201).json({ ok: true, product });
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Producto no encontrado.');
  }

  const fields = [
    'name',
    'description',
    'shortDescription',
    'price',
    'compareAtPrice',
    'images',
    'category',
    'brand',
    'tags',
    'stock',
    'sku',
    'isActive',
    'isFeatured',
  ];

  fields.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });

  await product.save();
  await product.populate('category', 'name slug');

  res.json({ ok: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Producto no encontrado.');
  }

  await Promise.all([
    product.deleteOne(),
    Review.deleteMany({ product: product._id }),
  ]);

  res.json({ ok: true, message: 'Producto eliminado.' });
});

export const createProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    throw ApiError.notFound('Producto no encontrado.');
  }

  const { rating, comment } = req.body;

  const existing = await Review.findOne({ product: product._id, user: req.user._id });

  if (existing) {
    throw ApiError.conflict('Ya publicaste una reseña para este producto.');
  }

  const review = await Review.create({
    product: product._id,
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  });

  await Review.recalculateProduct(product._id);

  res.status(201).json({ ok: true, review });
});

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort({ name: 1 });

  const withCounts = await Promise.all(
    categories.map(async (category) => {
      const count = await Product.countDocuments({ category: category._id, isActive: true });
      return { ...category.toJSON(), productCount: count };
    })
  );

  res.json({ ok: true, categories: withCounts });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description = '', image = '' } = req.body;
  const slug = String(name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const category = await Category.create({ name, slug, description, image });

  res.status(201).json({ ok: true, category });
});
