/**
 * Admin Dashboard
 * Handles authentication, data loading, and CRUD operations
 * for appointments, messages, donations, doctors, patients,
 * and medical records.
 */

// ================================
// CONFIG
// ================================

const API_BASE_URL = "https://fhah-backend.onrender.com/api/admin";
const token = localStorage.getItem("fhahToken");

// ================================
// AUTHENTICATION
// ================================

if (!token) {
  window.location.href = "login.html";
}

function getAuthHeaders(withJson = false) {
  const headers = { Authorization: `Bearer ${token}` };
  if (withJson) headers["Content-Type"] = "application/json";
  return headers;
}

// ================================
// LOGOUT
// ================================

const logoutLink = document.querySelector(".logout a");

if (logoutLink) {
  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    localStorage.removeItem("fhahToken");
    localStorage.removeItem("fhahAdmin");
    window.location.href = "login.html";
  });
}

// ================================
// GENERIC API HELPER
// ================================

async function apiRequest(endpoint, options = {}) {
  const { method = "GET", body, isJsonBody = true } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: getAuthHeaders(Boolean(body) && isJsonBody),
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (response.status === 401 || response.status === 403) {
      localStorage.removeItem("fhahToken");
      localStorage.removeItem("fhahAdmin");
      alert("Your session has expired. Please log in again.");
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
    alert("Network error. Please try again.");
    return null;
  }
}

// ================================
// DOM HELPERS
// ================================

