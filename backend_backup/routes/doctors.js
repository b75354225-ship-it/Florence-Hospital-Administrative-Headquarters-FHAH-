const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");


// GET ALL DOCTORS

router.get("/", verifyToken, (req, res)=>{


    db.query(

        "SELECT * FROM doctors ORDER BY created_at DESC",

        (err, results)=>{


            if(err){

                console.log(err);

                return res.status(500).json({

                    message:"Error fetching doctors"

                });

            }


            res.json(results);


        }

    );


});



// ADD DOCTOR

router.post("/", verifyToken, (req,res)=>{


    const {

        name,
        specialization,
        department,
        phone,
        email,
        image

    } = req.body;



    const sql = `

    INSERT INTO doctors

    (name, specialization, department, phone, email, image)

    VALUES (?, ?, ?, ?, ?, ?)

    `;



    db.query(

        sql,

        [
            name,
            specialization,
            department,
            phone,
            email,
            image
        ],

        (err,result)=>{


            if(err){

                console.log(err);

                return res.status(500).json({

                    message:"Doctor creation failed"

                });

            }


            res.json({

                message:"Doctor added successfully",

                id:result.insertId

            });


        }

    );


});



// DELETE DOCTOR

router.delete("/:id", verifyToken, (req,res)=>{


    const id = req.params.id;



    db.query(

        "DELETE FROM doctors WHERE id=?",

        [id],


        (err)=>{


            if(err){

                return res.status(500).json({

                    message:"Delete failed"

                });

            }



            res.json({

                message:"Doctor deleted successfully"

            });


        }


    );


});

// GET SINGLE DOCTOR

router.get("/:id", verifyToken, (req, res) => {

    const id = req.params.id;

    db.query(
        "SELECT * FROM doctors WHERE id = ?",
        [id],
        (err, results) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Error fetching doctor"
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    message: "Doctor not found"
                });
            }

            res.json(results[0]);

        }
    );

});

// UPDATE DOCTOR

router.put("/:id", verifyToken, (req, res) => {

    const id = req.params.id;

    const {
        name,
        specialization,
        department,
        phone,
        email,
        image
    } = req.body;

    if (!name) {
        return res.status(400).json({
            message: "Doctor name is required"
        });
    }

    const sql = `
        UPDATE doctors SET
            name = ?,
            specialization = ?,
            department = ?,
            phone = ?,
            email = ?,
            image = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            name,
            specialization || null,
            department || null,
            phone || null,
            email || null,
            image || null,
            id
        ],
        (err) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Doctor update failed"
                });
            }

            res.json({
                message: "Doctor updated successfully"
            });

        }
    );

});
module.exports = router;