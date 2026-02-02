var bookId=-1;
const imageBaseUrl="https://covers.openlibrary.org/b/id/";

function setupDefaultDate(){
    console.log("seting up");
    var today=new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const dd = String(today.getDate()).padStart(2, '0');
        const formattedDate = `${yyyy}-${mm}-${dd}`;
    document.querySelector("input[type=Date").value=formattedDate;

}

function showBlankOverlay(){
    document.querySelector("#overlayContainer").style.display="flex";
    document.querySelector("#updateButton").style.display="none";
    document.querySelector("#submitButton").style.display="inline";
    document.querySelector("#blogMunipilationPanel").style.display="none";
    setupDefaultDate();
}

function hideMe(){
    document.querySelector("#overlayContainer").style.display="none";
    document.querySelector("#informationTitleInput").value="";
    document.querySelector("#informationNotesInput").value="";
    document.querySelector("#informationReviewInput").value="";
    document.querySelector("#informationRatingsInput").value="0";
    bookId=-1;
    setupDefaultDate();
}

function deleteReview(){
    fetch(`/${bookId}`,{
                method:'DELETE',
            }).then((response) => {
                if(response.status=="404"){
                    alert("Unable to remove blog");
                }
                else{
                    alert("Blog removed");
                    window.location.href = "/";
                    }
            });
}

function validateInput(id=-1){
    console.log("sb");
    var title=document.querySelector("#informationTitleInput").value;
    if(title&&title.trim()!=""){
        title=title.trim();
        //title=title.replace(/\s+/g, ' ');
        document.querySelector("#informationTitleInput").value=title;
        var date=document.querySelector("#informationDateInput").value;
        console.log(title);
        if(date){
            
            var formData=new FormData();
            let content={
                title:title,
                start:date,
                notes:informationForm.informationNotesInput.value,
                review:informationForm.informationReviewInput.value,
                rating:informationForm.informationRatingsInput.value
            }
            formData.append('title',informationForm.informationTitleInputvalue);
            formData.append('date',informationForm.informationDateInput.value);
            formData.append('notes',informationForm.informationNotesInput.value);
            formData.append('review',informationForm.informationReviewInput.value);
            formData.append('rating',informationForm.informationRatingsInput.value);
            console.log(JSON.stringify(content));
            if(id>0){
                fetch(`/${bookId}`,{
                method:'PATCH',
                headers:{
                'Content-type': 'application/json; charset=UTF-8',
                'Accept': 'application/json'
                    },
                body:JSON.stringify(content),
            }).then((response) => {
                if(response.status=="404"){
                    alert("Blog with that title already exists");
                }
                else{
                    alert("Blog updated");
                    window.location.href = "/";
                    }
            });
            }
            else{
                fetch("/",{
                method:'POST',
                headers:{
                'Content-type': 'application/json; charset=UTF-8',
                'Accept': 'application/json'
                    },
                body:JSON.stringify(content),
            }).then((response) => {
                if(response.ok){
                     alert("Blog Created");
                    window.location.href = "/";
                }
                else{
                    alert("could not update blog");
                }
            });
            }
        }
        else{
            alert("Date must not be empty");
        }
    }
    else{
        alert("A title is required");
    }
}

    function loadBook(id){
        console.log("clicked");
        fetch(`/information/${id}`,{
            method: "GET",
            headers:{
                'Content-type': 'application/json; charset=UTF-8',
                'Accept': 'application/json'
            },
        }).then(response=>{
            if(response.ok){
                response.json().then((data)=>{
                    bookId=id;
                    console.log(data.data);
                    document.querySelector("#informationTitleInput").value=data.data.title;
                    document.querySelector("#informationNotesInput").value=data.data.notes;
                    document.querySelector("#informationReviewInput").value=data.data.review;
                    document.querySelector("#informationRatingsInput").value=data.data.rating;
                    document.querySelector("#informationRatingsInput").dispatchEvent(new Event("change"));
                    document.querySelector("#informationDateInput").value=data.data.started.split("T")[0];
                    document.querySelector("#updateButton").style.display="inline";
                    document.querySelector("#submitButton").style.display="none";
                    document.querySelector("#blogMunipilationPanel").style.display="contents";
                    document.querySelector("#overlayContainer").style.display="flex";
                });
            }
            else{
                alert("could not load");
            }
        });

}