function renderTable(tableId, rows, rowTemplate) {
  const table = document.getElementById(tableId);
  if (!table) return;
  table.innerHTML = rows.map(rowTemplate).join("");
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

// ================================
// DASHBOARD STATISTICS
// ================================

async function loadDashboardStats() {
  const data = await apiRequest("/stats");
  if (!data) return;

  document.getElementById("appointmentsCount").textContent = data.appointments;
  document.getElementById("messagesCount").textContent = data.messages;
  document.getElementById("donationsCount").textContent = data.donations;
  document.getElementById("patientsCount").textContent = data.patients ?? "0";
  document.getElementById("doctorsCount").textContent = data.doctors ?? "0";
  document.getElementById("recordsCount").textContent = data.records ?? "0";
}

// ================================
// APPOINTMENTS
// ================================

let appointmentState = {
  page: 1,
  limit: 10,
  status: "",
  department: "",
  doctor: "",
  date_from: "",
  date_to: "",
  search: "",
};

function buildAppointmentQuery() {
  const params = new URLSearchParams();
  Object.entries(appointmentState).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

async function loadAppointments() {
  const query = buildAppointmentQuery();
  const data = await apiRequest(`/appointments?${query}`);
  if (!data) return;

  renderTable("appointmentsTable", data.appointments, (appointment) => `
    <tr>
      <td>${appointment.name}</td>
      <td>${appointment.email || ""}<br>${appointment.phone || ""}</td>
      <td>${appointment.department}</td>
      <td>${appointment.doctor || "Unassigned"}</td>
      <td>${formatDate(appointment.appointment_date)}</td>
      <td>
        <span class="status ${appointment.status.toLowerCase()}">
          ${appointment.status}
        </span>
      </td>
      <td>
        <button onclick="updateAppointmentStatus(${appointment.id}, 'Approved')">Approve</button>
        <button onclick="updateAppointmentStatus(${appointment.id}, 'Rejected')">Reject</button>
        <button onclick="updateAppointmentStatus(${appointment.id}, 'Completed')">Complete</button>
        <button onclick="openEditAppointment(${appointment.id})">Edit</button>
        <button onclick="deleteAppointment(${appointment.id})">Delete</button>
      </td>
    </tr>
  `);

  renderAppointmentPagination(data.pagination);
}

function renderAppointmentPagination(pagination) {
  const container = document.getElementById("appointmentsPagination");
  if (!container || !pagination) return;

  const { page, total_pages } = pagination;

  container.innerHTML = `
    <button ${page <= 1 ? "disabled" : ""} onclick="goToAppointmentPage(${page - 1})">Previous</button>
    <span>Page ${page} of ${total_pages}</span>
    <button ${page >= total_pages ? "disabled" : ""} onclick="goToAppointmentPage(${page + 1})">Next</button>
  `;
}

function goToAppointmentPage(page) {
  appointmentState.page = page;
  loadAppointments();
}

function applyAppointmentFilters() {
  appointmentState.status = document.getElementById("filterStatus")?.value || "";
  appointmentState.department = document.getElementById("filterDepartment")?.value || "";
  appointmentState.doctor = document.getElementById("filterDoctor")?.value || "";
  appointmentState.date_from = document.getElementById("filterDateFrom")?.value || "";
  appointmentState.date_to = document.getElementById("filterDateTo")?.value || "";
  appointmentState.search = document.getElementById("filterSearch")?.value || "";
  appointmentState.page = 1;
  loadAppointments();
}

function resetAppointmentFilters() {
  appointmentState = {
    page: 1, limit: 10, status: "", department: "", doctor: "",
    date_from: "", date_to: "", search: "",
  };

  ["filterStatus", "filterDepartment", "filterDoctor", "filterDateFrom", "filterDateTo", "filterSearch"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  loadAppointments();
}

async function updateAppointmentStatus(id, status) {
  const data = await apiRequest(`/appointments/${id}/status`, {
    method: "PUT",
    body: { status },
  });

  if (data) alert(data.message);
  loadAppointments();
}

async function addAppointment() {
  const appointment = {
    name: document.getElementById("appointmentName").value,
    email: document.getElementById("appointmentEmail").value,
    phone: document.getElementById("appointmentPhone").value,
    department: document.getElementById("appointmentDepartment").value,
    appointment_date: document.getElementById("appointmentDate").value,
    doctor: document.getElementById("appointmentDoctor").value,
    message: document.getElementById("appointmentNotes").value,
  };

  const data = await apiRequest("/appointments", { method: "POST", body: appointment });
  if (data) alert(data.message);
  loadAppointments();
}

async function openEditAppointment(id) {
  const appointment = await apiRequest(`/appointments/${id}`);
  if (!appointment) return;

  document.getElementById("editAppointmentId").value = appointment.id;
  document.getElementById("editAppointmentName").value = appointment.name || "";
  document.getElementById("editAppointmentEmail").value = appointment.email || "";
  document.getElementById("editAppointmentPhone").value = appointment.phone || "";
  document.getElementById("editAppointmentDepartment").value = appointment.department || "";
  document.getElementById("editAppointmentDate").value = appointment.appointment_date?.slice(0, 10) || "";
  document.getElementById("editAppointmentDoctor").value = appointment.doctor || "";
  document.getElementById("editAppointmentNotes").value = appointment.message || "";

  document.getElementById("editAppointmentModal")?.classList.remove("hidden");
}

async function saveAppointmentEdit() {
  const id = document.getElementById("editAppointmentId").value;

  const appointment = {
    name: document.getElementById("editAppointmentName").value,
    email: document.getElementById("editAppointmentEmail").value,
    phone: document.getElementById("editAppointmentPhone").value,
    department: document.getElementById("editAppointmentDepartment").value,
    appointment_date: document.getElementById("editAppointmentDate").value,
    doctor: document.getElementById("editAppointmentDoctor").value,
    message: document.getElementById("editAppointmentNotes").value,
  };

  const data = await apiRequest(`/appointments/${id}`, { method: "PUT", body: appointment });
  if (data) alert(data.message);

  document.getElementById("editAppointmentModal")?.classList.add("hidden");
  loadAppointments();
}

async function deleteAppointment(id) {
  if (!confirm("Delete this appointment?")) return;

  const data = await apiRequest(`/appointments/${id}`, { method: "DELETE" });
  if (data) alert(data.message);
  loadAppointments();
}

function populateAppointmentDoctorDropdowns(doctors) {
  ["appointmentDoctor", "editAppointmentDoctor", "filterDoctor"].forEach((id) => {
    const select = document.getElementById(id);
    if (!select) return;

    const placeholder = id === "filterDoctor" ? "All Doctors" : "Unassigned";
    select.innerHTML = `<option value="">${placeholder}</option>`;

    doctors.forEach((doc) => {
      select.innerHTML += `<option value="${doc.name}">${doc.name}</option>`;
    });
  });
}

// ================================
// CONTACT MESSAGES
// ================================

async function loadMessages() {
  const messages = await apiRequest("/messages");
  if (!messages) return;

  renderTable("messagesTable", messages, (message) => `
    <tr>
      <td>${message.name}</td>
      <td>${message.email}</td>
      <td>${message.message}</td>
      <td>${formatDate(message.created_at)}</td>
    </tr>
  `);
}

// ================================
// DONATIONS
// ================================

async function loadDonations() {
  const donations = await apiRequest("/donations");
  if (!donations) return;

  renderTable("donationsTable", donations, (donation) => `
    <tr>
      <td>${donation.name}</td>
      <td>${donation.email || "N/A"}</td>
      <td>${donation.amount || "0"}</td>
      <td>${donation.payment_method || "N/A"}</td>
      <td>${formatDate(donation.created_at)}</td>
    </tr>
  `);
}

// ================================
// DOCTORS
// ================================

async function loadDoctors() {
  const doctors = await apiRequest("/doctors");
  if (!doctors) return;

  renderTable("doctorsTable", doctors, (doctor) => `
    <tr>
      <td>${doctor.name}</td>
      <td>${doctor.specialization}</td>
      <td>${doctor.department}</td>
      <td>${doctor.phone}</td>
      <td>
        <button onclick="viewDoctorProfile(${doctor.id})">View Profile</button>
        <button onclick="editDoctor(${doctor.id})">Edit</button>
        <button onclick="deleteDoctor(${doctor.id})">Delete</button>
        <button onclick="viewDoctorHistory(${doctor.id})">History</button>
      </td>
    </tr>
  `);

  populateAppointmentDoctorDropdowns(doctors);
}

function viewDoctorHistory(doctorId) {
  document.getElementById("filterRecordDoctor").value = doctorId;
  applyRecordFilters();
  document.getElementById("filterRecordDoctor").scrollIntoView({ behavior: "smooth", block: "center" });
}

async function addDoctor() {
  const doctor = {
    name: document.getElementById("doctorName").value,
    specialization: document.getElementById("doctorSpecialization").value,
    department: document.getElementById("doctorDepartment").value,
    phone: document.getElementById("doctorPhone").value,
    email: document.getElementById("doctorEmail").value,
    image: document.getElementById("doctorImage").value,
  };

  const data = await apiRequest("/doctors", { method: "POST", body: doctor });
  if (data) alert(data.message);
  loadDoctors();
}

async function deleteDoctor(id) {
  if (!confirm("Are you sure you want to delete this doctor?")) return;

  const data = await apiRequest(`/doctors/${id}`, { method: "DELETE" });
  if (data) alert(data.message);
  loadDoctors();
}

async function editDoctor(id) {
  const doctor = await apiRequest(`/doctors/${id}`);
  if (!doctor) return;

  document.getElementById("editDoctorId").value = doctor.id;
  document.getElementById("editDoctorName").value = doctor.name || "";
  document.getElementById("editDoctorSpecialization").value = doctor.specialization || "";
  document.getElementById("editDoctorDepartment").value = doctor.department || "";
  document.getElementById("editDoctorPhone").value = doctor.phone || "";
  document.getElementById("editDoctorEmail").value = doctor.email || "";
  document.getElementById("editDoctorImage").value = doctor.image || "";

  document.getElementById("editDoctorModal").style.display = "block";
}

async function updateDoctor() {
  const id = document.getElementById("editDoctorId").value;

  const doctorData = {
    name: document.getElementById("editDoctorName").value,
    specialization: document.getElementById("editDoctorSpecialization").value,
    department: document.getElementById("editDoctorDepartment").value,
    phone: document.getElementById("editDoctorPhone").value,
    email: document.getElementById("editDoctorEmail").value,
    image: document.getElementById("editDoctorImage").value,
  };

  const result = await apiRequest(`/doctors/${id}`, { method: "PUT", body: doctorData });

  if (result) {
    alert("Doctor updated successfully");
    closeEditDoctorModal();
    loadDoctors();
  }
}

function closeEditDoctorModal() {
  document.getElementById("editDoctorModal").style.display = "none";
}



// ================================
// PATIENTS
// ================================

async function loadPatients() {
  const patients = await apiRequest("/patients");
  if (!patients) return;

  renderTable("patientsTable", patients, (patient) => `
    <tr>
      <td>${patient.full_name}</td>
      <td>${patient.gender || "N/A"}</td>
      <td>${patient.phone || "N/A"}</td>
      <td>${patient.medical_number || "N/A"}</td>
      <td>
        <button onclick="viewPatientProfile(${patient.id})">View Profile</button>
        <button onclick="editPatient(${patient.id})">Edit</button>
        <button onclick="deletePatient(${patient.id})">Delete</button>
      </td>
    </tr>
  `);
}

async function editPatient(id) {
  const patient = await apiRequest(`/patients/${id}`);
  if (!patient) return;

  document.getElementById("editPatientId").value = patient.id;
  document.getElementById("editFullName").value = patient.full_name || "";
  document.getElementById("editGender").value = patient.gender || "Male";
  document.getElementById("editDOB").value = patient.date_of_birth ? patient.date_of_birth.slice(0, 10) : "";
  document.getElementById("editPhone").value = patient.phone || "";
  document.getElementById("editEmail").value = patient.email || "";
  document.getElementById("editAddress").value = patient.address || "";
  document.getElementById("editMedicalNumber").value = patient.medical_number || "";
  document.getElementById("editPatientModal").style.display = "block";
}

async function updatePatient() {
  const id = document.getElementById("editPatientId").value;

  const patientData = {
    full_name: document.getElementById("editFullName").value,
    gender: document.getElementById("editGender").value,
    date_of_birth: document.getElementById("editDOB").value,
    phone: document.getElementById("editPhone").value,
    email: document.getElementById("editEmail").value,
    address: document.getElementById("editAddress").value,
    medical_number: document.getElementById("editMedicalNumber").value,
  };

  const result = await apiRequest(`/patients/${id}`, { method: "PUT", body: patientData });

  if (result) {
    alert("Patient updated successfully");
    closeEditModal();
    loadPatients();
  }
}

function closeEditModal() {
  document.getElementById("editPatientModal").style.display = "none";
}

async function addPatient() {
  const patient = {
    full_name: document.getElementById("patientName").value,
    gender: document.getElementById("patientGender").value,
    date_of_birth: document.getElementById("patientDOB").value,
    phone: document.getElementById("patientPhone").value,
    email: document.getElementById("patientEmail").value,
    address: document.getElementById("patientAddress").value,
    medical_number: document.getElementById("patientMedicalNumber").value,
  };

  const data = await apiRequest("/patients", { method: "POST", body: patient });
  if (data) alert(data.message);
  loadPatients();
}

async function deletePatient(id) {
  if (!confirm("Delete this patient?")) return;

  const data = await apiRequest(`/patients/${id}`, { method: "DELETE" });
  if (data) alert(data.message);
  loadPatients();
}

function viewPatientProfile(id) {
  window.location.href = `patient-profile.html?id=${id}`;
}

// ================================
// MEDICAL RECORDS
// ================================

let recordState = {
  page: 1,
  limit: 10,
  patient: "",
  doctor_id: "",
  date_from: "",
  date_to: "",
};

function buildRecordQuery() {
  const params = new URLSearchParams();
  Object.entries(recordState).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return params.toString();
}

async function loadMedicalRecords() {
  const query = buildRecordQuery();
  const data = await apiRequest(`/medical-records?${query}`);
  if (!data) return;

  renderTable("medicalRecordsTable", data.records, (record) => `
    <tr>
      <td>${record.patient_name || "N/A"}</td>
      <td>${record.doctor_name || "N/A"}</td>
      <td>${record.diagnosis}</td>
      <td>${record.treatment || ""}</td>
      <td>${formatDate(record.created_at)}</td>
      <td>
        <button onclick="openEditMedicalRecord(${record.id})">Edit</button>
        <button onclick="deleteMedicalRecord(${record.id})">Delete</button>
      </td>
    </tr>
  `);

  renderRecordPagination(data.pagination);
}

function renderRecordPagination(pagination) {
  const container = document.getElementById("recordsPagination");
  if (!container || !pagination) return;

  const { page, total_pages } = pagination;

  container.innerHTML = `
    <button ${page <= 1 ? "disabled" : ""} onclick="goToRecordPage(${page - 1})">Previous</button>
    <span>Page ${page} of ${total_pages}</span>
    <button ${page >= total_pages ? "disabled" : ""} onclick="goToRecordPage(${page + 1})">Next</button>
  `;
}

function goToRecordPage(page) {
  recordState.page = page;
  loadMedicalRecords();
}

function applyRecordFilters() {
  recordState.patient = document.getElementById("filterRecordPatient")?.value || "";
  recordState.doctor_id = document.getElementById("filterRecordDoctor")?.value || "";
  recordState.date_from = document.getElementById("filterRecordDateFrom")?.value || "";
  recordState.date_to = document.getElementById("filterRecordDateTo")?.value || "";
  recordState.page = 1;
  loadMedicalRecords();
}

function resetRecordFilters() {
  recordState = { page: 1, limit: 10, patient: "", doctor_id: "", date_from: "", date_to: "" };

  ["filterRecordPatient", "filterRecordDoctor", "filterRecordDateFrom", "filterRecordDateTo"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });

  loadMedicalRecords();
}

async function addMedicalRecord() {
  const record = {
    patient_id: document.getElementById("recordPatient").value,
    doctor_id: document.getElementById("recordDoctor").value,
    diagnosis: document.getElementById("recordDiagnosis").value,
    treatment: document.getElementById("recordTreatment").value,
    prescription: document.getElementById("recordPrescription").value,
    notes: document.getElementById("recordNotes").value,
  };

  if (!record.patient_id || !record.diagnosis) {
    alert("Patient and diagnosis are required.");
    return;
  }

  const data = await apiRequest("/medical-records", { method: "POST", body: record });
  if (data) alert(data.message);
  loadMedicalRecords();
}

async function openEditMedicalRecord(id) {
  const record = await apiRequest(`/medical-records/${id}`);
  if (!record) return;

  document.getElementById("editRecordId").value = record.id;
  document.getElementById("editRecordDiagnosis").value = record.diagnosis || "";
  document.getElementById("editRecordTreatment").value = record.treatment || "";
  document.getElementById("editRecordPrescription").value = record.prescription || "";
  document.getElementById("editRecordNotes").value = record.notes || "";

  document.getElementById("editRecordModal")?.classList.remove("hidden");
}

async function saveMedicalRecordEdit() {
  const id = document.getElementById("editRecordId").value;

  const record = {
    diagnosis: document.getElementById("editRecordDiagnosis").value,
    treatment: document.getElementById("editRecordTreatment").value,
    prescription: document.getElementById("editRecordPrescription").value,
    notes: document.getElementById("editRecordNotes").value,
  };

  const data = await apiRequest(`/medical-records/${id}`, { method: "PUT", body: record });
  if (data) alert(data.message);

  document.getElementById("editRecordModal")?.classList.add("hidden");
  loadMedicalRecords();
}

async function deleteMedicalRecord(id) {
  if (!confirm("Delete this medical record?")) return;

  const data = await apiRequest(`/medical-records/${id}`, { method: "DELETE" });
  if (data) alert(data.message);
  loadMedicalRecords();
}

// ================================
// NOTIFICATIONS
// ================================

async function loadNotifications() {
  const pendingData = await apiRequest("/appointments?status=Pending&limit=5");
  const messages = await apiRequest("/messages");

  const pendingCount = pendingData?.pagination?.total || 0;
  const messageCount = messages?.length || 0;
  const totalCount = pendingCount + messageCount;

  const badge = document.getElementById("notificationBadge");
  if (totalCount > 0) {
    badge.textContent = totalCount > 99 ? "99+" : totalCount;
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }

  const list = document.getElementById("notificationList");
  const items = [];

  if (pendingData?.appointments) {
    pendingData.appointments.forEach((appt) => {
      items.push(`
        <div style="padding:8px; border-bottom:1px solid #f0f0f0;">
          <strong>New appointment request</strong><br>
          ${appt.name} ÔÇö ${appt.department}<br>
          <small>${formatDate(appt.appointment_date)}</small>
        </div>
      `);
    });
  }

  if (messages) {
    messages.slice(0, 5).forEach((msg) => {
      items.push(`
        <div style="padding:8px; border-bottom:1px solid #f0f0f0;">
          <strong>New message</strong><br>
          ${msg.name} ÔÇö ${msg.message.slice(0, 60)}${msg.message.length > 60 ? "..." : ""}<br>
          <small>${formatDate(msg.created_at)}</small>
        </div>
      `);
    });
  }

  list.innerHTML = items.length
    ? items.join("")
    : `<div style="padding:8px; color:#888;">No new notifications</div>`;
}

function toggleNotifications() {
  document.getElementById("notificationDropdown").classList.toggle("hidden");
}

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("notificationDropdown");
  const bell = document.getElementById("notificationBell");
  if (!dropdown || !bell) return;

  if (!dropdown.contains(e.target) && !bell.contains(e.target)) {
    dropdown.classList.add("hidden");
  }
});

document.getElementById("notificationBell")?.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleNotifications();
});

function scrollToSection(id) {
  if (id === "top") {
    document.querySelector(".main-content").scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ================================
// INITIALIZE DASHBOARD
// ================================

function initDashboard() {
  loadDashboardStats();
  loadAppointments();
  loadMessages();
  loadDonations();
  loadDoctors();
  loadPatients();
  loadMedicalRecords();
  loadNotifications();
}

document.addEventListener("DOMContentLoaded", initDashboard);

