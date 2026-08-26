const { TeacherAttendance, Teacher, User, SchoolSetting } = require('../../models');
const { createAttendancePolicyService } = require('./attendancePolicy.service');
const { normalizeToDayStart, addDays, parseTimeToMinutes } = require('./time.utils');

const SESSION_TYPES = ['morning', 'afternoon', 'evening'];

const createAbsentSettlementService = ({
  TeacherAttendanceModel = TeacherAttendance,
  TeacherModel = Teacher,
  UserModel = User,
  SchoolSettingModel = SchoolSetting,
  policyService = createAttendancePolicyService({ SchoolSettingModel }),
  nowProvider = () => new Date()
} = {}) => {
  const getSessionEnd = (dayStart, policy, sessionType) => {
    const sessionPolicy = policyService.getSessionPolicy(policy, sessionType);
    const endMinutes = parseTimeToMinutes(sessionPolicy.checkoutTime);
    if (endMinutes === null) return null;

    const end = new Date(dayStart);
    end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    return end;
  };

  const findExistingAttendance = async ({ teacherId, attendanceDate, sessionType }) => {
    const query = {
      teacherId,
      attendanceDate,
      isDeleted: false,
      ...(sessionType === 'morning'
        ? { $or: [{ sessionType: 'morning' }, { sessionType: null }, { sessionType: { $exists: false } }] }
        : { sessionType })
    };

    return TeacherAttendanceModel.findOne(query).sort({ createdAt: -1 }).lean();
  };

  const settleAbsent = async ({ date, sessionType, referenceTime = nowProvider() } = {}) => {
    const normalizedSession = String(sessionType || '').trim().toLowerCase();
    if (!SESSION_TYPES.includes(normalizedSession)) {
      throw new Error('sessionType must be morning, afternoon, or evening');
    }

    const dayStart = normalizeToDayStart(date || referenceTime);
    const policy = await policyService.getPolicy();
    const sessionEnd = getSessionEnd(dayStart, policy, normalizedSession);
    if (!sessionEnd || new Date(referenceTime).getTime() < sessionEnd.getTime()) {
      return { date: dayStart, sessionType: normalizedSession, settled: 0, preserved: 0, skipped: 0, beforeSessionEnd: true };
    }

    const teachers = await TeacherModel.find({ status: 'active' }).select('_id email').lean();
    let settled = 0;
    let preserved = 0;
    let skipped = 0;

    for (const teacher of teachers) {
      const existing = await findExistingAttendance({
        teacherId: teacher._id,
        attendanceDate: dayStart,
        sessionType: normalizedSession
      });

      if (existing) {
        preserved += 1;
        continue;
      }

      const user = teacher.email
        ? await UserModel.findOne({ email: String(teacher.email).trim().toLowerCase() }).select('_id').lean()
        : null;
      if (!user) {
        skipped += 1;
        continue;
      }

      try {
        const result = await TeacherAttendanceModel.findOneAndUpdate(
          {
            teacherId: teacher._id,
            attendanceDate: dayStart,
            sessionType: normalizedSession,
            isDeleted: false
          },
          {
            $setOnInsert: {
              teacherId: teacher._id,
              userId: user._id,
              attendanceDate: dayStart,
              sessionType: normalizedSession,
              checkInTime: null,
              checkOutTime: null,
              attendanceMethod: 'MANUAL',
              status: 'ABSENT',
              createdBy: user._id,
              updatedBy: user._id
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
        );

        if (result?.lastErrorObject?.updatedExisting) {
          preserved += 1;
        } else {
          settled += 1;
        }
      } catch (error) {
        if (error?.code === 11000) {
          preserved += 1;
          continue;
        }
        throw error;
      }
    }

    return {
      date: dayStart,
      sessionType: normalizedSession,
      sessionEnd,
      settled,
      preserved,
      skipped,
      beforeSessionEnd: false
    };
  };

  const settleCompletedSessions = async ({ date, referenceTime = nowProvider() } = {}) => {
    const results = [];
    for (const sessionType of SESSION_TYPES) {
      results.push(await settleAbsent({ date, sessionType, referenceTime }));
    }
    return results;
  };

  return {
    findExistingAttendance,
    settleAbsent,
    settleCompletedSessions
  };
};

module.exports = {
  createAbsentSettlementService,
  SESSION_TYPES
};