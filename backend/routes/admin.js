// ============================================
// FHAH ADMINISTRATION ROUTES
// Florence Hospital Administrative Headquarters
// ============================================

const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authMiddleware");

// ============================================
// DASHBOARD STATISTICS
// GET /api/admin/stats
// ============================================

router.get("/stats", verifyToken, (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM appointments)     AS appointments,
      (SELECT COUNT(*) FROM contact)          AS messages,
      (SELECT COUNT(*) FROM donations)        AS donations,
      (SELECT COUNT(*) FROM patients)         AS patients,
      (SELECT COUNT(*) FROM doctors)          AS doctors,
      (SELECT COUNT(*) FROM medical_records)  AS records
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Stats query error:", err);
      return res.status(500).json({
        message: "Unable to load dashboard statistics.",
      });
    }

    res.json(results[0]);
  });
});

// ============================================
// APPOINTMENT MANAGEMENT
// ============================================

const APPOINTMENT_STATUSES = ["Pending", "Approved", "Rejected", "Completed", "Cancelled"];

// --------------------------------------------
// LIST APPOINTMENTS (search, filter, paginate)
// GET /api/admin/appointments
//
// Query params (all optional):
//   status       - Pending | Approved | Rejected | Completed | Cancelled
//   department   - exact department match
//   doctor       - exact doctor name match
//   date_from    - YYYY-MM-DD, inclusive
//   date_to      - YYYY-MM-DD, inclusive
//   search       - matches against patient name (partial, case-insensitive)
//   page         - default 1
//   limit        - default 10, max 100
// --------------------------------------------

router.get("/appointments", verifyToken, (req, res) => {
  const {
    status,
    department,
    doctor,
    date_from,
    date_to,
    search,
    page = 1,
    limit = 10,
  } = req.query;

  const conditions = [];
  const params = [];

  if (status) {
    if (!APPOINTMENT_STATUSES.includes(status)) {
      return res.status(400).json({ message: "Invalid status filter." });
    }
    conditions.push("status = ?");
    params.push(status);
  }

  if (department) {
    conditions.push("department = ?");
    params.push(department);
  }

  if (doctor) {
    conditions.push("doctor = ?");
    params.push(doctor);
  }

  if (date_from) {
    conditions.push("appointment_date >= ?");
    params.push(date_from);
  }

  if (date_to) {
    conditions.push("appointment_date <= ?");
    params.push(date_to);
  }

  if (search) {
    conditions.push("name LIKE ?");
    params.push(`%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const safeLimit = Math.min(parseInt(limit, 10) || 10, 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const countSql = `SELECT COUNT(*) AS total FROM appointments ${whereClause}`;

  db.query(countSql, params, (countErr, countResults) => {
    if (countErr) {
      console.error("Appointments count error:", countErr);
      return res.status(500).json({
        message: "Unable to load appointments.",
      });
    }

    const total = countResults[0].total;

    const dataSql = `
      SELECT
        id,
        name,
        email,
        phone,
        department,
        appointment_date,
        doctor,
        message,
        status,
        created_at
      FROM appointments
      ${whereClause}
      ORDER BY appointment_date DESC
      LIMIT ? OFFSET ?
    `;

    db.query(dataSql, [...params, safeLimit, offset], (err, results) => {
      if (err) {
        console.error("Appointments query error:", err);
        return res.status(500).json({
          message: "Unable to load appointments.",
        });
      }

      res.json({
        appointments: results,
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          total_pages: Math.ceil(total / safeLimit) || 1,
        },
      });
    });
  });
});

// --------------------------------------------
// GET SINGLE APPOINTMENT
// GET /api/admin/appointments/:id
// --------------------------------------------

router.get("/appointments/:id", verifyToken, (req, res) => {
  const appointmentId = req.params.id;

  const sql = `
    SELECT
      id,
      name,
      email,
      phone,
      department,
      appointment_date,
      doctor,
      message,
      status,
      created_at
    FROM appointments
    WHERE id = ?
  `;

  db.query(sql, [appointmentId], (err, results) => {
    if (err) {
      console.error("Appointment lookup error:", err);
      return res.status(500).json({
        message: "Unable to retrieve appointment.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    res.json(results[0]);
  });
});

// --------------------------------------------
// CREATE APPOINTMENT (admin-initiated booking)
// POST /api/admin/appointments
// --------------------------------------------

router.post("/appointments", verifyToken, (req, res) => {
  const { name, email, phone, department, appointment_date, doctor, message } = req.body;

  if (!name || !department || !appointment_date) {
    return res.status(400).json({
      message: "Name, department, and appointment date are required.",
    });
  }

  const sql = `
    INSERT INTO appointments
      (name, email, phone, department, appointment_date, doctor, status, message)
    VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?)
  `;

  db.query(
    sql,
    [name, email || null, phone || null, department, appointment_date, doctor || null, message || null],
    (err, result) => {
      if (err) {
        console.error("Appointment creation error:", err);
        return res.status(500).json({
          message: "Appointment creation failed.",
        });
      }

      res.status(201).json({
        message: "Appointment created successfully.",
        appointment_id: result.insertId,
      });
    }
  );
});

// --------------------------------------------
// UPDATE APPOINTMENT DETAILS
// PUT /api/admin/appointments/:id
// --------------------------------------------

router.put("/appointments/:id", verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const { name, email, phone, department, appointment_date, doctor, message } = req.body;

  if (!name || !department || !appointment_date) {
    return res.status(400).json({
      message: "Name, department, and appointment date are required.",
    });
  }

  const sql = `
    UPDATE appointments
    SET
      name = ?,
      email = ?,
      phone = ?,
      department = ?,
      appointment_date = ?,
      doctor = ?,
      message = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [name, email || null, phone || null, department, appointment_date, doctor || null, message || null, appointmentId],
    (err) => {
      if (err) {
        console.error("Appointment update error:", err);
        return res.status(500).json({
          message: "Appointment update failed.",
        });
      }

      res.json({
        message: "Appointment updated successfully.",
      });
    }
  );
});

