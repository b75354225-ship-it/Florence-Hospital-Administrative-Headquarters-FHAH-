// ============================================
// FLORENCE HOSPITAL ADMINISTRATIVE HEADQUARTERS
// FHAH BACKEND SERVER
// ============================================


// ============================================
// CORE DEPENDENCIES
// ============================================

require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const chatRoutes = require("./routes/chat");


// ============================================
// DATABASE CONNECTION
// ============================================

require("./config/db");



// ============================================
// ROUTES IMPORTS
// ============================================


// Authentication
const authRoutes = require("./auth");


// Public routes
const appointmentRoutes = require("./routes/appointments");
const contactRoutes = require("./routes/contact");
const donationRoutes = require("./routes/donations");
const paymentRoutes = require("./routes/payments");

// Admin routes
const adminRoutes = require("./routes/admin");
const messageRoutes = require("./routes/messages");
const donationAdminRoutes = require("./routes/donations-admin");
const doctorRoutes = require("./routes/doctors");
const patientRoutes = require("./routes/patients");
 


// Middleware
const verifyToken = require("./middleware/authMiddleware");




// ============================================
// CREATE EXPRESS APPLICATION
// ============================================

const app = express();


// ============================================
// GLOBAL MIDDLEWARE
// ============================================


app.use(

    cors({

        origin: ["http://localhost:5500", "http://127.0.0.1:5500"],

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE"
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]

    })

);



app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                "script-src-attr": ["'unsafe-inline'"],
            },
        },
    })
);

app.use(
    morgan("dev")
);

app.use(
    express.json()
);

app.use(
    express.urlencoded({
        extended: true
    })
);


// ============================================
// SERVE FHAH FRONTEND WEBSITE
// ============================================

const frontendPath = path.join(
    __dirname,
    "../frontend"
);


app.use(
    express.static(frontendPath)
);

app.use(
    cors({
        origin: ["http://localhost:5500", "http://127.0.0.1:5500"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

// ============================================
// HEALTH CHECK ROUTE
// ============================================


app.get("/", (req,res)=>{

    res.sendFile(
        path.join(
            frontendPath,
            "index.html"
        )
    );

});


// ============================================
// PUBLIC API ROUTES
// ============================================

app.use(
    "/api/chat",
    chatRoutes
);



app.use(
    "/api/appointments",
    appointmentRoutes
);



app.use(
    "/api/contact",
    contactRoutes
);



app.use(
    "/api/donations",
    donationRoutes
);

app.use(
    "/api/payments",
    paymentRoutes
);

// ============================================
// AUTHENTICATION ROUTES
// ============================================


app.use(
    "/api/auth",
    authRoutes
);



// ============================================
// ADMINISTRATION ROUTES
// ============================================


app.use(
    "/api/admin",
    adminRoutes
);



app.use(
    "/api/admin/messages",
    messageRoutes
);



app.use(
    "/api/admin/donations",
    donationAdminRoutes
);



app.use(
    "/api/admin/doctors",
    doctorRoutes
);



app.use(
    "/api/admin/patients",
    patientRoutes
);


// ============================================
// PROTECTED ADMIN TEST ROUTE
// ============================================


app.get(

    "/api/admin/test",

    verifyToken,

    (req,res)=>{


        res.json({

            message:
            "Welcome FHAH Administrator. Protected route working.",


            administrator:
            req.admin

        });


    }

);

// ============================================
// 404 NOT FOUND HANDLER
// ============================================


app.use(
(req,res)=>{

    if(req.path.startsWith("/api")){
        return res.status(404).json({
            message:"API endpoint not found"
        });
    }

    res.sendFile(
        path.join(
            __dirname,
            "../frontend/index.html"
        )
    );

});


// ============================================
// GLOBAL ERROR HANDLER
// ============================================


app.use(

    (err,req,res,next)=>{


        console.error(err.stack);



        res.status(500).json({

            message:
            "Internal Server Error"

        });



    }

);


// ============================================
// SERVER START
// ============================================


const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";


app.listen(
    PORT,
    HOST,
    () => {

        console.log("====================================");
        console.log("FHAH BACKEND SERVER RUNNING");
        console.log(`HOST: ${HOST}`);
        console.log(`PORT: ${PORT}`);
        console.log("DATABASE: CONNECTED");
        console.log("====================================");

    }
);

// ============================================
// ADMIN PANEL ROUTING
// ============================================


app.use(
    "/admin",
    express.static(
        path.join(
            frontendPath,
            "admin"
        )
    )
);

