import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    slug: { type: String, default: '' },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    orderNumber: { type: String, required: true, unique: true },
    items: { type: [orderItemSchema], required: true, validate: (v) => v.length > 0 },
    shippingAddress: { type: shippingAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['stripe', 'demo', 'cod'], default: 'stripe' },
    paymentResult: {
      id: { type: String, default: '' },
      status: { type: String, default: '' },
      provider: { type: String, default: '' },
      paidAt: { type: Date, default: null },
    },
    itemsPrice: { type: Number, required: true, min: 0 },
    shippingPrice: { type: Number, required: true, min: 0 },
    taxPrice: { type: Number, required: true, min: 0 },
    totalPrice: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
      index: true,
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null },
    shippedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    notes: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);

orderSchema.virtual('itemCount').get(function itemCount() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
});

orderSchema.set('toJSON', { virtuals: true });

const Order = mongoose.model('Order', orderSchema);

export default Order;
