document.addEventListener("DOMContentLoaded", () => {

  const button = document.getElementById("analyzeBtn");
  const textarea = document.querySelector("textarea");

  const resultSection = document.getElementById("resultSection");
  const scoreValue = document.getElementById("scoreValue");
  const riskLevel = document.getElementById("riskLevel");
  const progressCircle = document.getElementById("progressCircle");
  const riskFill = document.getElementById("riskFill");
  const techniquesList = document.getElementById("techniquesList");

  const circumference = 440;

  button.addEventListener("click", () => {

    const content = textarea.value.trim();
    if (!content) {
      alert("Please insert content first.");
      return;
    }

    const score = Math.floor(Math.random() * 100);
    updateDashboard(score);

    resultSection.classList.remove("hidden");
  });

  function updateDashboard(score) {

    scoreValue.textContent = score;

    const offset = circumference - (score / 100) * circumference;
    progressCircle.style.strokeDashoffset = offset;

    let riskText = "Low Risk";
    let color = "#10B981"; // green

    if (score > 60) {
      riskText = "High Risk";
      color = "#EF4444"; // red
    } else if (score > 30) {
      riskText = "Medium Risk";
      color = "#F59E0B"; // yellow
    }

    riskLevel.textContent = riskText;
    progressCircle.style.stroke = color;
    riskFill.style.width = score + "%";
    riskFill.style.background = color;

    techniquesList.innerHTML = generateTechniques(score);
  }

  function generateTechniques(score) {
    if (score > 60) {
      return `
        <li>Artificial Urgency</li>
        <li>Fear Appeal</li>
        <li>Scarcity Framing</li>
      `;
    } else if (score > 30) {
      return `
        <li>Emotional Framing</li>
        <li>Authority Cue</li>
      `;
    } else {
      return `<li>No strong manipulation signals detected</li>`;
    }
  }

});
