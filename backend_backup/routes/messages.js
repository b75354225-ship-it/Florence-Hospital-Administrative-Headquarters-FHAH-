const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");


// Get all contact messages

router.get("/", verifyToken, (req, res) => {

    const sql = `
        SELECT *
        FROM contact
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Database error"
            });

        }

        res.json(results);

    });

});

module.exports = router;