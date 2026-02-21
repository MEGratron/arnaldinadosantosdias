document.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    btn.style.transform = "scale(0.98)";
    setTimeout(() => {
      btn.style.transform = "";
    }, 100);
  });
});
