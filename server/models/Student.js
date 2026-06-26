const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const StudentSchema = new Schema({
  studentId: { type: String, required: true, trim: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  dateOfBirth: { type: Date },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  guardianName: { type: String, trim: true },
  guardianPhone: { type: String, trim: true },
  className: { type: String, trim: true },
  academicYearId: { type: Schema.Types.ObjectId, ref: 'AcademicYear' },
  gradeId: { type: Schema.Types.ObjectId, ref: 'Grade' },
  classId: { type: Schema.Types.ObjectId, ref: 'Class' },
  status: { type: String, enum: ['active', 'inactive', 'graduated'], default: 'active' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

StudentSchema.index({ studentId: 1 }, { unique: true, sparse: true });
StudentSchema.index({ academicYearId: 1 });
StudentSchema.index({ gradeId: 1 });
StudentSchema.index({ classId: 1 });
StudentSchema.index({ fullName: 'text', className: 'text', guardianName: 'text', address: 'text' });

module.exports = model('Student', StudentSchema);
