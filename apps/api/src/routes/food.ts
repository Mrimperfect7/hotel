import { Router } from 'express';
import { z } from 'zod';
import { prisma, type Prisma } from '@gsv/database';
import { asyncH, ApiError } from '../lib/errors.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { cacheMiddleware } from '../lib/redis.js';

export const foodRouter = Router();

// GET /api/food/restaurants - List approved restaurants (Redis cached)
foodRouter.get(
  '/restaurants',
  cacheMiddleware({ ttlSeconds: 60, prefix: 'cache:food:restaurants' }),
  asyncH(async (req, res) => {
    const restaurants = await prisma.restaurant.findMany({
      where: { status: 'APPROVED' },
      include: { menuCategories: { include: { items: true } } }
    });
    res.json({ data: restaurants });
  })
);

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

  if (req.auth!.role === 'CUSTOMER') {
    await prisma.user.update({ where: { id: req.auth!.id }, data: { role: 'RESTAURANT_OWNER' } });
  }

  const restaurant = await prisma.restaurant.create({
    data: {
      userId: req.auth!.id,
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
      customerId: req.auth!.id,
      restaurantId: data.restaurantId,
      deliveryAddress: data.deliveryAddress,
      totalPaise: data.totalPaise,
      status: 'PLACED',
      items: {
        create: data.items
      }
    }
  });

  const trip = await prisma.trip.findFirst({ where: { customerId: req.auth!.id } })
    || await prisma.trip.create({ data: { customerId: req.auth!.id, name: "My Guruvayoor Trip", tripCode: `NMG-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}` } });

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
    where: { userId: req.auth!.id }
  });
  if (!restaurant) throw ApiError.forbidden('Not registered as restaurant');

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

// GET /api/food/profile - Get restaurant profile
foodRouter.get('/profile', requireAuth, asyncH(async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { userId: req.auth!.id },
    include: { menuCategories: { include: { items: true } } }
  });
  if (!restaurant) throw ApiError.forbidden('Not a restaurant');
  res.json({ restaurant });
}));

// PATCH /api/food/profile - Update restaurant profile
foodRouter.patch('/profile', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    cuisine: z.array(z.string()).optional(),
    openingHours: z.string().optional(),
    deliveryAvailable: z.boolean().optional(),
  });
  const data = schema.parse(req.body);

  const restaurant = await prisma.restaurant.findUnique({ where: { userId: req.auth!.id } });
  if (!restaurant) throw ApiError.forbidden('Not a restaurant');

  const updated = await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: {
      name: data.name ?? restaurant.name,
      phone: data.phone ?? restaurant.phone,
      address: data.address ?? restaurant.address,
      cuisine: data.cuisine ?? restaurant.cuisine,
      openingHours: data.openingHours ?? restaurant.openingHours,
      deliveryAvailable: data.deliveryAvailable ?? restaurant.deliveryAvailable,
    }
  });
  res.json({ restaurant: updated });
}));

// GET /api/food/menu - Get menu for logged in restaurant
foodRouter.get('/menu', requireAuth, asyncH(async (req, res) => {
  const restaurant = await prisma.restaurant.findUnique({
    where: { userId: req.auth!.id },
    include: { menuCategories: { include: { items: true } } }
  });
  if (!restaurant) throw ApiError.forbidden('Not a restaurant');
  res.json({ restaurant, categories: restaurant.menuCategories });
}));

// POST /api/food/menu/items - Add menu item
foodRouter.post('/menu/items', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    name: z.string(),
    description: z.string().optional(),
    categoryName: z.string(),
    pricePaise: z.number().int().min(0),
    isVeg: z.boolean().default(true),
    isAvailable: z.boolean().default(true),
  });
  const data = schema.parse(req.body);

  const restaurant = await prisma.restaurant.findUnique({ where: { userId: req.auth!.id } });
  if (!restaurant) throw ApiError.forbidden('Not a restaurant');

  // Find or create category
  let category = await prisma.menuCategory.findFirst({
    where: { restaurantId: restaurant.id, name: data.categoryName }
  });
  if (!category) {
    category = await prisma.menuCategory.create({
      data: { restaurantId: restaurant.id, name: data.categoryName }
    });
  }

  const item = await prisma.menuItem.create({
    data: {
      categoryId: category.id,
      name: data.name,
      description: data.description,
      pricePaise: data.pricePaise,
      isVeg: data.isVeg,
      isAvailable: data.isAvailable,
    }
  });

  res.json({ item });
}));

// PATCH /api/food/menu/items/:id - Update menu item
foodRouter.patch('/menu/items/:id', requireAuth, asyncH(async (req, res) => {
  const schema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    pricePaise: z.number().int().optional(),
    isVeg: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
  });
  const data = schema.parse(req.body);

  const item = await prisma.menuItem.update({
    where: { id: req.params.id },
    data
  });
  res.json({ item });
}));

// DELETE /api/food/menu/items/:id - Delete menu item
foodRouter.delete('/menu/items/:id', requireAuth, asyncH(async (req, res) => {
  await prisma.menuItem.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// GET /api/food/orders/:id - Get food order details
foodRouter.get('/orders/:id', requireAuth, asyncH(async (req, res) => {
  const order = await prisma.foodOrder.findUnique({
    where: { id: req.params.id },
    include: {
      restaurant: { select: { name: true, phone: true, address: true } },
      customer: { select: { name: true, phone: true } },
      items: { include: { menuItem: { select: { name: true, pricePaise: true } } } }
    }
  });
  if (!order) throw ApiError.notFound('Order not found');
  res.json({ order, data: order });
}));
