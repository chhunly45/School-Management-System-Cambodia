const { afterEach, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { Student } = require('../models');
const { listStudents } = require('../services/student.service');

const originalFind = Student.find;
const originalCountDocuments = Student.countDocuments;

afterEach(() => {
  Student.find = originalFind;
  Student.countDocuments = originalCountDocuments;
});

const mockStudents = (students, total = students.length) => {
  let findQuery;
  let countQuery;
  const paginationCalls = { sorted: false, skipped: false, limited: false };

  Student.find = (query) => {
    findQuery = query;
    return {
      sort() {
        paginationCalls.sorted = true;
        return this;
      },
      skip() {
        paginationCalls.skipped = true;
        return this;
      },
      limit() {
        paginationCalls.limited = true;
        return this;
      },
      lean: async () => students
    };
  };
  Student.countDocuments = async (query) => {
    countQuery = query;
    return total;
  };

  return {
    getQueries: () => ({ findQuery, countQuery }),
    getPaginationCalls: () => paginationCalls
  };
};

describe('student service Khmer surname sorting', () => {
  it('sorts Khmer surnames in Khmer order and places them before missing surnames', async () => {
    mockStudents([
      { studentId: 'S-EN', fullName: 'English Only' },
      { studentId: 'S-A', fullName: 'English / អេង សុវណ្ណ' },
      { studentId: 'S-S', fullName: 'English / សុខ សុភា' }
    ]);

    const result = await listStudents();

    assert.deepEqual(result.items.map((student) => student.studentId), ['S-S', 'S-A', 'S-EN']);
  });

  it('uses the first Khmer token as surname, including names with three or more tokens', async () => {
    mockStudents([
      { studentId: 'S-LATER', fullName: 'English / សុខ កា នី' },
      { studentId: 'S-FIRST', fullName: 'English / កា អា ខ' }
    ]);

    const result = await listStudents();

    assert.deepEqual(result.items.map((student) => student.studentId), ['S-FIRST', 'S-LATER']);
  });

  it('sorts Khmer-only full names by their first token', async () => {
    mockStudents([
      { studentId: 'S-2', fullName: 'អេង សុវណ្ណ' },
      { studentId: 'S-1', fullName: 'សុខ សុភា' }
    ]);

    const result = await listStudents();

    assert.deepEqual(result.items.map((student) => student.studentId), ['S-1', 'S-2']);
  });

  it('uses a single Khmer token as the surname and ignores extra whitespace', async () => {
    mockStudents([
      { studentId: 'S-A', fullName: 'English /  អេង   សុវណ្ណ ' },
      { studentId: 'S-S', fullName: 'English / សុខ' }
    ]);

    const result = await listStudents();

    assert.deepEqual(result.items.map((student) => student.studentId), ['S-S', 'S-A']);
  });

  it('treats English-only and missing names as records without a Khmer surname', async () => {
    mockStudents([
      { studentId: 'S-EMPTY', fullName: '' },
      { studentId: 'S-EN', fullName: 'English Only' },
      { studentId: 'S-KM', fullName: 'សុខ សុភា' }
    ]);

    const result = await listStudents();

    assert.deepEqual(result.items.map((student) => student.studentId), ['S-KM', 'S-EMPTY', 'S-EN']);
  });

  it('uses studentId as a deterministic tie-breaker for equal surnames', async () => {
    mockStudents([
      { studentId: 'S-20', fullName: 'English / សុខ សុភា' },
      { studentId: 'S-10', fullName: 'English / សុខ សុវណ្ណ' }
    ]);

    const result = await listStudents();

    assert.deepEqual(result.items.map((student) => student.studentId), ['S-10', 'S-20']);
  });

  it('sorts the complete filtered result before applying pagination', async () => {
    const tracker = mockStudents([
      { studentId: 'S-30', fullName: 'English / ឡា ឡា' },
      { studentId: 'S-10', fullName: 'English / កា កា' },
      { studentId: 'S-20', fullName: 'English / សា សា' }
    ]);

    const result = await listStudents({ page: 2, perPage: 1 });

    assert.deepEqual(result.items.map((student) => student.studentId), ['S-20']);
    assert.deepEqual(result.meta, { page: 2, limit: 1, total: 3 });
    assert.deepEqual(tracker.getPaginationCalls(), { sorted: false, skipped: false, limited: false });
  });

  it('preserves existing search and filter construction', async () => {
    const tracker = mockStudents([{ studentId: 'S-1', fullName: 'English / សុខ សុភា' }], 7);

    const result = await listStudents({
      search: 'S.1',
      status: 'active',
      className: 'Room 1',
      academicYear: '2026-2027',
      course: 'Headway',
      level: 'Beginner',
      room: 'Room 1',
      studyShift: 'Morning',
      grade: 'Grade 1',
      page: 2,
      perPage: 5
    });

    const { findQuery, countQuery } = tracker.getQueries();
    assert.deepEqual(findQuery, countQuery);
    assert.equal(findQuery.status, 'active');
    assert.equal(findQuery.className.source, 'Room 1');
    assert.equal(findQuery.academicYear.source, '2026-2027');
    assert.equal(findQuery.course.source, 'Headway');
    assert.equal(findQuery.level.source, 'Beginner');
    assert.equal(findQuery.room.source, 'Room 1');
    assert.equal(findQuery.studyShift.source, 'Morning');
    assert.equal(findQuery.grade.source, 'Grade 1');
    assert.deepEqual(findQuery.$or.map((condition) => Object.keys(condition)[0]), [
      'studentId',
      'fullName',
      'className',
      'guardianName',
      'phone'
    ]);
    assert.equal(findQuery.$or[0].studentId.source, 'S\\.1');
  });

  it('preserves the list response shape and total count', async () => {
    mockStudents([{ studentId: 'S-1', fullName: 'English / សុខ សុភា' }], 7);

    const result = await listStudents();

    assert.deepEqual(Object.keys(result).sort(), ['items', 'meta']);
    assert.deepEqual(Object.keys(result.meta).sort(), ['limit', 'page', 'total']);
    assert.equal(result.meta.total, 7);
    assert.equal(result.items.length, 1);
  });
});
