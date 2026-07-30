// ============================================
// FHAH ADMIN - PATIENT PROFILE MANAGEMENT
// ============================================

// Get authentication token
const token = localStorage.getItem("fhahToken");

// Check authentication
if (!token) {
    alert("Session expired. Please login again.");
    window.location.href = "login.html";
}

// Get patient ID from URL
const params = new URLSearchParams(window.location.search);
const patientId = params.get("id");

// Validate patient ID
if (!patientId) {
    alert("Patient ID is missing.");
    window.location.href = "dashboard.html";
}

// API configuration
const API_BASE_URL = "http://localhost:5000/api/admin";

function getAuthHeaders(withJson = false) {
  const headers = { Authorization: `Bearer ${token}` };
  if (withJson) headers["Content-Type"] = "application/json";
  return headers;
}

async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, isJsonBody = true } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: getAuthHeaders(Boolean(body) && isJsonBody),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 401 || response.status === 403) {
      alert("Your session has expired.");
      localStorage.removeItem("fhahToken");
      window.location.href = "login.html";
      return null;
    }

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Something went wrong.");
      return null;
    }

    return data;
  } catch (error) {
    console.error(`API request failed [${method} ${endpoint}]:`, error);
    alert("Unable to reach the server. Please try again.");
    return null;
  }
}

function formatDate(dateString) {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
}

// ================================
// PATIENT PROFILE (display)
// ================================

async function loadPatientProfile() {
  const patient = await apiRequest(`/patients/${patientId}`);
  if (!patient) return;

  document.getElementById("patientName").textContent = patient.full_name || "Not Available";
  document.getElementById("patientNumber").textContent = patient.medical_number || "Not Available";
  document.getElementById("patientGender").textContent = patient.gender || "Not Available";
  document.getElementById("patientDOB").textContent = patient.date_of_birth?.slice(0, 10) || "Not Available";
  document.getElementById("patientPhone").textContent = patient.phone || "Not Available";
  document.getElementById("patientEmail").textContent = patient.email || "Not Available";
  document.getElementById("patientAddress").textContent = patient.address || "Not Available";

  // Pre-fill the (hidden) edit form so it's ready the moment "Edit" is clicked
  document.getElementById("editPatientName").value = patient.full_name || "";
  document.getElementById("editPatientGender").value = patient.gender || "";
  document.getElementById("editPatientDOB").value = patient.date_of_birth?.slice(0, 10) || "";
  document.getElementById("editPatientPhone").value = patient.phone || "";
  document.getElementById("editPatientEmail").value = patient.email || "";
  document.getElementById("editPatientAddress").value = patient.address || "";
  document.getElementById("editPatientNumber").value = patient.medical_number || "";

  loadPatientAppointmentHistory(patient.full_name);
}

function toggleEditPatient() {
  document.getElementById("editPatientForm").classList.toggle("hidden");
}

async function savePatientEdit() {
  if (!patientId) {
    alert("No patient selected — please reload this page from the Patients table.");
    return;
  }

  const patient = {
    full_name: document.getElementById("editPatientName").value,
    gender: document.getElementById("editPatientGender").value,
    date_of_birth: document.getElementById("editPatientDOB").value || null,
    phone: document.getElementById("editPatientPhone").value,
    email: document.getElementById("editPatientEmail").value,
    address: document.getElementById("editPatientAddress").value,
    medical_number: document.getElementById("editPatientNumber").value,
  };

  const data = await apiRequest(`/patients/${patientId}`, { method: "PUT", body: patient });
  if (data) alert(data.message);

  toggleEditPatient();
  loadPatientProfile();
}

// ================================
// MEDICAL HISTORY
// ================================

