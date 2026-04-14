import { GoogleGenAI } from "@google/genai";
import { Transaction, CategoryDefinition } from "../types";

// En Vite, las variables de entorno se acceden vía import.meta.env
// Usamos un fallback para evitar que la app explote si no hay llave
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (GEMINI_KEY) {
  try {
    ai = new GoogleGenAI(GEMINI_KEY);
  } catch (e) {
    console.error("Error al inicializar Gemini:", e);
  }
} else {
  console.warn("⚠️ Gemini API Key no encontrada. Las funciones de IA estarán desactivadas.");
}

export async function getFinancialInsights(transactions: Transaction[], categories: CategoryDefinition[]) {
  if (!ai) {
    console.error("IA no disponible: Falta la API Key de Gemini.");
    return [];
  }

  if (transactions.length === 0) return [];

  const summary = transactions.reduce((acc, t) => {
    const cat = categories.find(c => c.id === t.categoryId)?.name || 'Otros';
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  const prompt = `
    Eres un experto en finanzas personales con un estilo elegante y directo (estilo Apple).
    Analiza los siguientes gastos e ingresos de este mes y proporciona 3 consejos clave para mejorar la salud financiera del usuario.
    Sé breve, motivador y profesional.
    
    Datos de transacciones (Resumen por categoría):
    ${JSON.stringify(summary, null, 2)}
    
    Responde en formato JSON con la siguiente estructura:
    {
      "insights": [
        { "title": "Título breve", "description": "Descripción del consejo" }
      ]
    }
  `;

  try {
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const data = JSON.parse(text || '{"insights": []}');
    return data.insights;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return [];
  }
}