// --------------------------------------------
// UPDATE APPOINTMENT STATUS / ASSIGN DOCTOR
// PUT /api/admin/appointments/:id/status
// --------------------------------------------

router.put("/appointments/:id/status", verifyToken, (req, res) => {
  const appointmentId = req.params.id;
  const { status, doctor } = req.body;

  if (!APPOINTMENT_STATUSES.includes(status)) {
    return res.status(400).json({
      message: "Invalid status value.",
    });
  }

  const sql = `
    UPDATE appointments
    SET status = ?, doctor = ?
    WHERE id = ?
  `;

  db.query(sql, [status, doctor || null, appointmentId], (err) => {
    if (err) {
      console.error("Appointment status update error:", err);
      return res.status(500).json({
        message: "Unable to update appointment status.",
      });
    }

    res.json({
      message: `Appointment ${status.toLowerCase()} successfully.`,
    });
  });
});

// --------------------------------------------
// DELETE / CANCEL APPOINTMENT
// DELETE /api/admin/appointments/:id
// --------------------------------------------

router.delete("/appointments/:id", verifyToken, (req, res) => {
  const appointmentId = req.params.id;

  db.query("DELETE FROM appointments WHERE id = ?", [appointmentId], (err) => {
    if (err) {
      console.error("Appointment deletion error:", err);
      return res.status(500).json({
        message: "Appointment deletion failed.",
      });
    }

    res.json({
      message: "Appointment deleted successfully.",
    });
  });
});

// ============================================
// GET SINGLE PATIENT PROFILE
// GET /api/admin/patients/:id
// ============================================

