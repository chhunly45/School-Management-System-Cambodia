const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const GradeSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    level: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active'
    },
    remarks: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

GradeSchema.index({ code: 1 }, { unique: true });
GradeSchema.index({ level: 1 }, { unique: true });
GradeSchema.index({ status: 1, level: 1 });
GradeSchema.index({ code: 'text', name: 'text' });

module.exports = model('Grade', GradeSchema);
