import { GoogleGenAI } from "@google/genai";
import { Trade, TradeType, DashboardStats } from "../types";

const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeTradeWithAI = async (trade: Trade): Promise<string> => {
  try {
    const ai = getAIClient();
    const prompt = `
      You are an expert trading psychology coach and technical analyst for the **Indian Stock Market (NSE/BSE)**. 
      Analyze the following trade entry and provide constructive feedback in 3 bullet points.
      
      Context: The trader trades Options (F&O) and Equity.
      Focus on risk management, psychology, and Indian market context (Nifty/BankNifty levels, Expiry dynamics) based on the notes.

      Trade Details:
      Symbol: ${trade.symbol}
      Type: ${trade.type}
      Entry: ${trade.entryPrice}
      Exit: ${trade.exitPrice || 'N/A'}
      P&L: ${trade.pnl || 'N/A'}
      Strategy: ${trade.setup}
      Trader's Notes: "${trade.notes}"
      
      Output format:
      1. [Technical Observation] (Mention key levels if symbol is NIFTY/BANKNIFTY)
      2. [Psychological/Risk Insight]
      3. [Actionable Advice for next trade]
      
      Keep it concise and professional.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return response.text || "Could not generate analysis.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Error connecting to AI Coach. Please check your API key or try again later.";
  }
};