async function loadPatientHistory() {
  const records = await apiRequest(`/medical-records/patient/${patientId}`);
  if (!records) return;

  const table = document.getElementById("historyTable");

  table.innerHTML = records.map((record) => `
    <tr>
      <td>${formatDate(record.created_at)}</td>
      <td>${record.doctor_name || "N/A"}</td>
      <td>${record.diagnosis}</td>
      <td>${record.treatment || ""}</td>
      <td>${record.prescription || ""}</td>
      <td>
        <button onclick="openEditHistory(${record.id}, '${(record.diagnosis || "").replace(/'/g, "\\'")}', '${(record.treatment || "").replace(/'/g, "\\'")}', '${(record.prescription || "").replace(/'/g, "\\'")}', '${(record.notes || "").replace(/'/g, "\\'")}')">Edit</button>
        <button onclick="deleteHistoryRecord(${record.id})">Delete</button>
      </td>
    </tr>
  `).join("");
}

async function addHistoryRecord() {
  const record = {
    patient_id: patientId,
    doctor_id: document.getElementById("historyRecordDoctor").value,
    diagnosis: document.getElementById("historyDiagnosis").value,
    treatment: document.getElementById("historyTreatment").value,
    prescription: document.getElementById("historyPrescription").value,
    notes: document.getElementById("historyNotes").value,
  };

  if (!record.diagnosis) {
    alert("Diagnosis is required.");
    return;
  }

  const data = await apiRequest("/medical-records", { method: "POST", body: record });
  if (data) alert(data.message);

  ["historyDiagnosis", "historyTreatment", "historyPrescription", "historyNotes"].forEach((id) => {
    document.getElementById(id).value = "";
  });

  loadPatientHistory();
}

function openEditHistory(id, diagnosis, treatment, prescription, notes) {
  document.getElementById("editHistoryId").value = id;
  document.getElementById("editHistoryDiagnosis").value = diagnosis;
  document.getElementById("editHistoryTreatment").value = treatment;
  document.getElementById("editHistoryPrescription").value = prescription;
  document.getElementById("editHistoryNotes").value = notes;

  document.getElementById("editHistoryModal").classList.remove("hidden");
}

async function saveHistoryEdit() {
  const id = document.getElementById("editHistoryId").value;

  const record = {
    diagnosis: document.getElementById("editHistoryDiagnosis").value,
    treatment: document.getElementById("editHistoryTreatment").value,
    prescription: document.getElementById("editHistoryPrescription").value,
    notes: document.getElementById("editHistoryNotes").value,
  };

  const data = await apiRequest(`/medical-records/${id}`, { method: "PUT", body: record });
  if (data) alert(data.message);

  document.getElementById("editHistoryModal").classList.add("hidden");
  loadPatientHistory();
}

async function deleteHistoryRecord(id) {
  if (!confirm("Delete this medical record?")) return;

  const data = await apiRequest(`/medical-records/${id}`, { method: "DELETE" });
  if (data) alert(data.message);
  loadPatientHistory();
}

async function loadPatientAppointmentHistory(patientName) {
  const data = await apiRequest(`/appointments?search=${encodeURIComponent(patientName)}&limit=50`);
  if (!data) return;

  const table = document.getElementById("profileAppointmentsTable");
  table.innerHTML = data.appointments.map((appt) => `
    <tr>
      <td>${appt.department}</td>
      <td>${appt.doctor || "Unassigned"}</td>
      <td>${formatDate(appt.appointment_date)}</td>
      <td>${appt.status}</td>
    </tr>
  `).join("");
}

// ================================
// DOCTOR DROPDOWN
// ================================

async function loadDoctorDropdown() {
  const doctors = await apiRequest("/doctors");
  if (!doctors) return;

  const select = document.getElementById("historyRecordDoctor");
  select.innerHTML = `<option value="">Select Doctor</option>`;
  doctors.forEach((doc) => {
    select.innerHTML += `<option value="${doc.id}">${doc.name}</option>`;
  });
}

// ================================
// INITIALIZE
// ================================

function initPatientProfile() {
  loadPatientProfile();
  loadPatientHistory();
  loadDoctorDropdown();
}

document.addEventListener("DOMContentLoaded", initPatientProfile);