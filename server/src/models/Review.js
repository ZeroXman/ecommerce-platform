import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

reviewSchema.statics.recalculateProduct = async function recalculateProduct(productId) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', rating: { $avg: '$rating' }, numReviews: { $sum: 1 } } },
  ]);

  const rating = stats[0]?.rating ? Math.round(stats[0].rating * 10) / 10 : 0;
  const numReviews = stats[0]?.numReviews || 0;

  await mongoose.model('Product').findByIdAndUpdate(productId, { rating, numReviews });
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
