const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const CertificateSchema = new Schema({
  certificateNumber: { type: String, required: true, trim: true, unique: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true, trim: true },
  className: { type: String, required: true, trim: true },
  certificateType: {
    type: String,
    enum: ['graduation', 'achievement', 'attendance', 'honor'],
    required: true
  },
  issueDate: { type: Date, required: true },
  academicYear: { type: String, required: true, trim: true },
  issuedBy: { type: String, trim: true },
  remarks: { type: String, trim: true },
  status: {
    type: String,
    enum: ['draft', 'issued', 'revoked'],
    default: 'draft'
  }
}, {
  timestamps: true
});

CertificateSchema.index({ studentId: 1 });
CertificateSchema.index({ certificateNumber: 1 }, { unique: true });
CertificateSchema.index({ issueDate: -1 });
CertificateSchema.index({ academicYear: 1 });

module.exports = model('Certificate', CertificateSchema);