const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { body, validationResult } = require("express-validator");

// ================================
// VALIDATION
// ================================

const validateAppointment = [
  body("fullName").trim().notEmpty().withMessage("Full name is required").isLength({ max: 100 }).withMessage("Name is too long"),
  body("phone").trim().notEmpty().withMessage("Phone is required").isLength({ max: 20 }).withMessage("Phone number is too long"),
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().withMessage("Invalid email format"),
  body("department").trim().notEmpty().withMessage("Department is required").isLength({ max: 100 }).withMessage("Department name is too long"),
  body("date").notEmpty().withMessage("Appointment date is required").isISO8601().withMessage("Invalid date format"),
  body("message").optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage("Message is too long"),
];

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: errors.array()[0].msg,
    });
  }
  next();
}

// POST /api/appointments
router.post("/", validateAppointment, handleValidation, (req, res) => {

    const {
        fullName,
        phone,
        email,
        department,
        date,
        message
    } = req.body;

    const sql = `
        INSERT INTO appointments
        (name, email, phone, department, appointment_date, message)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            fullName,
            email,
            phone,
            department,
            date,
            message || ""
        ],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({ error: "Unable to book appointment." });
            }

            res.status(201).json({
                message: "Appointment booked successfully.",
                id: result.insertId
            });

        }
    );

});

// GET all appointments
router.get("/", (req, res) => {

    db.query(
        "SELECT * FROM appointments ORDER BY id DESC",
        (err, results) => {

            if (err) {
                return res.status(500).json(err);
            }

            res.json(results);

        }
    );

});

// UPDATE appointment status and doctor
router.put("/:id", (req, res) => {

    const { status, doctor } = req.body;

    const appointmentId = req.params.id;


    if (!status) {
        return res.status(400).json({
            error: "Status is required."
        });
    }


    const sql = `
        UPDATE appointments
        SET status = ?, doctor = ?
        WHERE id = ?
    `;


    db.query(
        sql,
        [
            status,
            doctor || null,
            appointmentId
        ],
        (err, result) => {

            if (err) {
                console.log(err);

                return res.status(500).json({
                    error: err.message
                });
            }


            res.json({
                message: "Appointment updated successfully."
            });

        }
    );

});

// DELETE appointment
router.delete("/:id", (req, res) => {

    const appointmentId = req.params.id;


    db.query(
        "DELETE FROM appointments WHERE id = ?",
        [appointmentId],

        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }


            res.json({
                message: "Appointment deleted successfully."
            });

        }
    );

});
module.exports = router;
