const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/appointments
router.post("/", (req, res) => {

    const {
        fullName,
        phone,
        email,
        department,
        date,
        message
    } = req.body;

    if (!fullName || !phone || !email || !department || !date) {
        return res.status(400).json({
            error: "All required fields must be filled."
        });
    }

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
                return res.status(500).json(err);
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