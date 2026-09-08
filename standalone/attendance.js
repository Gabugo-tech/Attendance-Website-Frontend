/**
 * Chukwuemeka Odumegwu Ojukwu University (COOU)
 * Secure Biometric Face-Recognition Client-side Controller with Eye-Blink Liveness Engine
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1. DYNAMIC CONFIGURATION LOADER
let db, auth;
let idToken = null;
let currentSession = null;
let currentCourse = null;

async function bootstrapFirebase() {
  try {
    const configResponse = await fetch("/firebase-applet-config.json");
    const firebaseConfig = await configResponse.json();
    
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log("[Client System] Firebase services successfully calibrated.");
    setupAuthListeners();
    await loadCoursesAndSessions();
  } catch (err) {
    console.error("[Client System] Failed to initialize Firebase application context.", err);
    updateFeedback("Critical Error: Firebase config could not be resolved.", "text-rose-550 font-bold");
  }
}

// 2. RUN AUTHENTICATION WRAPPER
let currentUser = null; // Keep a reference to refresh tokens on demand

function setupAuthListeners() {
  const provider = new GoogleAuthProvider();
  const usernameText = document.getElementById("auth-username");
  const authButton = document.getElementById("auth-button");
  const authIndicator = document.getElementById("auth-indicator");

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      idToken = await user.getIdToken();
      usernameText.textContent = user.email;
      usernameText.className = "text-[10px] font-mono-code text-emerald-400 uppercase font-black";
      authIndicator.className = "h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]";
      authButton.classList.add("hidden");
      
      console.log("[Security Hub] Verified active supervisor session:", user.email);
      updateFeedback("Calibrating Lens... Ready to scan.", "text-slate-350");
      
      // Wake UI controls
      document.getElementById("camera-gate-overlay").classList.remove("hidden");
    } else {
      idToken = null;
      usernameText.textContent = "SUPERVISOR SIGN-IN REQUIRED";
      usernameText.className = "text-[10px] font-mono-code text-rose-450 uppercase font-bold";
      authIndicator.className = "h-2 w-2 rounded-full bg-slate-800";
      authButton.classList.remove("hidden");
      
      document.getElementById("camera-gate-overlay").classList.add("hidden");
      updateFeedback("Session locked. Please sign in as an authorized admin or supervisor.", "text-amber-505 font-semibold");
    }
  });

  authButton.addEventListener("click", async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("[Security Hub] Popup signIn failed", err);
      alert("Authentication Failed. Check if browser blocked oauth popups.");
    }
  });
}

// 3. RETRIEVE ACTIVE COURSES & SEESSIONS
async function loadCoursesAndSessions() {
  const courseSelect = document.getElementById("course-select");
  const sessionSelect = document.getElementById("session-select");
  
  if (!db) return;
  
  try {
    // Read Course list
    const courseSnap = await getDocs(collection(db, "courses"));
    courseSelect.innerHTML = '<option value="">-- Choose Course Target --</option>';
    
    courseSnap.forEach(docSnap => {
      const data = docSnap.data();
      const opt = document.createElement("option");
      opt.value = docSnap.id;
      opt.textContent = `${docSnap.id} - ${data.title}`;
      courseSelect.appendChild(opt);
    });

    courseSelect.addEventListener("change", async (e) => {
      currentCourse = e.target.value;
      if (!currentCourse) {
        sessionSelect.innerHTML = '<option value="">Choose Course First</option>';
        return;
      }
      
      // Find Matching Active Sessions
      sessionSelect.innerHTML = '<option value="">Fetching sessions...</option>';
      const q = query(
        collection(db, "sessions"), 
        where("courseCode", "==", currentCourse),
        where("isActive", "==", true)
      );
      
      const sessionSnap = await getDocs(q);
      sessionSelect.innerHTML = '<option value="">-- Choose Session Target --</option>';
      
      if (sessionSnap.empty) {
        sessionSelect.innerHTML = '<option value="">No active sessions found</option>';
        updateFeedback(`No active lecture sessions started for ${currentCourse}. Create one in Dashboard.`, "text-amber-500 font-semibold");
        return;
      }
      
      sessionSnap.forEach(docSnap => {
        const data = docSnap.data();
        const opt = document.createElement("option");
        opt.value = docSnap.id;
        opt.textContent = `Session ${data.date} (${data.startTime})`;
        sessionSelect.appendChild(opt);
      });
    });

    sessionSelect.addEventListener("change", (e) => {
      currentSession = e.target.value;
      if (currentSession) {
        updateFeedback("Handshake Ready. Launch camera scan lens.", "text-slate-300");
      }
    });

  } catch (err) {
    console.error("[Data Loader] Retrieval failure", err);
  }
}

// 4. FACE API BIO LENS ENGINE & EYE BLINK COMPILER
const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const startBtn = document.getElementById("activate-scan-btn");

let biometricModelsLoaded = false;
let isScanRunning = false;
let blinkHistory = [];
let livenessVerified = false;
let scanIntervalTimer = null;

async function checkAndLoadFaceModels() {
  const statusLabel = document.getElementById("portal-init-text");
  try {
    statusLabel.textContent = "Loading Face Detector Weights...";
    // ssd_mobilenetv1
    await faceapi.nets.ssdMobilenetv1.loadFromUri("/models");
    
    statusLabel.textContent = "Loading Landmark Mesh Neural Net...";
    // face_landmark_68
    await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
    
    statusLabel.textContent = "Loading Feature Descriptor Weights...";
    // face_recognition
    await faceapi.nets.faceRecognitionNet.loadFromUri("/models");
    
    biometricModelsLoaded = true;
    console.log("[Bio Engine] Neural network pipelines fully online.");
    
    document.getElementById("camera-loading-overlay").classList.add("hidden");
  } catch (err) {
    console.error("[Bio Engine] Model download failed.", err);
    statusLabel.innerHTML = `<span class="text-rose-550 font-bold">Model Setup Failure</span>`;
    updateFeedback("Neural files missing. Ensure public/models/ exists.", "text-rose-500 font-semibold");
  }
}

// Eye Aspect Ratio (EAR) Euclidean distance helpers
function getDistance(p1, p2) {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

function calculateEyeAspectRatio(eyeLandmarks) {
  // Eye points: top-down heights p2-p6, p3-p5. Width: p1-p4.
  const verticalLeft = getDistance(eyeLandmarks[1], eyeLandmarks[5]);
  const verticalRight = getDistance(eyeLandmarks[2], eyeLandmarks[4]);
  const horizontal = getDistance(eyeLandmarks[0], eyeLandmarks[3]);
  return (verticalLeft + verticalRight) / (2.0 * horizontal);
}

// Wake Scanner
async function startAttendanceScanner() {
  if (!biometricModelsLoaded) return;
  if (!currentSession || !currentCourse) {
    alert("Please formulate session calibration options first.");
    return;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" }
    });
    
    video.srcObject = stream;
    video.classList.remove("hidden");
    document.getElementById("camera-gate-overlay").classList.add("hidden");
    document.getElementById("scanning-laser-line").classList.remove("hidden");
    
    document.getElementById("lens-hud-status").textContent = "LENS ACTIVE: MONITORING Liveness";
    document.getElementById("scan-hud-dot").className = "relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]";
    
    isScanRunning = true;
    livenessVerified = false;
    updateLivenessHUD();
    
    startAnalysisLoops();
  } catch (err) {
    console.error("[Bio Engine] Media error", err);
    alert("Camera access denied or device conflicts.");
  }
}

function stopAttendanceScanner() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }
  video.classList.add("hidden");
  document.getElementById("camera-gate-overlay").classList.remove("hidden");
  document.getElementById("scanning-laser-line").classList.add("hidden");
  
  document.getElementById("lens-hud-status").textContent = "LENS INACTIVE";
  document.getElementById("scan-hud-dot").className = "relative inline-flex h-2 w-2 rounded-full bg-red-500";
  
  isScanRunning = false;
  if (scanIntervalTimer) clearInterval(scanIntervalTimer);
}

// 5. MATH METRIC LOOPS
function startAnalysisLoops() {
  const displaySize = { width: video.clientWidth, height: video.clientHeight };
  faceapi.matchDimensions(canvas, displaySize);

  scanIntervalTimer = setInterval(async () => {
    if (!isScanRunning) return;

    // Detect Single Face with landmarks and facial descriptor
    const detection = await faceapi.detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

    // Clear Canvas overlays
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!detection) {
      updateFeedback("Align face inside camera viewport", "text-slate-400 font-mono-code");
      return;
    }

    // Draw HUD boxes
    const resizedDetections = faceapi.resizeResults(detection, displaySize);
    faceapi.draw.drawDetections(canvas, resizedDetections);

    // 6. COMPUTE LIVENESS (BLINKS VERIFYING EYE EAR RATIOS)
    const landmarks = detection.landmarks;
    const leftEyePoints = landmarks.getLeftEye();
    const rightEyePoints = landmarks.getRightEye();

    const leftEAR = calculateEyeAspectRatio(leftEyePoints);
    const rightEAR = calculateEyeAspectRatio(rightEyePoints);
    const averageEAR = (leftEAR + rightEAR) / 2;

    // Blink criteria: ratio drops below 0.22, then recovers back up above 0.25
    if (averageEAR < 0.22) {
      blinkHistory.push("closed");
      if (blinkHistory.length > 10) blinkHistory.shift();
    } else if (averageEAR > 0.25) {
      if (blinkHistory.includes("closed")) {
        triggerBlinkSuccess();
      }
      blinkHistory = [];
    }

    // 7. SENT TO DEPLOYED CLOUD DATABASE VALIDATOR CAPTURE OVER THERMAL ENGINE
    if (livenessVerified) {
      updateFeedback("Liveness Verified. Transmitting Biometric Identity...", "text-green-405 font-bold animate-pulse");
      isScanRunning = false; // Pause scanner to prevent buffer bombardment
      clearInterval(scanIntervalTimer);
      
      await handleTransmitDescriptor(detection.descriptor);
    } else {
      updateFeedback("LIVENESS AUDIT: Eye Blink Required.", "text-amber-500 font-extrabold tracking-wide");
    }

  }, 120);
}

function triggerBlinkSuccess() {
  livenessVerified = true;
  updateLivenessHUD();
  
  const alertDot = document.getElementById("blink-detected-alert");
  alertDot.classList.remove("hidden");
  setTimeout(() => alertDot.classList.add("hidden"), 1500);
}

function updateLivenessHUD() {
  const text = document.getElementById("liveness-status-text");
  const dot = document.getElementById("liveness-dot");
  
  if (livenessVerified) {
    text.textContent = "Liveness: VERIFIED ACTIVE";
    text.className = "text-[9px] font-mono-code font-extrabold uppercase text-green-400";
    dot.className = "h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#10b981]";
  } else {
    text.textContent = "Liveness: PENDING EYE BLINK";
    text.className = "text-[9px] font-mono-code font-extrabold uppercase text-amber-500";
    dot.className = "h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-ping";
  }
}

// 8. SEND DESCRIPTOR STREAM TO SERVER CLOUD RUN API ENDPOINT
async function handleTransmitDescriptor(descriptorArray) {
  // Always refresh the ID token before transmitting — tokens expire after 1 hour
  if (currentUser) {
    try {
      idToken = await currentUser.getIdToken(/* forceRefresh= */ false);
    } catch (e) {
      console.warn("[Security Hub] Token refresh failed", e);
    }
  }

  if (!idToken) {
    alert("Supervision Token expired. Re-authenticate!");
    stopAttendanceScanner();
    return;
  }

  // Convert Float32Array to native array
  const nativeDescriptor = Array.from(descriptorArray);

  try {
    // Dynamic Cloud Functions endpoint locator
    const response = await fetch("https://verifyfaceattendance-f0168a7c-a113-4237-ad13-9d3ceaf9439e.a.run.app", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        descriptor: nativeDescriptor,
        sessionId: currentSession,
        courseCode: currentCourse
      })
    });

    const result = await response.json();

    if (result.success) {
      appendActivityLog(result.student, result.confidence, result.alreadyMarked);
      if (result.alreadyMarked) {
        updateFeedback(`Already verified: ${result.student.name}`, "text-amber-400 font-bold");
      } else {
        updateFeedback(`Verified Present: ${result.student.name}!`, "text-emerald-400 font-extrabold animate-bounce");
      }
    } else {
      updateFeedback(`Biometric Match Denied: ${result.error || "No match"}`, "text-rose-500 font-bold");
    }

  } catch (err) {
    console.error("[Bio Network] Transmit loop failed", err);
    updateFeedback("Handshake Failure: Server unreachable", "text-rose-600 font-bold");
  } finally {
    // Resume Scanner after 3.5 seconds
    setTimeout(() => {
      if (!isScanRunning) {
        livenessVerified = false;
        isScanRunning = true;
        updateLivenessHUD();
        startAnalysisLoops();
      }
    }, 3500);
  }
}

