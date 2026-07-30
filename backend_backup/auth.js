const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per window
  message: {
    message: "Too many login attempts. Please try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});


const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const db = require("./db");


// ADMIN LOGIN ROUTE

router.post("/login", loginLimiter, (req, res) => {

   
    const { username, password } = req.body;

    if (!username || !password) {

        return res.status(400).json({

            message: "Username and password are required"

        });

    }



    const sql =  "SELECT * FROM admins WHERE username = ?";


    db.query(
        sql,
        [username],
        async (err, results) => {


            if(err){

                console.log(err);

                return res.status(500).json({

                    message:"Database error"

                });

            }



            if(results.length === 0){

                return res.status(401).json({

                    message:"Invalid username or password"

                });

            }



            const admin = results[0];



            const passwordMatch =
            await bcrypt.compare(
                password,
                admin.password
            );



            if(!passwordMatch){

                return res.status(401).json({

                    message:"Invalid username or password"

                });

            }




            const token = jwt.sign(

                {
                    id:admin.id,
                    username:admin.username,
                    role:admin.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn:"8h"
                }

            );

              


            res.json({

                message:"Login successful",

                token:token,

                admin:{
                    username:admin.username,
                    role:admin.role
                }

            });



        }

    );



});



module.exports = router;