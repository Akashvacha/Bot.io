const API_KEY = "AIzaSyCnctQo3wCSfNU9eSRWfsKwNUi2qH_1oQI";
const weatherKey = "2ed7b97226de42162349e201ad43ff9f";

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");

// Initialize theme and welcome message
window.onload = () => {
  applySavedTheme();
  if (!localStorage.getItem("hasWelcomed")) {
    appendMessage("bot", "👋 Hello! I'm Gemini AI. Ask me anything!");
    localStorage.setItem("hasWelcomed", "true");
  }
  userInput.focus();
};

// Theme toggling
document.getElementById("toggleTheme").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
});

function applySavedTheme() {
  if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
  }
}

// Handle Enter key to send message
userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSend();
});

// Add message to chat
function appendMessage(sender, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `message ${sender}-message`;

  wrapper.innerHTML = `
    <div class="avatar">${sender === "user" ? "👤" : "🤖"}</div>
    <div class="message-text">${text}</div>
  `;

  chatBox.appendChild(wrapper);
  scrollToBottom();
}

function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Main send handler
async function handleSend() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";

  const typingEl = document.createElement("div");
  typingEl.className = "message bot-message";
  typingEl.innerHTML = `
    <div class="avatar">🤖</div>
    <div class="message-text">
      Gemini is typing<span class="dot" style="--i:0">.</span>
      <span class="dot" style="--i:1">.</span>
      <span class="dot" style="--i:2">.</span>
    </div>`;
  chatBox.appendChild(typingEl);
  scrollToBottom();

  const reply = await getGeminiResponse(message);
  typingEl.remove();
  appendMessage("bot", reply.replace(/\n/g, "<br>"));
}

// Gemini API call
async function getGeminiResponse(userText) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  const body = { contents: [{ parts: [{ text: userText }] }] };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "⚠️ No response.";
  } catch (err) {
    console.error("Gemini API error:", err);
    return "❌ Error fetching response.";
  }
}

// Clear chat with animation
document.getElementById("clearChat").addEventListener("click", () => {
  localStorage.removeItem("chatHistory");
  localStorage.removeItem("hasWelcomed");

  const messages = Array.from(chatBox.children);
  messages.forEach((msg, index) => {
    setTimeout(() => msg.classList.add("clear-animate"), index * 100);
  });

  setTimeout(() => {
    chatBox.innerHTML = "";

    const tempMsg = document.createElement("div");
    tempMsg.className = "message bot-message fade";
    tempMsg.innerText = "🧹 Chat cleared with style! ✨";
    chatBox.appendChild(tempMsg);
    scrollToBottom();

    setTimeout(() => tempMsg.classList.add("fade-out"), 3000);

    tempMsg.addEventListener("animationend", () => {
      tempMsg.remove();
      appendMessage("bot", "👋 Hello! I'm Gemini AI. Ask me anything!");
      localStorage.setItem("hasWelcomed", "true");
    });
  }, messages.length * 100 + 600);
});

// Prompt buttons
function sendPrompt(promptText) {
  if (promptText.toLowerCase().includes("weather")) {
    getWeather();
  } else {
    userInput.value = promptText;
    handleSend();
  }
}

// Ask for city name
function getWeather() {
  appendMessage("bot", "📌 Which city's weather would you like to check?");
  askForCityName();
}

function askForCityName() {
  const cityInput = document.createElement("input");
  cityInput.type = "text";
  cityInput.placeholder = "Enter city name...";
  cityInput.className = "city-input";

  const submitBtn = document.createElement("button");
  submitBtn.innerText = "Get Weather";
  submitBtn.className = "submit-city-btn";

  const container = document.createElement("div");
  container.className = "city-prompt";
  container.append(cityInput, submitBtn);
  chatBox.appendChild(container);

  cityInput.focus();

  const submitCity = () => {
    const city = cityInput.value.trim();
    if (!city) return;
    container.remove();
    fetchWeatherByCity(city);
  };

  submitBtn.onclick = submitCity;
  cityInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitCity();
  });

  scrollToBottom();
}

// Fetch and display weather
async function fetchWeatherByCity(city) {
  appendMessage("bot", "☁️ Fetching weather...");
  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${weatherKey}&units=metric`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.cod === "404") {
      appendMessage("bot", "⚠️ City not found. Please try again.");
      askForCityName();
    } else {
      const { name, main, weather } = data;
      const icon = `https://openweathermap.org/img/wn/${weather[0].icon}.png`;
      appendMessage("bot", `🌦️ Weather in ${name}: ${main.temp}°C, ${weather[0].description} <img src="${icon}" alt="icon">`);
    }
  } catch {
    appendMessage("bot", "❌ Error fetching city weather.");
  }
}