router.get("/patients/:id", verifyToken, (req, res) => {
  const patientId = req.params.id;

  if (!patientId) {
    return res.status(400).json({
      message: "Patient ID is required.",
    });
  }

  const sql = `
    SELECT
      id,
      full_name,
      gender,
      date_of_birth,
      phone,
      email,
      address,
      medical_number,
      created_at
    FROM patients
    WHERE id = ?
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("Patient lookup error:", err);
      return res.status(500).json({
        message: "Unable to retrieve patient.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Patient not found.",
      });
    }

    res.json(results[0]);
  });
});

// ============================================
// GET SINGLE MEDICAL RECORD
// GET /api/admin/medical-records/:id
// ============================================

router.get("/medical-records/:id", verifyToken, (req, res) => {
  const recordId = req.params.id;

  const sql = `
    SELECT
      medical_records.id,
      medical_records.patient_id,
      medical_records.doctor_id,
      medical_records.diagnosis,
      medical_records.treatment,
      medical_records.prescription,
      medical_records.notes,
      medical_records.created_at,
      patients.full_name AS patient_name,
      doctors.name AS doctor_name
    FROM medical_records
    LEFT JOIN patients ON medical_records.patient_id = patients.id
    LEFT JOIN doctors ON medical_records.doctor_id = doctors.id
    WHERE medical_records.id = ?
  `;

  db.query(sql, [recordId], (err, results) => {
    if (err) {
      console.error("Medical record lookup error:", err);
      return res.status(500).json({
        message: "Unable to retrieve medical record.",
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "Medical record not found.",
      });
    }

    res.json(results[0]);
  });
});

// ============================================
// CREATE MEDICAL RECORD
// POST /api/admin/medical-records
// ============================================

router.post("/medical-records", verifyToken, (req, res) => {
  const { patient_id, doctor_id, diagnosis, treatment, prescription, notes } =
    req.body;

  if (!patient_id || !diagnosis) {
    return res.status(400).json({
      message: "Patient and diagnosis are required.",
    });
  }

  const sql = `
    INSERT INTO medical_records
      (patient_id, doctor_id, diagnosis, treatment, prescription, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [patient_id, doctor_id, diagnosis, treatment, prescription, notes],
    (err, result) => {
      if (err) {
        console.error("Medical record creation error:", err);
        return res.status(500).json({
          message: "Medical record creation failed.",
        });
      }

      res.status(201).json({
        message: "Medical record created successfully.",
        record_id: result.insertId,
      });
    }
  );
});


// ============================================
// GET PATIENT MEDICAL RECORDS
// GET /api/admin/medical-records/patient/:id
// ============================================

router.get("/medical-records/patient/:id", verifyToken, (req, res) => {
  const patientId = req.params.id;

  const sql = `
    SELECT
      medical_records.id,
      diagnosis,
      treatment,
      prescription,
      notes,
      medical_records.created_at,
      doctors.name AS doctor_name,
      doctors.specialization
    FROM medical_records
    LEFT JOIN doctors
      ON medical_records.doctor_id = doctors.id
    WHERE medical_records.patient_id = ?
    ORDER BY medical_records.created_at DESC
  `;

  db.query(sql, [patientId], (err, results) => {
    if (err) {
      console.error("Medical records lookup error:", err);
      return res.status(500).json({
        message: "Unable to load medical records.",
      });
    }

    res.json(results);
  });
});

// ============================================
// UPDATE PATIENT PROFILE
// PUT /api/admin/patients/:id
// ============================================

router.put("/patients/:id", verifyToken, (req, res) => {
  const patientId = req.params.id;
  const { full_name, gender, date_of_birth, phone, email, address, medical_number } = req.body;

  if (!full_name) {
    return res.status(400).json({
      message: "Full name is required.",
    });
  }

  const sql = `
    UPDATE patients
    SET
      full_name = ?,
      gender = ?,
      date_of_birth = ?,
      phone = ?,
      email = ?,
      address = ?,
      medical_number = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [full_name, gender || null, date_of_birth || null, phone || null, email || null, address || null, medical_number || null, patientId],
    (err) => {
      if (err) {
        console.error("Patient update error:", err);
        return res.status(500).json({
          message: "Patient update failed.",
        });
      }

      res.json({
        message: "Patient updated successfully.",
      });
    }
  );
});

// ============================================
// CREATE MEDICAL RECORD
// POST /api/admin/medical-records
// ============================================

router.post("/medical-records", verifyToken, (req, res) => {
  const { patient_id, doctor_id, diagnosis, treatment, prescription, notes } =
    req.body;

  if (!patient_id || !diagnosis) {
    return res.status(400).json({
      message: "Patient and diagnosis are required.",
    });
  }

  const sql = `
    INSERT INTO medical_records
      (patient_id, doctor_id, diagnosis, treatment, prescription, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [patient_id, doctor_id, diagnosis, treatment, prescription, notes],
    (err, result) => {
      if (err) {
        console.error("Medical record creation error:", err);
        return res.status(500).json({
          message: "Medical record creation failed.",
        });
      }

      res.status(201).json({
        message: "Medical record created successfully.",
        record_id: result.insertId,
      });
    }
  );
});

