const {
  Teacher,
  TeacherAttendance,
  AttendanceAttemptLog
} = require('../models');
const { createTeacherAttendanceServices } = require('./teacherAttendance');
const { normalizeToDayStart } = require('./teacherAttendance/time.utils');
const { createAttendanceError } = require('./teacherAttendance/errors');
const config = require('../config');

const normalizePhone = (value = '') => String(value || '').replace(/[^\d+]/g, '');

const mapFailureReasonCode = (errorCode) => {
  switch (errorCode) {
    case 'OUTSIDE_RADIUS':
      return 'OUTSIDE_RADIUS';
    case 'QR_EXPIRED':
      return 'QR_EXPIRED';
    case 'QR_INVALID':
    case 'QR_REVOKED':
      return 'QR_INVALID';
    case 'GPS_DENIED':
      return 'GPS_DENIED';
    case 'ALREADY_CHECKED_IN':
    case 'ALREADY_CHECKED_OUT':
      return 'DUPLICATE';
    case 'SESSION_EXPIRED':
      return 'SESSION_EXPIRED';
    default:
      return 'UNKNOWN_ERROR';
  }
};

const createTeacherAttendanceService = ({
  TeacherModel = Teacher,
  TeacherAttendanceModel = TeacherAttendance,
  AttendanceAttemptLogModel = AttendanceAttemptLog,
  businessServices = createTeacherAttendanceServices(),
  nowProvider = () => new Date(),
  sessionWritesEnabled = config.teacherAttendanceSessionWritesEnabled
} = {}) => {
  const resolveActorFromUser = async (user) => {
    if (!user || !user._id) {
      throw createAttendanceError('SESSION_EXPIRED', 'Teacher session is invalid or expired', 401);
    }

    const email = String(user.email || '').trim().toLowerCase();
    const phone = normalizePhone(user.phoneNumber || '');

    const orFilters = [];
    if (email) {
      orFilters.push({ email });
    }
    if (phone) {
      orFilters.push({ phone: phone.replace(/^\+855/, '0') });
      orFilters.push({ phone });
    }

    if (orFilters.length === 0) {
      throw createAttendanceError('TEACHER_PROFILE_NOT_FOUND', 'Teacher profile not linked to current user', 403);
    }

    const teacher = await TeacherModel.findOne({ status: 'active', $or: orFilters }).lean();
    if (!teacher) {
      throw createAttendanceError('TEACHER_PROFILE_NOT_FOUND', 'Teacher profile not linked to current user', 403);
    }

    return {
      teacherId: teacher._id,
      userId: user._id
    };
  };

  const recordAttempt = async ({
    actor,
    attendanceMethod,
    qrTokenId,
    latitude,
    longitude,
    gpsAccuracy,
    device,
    ipAddress,
    userAgent,
    result,
    reasonCode,
    requestId
  }) => {
    const payload = {
      teacherId: actor?.teacherId || null,
      userId: actor?.userId || null,
      attendanceMethod,
      requestTime: nowProvider(),
      latitude: latitude === undefined ? null : Number(latitude),
      longitude: longitude === undefined ? null : Number(longitude),
      gpsAccuracy: gpsAccuracy === undefined ? null : Number(gpsAccuracy),
      device: String(device || ''),
      ipAddress: String(ipAddress || ''),
      userAgent: String(userAgent || ''),
      qrTokenId: qrTokenId || null,
      result,
      reasonCode,
      requestId: String(requestId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`)
    };

    await AttendanceAttemptLogModel.create(payload);
  };

  const checkIn = async ({
    user,
    attendanceMethod = 'QR',
    qrToken,
    latitude,
    longitude,
    gpsAccuracy,
    remarks,
    device,
    ipAddress,
    userAgent,
    requestId,
    sessionType = 'morning'
  }) => {
    const actor = await resolveActorFromUser(user);

    try {
      const validated = await businessServices.checkInValidationService.validateCheckIn({
        actor,
        attendanceMethod,
        qrToken,
        latitude,
        longitude,
        gpsAccuracy,
        sessionType: sessionWritesEnabled ? sessionType : null
      });

      const attendance = await TeacherAttendanceModel.create({
        teacherId: actor.teacherId,
        userId: actor.userId,
        attendanceDate: validated.attendanceDate,
        sessionType: sessionWritesEnabled ? validated.sessionType : null,
        checkInTime: validated.checkInTime,
        attendanceMethod: validated.attendanceMethod,
        status: validated.status,
        latitude: validated.latitude,
        longitude: validated.longitude,
        gpsAccuracy: validated.gpsAccuracy,
        distanceFromSchool: validated.distanceFromSchool,
        qrTokenId: validated.qrTokenId,
        remarks: String(remarks || '').trim() || undefined,
        createdBy: actor.userId,
        updatedBy: actor.userId
      });

      await recordAttempt({
        actor,
        attendanceMethod: validated.attendanceMethod,
        qrTokenId: validated.qrTokenId,
        latitude,
        longitude,
        gpsAccuracy,
        device,
        ipAddress,
        userAgent,
        result: 'SUCCESS',
        reasonCode: 'SUCCESS',
        requestId
      });

      return attendance.toObject();
    } catch (error) {
      await recordAttempt({
        actor,
        attendanceMethod,
        latitude,
        longitude,
        gpsAccuracy,
        device,
        ipAddress,
        userAgent,
        result: 'FAILED',
        reasonCode: mapFailureReasonCode(error.code),
        requestId
      });
      throw error;
    }
  };

  const checkOut = async ({
    user,
    latitude,
    longitude,
    gpsAccuracy,
    remarks,
    device,
    ipAddress,
    userAgent,
    requestId,
    sessionType = 'morning'
  }) => {
    const actor = await resolveActorFromUser(user);

    try {
      const validated = await businessServices.checkOutValidationService.validateCheckOut({
        actor,
        latitude,
        longitude,
        gpsAccuracy,
        sessionType
      });

      const attendance = validated.attendance;
      if (!sessionWritesEnabled && attendance.sessionType) {
        throw createAttendanceError('SESSION_ATTENDANCE_WRITES_DISABLED', 'Session-aware attendance writes are temporarily disabled', 503);
      }
      attendance.sessionType = validated.sessionType || attendance.sessionType;
      attendance.checkOutTime = validated.checkOutTime;
      attendance.status = validated.status;
      attendance.latitude = validated.latitude;
      attendance.longitude = validated.longitude;
      attendance.gpsAccuracy = validated.gpsAccuracy;
      attendance.distanceFromSchool = validated.distanceFromSchool;
      if (remarks !== undefined) {
        attendance.remarks = String(remarks || '').trim();
      }
      attendance.updatedBy = actor.userId;
      await attendance.save();

      await recordAttempt({
        actor,
        attendanceMethod: attendance.attendanceMethod,
        qrTokenId: attendance.qrTokenId,
        latitude,
        longitude,
        gpsAccuracy,
        device,
        ipAddress,
        userAgent,
        result: 'SUCCESS',
        reasonCode: 'SUCCESS',
        requestId
      });

      return attendance.toObject();
    } catch (error) {
      await recordAttempt({
        actor,
        attendanceMethod: 'MANUAL',
        latitude,
        longitude,
        gpsAccuracy,
        device,
        ipAddress,
        userAgent,
        result: 'FAILED',
        reasonCode: mapFailureReasonCode(error.code),
        requestId
      });
      throw error;
    }
  };

  const getTodayAttendance = async ({ user }) => {
    const actor = await resolveActorFromUser(user);
    const today = normalizeToDayStart(nowProvider());

    const attendance = await businessServices.duplicatePreventionService.findExistingDailyAttendance({
      teacherId: actor.teacherId,
      attendanceDate: today
    });

    if (!attendance) {
      return {
        attendance: null,
        canCheckIn: true,
        canCheckOut: false
      };
    }

    return {
      attendance: attendance.toObject ? attendance.toObject() : attendance,
      canCheckIn: false,
      canCheckOut: !attendance.checkOutTime
    };
  };

  const getAttendanceHistory = async ({ user, query = {} }) => {
    const actor = await resolveActorFromUser(user);
    return businessServices.attendanceHistoryQueryService.queryHistory({
      teacherId: actor.teacherId,
      fromDate: query.fromDate,
      toDate: query.toDate,
      status: query.status,
      attendanceMethod: query.attendanceMethod,
      sessionType: query.sessionType,
      page: query.page,
      perPage: query.perPage
    });
  };

  return {
    resolveActorFromUser,
    checkIn,
    checkOut,
    getTodayAttendance,
    getAttendanceHistory
  };
};

module.exports = createTeacherAttendanceService();
module.exports.createTeacherAttendanceService = createTeacherAttendanceService;
