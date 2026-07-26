// ============================================
// FHAH ADMIN - PATIENT MANAGEMENT ROUTES
// ============================================


const express = require("express");
const router = express.Router();

const db = require("../db");
const verifyToken = require("../middleware/authMiddleware");



// ============================================
// GET ALL PATIENTS
// ============================================

router.get("/", verifyToken, (req, res)=>{

    const sql = `
        SELECT 
            id,
            full_name,
            medical_number,
            gender,
            date_of_birth,
            phone,
            email,
            address,
            created_at
        FROM patients
        ORDER BY created_at DESC
    `;


    db.query(sql,(err,results)=>{

        if(err){

            console.error("GET PATIENTS ERROR:",err);

            return res.status(500).json({
                message:"Failed to load patients"
            });

        }


        res.json(results);

    });


});




// ============================================
// GET SINGLE PATIENT
// ============================================


router.get("/:id",verifyToken,(req,res)=>{


    const id=req.params.id;


    db.query(
        "SELECT * FROM patients WHERE id=?",
        [id],
        (err,result)=>{


            if(err){

                console.error(err);

                return res.status(500).json({
                    message:"Database error"
                });

            }



            if(result.length===0){

                return res.status(404).json({
                    message:"Patient not found"
                });

            }



            res.json(result[0]);

        }
    );


});




// ============================================
// CREATE PATIENT
// ============================================


router.post("/",verifyToken,(req,res)=>{


    const {

        full_name,
        medical_number,
        gender,
        date_of_birth,
        phone,
        email,
        address

    } = req.body;



    if(!full_name){

        return res.status(400).json({

            message:"Patient name is required"

        });

    }



    const sql=`

    INSERT INTO patients

    (
        full_name,
        medical_number,
        gender,
        date_of_birth,
        phone,
        email,
        address
    )

    VALUES (?,?,?,?,?,?,?)

    `;



    db.query(

        sql,

        [

            full_name,
            medical_number || null,
            gender || null,
            date_of_birth || null,
            phone || null,
            email || null,
            address || null

        ],


        (err,result)=>{


            if(err){

                console.error(
                    "CREATE PATIENT ERROR:",
                    err
                );


                return res.status(500).json({

                    message:"Unable to register patient"

                });

            }



            res.status(201).json({

                message:"Patient registered successfully",

                id:result.insertId

            });


        }


    );


});




// ============================================
// UPDATE PATIENT
// ============================================


router.put("/:id",verifyToken,(req,res)=>{


const id=req.params.id;


const {

full_name,
medical_number,
gender,
date_of_birth,
phone,
email,
address

}=req.body;



const sql=`

UPDATE patients SET

full_name=?,
medical_number=?,
gender=?,
date_of_birth=?,
phone=?,
email=?,
address=?

WHERE id=?

`;



db.query(

sql,

[

full_name,
medical_number,
gender,
date_of_birth,
phone,
email,
address,
id

],


(err)=>{


if(err){

console.error(err);

return res.status(500).json({

message:"Unable to update patient"

});

}


res.json({

message:"Patient updated successfully"

});


}


);


});





// ============================================
// DELETE PATIENT
// ============================================


router.delete("/:id",verifyToken,(req,res)=>{


const id=req.params.id;


db.query(

"DELETE FROM patients WHERE id=?",

[id],


(err)=>{


if(err){

console.error(err);


return res.status(500).json({

message:"Unable to delete patient"

});

}


res.json({

message:"Patient deleted successfully"

});


}


);


});





module.exports = router;