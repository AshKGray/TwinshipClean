/*
IMPORTANT NOTICE: DO NOT REMOVE
This is a custom client for the Google Gemini API. You may update this service, but you should not need to.

Available models:
- gemini-2.0-flash-exp (Latest experimental model)
- gemini-1.5-pro (Production ready, multimodal)
- gemini-1.5-flash (Fast, efficient, multimodal)
*/
import { GoogleGenerativeAI } from "@google/generative-ai";

export const getGeminiClient = () => {
  const apiKey = process.env.EXPO_PUBLIC_VIBECODE_GOOGLE_API_KEY;
  if (!apiKey) {
    console.warn("Google API key not found in environment variables");
  }
  return new GoogleGenerativeAI(apiKey || "");
};
