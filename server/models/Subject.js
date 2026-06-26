const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const SubjectSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    credit: { type: Number, required: true, min: 1, default: 1 },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

SubjectSchema.index({ code: 1 }, { unique: true });
SubjectSchema.index({ status: 1, name: 1 });
SubjectSchema.index({ code: 'text', name: 'text', description: 'text' });

module.exports = model('Subject', SubjectSchema);