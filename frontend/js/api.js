const API_BASE_URL = "http://localhost:5000/api";


function getAuthHeaders(json=false){

    const headers = {
        Authorization:
        "Bearer " + localStorage.getItem("fhahToken")
    };


    if(json){
        headers["Content-Type"] =
        "application/json";
    }


    return headers;

}



async function apiRequest(endpoint, options={}){

    const {
        method="GET",
        body,
        auth=false
    } = options;


    try{

        const response = await fetch(

            `${API_BASE_URL}${endpoint}`,

            {

                method,

                headers:
                auth
                ?
                getAuthHeaders(Boolean(body))
                :
                {
                    "Content-Type":"application/json"
                },


                body:
                body
                ?
                JSON.stringify(body)
                :
                undefined

            }

        );


        const data =
        await response.json();


        if(!response.ok){

            console.error(data);

            return null;

        }


        return data;


    }

    catch(error){

        console.error(
        "API Error:",
        error
        );

        return null;

    }

}