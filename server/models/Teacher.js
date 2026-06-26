const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const TeacherSchema = new Schema({
  teacherId: { type: String, required: true, trim: true, unique: true },
  fullName: { type: String, required: true, trim: true },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'other' },
  dateOfBirth: { type: Date },
  phone: { type: String, trim: true },
  email: { type: String, trim: true },
  address: { type: String, trim: true },
  qualification: { type: String, enum: ['Bachelor', 'Master', 'PhD', 'Other'], default: 'Bachelor' },
  specialization: { type: String, trim: true },
  experienceYears: { type: Number, min: 0, default: 0 },
  className: { type: String, trim: true },
  subjects: [{ type: String, trim: true }],
  subjectIds: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
  homeroomClassId: { type: Schema.Types.ObjectId, ref: 'Class' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  joinDate: { type: Date },
  remarks: { type: String, trim: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

TeacherSchema.index({ teacherId: 1 }, { unique: true, sparse: true });
TeacherSchema.index({ status: 1 });
TeacherSchema.index({ className: 1 });
TeacherSchema.index({ homeroomClassId: 1 });
TeacherSchema.index({ subjectIds: 1 });
TeacherSchema.index({ fullName: 'text', specialization: 'text', email: 'text', phone: 'text' });

module.exports = model('Teacher', TeacherSchema);
