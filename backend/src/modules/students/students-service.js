const { ApiError, sendAccountVerificationEmail } = require("../../utils");
const { findAllStudents, findStudentDetail, findStudentToSetStatus, addOrUpdateStudent } = require("./students-repository");
const { findUserById } = require("../../shared/repository");

const STUDENT_ROLE_ID = 3;

// Only students count: without the role check, /students/:id could read, disable or overwrite an admin/staff user.
const checkStudentId = async (id) => {
    const user = await findUserById(id);
    if (!user || user.role_id !== STUDENT_ROLE_ID) {
        throw new ApiError(404, "Student not found");
    }
}

// student_add_update reports failures as { status: false, message, description: SQLERRM }.
const throwStudentSaveError = ({ message, description }) => {
    if (message === "Email already exists" || description?.includes("users_email_key")) {
        throw new ApiError(409, "Email already exists");
    }
    if (description?.includes("class_name_fkey") || description?.includes("section_name_fkey")) {
        throw new ApiError(400, "Class or section does not exist");
    }
    console.error(description);
    throw new ApiError(500, message);
}

const getAllStudents = async (payload) => {
    const students = await findAllStudents(payload);
    if (students.length <= 0) {
        throw new ApiError(404, "Students not found");
    }

    return students;
}

const getStudentDetail = async (id) => {
    await checkStudentId(id);

    const student = await findStudentDetail(id);
    if (!student) {
        throw new ApiError(404, "Student not found");
    }

    return student;
}

const addNewStudent = async (payload) => {
    const ADD_STUDENT_AND_EMAIL_SEND_SUCCESS = "Student added and verification email sent successfully.";
    const ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL = "Student added, but failed to send verification email.";
    const result = await addOrUpdateStudent(payload);
    if (!result.status) {
        throwStudentSaveError(result);
    }

    try {
        await sendAccountVerificationEmail({ userId: result.userId, userEmail: payload.email });
        return { message: ADD_STUDENT_AND_EMAIL_SEND_SUCCESS };
    } catch (error) {
        return { message: ADD_STUDENT_AND_BUT_EMAIL_SEND_FAIL }
    }
}

const updateStudent = async (payload) => {
    // student_add_update inserts when the id is unknown, so check first or PUT would create a student.
    await checkStudentId(payload.userId);

    const result = await addOrUpdateStudent(payload);
    if (!result.status) {
        throwStudentSaveError(result);
    }

    return { message: result.message };
}

const setStudentStatus = async ({ userId, reviewerId, status }) => {
    await checkStudentId(userId);

    const affectedRow = await findStudentToSetStatus({ userId, reviewerId, status });
    if (affectedRow <= 0) {
        throw new ApiError(500, "Unable to disable student");
    }

    return { message: "Student status changed successfully" };
}

module.exports = {
    getAllStudents,
    getStudentDetail,
    addNewStudent,
    setStudentStatus,
    updateStudent,
};
