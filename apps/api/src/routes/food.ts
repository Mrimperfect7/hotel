import { Router } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const foodRouter = Router();

// GET /api/food/restaurants - List approved restaurants
foodRouter.get('/restaurants', asyncH(async (req, res) => {
  const restaurants = await prisma.restaurant.findMany({
    where: { status: 'APPROVED' },
    include: { menuCategories: { include: { items: true } } }
  });
  res.json({ data: restaurants });
}));

// POST /api/food/restaurants/register - Register restaurant
foodRouter.post('/restaurants/register', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    name: z.string(),
    slug: z.string(),
    phone: z.string(),
    address: z.string(),
    cuisine: z.array(z.string()),
  });
  const data = schema.parse(req.body);

  if (req.user!.role === 'CUSTOMER') {
    await prisma.user.update({ where: { id: req.user!.id }, data: { role: 'RESTAURANT_OWNER' } });
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      userId: req.user!.id,
      ...data,
      status: 'PENDING'
    }
  });
  res.json({ data: restaurant });
}));

// POST /api/food/orders - Place a food order
foodRouter.post('/orders', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    restaurantId: z.string(),
    items: z.array(z.object({
      menuItemId: z.string(),
      quantity: z.number().int().min(1),
      pricePaise: z.number().int()
    })),
    deliveryAddress: z.string(),
    totalPaise: z.number().int()
  });
  const data = schema.parse(req.body);

  const order = await prisma.foodOrder.create({
    data: {
      customerId: req.user!.id,
      restaurantId: data.restaurantId,
      deliveryAddress: data.deliveryAddress,
      totalPaise: data.totalPaise,
      status: 'PLACED',
      items: {
        create: data.items
      }
    }
  });

  const trip = await prisma.trip.findFirst({ where: { customerId: req.user!.id } })
    || await prisma.trip.create({ data: { customerId: req.user!.id, name: "My Guruvayoor Trip" } });

  await prisma.tripItem.create({
    data: {
      tripId: trip.id,
      type: 'FOOD',
      entityId: order.id,
      dateTime: new Date(), 
      title: 'Food Order',
      subtitle: `Delivery to ${data.deliveryAddress}`
    }
  });

  res.json({ data: order });
}));

// PATCH /api/food/orders/:id - Update order status (Restaurant)
foodRouter.patch('/orders/:id', requireAuth, asyncH(async (req, res) => {
  const { status } = req.body;
  const order = await prisma.foodOrder.update({
    where: { id: req.params.id },
    data: { status }
  });
  res.json({ data: order });
}));

// GET /api/food/dashboard - Restaurant dashboard
foodRouter.get('/dashboard', requireAuth, asyncH(async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { userId: req.user!.id }
  });
  if (!restaurant) throw new ApiError('Not registered as restaurant', 403);

  const orders = await prisma.foodOrder.findMany({
    where: { restaurantId: restaurant.id },
    include: { 
      customer: { select: { name: true, phone: true } },
      items: { include: { menuItem: { select: { name: true } } } }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  const activeOrders = orders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const completed = orders.filter(o => o.status === 'DELIVERED').length;
  const revenuePaise = orders.filter(o => o.status === 'DELIVERED').reduce((acc, o) => acc + o.totalPaise, 0);

  res.json({
    restaurant,
    stats: { active: activeOrders.length, completed, revenuePaise },
    activeOrders,
    recentOrders: orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status)).slice(0, 10)
  });
}));
