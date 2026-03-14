export const dashboardKpis = {
  totalPredictions: 628,
  totalWaste: 412,
  avgWaste: 6.6,
  efficiencyRate: 91.4,
  moneySaved: 184500,
  platesSaved: 3690
};

export const latestPredictionSnapshot = {
  date: '2026-03-14T11:20:00.000Z',
  expectedPeople: 144,
  predictedQuantity: 152,
  estimatedWaste: 8,
  dayOfWeek: 'Saturday',
  weather: 'Cloudy',
  eventMultiplier: 1.08,
  weatherMultiplier: 1.04
};

export const wasteTrend = [
  { label: 'Mar 08', waste: 10, efficiency: 88, donations: 2 },
  { label: 'Mar 09', waste: 8, efficiency: 90, donations: 2 },
  { label: 'Mar 10', waste: 6, efficiency: 92, donations: 1 },
  { label: 'Mar 11', waste: 7, efficiency: 91, donations: 3 },
  { label: 'Mar 12', waste: 5, efficiency: 93, donations: 1 },
  { label: 'Mar 13', waste: 4, efficiency: 94, donations: 1 },
  { label: 'Mar 14', waste: 8, efficiency: 90, donations: 2 }
];

export const predictionHistory = [
  { id: 'p1', date: '2026-03-14 11:20', expected: 144, predicted: 152, waste: 8, efficiency: 94.7, risk: 'High', donation: 'Yes' },
  { id: 'p2', date: '2026-03-13 18:10', expected: 132, predicted: 136, waste: 4, efficiency: 97.1, risk: 'Low', donation: 'No' },
  { id: 'p3', date: '2026-03-12 13:40', expected: 120, predicted: 125, waste: 5, efficiency: 96.0, risk: 'Low', donation: 'No' },
  { id: 'p4', date: '2026-03-11 20:30', expected: 160, predicted: 167, waste: 7, efficiency: 95.8, risk: 'High', donation: 'Yes' },
  { id: 'p5', date: '2026-03-10 09:25', expected: 118, predicted: 124, waste: 6, efficiency: 95.2, risk: 'Low', donation: 'No' }
];

export const topDemandDishes = [
  { id: 'td-1', dish: 'Paneer Butter Masala', currentConsumption: 126, unit: 'plates/day', trend: '+8%' },
  { id: 'td-2', dish: 'Jeera Rice', currentConsumption: 118, unit: 'plates/day', trend: '+6%' },
  { id: 'td-3', dish: 'Dal Tadka', currentConsumption: 109, unit: 'plates/day', trend: '+5%' },
  { id: 'td-4', dish: 'Veg Biryani', currentConsumption: 102, unit: 'plates/day', trend: '+9%' },
  { id: 'td-5', dish: 'Chapati', currentConsumption: 98, unit: 'plates/day', trend: '+4%' },
  { id: 'td-6', dish: 'Chole Masala', currentConsumption: 91, unit: 'plates/day', trend: '+3%' },
  { id: 'td-7', dish: 'Mixed Veg Curry', currentConsumption: 86, unit: 'plates/day', trend: '+2%' },
  { id: 'td-8', dish: 'Idli Sambar', currentConsumption: 79, unit: 'plates/day', trend: '+7%' },
  { id: 'td-9', dish: 'Aloo Paratha', currentConsumption: 74, unit: 'plates/day', trend: '+5%' },
  { id: 'td-10', dish: 'Curd Rice', currentConsumption: 69, unit: 'plates/day', trend: '+2%' }
];

