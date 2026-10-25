import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, default: 'Casa' },
    fullName: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const refreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'El nombre es obligatorio'], trim: true, maxlength: 80 },
    email: {
      type: String,
      required: [true, 'El email es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: [true, 'La contraseña es obligatoria'], minlength: 6, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar: { type: String, default: '' },
    addresses: { type: [addressSchema], default: [] },
    refreshTokens: { type: [refreshTokenSchema], default: [], select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.refreshTokens;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.findByEmail = function findByEmail(email) {
  return this.findOne({ email: String(email).toLowerCase().trim() });
};

userSchema.methods.addRefreshToken = async function addRefreshToken(rawToken) {
  this.refreshTokens.push({ token: await bcrypt.hash(rawToken, 10) });
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
  return this.save();
};

userSchema.methods.hasRefreshToken = async function hasRefreshToken(rawToken) {
  const tokens = this.refreshTokens || [];
  const checks = await Promise.all(tokens.map((entry) => bcrypt.compare(rawToken, entry.token)));
  return checks.some(Boolean);
};

userSchema.methods.removeRefreshToken = async function removeRefreshToken(rawToken) {
  const kept = [];

  for (const entry of this.refreshTokens || []) {
    const matches = await bcrypt.compare(rawToken, entry.token);
    if (!matches) kept.push(entry);
  }

  this.refreshTokens = kept;
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;
