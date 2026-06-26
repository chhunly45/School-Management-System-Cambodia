const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const AcademicYearSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['planned', 'active', 'closed', 'archived'],
      default: 'planned'
    },
    isCurrent: { type: Boolean, default: false },
    remarks: { type: String, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

AcademicYearSchema.index({ code: 1 }, { unique: true });
AcademicYearSchema.index({ status: 1, startDate: -1 });
AcademicYearSchema.index({ name: 'text', code: 'text' });
AcademicYearSchema.index({ isCurrent: 1 }, { unique: true, partialFilterExpression: { isCurrent: true } });

module.exports = model('AcademicYear', AcademicYearSchema);
