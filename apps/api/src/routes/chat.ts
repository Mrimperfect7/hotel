import { Router } from 'express';
import { z } from 'zod';
import { asyncH } from '../lib/errors.js';

export const chatRouter = Router();

// POST /api/chat - Simple rule-based chatbot
chatRouter.post('/', asyncH(async (req, res) => {
  const schema = z.object({
    message: z.string().min(1)
  });
  const { message } = schema.parse(req.body);

  const lowerMsg = message.toLowerCase();
  let reply = "I'm the Namma Guruvayoor assistant. I can help you with hotel bookings, temple timings, finding rides, and ordering food. What do you need?";

  if (lowerMsg.includes('time') || lowerMsg.includes('darshan') || lowerMsg.includes('open')) {
    reply = "The Guruvayoor Temple typically opens at 3:00 AM for Nirmalya Darshan and closes around 9:15 PM after Thrippuka. Would you like me to help you book a hotel within walking distance?";
  } else if (lowerMsg.includes('hotel') || lowerMsg.includes('stay') || lowerMsg.includes('room')) {
    reply = "We have many Verified Hotels near the temple. You can check our 'Plan My Trip' feature or browse the homepage to find hotels filtered by walking distance to the temple.";
  } else if (lowerMsg.includes('ride') || lowerMsg.includes('taxi') || lowerMsg.includes('auto') || lowerMsg.includes('transport')) {
    reply = "Need a ride? You can book a verified Namma Ride (Auto or Taxi) directly from the platform. Drivers are strictly verified with active licenses.";
  } else if (lowerMsg.includes('food') || lowerMsg.includes('eat') || lowerMsg.includes('restaurant')) {
    reply = "You can order local Kerala cuisine or South Indian meals from our verified restaurant partners. We'll deliver it right to your hotel room!";
  } else if (lowerMsg.includes('help') || lowerMsg.includes('support') || lowerMsg.includes('emergency')) {
    reply = "If you need immediate assistance, please visit the /support page for emergency contacts and concierge services.";
  } else if (lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('namaskaram')) {
    reply = "Namaskaram! Welcome to Namma Guruvayoor. How can I help you plan your complete journey today?";
  }

  // Simulate network delay for realism
  await new Promise(r => setTimeout(r, 600));

  res.json({ reply });
}));
