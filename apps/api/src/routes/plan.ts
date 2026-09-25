import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '@gsv/database';
import { asyncH } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const planRouter = Router();

const planSchema = z.object({
  arrivalDate: z.string().datetime(),
  departureDate: z.string().datetime(),
  adults: z.number().min(1),
  children: z.number().min(0),
  seniorCitizens: z.number().min(0),
  arrivalLocation: z.string(),
  departureLocation: z.string(),
  budget: z.enum(['BUDGET', 'STANDARD', 'PREMIUM']),
  purpose: z.enum(['TEMPLE', 'FAMILY', 'PILGRIMAGE', 'WEEKEND', 'GROUP', 'SENIOR', 'COUPLE']),
  preferences: z.array(z.string()).optional()
});

planRouter.post('/', requireAuth, asyncH(async (req, res) => {
  const data = planSchema.parse(req.body);
  
  // Deterministic rule-based itinerary generation
  const itinerary = [];
  let dayCounter = 1;
  const startDate = new Date(data.arrivalDate);
  const endDate = new Date(data.departureDate);
  const diffDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  
  // Generate a basic day-by-day plan based on purpose and demographics
  if (data.seniorCitizens > 0) {
    itinerary.push({ day: 1, title: 'Arrival & Rest', description: `Arrive at ${data.arrivalLocation}. Take a Namma Ride to your senior-friendly hotel (lift-equipped). Rest.` });
    itinerary.push({ day: 2, title: 'Temple Darshan', description: 'Early morning low-walking darshan. Pre-booked comfortable transport.' });
  } else if (data.purpose === 'TEMPLE' || data.purpose === 'PILGRIMAGE') {
    itinerary.push({ day: 1, title: 'Arrival & Evening Darshan', description: `Arrive at ${data.arrivalLocation}. Check-in to a hotel near the temple. Evening walk to the temple.` });
    itinerary.push({ day: 2, title: 'Main Darshan & Offerings', description: 'Early morning Nirmalya Darshan. Breakfast. Local exploration.' });
  } else {
    itinerary.push({ day: 1, title: 'Arrival & Local Food', description: 'Arrive and check into your hotel. Explore local Kerala cuisine.' });
    itinerary.push({ day: 2, title: 'Temple Darshan & Sightseeing', description: 'Morning temple visit followed by a hired local guide for sightseeing.' });
  }

  // Create a trip record in the database
  const tripCode = `NMG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const trip = await prisma.trip.create({
    data: {
      customerId: req.auth!.id,
      name: `My ${data.purpose} Trip to Guruvayoor`,
      tripCode,
      startDate,
      endDate
    }
  });

  res.json({
    message: 'Trip itinerary generated successfully',
    tripCode,
    itinerary,
    tripId: trip.id
  });
}));