// ============================================
// UPDATE MEDICAL RECORD
// PUT /api/admin/medical-records/:id
// ============================================

router.put("/medical-records/:id", verifyToken, (req, res) => {
  const recordId = req.params.id;
  const { diagnosis, treatment, prescription, notes } = req.body;

  const sql = `
    UPDATE medical_records
    SET
      diagnosis = ?,
      treatment = ?,
      prescription = ?,
      notes = ?
    WHERE id = ?
  `;

  db.query(
    sql,
    [diagnosis, treatment, prescription, notes, recordId],
    (err) => {
      if (err) {
        console.error("Medical record update error:", err);
        return res.status(500).json({
          message: "Medical record update failed.",
        });
      }

      res.json({
        message: "Medical record updated successfully.",
      });
    }
  );
});

// ============================================
// LIST ALL MEDICAL RECORDS (search, filter, paginate)
// GET /api/admin/medical-records
//
// Query params (all optional):
//   patient   - partial match on patient name
//   doctor_id - exact doctor match
//   date_from - YYYY-MM-DD, inclusive
//   date_to   - YYYY-MM-DD, inclusive
//   page      - default 1
//   limit     - default 10, max 100
// ============================================

router.get("/medical-records", verifyToken, (req, res) => {
  const { patient, doctor_id, date_from, date_to, page = 1, limit = 10 } = req.query;

  const conditions = [];
  const params = [];

  if (patient) {
    conditions.push("patients.full_name LIKE ?");
    params.push(`%${patient}%`);
  }

  if (doctor_id) {
    conditions.push("medical_records.doctor_id = ?");
    params.push(doctor_id);
  }

  if (date_from) {
    conditions.push("medical_records.created_at >= ?");
    params.push(date_from);
  }

  if (date_to) {
    conditions.push("medical_records.created_at <= ?");
    params.push(date_to);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const safeLimit = Math.min(parseInt(limit, 10) || 10, 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM medical_records
    LEFT JOIN patients ON medical_records.patient_id = patients.id
    ${whereClause}
  `;

  db.query(countSql, params, (countErr, countResults) => {
    if (countErr) {
      console.error("Medical records count error:", countErr);
      return res.status(500).json({
        message: "Unable to load medical records.",
      });
    }

    const total = countResults[0].total;

    const dataSql = `
      SELECT
        medical_records.id,
        medical_records.patient_id,
        medical_records.diagnosis,
        medical_records.treatment,
        medical_records.prescription,
        medical_records.notes,
        medical_records.created_at,
        patients.full_name AS patient_name,
        doctors.name AS doctor_name,
        doctors.specialization
      FROM medical_records
      LEFT JOIN patients ON medical_records.patient_id = patients.id
      LEFT JOIN doctors ON medical_records.doctor_id = doctors.id
      ${whereClause}
      ORDER BY medical_records.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.query(dataSql, [...params, safeLimit, offset], (err, results) => {
      if (err) {
        console.error("Medical records query error:", err);
        return res.status(500).json({
          message: "Unable to load medical records.",
        });
      }

      res.json({
        records: results,
        pagination: {
          total,
          page: safePage,
          limit: safeLimit,
          total_pages: Math.ceil(total / safeLimit) || 1,
        },
      });
    });
  });
});

// ============================================
// DELETE MEDICAL RECORD
// DELETE /api/admin/medical-records/:id
// ============================================

router.delete("/medical-records/:id", verifyToken, (req, res) => {
  const recordId = req.params.id;

  db.query("DELETE FROM medical_records WHERE id = ?", [recordId], (err) => {
    if (err) {
      console.error("Medical record deletion error:", err);
      return res.status(500).json({
        message: "Medical record deletion failed.",
      });
    }

    res.json({
      message: "Medical record deleted successfully.",
    });
  });
});

module.exports = router;