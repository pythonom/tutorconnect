// src/services/api.ts

import { API } from "../lib/api";

const BASE_URL = `${API}`; // your FastAPI backend

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
