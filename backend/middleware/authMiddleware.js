// ============================================
// FHAH AUTHENTICATION MIDDLEWARE
// JWT TOKEN VERIFICATION
// ============================================


const jwt = require("jsonwebtoken");

function verifyToken(req, res, next) {


    const authHeader = req.headers.authorization;



    // Check if token exists

    if (!authHeader) {


        return res.status(401).json({

            message:
            "Access denied. No token provided."

        });


    }



    // Extract token

    const token = authHeader.split(" ")[1];



    if (!token) {


        return res.status(401).json({

            message:
            "Access denied. Invalid token format."

        });


    }




    try {


        const decoded = jwt.verify(

            token,

            process.env.JWT_SECRET

        );



        // Debug confirmation
        // console.log(
        //     "Decoded Admin:",
        //     decoded
        // );



        req.admin = decoded;



        next();



    } catch(error) {


        console.error(
            "JWT Verification Error:",
            error.message
        );



        return res.status(403).json({

            message:
            "Invalid or expired token."

        });


    }


}




module.exports = verifyToken;