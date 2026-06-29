const path = require('path');
const mongoose = require('mongoose');
const { AcademicYear, Grade, Class: ClassModel } = require('../models');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!mongoUri) {
  console.error('MONGODB_URI or MONGO_URI is required to seed master data. Set it in server/.env or environment variables.');
  process.exit(1);
}

const academicYears = [
  {
    code: '2025-2026',
    name: 'Academic Year 2025-2026',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2026-06-30'),
    status: 'active',
    isCurrent: true,
    remarks: 'Current academic year'
  },
  {
    code: '2026-2027',
    name: 'Academic Year 2026-2027',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2027-06-30'),
    status: 'planned',
    isCurrent: false,
    remarks: 'Next academic year'
  }
];

const grades = Array.from({ length: 12 }, (_, index) => {
  const level = index + 1;
  return {
    code: `G${level}`,
    name: `Grade ${level}`,
    level,
    status: 'active',
    remarks: `Default grade ${level}`
  };
});

const classesByGrade = grades.flatMap((grade) => {
  return ['A', 'B'].map((section) => ({
    gradeCode: grade.code,
    className: `Grade ${grade.level}-${section}`,
    status: 'active',
    remarks: `Default class for ${grade.name}`
  }));
});

const connect = async () => {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });
};

const seedAcademicYears = async () => {
  const count = await AcademicYear.countDocuments();
  if (count > 0) {
    console.log(`AcademicYear collection already has ${count} documents, skipping seeding.`);
    return 0;
  }
  const docs = await AcademicYear.insertMany(academicYears);
  console.log(`Inserted ${docs.length} AcademicYear documents.`);
  return docs.length;
};

const seedGrades = async () => {
  const count = await Grade.countDocuments();
  if (count > 0) {
    console.log(`Grade collection already has ${count} documents, skipping seeding.`);
    return 0;
  }
  const docs = await Grade.insertMany(grades);
  console.log(`Inserted ${docs.length} Grade documents.`);
  return docs.length;
};

const seedClasses = async () => {
  const count = await ClassModel.countDocuments();
  if (count > 0) {
    console.log(`Class collection already has ${count} documents, skipping seeding.`);
    return 0;
  }

  const currentYear = await AcademicYear.findOne({ code: '2025-2026' });
  if (!currentYear) {
    throw new Error('Current academic year 2025-2026 must exist before seeding classes.');
  }

  const gradeDocs = await Grade.find().lean();
  if (gradeDocs.length === 0) {
    throw new Error('Grade documents must exist before seeding classes.');
  }

  const gradeMap = gradeDocs.reduce((acc, grade) => {
    acc[grade.code] = grade._id;
    return acc;
  }, {});

  const classDocs = classesByGrade.map((item) => ({
    className: item.className,
    academicYearId: currentYear._id,
    gradeId: gradeMap[item.gradeCode],
    status: item.status,
    remarks: item.remarks
  }));

  const docs = await ClassModel.insertMany(classDocs);
  console.log(`Inserted ${docs.length} Class documents.`);
  return docs.length;
};

const run = async () => {
  try {
    await connect();
    const academicYearsCreated = await seedAcademicYears();
    const gradesCreated = await seedGrades();
    const classesCreated = await seedClasses();

    console.log('Seed summary:');
    console.log(`  Academic Years created: ${academicYearsCreated}`);
    console.log(`  Grades created: ${gradesCreated}`);
    console.log(`  Classes created: ${classesCreated}`);
    process.exit(0);
  } catch (error) {
    console.error('Master data seeding failed:', error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

run();
