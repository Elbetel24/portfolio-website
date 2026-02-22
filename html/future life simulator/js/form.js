// Instead of 11 separate setItems, do this:
const userData = {
    name, age, career, careerGoal, study, skills, 
    saving, financialGoal, exercise, careerGoal2, motivation
};

localStorage.setItem("userProfile", JSON.stringify(userData));