const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const AcademicRecordSchema = new Schema(
  {
    studentId: { type: String, required: true, trim: true },
    studentName: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F'],
      required: true
    },
    academicYear: { type: String, required: true, trim: true },
    semester: { type: Number, enum: [1, 2], required: true },
    examType: {
      type: String,
      enum: ['midterm', 'final', 'quiz'],
      required: true
    },
    remarks: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  {
    timestamps: true
  }
);

AcademicRecordSchema.index({ studentId: 1 });
AcademicRecordSchema.index({ academicYear: 1, semester: 1 });
AcademicRecordSchema.index({ className: 1, subject: 1 });
AcademicRecordSchema.index(
  { studentId: 1, subject: 1, examType: 1, academicYear: 1, semester: 1 },
  { unique: true }
);

module.exports = model('AcademicRecord', AcademicRecordSchema);
