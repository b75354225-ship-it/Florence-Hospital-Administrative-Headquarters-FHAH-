const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");


// GET ALL MEDICAL RECORDS

router.get("/", verifyToken, (req, res)=>{


    const sql = `

    SELECT 

    medical_records.*,

    patients.full_name AS patient_name,

    doctors.name AS doctor_name


    FROM medical_records


    LEFT JOIN patients

    ON medical_records.patient_id = patients.id


    LEFT JOIN doctors

    ON medical_records.doctor_id = doctors.id


    ORDER BY medical_records.created_at DESC

    `;



    db.query(sql, (err, results)=>{


        if(err){

            console.log(err);

            return res.status(500).json({

                message:"Error fetching medical records"

            });

        }


        res.json(results);


    });


});



// ADD MEDICAL RECORD

router.post("/", verifyToken, (req,res)=>{


    const {

        patient_id,
        doctor_id,
        diagnosis,
        treatment,
        prescription,
        notes

    } = req.body;



    const sql = `

    INSERT INTO medical_records

    (

    patient_id,
    doctor_id,
    diagnosis,
    treatment,
    prescription,
    notes

    )

    VALUES (?, ?, ?, ?, ?, ?)

    `;



    db.query(

        sql,

        [

        patient_id,
        doctor_id,
        diagnosis,
        treatment,
        prescription,
        notes

        ],


        (err,result)=>{


            if(err){

                console.log(err);


                return res.status(500).json({

                    message:"Medical record creation failed"

                });

            }


            res.json({

                message:"Medical record added successfully",

                id:result.insertId

            });


        }

    );


});



// DELETE MEDICAL RECORD

router.delete("/:id", verifyToken, (req,res)=>{


    db.query(

        "DELETE FROM medical_records WHERE id=?",

        [req.params.id],


        (err)=>{


            if(err){

                return res.status(500).json({

                    message:"Delete failed"

                });

            }


            res.json({

                message:"Medical record deleted successfully"

            });


        }

    );


});

// GET MEDICAL RECORDS FOR ONE PATIENT

router.get("/patient/:id", verifyToken, (req, res) => {

    const patientId = req.params.id;

    db.query(

        `
        SELECT
            medical_records.*,
            patients.full_name AS patient_name,
            doctors.name AS doctor_name

        FROM medical_records

        INNER JOIN patients
            ON medical_records.patient_id = patients.id

        LEFT JOIN doctors
            ON medical_records.doctor_id = doctors.id

        WHERE medical_records.patient_id = ?

        ORDER BY medical_records.created_at DESC
        `,

        [patientId],

        (err, results) => {

            if (err) {

                return res.status(500).json({
                    message: "Error fetching patient medical records"
                });

            }

            res.json(results);

        }

    );

});

module.exports = router;