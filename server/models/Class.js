const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const ClassSchema = new Schema(
  {
    className: { type: String, required: true, trim: true },
    academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    gradeId: { type: Schema.Types.ObjectId, ref: 'Grade', required: true },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active'
    },
    description: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

ClassSchema.index({ className: 1, academicYearId: 1, gradeId: 1 }, { unique: true });
ClassSchema.index({ academicYearId: 1, gradeId: 1, status: 1 });
ClassSchema.index({ status: 1, createdAt: -1 });
ClassSchema.index({ className: 'text', description: 'text' });

module.exports = model('Class', ClassSchema);
