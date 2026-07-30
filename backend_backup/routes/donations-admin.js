const express = require("express");
const router = express.Router();

const db = require("../config/db");
const verifyToken = require("../middleware/authMiddleware");


// Get all donations

router.get("/", verifyToken, (req, res)=>{


    db.query(

        "SELECT * FROM donations ORDER BY created_at DESC",

        (err, results)=>{


            if(err){

                console.log(err);

                return res.status(500).json({

                    message:"Error fetching donations"

                });

            }


            res.json(results);


        }

    );


});


module.exports = router;