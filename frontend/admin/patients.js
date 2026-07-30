// ============================================
// FHAH ADMIN - PATIENT MANAGEMENT JAVASCRIPT
// ============================================


const API_URL = "http://localhost:5000/api/patients";


// Get authentication token
const token = localStorage.getItem("token");



// DOM Elements

const patientForm = document.getElementById("patientForm");
const patientTableBody = document.getElementById("patientTableBody");
const patientModal = document.getElementById("patientModal");
const modalTitle = document.getElementById("modalTitle");
const addPatientBtn = document.getElementById("addPatientBtn");
const closeModalBtn = document.getElementById("closeModal");



// Store current editing patient

let editingPatientId = null;





// ============================================
// LOAD PATIENTS
// ============================================


async function loadPatients(){


    try{


        const response = await fetch(API_URL, {


            headers:{


                "Authorization":`Bearer ${token}`


            }


        });



        const patients = await response.json();



        if(!response.ok){


            throw new Error(
                patients.message || 
                "Unable to load patients"
            );


        }



        patientTableBody.innerHTML="";



        patients.forEach(patient=>{


            patientTableBody.innerHTML += `


             <tr>
                 <td>${patient.full_name}</td>
                 <td>${patient.medical_number || "-"}</td>
                 <td>${patient.gender || "-"}</td>
                 <td>${patient.phone || "-"}</td>
                 <td>${patient.email || "-"}</td>
            <td>

                    <button 
                    class="edit-btn"
                    onclick="editPatient(${patient.id})">

                    <i class="fas fa-edit"></i>
                    Edit

                    </button>



                    <button 
                    class="delete-btn"
                    onclick="deletePatient(${patient.id})">

                    <i class="fas fa-trash"></i>
                    Delete

                    </button>


                </td>


            </tr>


            `;


        });



    }

    catch(error){


        console.error(
            "LOAD PATIENT ERROR:",
            error
        );


        alert(
            "Unable to load patients"
        );


    }



}





// ============================================
// OPEN ADD PATIENT MODAL
// ============================================


addPatientBtn.addEventListener(
"click",
()=>{


    editingPatientId=null;


    patientForm.reset();


    modalTitle.textContent =
    "Register New Patient";


    patientModal.style.display="flex";


});






// ============================================
// CLOSE MODAL
// ============================================


closeModalBtn.addEventListener(
"click",
()=>{


    patientModal.style.display="none";


});






// Close when clicking outside

window.addEventListener(
"click",
(event)=>{


    if(event.target === patientModal){

        patientModal.style.display="none";

    }


});







// ============================================
// SUBMIT PATIENT FORM
// ============================================


patientForm.addEventListener(
"submit",
async function(event){


event.preventDefault();



const patientData={


    full_name:
    this.full_name.value,


    medical_number:
    this.medical_number.value,


    gender:
    this.gender.value,


    date_of_birth:
    this.date_of_birth.value,


    phone:
    this.phone.value,


    email:
    this.email.value,


    address:
    this.address.value



};




try{


let url = API_URL;

let method="POST";



// UPDATE MODE

if(editingPatientId){


    url =
    `${API_URL}/${editingPatientId}`;


    method="PUT";


}




const response = await fetch(
url,
{


method,


headers:{


"Content-Type":"application/json",


"Authorization":
`Bearer ${token}`


},


body:
JSON.stringify(patientData)



});





const result =
await response.json();




if(!response.ok){


    throw new Error(
        result.message
    );


}




alert(result.message);



patientForm.reset();



patientModal.style.display="none";



editingPatientId=null;



loadPatients();



}


catch(error){


console.error(
"SUBMIT PATIENT ERROR:",
error
);



alert(
error.message ||
"Unable to save patient"
);



}



});








// ============================================
// EDIT PATIENT
// ============================================


async function editPatient(id){



try{


const response =
await fetch(
`${API_URL}/${id}`,
{


headers:{


"Authorization":
`Bearer ${token}`


}


});




const patient =
await response.json();



if(!response.ok){


throw new Error(
patient.message
);


}




editingPatientId=id;



patientForm.full_name.value =
patient.full_name || "";



patientForm.medical_number.value =
patient.medical_number || "";



patientForm.gender.value =
patient.gender || "";



patientForm.date_of_birth.value =
patient.date_of_birth 
? patient.date_of_birth.substring(0,10)
: "";



patientForm.phone.value =
patient.phone || "";



patientForm.email.value =
patient.email || "";



patientForm.address.value =
patient.address || "";





modalTitle.textContent =
"Edit Patient";



patientModal.style.display="flex";



}



catch(error){


console.error(
"EDIT PATIENT ERROR:",
error
);



alert(
"Unable to load patient"
);


}



}







// ============================================
// DELETE PATIENT
// ============================================


async function deletePatient(id){



const confirmDelete =
confirm(
"Are you sure you want to delete this patient?"
);



if(!confirmDelete)
return;




try{


const response =
await fetch(
`${API_URL}/${id}`,
{


method:"DELETE",


headers:{


"Authorization":
`Bearer ${token}`


}


});




const result =
await response.json();



if(!response.ok){


throw new Error(
result.message
);


}




alert(
result.message
);



loadPatients();



}



catch(error){



console.error(
"DELETE PATIENT ERROR:",
error
);



alert(
"Unable to delete patient"
);



}



}







// ============================================
// START PAGE
// ============================================


document.addEventListener(
"DOMContentLoaded",
()=>{


loadPatients();


});