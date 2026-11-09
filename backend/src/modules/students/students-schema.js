const { z } = require("zod");

const idParams = z.object({
    id: z.string().regex(/^\d+$/, "Student id must be a positive integer")
});

// PUT overwrites every column (student_add_update), so add and update require the same fields.
const studentBody = z.object({
    name: z.string().trim().min(1, "Name is required"),
    email: z.string().trim().email("Valid email is required"),
    class: z.string().trim().min(1, "Class is required"),
    section: z.string().trim().min(1, "Section is required"),
    roll: z.union([z.string().regex(/^\d+$/), z.number().int()], { message: "Roll must be a number" }),
    dob: z.string().date("dob must be YYYY-MM-DD").or(z.string().datetime()).optional(),
    admissionDate: z.string().date("admissionDate must be YYYY-MM-DD").or(z.string().datetime()).optional(),
    systemAccess: z.boolean().optional()
}).passthrough();

const AddStudentSchema = z.object({ body: studentBody });

const UpdateStudentSchema = z.object({ params: idParams, body: studentBody });

const StudentIdSchema = z.object({ params: idParams });

const StudentStatusSchema = z.object({
    params: idParams,
    body: z.object({ status: z.boolean({ required_error: "status is required", invalid_type_error: "status must be true or false" }) })
});

module.exports = {
    AddStudentSchema,
    UpdateStudentSchema,
    StudentIdSchema,
    StudentStatusSchema
};
