const bcrypt = require("bcrypt");

const newPassword = "FHAH2026@AdminPass";

bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) {
        console.error(err);
        return;
    }
    console.log("New hash:", hash);
});