import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  // We can add an 'icon' or 'description' field here later
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
export default Category;