// Mobile Navigation Toggle
const navToggle = document.getElementById("nav-toggle");
const navList = document.querySelector(".nav-list");

navToggle.addEventListener("click", () => {
  if (navList.style.display === "block") {
    navList.style.display = "none";
  } else {
    navList.style.display = "block";
  }
});

// Fade-in on Scroll
const sections = document.querySelectorAll(".section");
const revealSections = () => {
  sections.forEach((section) => {
    const sectionTop = section.getBoundingClientRect().top;
    if (sectionTop < window.innerHeight - 100) {
      section.classList.add("visible");
    }
  });
};
window.addEventListener("scroll", revealSections);
window.addEventListener("load", revealSections);

async function askChatbot() {
  const userInput = document.getElementById("user-input").value;
  if (!userInput) return;

  const response = await fetch("http://localhost:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput }),
  });

  const data = await response.json();
  document.getElementById("chat-box").innerHTML += `<p><b>You:</b> ${userInput}</p>`;
  document.getElementById("chat-box").innerHTML += `<p><b>Bot:</b> ${data.reply}</p>`;

  document.getElementById("user-input").value = "";
}


// Update Footer Year
document.getElementById("year").textContent = new Date().getFullYear();