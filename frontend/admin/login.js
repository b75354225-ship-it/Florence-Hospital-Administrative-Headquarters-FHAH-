const loginForm = document.getElementById("loginForm");


loginForm.addEventListener("submit", async function(event){

    event.preventDefault();


    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;


    try {


        const response = await fetch(
            "http://localhost:5000/api/auth/login",
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },


                body:JSON.stringify({
                    username:username,
                    password:password

                })

            }
        );



        const data = await response.json();

        console.log("Login Response:", data);
        console.log("Status:", response.status);

        if(response.ok){

            console.log("Login successful");

            localStorage.setItem("fhahToken", data.token);

            localStorage.setItem(
              "fhahAdmin",
               JSON.stringify(data.admin)
           );

           console.log("Stored Token:", localStorage.getItem("fhahToken"));

           window.location.href = "dashboard.html";

        }

        else{

            document.getElementById("message").innerHTML = data.message;

        }

    }


    catch(error){
        console.log(error);

        document.getElementById("message").innerHTML = "Server connection failed";

    }

});