// 1. Get the data from storage
const rawData = localStorage.getItem("userProfile");

// 2. Check if data actually exists
if (rawData) {
    const user = JSON.parse(rawData);

    // 3. Map the object data to the HTML IDs
    document.getElementById("displayName").innerText = user.name;
    document.getElementById("displayAge").innerText = user.age;
    document.getElementById("displayCareer").innerText = user.career;
    document.getElementById("displayCareerGoal").innerText = user.careerGoal;
    document.getElementById("displayStudy").innerText = user.study;
    document.getElementById("displaySkills").innerText = user.skills;
    document.getElementById("displaySaving").innerText = user.saving;
    document.getElementById("displayFinancialGoal").innerText = user.financialGoal;
    document.getElementById("displayExercise").innerText = user.exercise;
    document.getElementById("displayCareerGoal2").innerText = user.careerGoal2;
    document.getElementById("displayMotivation").innerText = user.motivation;

} else {
    // If someone tries to visit result.html without filling the form
    alert("No profile found. Redirecting to setup...");
    window.location.href = "index.html";
}