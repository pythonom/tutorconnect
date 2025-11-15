// src/services/api.ts

const BASE_URL = "http://127.0.0.1:8000"; // your FastAPI backend

// Fetch all tutors
export async function fetchTutors() {
  const response = await fetch(`${BASE_URL}/api/tutors`);
  return response.json();
}

// Add a new tutor
export async function addTutor(data: any) {
  const response = await fetch(`${BASE_URL}/api/add_tutor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return response.json();
}
