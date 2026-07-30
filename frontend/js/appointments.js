document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("appointmentForm");

    if (!form) return;


    form.addEventListener("submit", async (e) => {

        e.preventDefault();


        const appointmentData = {

            fullName: document.getElementById("fullName").value,
            phone: document.getElementById("phone").value,
            email: document.getElementById("email").value,
            department: document.getElementById("department").value,
            date: document.getElementById("date").value,
            message: document.getElementById("notes").value

        };


        try {

            const response = await fetch(
                "http://localhost:5000/api/appointments",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(appointmentData)
                }
            );


            const result = await response.json();


            const status =
                document.getElementById("appointmentStatus");


            if (response.ok) {

                status.innerHTML =
                "✅ Appointment request submitted successfully.";

                form.reset();

            } else {

                status.innerHTML =
                "❌ " + result.error;

            }


        } catch(error) {

            console.log(error);

            document.getElementById("appointmentStatus").innerHTML =
            "❌ Server connection failed.";

        }

    });

});