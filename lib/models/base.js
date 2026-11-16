// lib/models/base.js
// Sab models ke liye common options.

export const baseOptions = {
  timestamps: true, // createdAt + updatedAt khud ban jayenge

  toJSON: {
    virtuals: true,
    versionKey: false, // __v hata do
    transform(_doc, ret) {
      ret.id = String(ret._id); // UI 'id' padhti hai
      delete ret._id;
      return ret;
    },
  },
  toObject: { virtuals: true, versionKey: false },
};