export const inventoryItems = [
  {
    id: 'i1',
    name: 'Tomato Puree',
    category: 'Sauce Base',
    quantity: 40,
    unit: 'kg',
    expiryDate: '2026-03-19',
    batches: [
      { id: 'i1-b1', quantity: 12, expiryDate: '2026-03-16' },
      { id: 'i1-b2', quantity: 18, expiryDate: '2026-03-19' },
      { id: 'i1-b3', quantity: 10, expiryDate: '2026-03-25' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1607305387299-a3d9611cd469?auto=format&fit=crop&w=800&q=60',
    notes: 'Keep refrigerated after opening.'
  },
  {
    id: 'i2',
    name: 'Paneer Cubes',
    category: 'Dairy',
    quantity: 22,
    unit: 'kg',
    expiryDate: '2026-03-16',
    batches: [
      { id: 'i2-b1', quantity: 7, expiryDate: '2026-03-15' },
      { id: 'i2-b2', quantity: 9, expiryDate: '2026-03-16' },
      { id: 'i2-b3', quantity: 6, expiryDate: '2026-03-20' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=60',
    notes: 'First-in rack A2.'
  },
  {
    id: 'i3',
    name: 'Basmati Rice',
    category: 'Dry Goods',
    quantity: 160,
    unit: 'kg',
    expiryDate: '2026-05-20',
    batches: [
      { id: 'i3-b1', quantity: 40, expiryDate: '2026-04-20' },
      { id: 'i3-b2', quantity: 65, expiryDate: '2026-05-20' },
      { id: 'i3-b3', quantity: 55, expiryDate: '2026-06-15' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?auto=format&fit=crop&w=800&q=60',
    notes: 'Store in dry silos.'
  },
  {
    id: 'i4',
    name: 'Spinach Leaves',
    category: 'Produce',
    quantity: 14,
    unit: 'kg',
    expiryDate: '2026-03-13',
    batches: [
      { id: 'i4-b1', quantity: 8, expiryDate: '2026-03-13' },
      { id: 'i4-b2', quantity: 6, expiryDate: '2026-03-14' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=800&q=60',
    notes: 'Wash before prep.'
  },
  {
    id: 'i5',
    name: 'Yellow Onions',
    category: 'Produce',
    quantity: 80,
    unit: 'kg',
    expiryDate: '2026-04-13',
    batches: [
      { id: 'i5-b1', quantity: 30, expiryDate: '2026-03-28' },
      { id: 'i5-b2', quantity: 50, expiryDate: '2026-04-13' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=800&q=60',
    notes: 'Store in cool, dry place. No refrigeration needed.'
  },
  {
    id: 'i6',
    name: 'Sunflower Oil',
    category: 'Dry Goods',
    quantity: 50,
    unit: 'L',
    expiryDate: '2027-03-14',
    batches: [
      { id: 'i6-b1', quantity: 20, expiryDate: '2026-12-14' },
      { id: 'i6-b2', quantity: 30, expiryDate: '2027-03-14' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=800&q=60',
    notes: 'Store away from direct sunlight.'
  },
  {
    id: 'i7',
    name: 'Whole Wheat Flour',
    category: 'Dry Goods',
    quantity: 120,
    unit: 'kg',
    expiryDate: '2026-09-14',
    batches: [
      { id: 'i7-b1', quantity: 60, expiryDate: '2026-07-14' },
      { id: 'i7-b2', quantity: 60, expiryDate: '2026-09-14' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=60',
    notes: 'Keep in airtight containers, away from moisture.'
  },
  {
    id: 'i8',
    name: 'Chickpeas (Chole)',
    category: 'Dry Goods',
    quantity: 45,
    unit: 'kg',
    expiryDate: '2027-01-14',
    batches: [
      { id: 'i8-b1', quantity: 25, expiryDate: '2026-10-14' },
      { id: 'i8-b2', quantity: 20, expiryDate: '2027-01-14' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1515543904379-3d757afe72e4?auto=format&fit=crop&w=800&q=60',
    notes: 'Soak overnight before cooking.'
  },
  {
    id: 'i9',
    name: 'Fresh Butter',
    category: 'Dairy',
    quantity: 10,
    unit: 'kg',
    expiryDate: '2026-04-13',
    batches: [
      { id: 'i9-b1', quantity: 5, expiryDate: '2026-03-28' },
      { id: 'i9-b2', quantity: 5, expiryDate: '2026-04-13' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=800&q=60',
    notes: 'Keep refrigerated at all times.'
  },
  {
    id: 'i10',
    name: 'Garam Masala',
    category: 'Dry Goods',
    quantity: 8,
    unit: 'kg',
    expiryDate: '2028-03-14',
    batches: [
      { id: 'i10-b1', quantity: 8, expiryDate: '2028-03-14' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=60',
    notes: 'Store in airtight containers to preserve aroma.'
  },
  {
    id: 'i11',
    name: 'Chicken Breast',
    category: 'Protein',
    quantity: 30,
    unit: 'kg',
    expiryDate: '2026-03-16',
    batches: [
      { id: 'i11-b1', quantity: 15, expiryDate: '2026-03-15' },
      { id: 'i11-b2', quantity: 15, expiryDate: '2026-03-16' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?auto=format&fit=crop&w=800&q=60',
    notes: 'Keep at 0–4°C. Use within 2 days of delivery.'
  },
  {
    id: 'i12',
    name: 'Greek Yogurt (Dahi)',
    category: 'Dairy',
    quantity: 18,
    unit: 'kg',
    expiryDate: '2026-03-21',
    batches: [
      { id: 'i12-b1', quantity: 10, expiryDate: '2026-03-18' },
      { id: 'i12-b2', quantity: 8, expiryDate: '2026-03-21' }
    ],
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=800&q=60',
    notes: 'Refrigerate at all times. Great for raita.'
  }
];

export const nearestNgos = [
  { id: 'n1', name: 'Robin Hood Army Mumbai South', distanceKm: 2.1, contact: '+91 98765 10001', description: 'Daily evening pickup for cooked meals.', lat: 18.9217, lng: 72.8326, imageUrl: 'https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?auto=format&fit=crop&w=800&q=60' },
  { id: 'n2', name: 'Feeding India Community Hub', distanceKm: 3.4, contact: '+91 98765 10003', description: 'Community meal redistribution partner.', lat: 19.0176, lng: 72.8414, imageUrl: 'https://images.unsplash.com/photo-1609132718484-cc90df3417f8?auto=format&fit=crop&w=800&q=60' },
  { id: 'n3', name: 'Annadaan Food Support', distanceKm: 4.2, contact: '+91 98765 10004', description: 'Supports shelters and night kitchens.', lat: 19.0596, lng: 72.8263, imageUrl: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=60' },
  { id: 'n4', name: 'No Food Waste Mumbai Central', distanceKm: 5.0, contact: '+91 98765 10005', description: 'On-demand volunteers for excess food.', lat: 19.1136, lng: 72.8729, imageUrl: 'https://images.unsplash.com/photo-1518398046578-8cca57782e17?auto=format&fit=crop&w=800&q=60' },
  { id: 'n5', name: 'Akshaya Chaitanya Relief Kitchen', distanceKm: 5.8, contact: '+91 98765 10002', description: 'Bulk pickup for event leftovers.', lat: 18.9987, lng: 72.8322, imageUrl: 'https://images.unsplash.com/photo-1469571486292-b53601020a8e?auto=format&fit=crop&w=800&q=60' }
];

export const donationHistory = [
  { id: 'd1', date: '2026-03-14', ngo: 'Robin Hood Army Mumbai South', foodType: 'Cooked Meals', quantity: '48 plates', status: 'Delivered' },
  { id: 'd2', date: '2026-03-13', ngo: 'Feeding India Community Hub', foodType: 'Rice + Curry', quantity: '36 plates', status: 'Picked Up' },
  { id: 'd3', date: '2026-03-11', ngo: 'Annadaan Food Support', foodType: 'Bread + Sabzi', quantity: '22 plates', status: 'Delivered' }
];

export const invoices = [
  { id: 'inv-1001', period: 'March 2026', amount: 24999, status: 'Paid' },
  { id: 'inv-1000', period: 'February 2026', amount: 24999, status: 'Paid' },
  { id: 'inv-999', period: 'January 2026', amount: 24999, status: 'Paid' }
];

export const paymentMethods = [
  { id: 'pm-1', type: 'Visa', last4: '8742', expiry: '10/28', holder: 'Ahar Hospitality Pvt Ltd' },
  { id: 'pm-2', type: 'Mastercard', last4: '1228', expiry: '03/27', holder: 'Ahar Ops Team' }
];

export const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyAmount: 499,
    monthly: '₹499 / kitchen / month',
    yearly: 'Best for single kitchens',
    features: ['Core dashboard', 'Prediction module', 'Inventory + donation basics', 'Email support']
  },
  {
    id: 'growth',
    name: 'Growth',
    monthlyAmount: 999,
    monthly: '₹999 / kitchen / month',
    yearly: 'Built for growing kitchen teams',
    features: ['Everything in Starter', 'Enhanced analytics', 'Priority issue handling', 'Faster onboarding setup']
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyAmount: 1999,
    monthly: '₹1,999 / kitchen / month',
    yearly: 'Advanced features for high-volume kitchens',
    features: ['Everything in Growth', 'Advanced insights', 'High-priority support', 'Operational review support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyAmount: null,
    monthly: 'Enterprise pricing for chains & institutions',
    yearly: 'Custom contract',
    features: ['Custom rollout plan', 'Institution-level governance', 'Dedicated success manager', 'Custom integrations + SLA']
  }
];