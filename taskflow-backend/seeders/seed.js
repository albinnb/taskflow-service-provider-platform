import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
// Model Imports
import User from '../src/models/User.js';
import Provider from '../src/models/Provider.js';
import Service from '../src/models/Service.js';
import Booking from '../src/models/Booking.js';
import Review from '../src/models/Review.js';
import Category from '../src/models/Category.js';

dotenv.config();

// Connect to DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Seeding... ✅');
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

// Disconnect from DB
const disconnectDB = async () => {
  await mongoose.disconnect();
  console.log('MongoDB Disconnected.');
}

// --------------------------------------------------------------------------
// 1. Categories Data
// --------------------------------------------------------------------------
const categoryData = [
  { name: 'Cleaning', slug: 'cleaning' },
  { name: 'Fitness', slug: 'fitness' },
  { name: 'IT Repair', slug: 'it-repair' },
  { name: 'Plumbing', slug: 'plumbing' },
  { name: 'Electrical', slug: 'electrical' },
];

// --------------------------------------------------------------------------
// 2. Users Data (10 Providers + 10 Customers)
// --------------------------------------------------------------------------
const usersData = [
  // --- ADMIN ---
  { name: 'Admin User', email: 'admin@gmail.com', role: 'admin', password: 'password123', address: { house_name: 'Admin HQ', street_address: 'Central Ave', city_district: 'New Delhi', state: 'Delhi', pincode: '110001' } },

  // --- PROVIDERS (10) ---
  // Cleaning (2)
  { name: 'Sarah Clean', email: 'sarah.cleaner@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Villa 1', street_address: 'Clean St', city_district: 'Kochi', state: 'Kerala', pincode: '682001' } },
  { name: 'Green Clean Co', email: 'greenclean@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Office 202', street_address: 'Eco Road', city_district: 'Trivandrum', state: 'Kerala', pincode: '695001' } },

  // Fitness (2)
  { name: 'Rahul Fit', email: 'rahul.fitness@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Gym House', street_address: 'Fit Lane', city_district: 'Bangalore', state: 'Karnataka', pincode: '560001' } },
  { name: 'Yoga with Priya', email: 'priya.yoga@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Studio 5', street_address: 'Peace Ave', city_district: 'Mysore', state: 'Karnataka', pincode: '570001' } },

  // IT Repair (2)
  { name: 'Tech Fixer', email: 'tech.fixer@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Shop 10', street_address: 'Digital Park', city_district: 'Bangalore', state: 'Karnataka', pincode: '560002' } },
  { name: 'Laptop Medic', email: 'laptop.medic@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Zone 4', street_address: 'Cyber City', city_district: 'Hyderabad', state: 'Telangana', pincode: '500001' } },

  // Plumbing (2)
  { name: 'Joe Plumber', email: 'joe.plumber@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'H-99', street_address: 'Water Works', city_district: 'Chennai', state: 'Tamil Nadu', pincode: '600001' } },
  { name: 'City Plumbers', email: 'city.plumbers@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Depot 5', street_address: 'Main Pipe Rd', city_district: 'Coimbatore', state: 'Tamil Nadu', pincode: '641001' } },

  // Electrical (2)
  { name: 'Max Electric', email: 'max.electric@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Power House', street_address: 'Volt Lane', city_district: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
  { name: 'Bright Sparks', email: 'bright.sparks@gmail.com', role: 'provider', password: 'password123', address: { house_name: 'Unit 7', street_address: 'Current St', city_district: 'Pune', state: 'Maharashtra', pincode: '411001' } },

  // --- CUSTOMERS (10) ---
  { name: 'Arjun Das', email: 'arjun.das@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'Apt 101', street_address: 'MG Road', city_district: 'Kochi', state: 'Kerala', pincode: '682001' } },
  { name: 'Sneha P', email: 'sneha.p@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'Villa 5', street_address: 'Palm Grove', city_district: 'Bangalore', state: 'Karnataka', pincode: '560001' } },
  { name: 'Rohan K', email: 'rohan.k@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'Flat 4B', street_address: 'Lake View', city_district: 'Chennai', state: 'Tamil Nadu', pincode: '600001' } },
  { name: 'Anjali M', email: 'anjali.m@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'House 22', street_address: 'Garden St', city_district: 'Mumbai', state: 'Maharashtra', pincode: '400001' } },
  { name: 'Vikram S', email: 'vikram.s@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'C-Block', street_address: 'Tech Park', city_district: 'Hyderabad', state: 'Telangana', pincode: '500001' } },
  { name: 'Meera R', email: 'meera.r@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'No 7', street_address: 'Temple Rd', city_district: 'Trivandrum', state: 'Kerala', pincode: '695001' } },
  { name: 'David J', email: 'david.j@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'Plot 45', street_address: 'Residency Rd', city_district: 'Bangalore', state: 'Karnataka', pincode: '560002' } },
  { name: 'Fatima Z', email: 'fatima.z@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'Floor 2', street_address: 'Beach Rd', city_district: 'Kozhikode', state: 'Kerala', pincode: '673001' } },
  { name: 'Karthik N', email: 'karthik.n@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'Tower A', street_address: 'Skyline', city_district: 'Kochi', state: 'Kerala', pincode: '682002' } },
  { name: 'Pooja Iyer', email: 'pooja.iyer@gmail.com', role: 'customer', password: 'password123', address: { house_name: 'Old House', street_address: 'Heritage Ln', city_district: 'Mysore', state: 'Karnataka', pincode: '570001' } },
];

const buildDefaultAvailability = () => ({
  bufferTime: 30,
  days: [
    { dayOfWeek: 'Monday', isAvailable: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 'Tuesday', isAvailable: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 'Wednesday', isAvailable: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 'Thursday', isAvailable: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 'Friday', isAvailable: true, slots: [{ startTime: '09:00', endTime: '18:00' }] },
    { dayOfWeek: 'Saturday', isAvailable: true, slots: [{ startTime: '10:00', endTime: '14:00' }] },
    { dayOfWeek: 'Sunday', isAvailable: false, slots: [] },
  ],
});

// Helper to get Provider Details by Index Mapping
// We have 10 providers in `usersData` (Index 0-9).
// 0,1 -> Cleaning
// 2,3 -> Fitness
// 4,5 -> IT Repair
// 6,7 -> Plumbing
// 8,9 -> Electrical
const getProviderDetails = (user, index, categories) => {
  let catId, businessName, desc;

  if (index === 0) { catId = categories[0]._id; businessName = "Sarah's Deep Cleaning"; desc = "Specialized deep cleaning for homes and offices. Eco-friendly products used."; }
  else if (index === 1) { catId = categories[0]._id; businessName = "Green Clean Solutions"; desc = "Sustainable and organic cleaning services for a healthier home."; }
  else if (index === 2) { catId = categories[1]._id; businessName = "Iron Gym & Fitness"; desc = "Personal training gym focused on strength and conditioning."; }
  else if (index === 3) { catId = categories[1]._id; businessName = "Priya's Yoga Studio"; desc = "Traditional Hatha and Vinyasa yoga classes for mindfulness and flexibility."; }
  else if (index === 4) { catId = categories[2]._id; businessName = "QuickFix Electronics"; desc = "Expert repair for laptops, mobiles, and gaming consoles. Fast turnaround."; }
  else if (index === 5) { catId = categories[2]._id; businessName = "Laptop Surgeons"; desc = "Chip-level motherboard repair and data recovery specialists."; }
  else if (index === 6) { catId = categories[3]._id; businessName = "Joe The Plumber"; desc = "All plumbing needs handled efficiently. Leaks, clogs, and installations."; }
  else if (index === 7) { catId = categories[3]._id; businessName = "City Wide Plumbing"; desc = "Commercial and residential plumbing contractors. Licensed and insured."; }
  else if (index === 8) { catId = categories[4]._id; businessName = "Max Voltage Services"; desc = "High-quality electrical work for new constructions and renovations."; }
  else if (index === 9) { catId = categories[4]._id; businessName = "Bright Sparks Electric"; desc = "Emergency electrician service. Safety inspections and rewiring."; }

  return {
    userId: user._id,
    businessName,
    description: desc,
    categories: [catId],
    isVerified: true,
    address: user.address,
    availability: buildDefaultAvailability(),
    ratingAvg: 0, // Will be updated later
    reviewCount: 0
  };
};



const importData = async () => {
  try {
    await connectDB();

    // 1. CLEAR MOCK DATA ONLY (Smart Cleanup)
    console.log('🗑️  Cleaning up previous mock data...');

    // Collect emails of all mock users to target for deletion
    // We actively track these emails to separate "Mock" from "Real" users
    // Also explicitly add the old admin email to ensure it gets removed
    const mockEmails = usersData.map(u => u.email).concat(['admin@locallink.com']);

    // Find users by these emails
    const mockUsers = await User.find({ email: { $in: mockEmails } });
    const mockUserIds = mockUsers.map(u => u._id);

    if (mockUserIds.length > 0) {
      // Find providers associated with these users
      const mockProviders = await Provider.find({ userId: { $in: mockUserIds } });
      const mockProviderIds = mockProviders.map(p => p._id);

      // Clean up dependent data (Reviews, Bookings, Services) linked to these mock entities
      await Review.deleteMany({ $or: [{ userId: { $in: mockUserIds } }, { providerId: { $in: mockProviderIds } }] });
      await Booking.deleteMany({ $or: [{ userId: { $in: mockUserIds } }, { providerId: { $in: mockProviderIds } }] });
      await Service.deleteMany({ providerId: { $in: mockProviderIds } });

      // Delete the Profiles and User Accounts
      await Provider.deleteMany({ _id: { $in: mockProviderIds } });
      await User.deleteMany({ _id: { $in: mockUserIds } });

      console.log(`✅ Removed ${mockUserIds.length} mock users and their associated data.`);
    } else {
      console.log('ℹ️  No existing mock data found to clean.');
    }
    // Note: We DO NOT delete Categories, we only 'ensure' them below. This protects real categories.

    // ---------------------------------------------------------
    // 1. Categories
    // ---------------------------------------------------------
    console.log('👉 Ensuring Categories...');
    const dbCategories = [];
    for (const cat of categoryData) {
      let c = await Category.findOne({ slug: cat.slug });
      if (!c) c = await Category.create(cat);
      dbCategories.push(c);
    }

    // Sort logic to ensure we map correctly: 
    // Data order: Cleaning, Fitness, IT Repair, Plumbing, Electrical
    // We need to fetch/sort them to match the provider generation logic 0-9
    const cleaningCat = dbCategories.find(c => c.slug === 'cleaning');
    const fitnessCat = dbCategories.find(c => c.slug === 'fitness');
    const itCat = dbCategories.find(c => c.slug === 'it-repair');
    const plumbingCat = dbCategories.find(c => c.slug === 'plumbing');
    const electricalCat = dbCategories.find(c => c.slug === 'electrical');

    const orderedCategories = [cleaningCat, cleaningCat, fitnessCat, fitnessCat, itCat, itCat, plumbingCat, plumbingCat, electricalCat, electricalCat];

    // ---------------------------------------------------------
    // 2. Users (Providers & Customers)
    // ---------------------------------------------------------
    console.log('👉 Ensuring Users...');
    const salt = await bcrypt.genSalt(10);
    const dbProvidersUser = [];
    const dbCustomersUser = [];

    for (const u of usersData) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        // FIX: Do not hash manually here. The User model pre-save hook handles hashing.
        // Passing plain text password into passwordHash field triggers the hook.
        const passwordHash = u.password;
        user = await User.create({ ...u, passwordHash });
      }

      if (u.role === 'provider') dbProvidersUser.push(user);
      else if (u.role === 'customer') dbCustomersUser.push(user);
    }

    // ---------------------------------------------------------
    // 3. Provider Profiles
    // ---------------------------------------------------------
    console.log('👉 Ensuring Provider Profiles...');
    const dbProviders = [];

    // We expect 10 provider users. Map them to the 10 descriptions.
    // orderedCategories array is length 10 (2 of each).
    // The dbProvidersUser should be length 10 if we just created them.

    for (let i = 0; i < dbProvidersUser.length; i++) {
      const pUser = dbProvidersUser[i];

      // Use our helper to generate the profile data based on index
      // We need strictly: 2 cleaning, 2 fitness...
      // Assuming usersData defined them in that order (it did).
      const pData = getProviderDetails(pUser, i, [cleaningCat, fitnessCat, itCat, plumbingCat, electricalCat]);

      let provider = await Provider.findOne({ userId: pUser._id });
      if (!provider) {
        provider = await Provider.create(pData);
      }
      dbProviders.push(provider);
    }

    // ---------------------------------------------------------
    // 4. Services (25 Total - 5 per Category)
    // ---------------------------------------------------------
    console.log('👉 Ensuring Services...');
    // We distribute 5 services per category.
    // Provider 1 (Index 0) gets 3, Provider 2 (Index 1) gets 2.
    // ... Repeat for each pair.

    const servicesPayload = [
      // -- CLEANING (Provider 0 & 1) --
      { providerIdx: 0, title: 'Deep Home Cleaning', description: 'Full sanitation of floors, bathrooms, and kitchen.', price: 150, duration: 180, category: cleaningCat },
      { providerIdx: 0, title: 'Sofa & Carpet Shampoo', description: 'Remove stains and dust mites from upholstery.', price: 80, duration: 90, category: cleaningCat },
      { providerIdx: 0, title: 'Curtain Steaming', description: 'Steam clean curtains without removal.', price: 50, duration: 60, category: cleaningCat },
      { providerIdx: 1, title: 'Eco-Friendly Kitchen Clean', description: 'Detailed kitchen cleaning using organic products.', price: 120, duration: 120, category: cleaningCat },
      { providerIdx: 1, title: 'Move-Out Cleaning', description: 'Empty house cleaning for tenants leaving an apartment.', price: 200, duration: 240, category: cleaningCat },

      // -- FITNESS (Provider 2 & 3) --
      { providerIdx: 2, title: 'Personal Training Session', description: 'One-hour strength and conditioning session.', price: 70, duration: 60, category: fitnessCat },
      { providerIdx: 2, title: 'Group HIIT Class', description: 'High Intensity Interval Training for groups.', price: 30, duration: 45, category: fitnessCat },
      { providerIdx: 2, title: 'Nutrition Consultation', description: 'Diet planning and macro breakdown analysis.', price: 50, duration: 30, category: fitnessCat },
      { providerIdx: 3, title: 'Private Yoga Class', description: 'Personalized yoga flow for flexibility and peace.', price: 60, duration: 60, category: fitnessCat },
      { providerIdx: 3, title: 'Meditation Workshop', description: 'Guided mindfulness and breathing techniques.', price: 40, duration: 60, category: fitnessCat },

      // -- IT REPAIR (Provider 4 & 5) --
      { providerIdx: 4, title: 'Laptop Screen Repair', description: 'Replacement of cracked or broken laptop screens.', price: 100, duration: 120, category: itCat },
      { providerIdx: 4, title: 'OS Formatting & Reinstall', description: 'Clean install of Windows/Mac/Linux OS.', price: 50, duration: 90, category: itCat },
      { providerIdx: 4, title: 'Data Recovery', description: 'Attempt to recover lost files from hard drives.', price: 150, duration: 240, category: itCat },
      { providerIdx: 5, title: 'Motherboard Chip-Level Fix', description: 'Advanced soldering and component replacement.', price: 200, duration: 180, category: itCat },
      { providerIdx: 5, title: 'Thermal Paste Re-application', description: 'Fix overheating issues by cleaning cooling fans.', price: 40, duration: 60, category: itCat },

      // -- PLUMBING (Provider 6 & 7) --
      { providerIdx: 6, title: 'Leak Fix - Pipe Burst', description: 'Emergency repair for burst or leaking pipes.', price: 90, duration: 60, category: plumbingCat },
      { providerIdx: 6, title: 'Tap & Faucet Installation', description: 'Replace old taps with new modern fittings.', price: 40, duration: 30, category: plumbingCat },
      { providerIdx: 6, title: 'Water Tank Cleaning', description: 'Hygienic cleaning of overhead water tanks.', price: 80, duration: 120, category: plumbingCat },
      { providerIdx: 7, title: 'Bathroom Plumbing Setup', description: 'Complete piping for a new bathroom renovation.', price: 500, duration: 480, category: plumbingCat },
      { providerIdx: 7, title: 'Drain Unclogging', description: 'Remove blockages from washbasins and sinks.', price: 60, duration: 45, category: plumbingCat },

      // -- ELECTRICAL (Provider 8 & 9) --
      { providerIdx: 8, title: 'House Wiring Check', description: 'Complete inspection of home electrical safety.', price: 100, duration: 90, category: electricalCat },
      { providerIdx: 8, title: 'Inverter Installation', description: 'Setup for power backup inverters and batteries.', price: 80, duration: 60, category: electricalCat },
      { providerIdx: 8, title: 'Ceiling Fan Install', description: 'Assembly and mounting of ceiling fans.', price: 30, duration: 45, category: electricalCat },
      { providerIdx: 9, title: 'Fuse Board Upgrade', description: 'Replace old fuses with modern MCB panels.', price: 250, duration: 240, category: electricalCat },
      { providerIdx: 9, title: 'Smart Light Setup', description: 'Installation and config of WiFi smart bulbs/switches.', price: 120, duration: 120, category: electricalCat },
    ];

    const dbServices = [];
    for (const req of servicesPayload) {
      let sc = await Service.findOne({ title: req.title, providerId: dbProviders[req.providerIdx]._id });
      if (!sc) {
        sc = await Service.create({
          providerId: dbProviders[req.providerIdx]._id,
          title: req.title,
          description: req.description,
          category: req.category._id,
          price: req.price,
          durationMinutes: req.duration,
          isActive: true
        });
      }
      dbServices.push(sc);
    }

    // Link Services to Providers
    for (const p of dbProviders) {
      const myServices = dbServices.filter(s => s.providerId.equals(p._id)).map(s => s._id);
      if (myServices.length > 0) {
        p.services = myServices;
        await p.save();
      }
    }

    // ---------------------------------------------------------
    // 5. Reviews (Add realistic reviews for all services)
    // ---------------------------------------------------------
    console.log('👉 Ensuring Reviews...');
    const reviewComments = [
      "Amazing service! Very professional.",
      "Good job, but arrived slightly late.",
      "Excellent work, fixed the issue completely.",
      "Very polite and clean work.",
      "Highly recommended!",
      "A bit expensive, but worth the quality.",
      "Fast and efficient.",
      "Will definitely book again.",
      "The provider was very knowledgeable.",
      "Five stars! seamless experience."
    ];

    const reviewDocs = [];

    // Create ~2 reviews per service
    for (const service of dbServices) {
      const existingCount = await Review.countDocuments({ serviceId: service._id });
      if (existingCount > 0) continue; // Skip if already has reviews

      // Random customers
      const c1 = dbCustomersUser[Math.floor(Math.random() * dbCustomersUser.length)];
      const c2 = dbCustomersUser[Math.floor(Math.random() * dbCustomersUser.length)];

      // Review 1
      reviewDocs.push({
        userId: c1._id,
        providerId: service.providerId,
        serviceId: service._id, // If booking linkage not strictly enforced in model validation
        // Note: If Review model requires bookingId, we might need dummy bookings. 
        // Assuming simplified seeding where we just need reviews to show up.
        // If BookingId IS required, we must create dummy bookings first.
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
      });

      // Review 2
      reviewDocs.push({
        userId: c2._id,
        providerId: service.providerId,
        serviceId: service._id,
        rating: Math.floor(Math.random() * 3) + 3, // 3 to 5
        comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
      });
    }

    // We need to verify if Review requires bookingId. Usually yes.
    // Let's create dummy COMPLETED bookings for these reviews to keep it clean.
    const dbBookings = [];
    for (const r of reviewDocs) {
      // Create a completed booking for this review
      const b = await Booking.create({
        userId: r.userId,
        providerId: r.providerId,
        serviceId: r.serviceId,
        scheduledAt: new Date(Date.now() - 86400000 * Math.floor(Math.random() * 30)), // Past 30 days
        durationMinutes: 60,
        totalPrice: 100,
        status: 'completed',
        paymentStatus: 'paid'
      });
      r.bookingId = b._id; // Link review to booking
    }

    if (reviewDocs.length > 0) {
      await Review.insertMany(reviewDocs);
    }

    // ---------------------------------------------------------
    // 6. Recalculate Provider Stats
    // ---------------------------------------------------------
    console.log('👉 Updating Provider Ratings...');
    for (const p of dbProviders) {
      const stats = await Review.aggregate([
        { $match: { providerId: p._id } },
        { $group: { _id: '$providerId', ratingAvg: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
      ]);

      if (stats.length > 0) {
        p.ratingAvg = stats[0].ratingAvg;
        p.reviewCount = stats[0].reviewCount;
        await p.save();
      }
    }

    console.log('✅ Seeding Complete!');
    process.exit(0);

  } catch (error) {
    console.error(`❌ Seeding Error: ${error.message}`);
    process.exit(1);
  }
};

importData();