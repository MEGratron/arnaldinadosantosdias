document.addEventListener("DOMContentLoaded", () => {

  const button = document.getElementById("analyzeBtn");
  const textarea = document.querySelector("textarea");

  button.addEventListener("click", () => {

    const content = textarea.value.trim();

    if (!content) {
      alert("Please insert content first.");
      return;
    }

    // Simulação de análise
    const score = Math.floor(Math.random() * 100);

    let risk = "Low Risk";
    if (score > 60) risk = "High Risk";
    else if (score > 30) risk = "Medium Risk";

    alert(`Manipulation Score: ${score}\nRisk Level: ${risk}`);
  });

});
