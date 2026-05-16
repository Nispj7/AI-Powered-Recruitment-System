const API = "http://127.0.0.1:5000/api";

let user = null;
let sessionId = null;

function addBubble(text, who="bot") {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

document.getElementById("btnLogin").onclick = async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API}/login`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();
  if (!data.ok) {
    document.getElementById("loginStatus").textContent = "❌ Login failed";
    return;
  }
  user = data.user;
  document.getElementById("loginStatus").textContent = `✅ Logged in as ${user.username}`;
};

document.getElementById("start").onclick = async () => {
  if (!user) return alert("Login first");

  const res = await fetch(`${API}/start_session`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ user_id: user.id })
  });
  const data = await res.json();
  if (!data.ok) return alert("Failed to start session");

  sessionId = data.session_id;
  addBubble(`QUESTION ${data.q_no}: ${data.question}`, "bot");
  addBubble(`Reason: ${data.reason}`, "bot");
};

document.getElementById("send").onclick = async () => {
  if (!sessionId) return alert("Start interview first");
  const msg = document.getElementById("msg").value.trim();
  if (!msg) return;

  addBubble(msg, "user");
  document.getElementById("msg").value = "";

  const res = await fetch(`${API}/submit_answer`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      session_id: sessionId,
      answer_text: msg,
      answer_mode: "text"
    })
  });

  const data = await res.json();
  if (!data.ok) {
    addBubble("Error: " + data.error, "bot");
    return;
  }

  if (data.done) {
    addBubble(`✅ Interview completed. Decision: ${data.decision} | Score: ${data.final_score}`, "bot");
    document.getElementById("report").textContent = data.report;
    return;
  }

  addBubble(`QUESTION ${data.q_no}: ${data.question}`, "bot");
  addBubble(`Reason: ${data.reason}`, "bot");
};
const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

let user_id = 1;       // default user
let session_id = null; // will be created when interview starts

function addMessage(sender, msg) {
  chatBox.innerHTML += `<p><b>${sender}:</b> ${msg}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Start interview automatically
async function startInterview() {
  addMessage("System", "Starting interview...");

  const res = await fetch("http://127.0.0.1:5000/api/interview/start", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ user_id })
  });

  const data = await res.json();
  session_id = data.session_id;

  addMessage("System", "✅ Interview started. Session ID: " + session_id);
  addMessage("Bot", "Tell me about yourself.");
}

sendBtn.addEventListener("click", () => {
  const text = input.value.trim();
  if (!text) return;

  addMessage("You", text);
  input.value = "";

  // for now just show dummy reply
  addMessage("Bot", "✅ Answer received. Next question will come here...");
});

startInterview();
let mediaRecorder;
let audioChunks = [];

document.getElementById("record").onclick = async () => {
  if (!sessionId) {
    alert("Start interview first");
    return;
  }

  const status = document.getElementById("recStatus");

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);
  audioChunks = [];

  mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

  mediaRecorder.onstop = async () => {
    const blob = new Blob(audioChunks, { type: "audio/wav" });
    const formData = new FormData();
    formData.append("audio", blob);
    formData.append("session_id", sessionId);

    status.textContent = "Uploading audio...";

    const res = await fetch(`${API}/upload_audio`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    if (!data.ok) {
      status.textContent = "❌ Audio processing failed";
      return;
    }

    addBubble("🎤 Audio answer submitted", "user");
    status.textContent = "";

    // chatbot response
    if (data.done) {
      addBubble(`✅ Interview completed. Decision: ${data.decision}`, "bot");
      document.getElementById("report").textContent = data.report;
    } else {
      addBubble(`QUESTION ${data.q_no}: ${data.question}`, "bot");
      addBubble(`Reason: ${data.reason}`, "bot");
    }
  };

  mediaRecorder.start();
  status.textContent = "Recording... (5 sec)";

  setTimeout(() => {
    mediaRecorder.stop();
  }, 5000);
};