// 9. EVENT REGISTERY LOGS
function appendActivityLog(student, confidence, alreadyMarked) {
  const container = document.getElementById("attendance-activity-logs");
  const counter = document.getElementById("today-logs-count");
  
  if (container.firstElementChild && container.firstElementChild.textContent.includes("Biometric results")) {
    container.innerHTML = "";
  }

  const logBox = document.createElement("div");
  logBox.className = `p-3 rounded-lg border text-xs flex items-center justify-between transition-all ${
    alreadyMarked 
      ? "bg-amber-950/10 border-amber-900/30 text-amber-305" 
      : "bg-emerald-950/10 border-emerald-900/30 text-emerald-350"
  }`;

  const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  logBox.innerHTML = `
    <div>
      <p class="font-extrabold uppercase truncate max-w-[190px]">${student.name}</p>
      <p class="text-[9px] font-mono-code text-slate-400 truncate">${student.regNo} &bull; ${timeStr}</p>
    </div>
    <div class="text-right">
      <span class="block text-[8px] uppercase font-bold tracking-widest text-slate-400">Match Accuracy</span>
      <span class="font-mono-code text-[11px] font-black">${confidence}%</span>
    </div>
  `;

  container.prepend(logBox);

  // Update total matches roster
  const count = container.children.length;
  counter.textContent = `${count} verified`;
}

function updateFeedback(msg, cssClasses = "") {
  const box = document.getElementById("scanner-instruction");
  box.textContent = msg;
  box.className = `text-[11px] font-mono-code ${cssClasses}`;
}

// Attach Event Buttons
startBtn.addEventListener("click", () => {
  startAttendanceScanner();
});

// Boot loader init
window.addEventListener("DOMContentLoaded", async () => {
  await bootstrapFirebase();
  await checkAndLoadFaceModels();
});
