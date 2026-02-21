const translations = {
  en: {
    brand: "DeepEye",
    subtitle: "Cognitive Security Infrastructure",
    hero_description:
      "DeepEye detects invisible manipulation structures to protect human judgment in the AI era.",
    analyze_label: "Analyze digital content",
    analyze_button: "Run Analysis",
    score_label: "Manipulation Score",
    techniques_label: "Detected Techniques",
    explanation_label: "Explanation"
  },
  pt: {
    brand: "DeepEye",
    subtitle: "Infraestrutura de Segurança Cognitiva",
    hero_description:
      "DeepEye identifica padrões invisíveis de manipulação emocional para proteger o julgamento humano na era da IA.",
    analyze_label: "Analisa conteúdo digital",
    analyze_button: "Analisar padrão",
    score_label: "Score de Manipulação",
    techniques_label: "Técnicas Identificadas",
    explanation_label: "Explicação"
  }
};

function setLanguage(lang) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = translations[lang][key];
  });
  localStorage.setItem("language", lang);
}

document.getElementById("languageSelect").addEventListener("change", (e) => {
  setLanguage(e.target.value);
});

window.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("language") || "en";
  document.getElementById("languageSelect").value = savedLang;
  setLanguage(savedLang);

  document.getElementById("analyzeBtn").addEventListener("click", () => {
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("scoreValue").textContent = "72";
    document.getElementById("riskLevel").textContent = "High Risk";
    document.getElementById("techniquesList").innerHTML =
      "<li>Artificial Urgency</li><li>Fear Appeal</li>";
    document.getElementById("explanation").textContent =
      "This text uses urgency and fear-based framing to trigger impulsive reaction.";
  });
});
