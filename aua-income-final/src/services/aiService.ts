import { GoogleGenAI } from "@google/genai";
import { Transaction, CategoryDefinition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getFinancialInsights(transactions: Transaction[], categories: CategoryDefinition[]) {
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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const data = JSON.parse(response.text || '{"insights": []}');
    return data.insights;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return [];
  }
}
