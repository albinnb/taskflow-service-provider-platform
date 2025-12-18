import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
// *** CORRECTED PATHS FOR MODELS INSIDE 'src' ***
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

// Data Definition
const categoryData = [
  { name: 'Plumbing', slug: 'plumbing' },
  { name: 'Electrical', slug: 'electrical' },
  { name: 'Cleaning', slug: 'cleaning' },
  { name: 'Fitness', slug: 'fitness' },
  { name: 'IT Repair', slug: 'it-repair' },
];

const usersData = [
  // Admin User
  { name: 'Admin User', email: 'admin@locallink.com', role: 'admin', password: 'password123', address: { house_name: 'Admin House', street_address: 'Central Avenue', city_district: 'Kasaragod', state: 'Kerala', pincode: '671121' } },
  // Providers (5)
  { name: 'Alex Plumbing', email: 'alex@plumbing.com', role: 'provider', password: 'password123', address: { house_name: 'Alex Villa', street_address: 'Beach Road', city_district: 'Kasaragod', state: 'Kerala', pincode: '671121' } },
  { name: 'Beth Electric', email: 'beth@electric.com', role: 'provider', password: 'password123', address: { house_name: 'Beth Towers', street_address: 'Techno Park', city_district: 'Mangalore', state: 'Karnataka', pincode: '575001' } },
  { name: 'Cleaning Co.', email: 'clean@co.com', role: 'provider', password: 'password123', address: { house_name: 'Clean Base', street_address: 'Industrial Area', city_district: 'Kasaragod', state: 'Kerala', pincode: '671123' } },
  { name: 'Fit Pro', email: 'fit@pro.com', role: 'provider', password: 'password123', address: { house_name: 'Fit Gym', street_address: 'Temple Road', city_district: 'Kannur', state: 'Kerala', pincode: '670001' } },
  { name: 'IT Fixer', email: 'it@fixer.com', role: 'provider', password: 'password123', address: { house_name: 'IT Home', street_address: 'City Center', city_district: 'Mangalore', state: 'Karnataka', pincode: '575003' } },
  // Customers (10)
  { name: 'Customer One', email: 'customer1@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 1', street_address: 'Market Road', city_district: 'Kasaragod', state: 'Kerala', pincode: '671121' } },
  { name: 'Customer Two', email: 'customer2@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 2', street_address: 'Main Street', city_district: 'Kasaragod', state: 'Kerala', pincode: '671121' } },
  { name: 'Customer Three', email: 'customer3@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 3', street_address: 'Park Lane', city_district: 'Mangalore', state: 'Karnataka', pincode: '575001' } },
  { name: 'Customer Four', email: 'customer4@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 4', street_address: 'Mall Area', city_district: 'Kannur', state: 'Kerala', pincode: '670001' } },
  { name: 'Customer Five', email: 'customer5@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 5', street_address: 'River View', city_district: 'Kasaragod', state: 'Kerala', pincode: '671123' } },
  { name: 'Customer Six', email: 'customer6@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 6', street_address: 'Random St', city_district: 'Kannur', state: 'Kerala', pincode: '670002' } },
  { name: 'Customer Seven', email: 'customer7@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 7', street_address: 'Tech Lane', city_district: 'Mangalore', state: 'Karnataka', pincode: '575002' } },
  { name: 'Customer Eight', email: 'customer8@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 8', street_address: 'Main St', city_district: 'Kannur', state: 'Kerala', pincode: '670001' } },
  { name: 'Customer Nine', email: 'customer9@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 9', street_address: 'Service Rd', city_district: 'Kasaragod', state: 'Kerala', pincode: '671121' } },
  { name: 'Customer Ten', email: 'customer10@test.com', role: 'customer', password: 'password123', address: { house_name: 'Cust House 10', street_address: 'Back Rd', city_district: 'Mangalore', state: 'Karnataka', pincode: '575001' } },
];


const defaultAvailability = [
  { dayOfWeek: 1, slots: [{ from: "09:00", to: "17:00" }] },
  { dayOfWeek: 2, slots: [{ from: "09:00", to: "17:00" }] },
  { dayOfWeek: 3, slots: [{ from: "09:00", to: "17:00" }] },
  { dayOfWeek: 4, slots: [{ from: "09:00", to: "17:00" }] },
  { dayOfWeek: 5, slots: [{ from: "09:00", to: "17:00" }] },
  { dayOfWeek: 6, slots: [{ from: "10:00", to: "14:00" }] },
];


/**
 * @desc Main function to seed the database with sample data.
 */
const importData = async () => {
  try {
    await connectDB();

    // 1. Clear existing data (Aggressive Drop to clear ALL indexes)
    console.log('Destroying all data and indexes...');
    
    // Explicitly drop the problematic unique index before inserting new documents
    try {
        await Provider.collection.dropIndex('availability.dayOfWeek_1');
        console.log('Successfully dropped old unique index on providers.availability.dayOfWeek');
    } catch (e) {
        // Ignore if index doesn't exist
        if (e.codeName !== 'IndexNotFound') {
            console.log('Could not drop index, proceeding with data deletion...');
        }
    }
    
    // Now delete all documents and collections (safest way to clear schema cache)
    await User.deleteMany();
    await Provider.deleteMany();
    await Service.deleteMany();
    await Booking.deleteMany();
    await Review.deleteMany();
    await Category.deleteMany();
    
    // 2. Insert Categories
    console.log('Inserting Categories...');
    const createdCategories = await Category.insertMany(categoryData);
    const plumbingCat = createdCategories.find(c => c.slug === 'plumbing')._id;
    const electricalCat = createdCategories.find(c => c.slug === 'electrical')._id;
    const cleaningCat = createdCategories.find(c => c.slug === 'cleaning')._id;
    const fitnessCat = createdCategories.find(c => c.slug === 'fitness')._id;
    const itCat = createdCategories.find(c => c.slug === 'it-repair')._id;

    // 3. Insert Users & Hash Passwords
    console.log('Inserting Users...');
    const salt = await bcrypt.genSalt(10);
    
    const usersWithHash = await Promise.all(usersData.map(async (user) => ({
        ...user,
        passwordHash: await bcrypt.hash(user.password, salt),
        address: {
          house_name: user.address?.house_name || 'H.No. 123',
          street_address: user.address?.street_address || 'Main Road',
          city_district: user.address?.city_district || user.address?.city || 'Mumbai', 
          state: user.address?.state || 'Maharashtra',
          pincode: user.address?.pincode || '400001',
        },
    })));
    
    const createdUsers = await User.insertMany(usersWithHash);

    const adminUser = createdUsers[0];
    const providerUsers = createdUsers.slice(1, 6);
    const customerUsers = createdUsers.slice(6);

    // 4. Insert Providers
    console.log('Inserting Providers...');
    const providersData = [
        { userId: providerUsers[0]._id, businessName: 'Alex Plumbing Services', description: 'Certified plumber available 24/7 for emergency repairs and installations.', categories: [plumbingCat], isVerified: true, address: providerUsers[0].address, ratingAvg: 4.5, reviewCount: 2, availability: defaultAvailability },
        { userId: providerUsers[1]._id, businessName: 'Beth Electrical Solutions', description: 'Expert electrician for residential and commercial wiring and fault finding.', categories: [electricalCat], isVerified: true, address: providerUsers[1].address, ratingAvg: 3.8, reviewCount: 1, availability: defaultAvailability },
        { userId: providerUsers[2]._id, businessName: 'Spotless Cleaning Co.', description: 'Professional cleaning services for homes and offices. We use eco-friendly products.', categories: [cleaningCat], isVerified: true, address: providerUsers[2].address, ratingAvg: 5, reviewCount: 1, availability: defaultAvailability },
        { userId: providerUsers[3]._id, businessName: 'The Fit Zone', description: 'Personal training and group fitness classes. Get fit with our certified pros.', categories: [fitnessCat], isVerified: false, address: providerUsers[3].address, availability: defaultAvailability },
        { userId: providerUsers[4]._id, businessName: 'Computer Fix Masters', description: 'Affordable and fast laptop/PC repair, virus removal, and data recovery.', categories: [itCat], isVerified: true, address: providerUsers[4].address, availability: defaultAvailability },
    ];
    const createdProviders = await Provider.insertMany(providersData);

    // 5. Insert Services (Price is now HOURLY RATE, Duration is MINIMUM MINUTES)
    console.log('Inserting Services...');
    const servicesData = [
      // Plumbing
      { providerId: createdProviders[0]._id, title: 'Drain Unclogging', description: 'Fast and effective drain cleaning service (Est. 1-2 hours).', category: plumbingCat, price: 90.00, durationMinutes: 60, tags: ['emergency', 'quick-fix'] },
      { providerId: createdProviders[0]._id, title: 'Toilet Repair/Installation', description: 'Full service toilet repair or new installation (Est. 2-3 hours).', category: plumbingCat, price: 150.00, durationMinutes: 120 },
      { providerId: createdProviders[0]._id, title: 'Water Heater Maintenance', description: 'Annual check and maintenance for tank water heaters (Est. 90 min).', category: plumbingCat, price: 120.00, durationMinutes: 90 },
      // Electrical
      { providerId: createdProviders[1]._id, title: 'Faulty Wiring Diagnosis', description: 'Identify and fix electrical faults safely (Est. 60 min).', category: electricalCat, price: 110.00, durationMinutes: 60, tags: ['safety'] },
      { providerId: createdProviders[1]._id, title: 'Light Fixture Installation', description: 'Install new lights or replace old ones (Est. 45 min).', category: electricalCat, price: 75.00, durationMinutes: 45 },
      { providerId: createdProviders[1]._id, title: 'Circuit Breaker Repair', description: 'Fixing or replacing tripped/faulty circuit breakers (Est. 90 min).', category: electricalCat, price: 130.00, durationMinutes: 90 },
      // Cleaning
      { providerId: createdProviders[2]._id, title: 'Standard Home Cleaning', description: 'Tidy up and general cleaning for a standard 2-bedroom apartment (Est. 3 hours).', category: cleaningCat, price: 100.00, durationMinutes: 180, tags: ['weekly', 'eco-friendly'] },
      { providerId: createdProviders[2]._id, title: 'Deep Kitchen Clean', description: 'Intensive clean of kitchen appliances, cabinets, and surfaces (Est. 2.5 hours).', category: cleaningCat, price: 150.00, durationMinutes: 150 },
      // Fitness
      { providerId: createdProviders[3]._id, title: '1-on-1 Personal Training (60min)', description: 'Customized workout session with a certified trainer.', category: fitnessCat, price: 65.00, durationMinutes: 60, tags: ['weight-loss', 'strength'] },
      { providerId: createdProviders[3]._id, title: 'Group Yoga Class', description: 'Weekly group yoga session for all skill levels (Est. 75 min).', category: fitnessCat, price: 20.00, durationMinutes: 75 },
      // IT Repair
      { providerId: createdProviders[4]._id, title: 'Laptop Screen Replacement', description: 'Replace cracked or damaged laptop screens (Est. 3 hours).', category: itCat, price: 80.00, durationMinutes: 180 },
      { providerId: createdProviders[4]._id, title: 'Virus/Malware Removal', description: 'Deep scan and removal of all malicious software (Est. 2 hours).', category: itCat, price: 60.00, durationMinutes: 120 },
      { providerId: createdProviders[4]._id, title: 'RAM Upgrade & Install', description: 'Upgrade your computer memory for better performance (Est. 30 min).', category: itCat, price: 40.00, durationMinutes: 30 },
    ];
    const createdServices = await Service.insertMany(servicesData);

    // Update Provider models with their services
    await Promise.all(createdProviders.map(async (provider) => {
        const providerServices = createdServices.filter(s => s.providerId.equals(provider._id)).map(s => s._id);
        await Provider.findByIdAndUpdate(provider._id, { services: providerServices });
    }));

    // 6. Insert Bookings (20) - Uses specific scheduledAt and durationMinutes
    console.log('Inserting Bookings...');
    
    const bookingTemplates = [
      // Completed Bookings for Reviews (5)
      { userId: customerUsers[0], service: createdServices[0], duration: 60, status: 'completed', paymentStatus: 'paid', rating: 5, comment: 'Excellent plumbing service, highly recommend!', notes: 'Drain was completely blocked.' },
      { userId: customerUsers[1], service: createdServices[0], duration: 90, status: 'completed', paymentStatus: 'paid', rating: 4, comment: 'Good work, arrived on time.', notes: 'Minor leak fixed.' },
      { userId: customerUsers[2], service: createdServices[3], duration: 60, status: 'completed', paymentStatus: 'paid', rating: 4, comment: 'Electrical fix was clean and quick.', notes: 'Faulty switch replaced.' },
      { userId: customerUsers[3], service: createdServices[6], duration: 180, status: 'completed', paymentStatus: 'paid', rating: 5, comment: 'Spotless clean! Truly 5-star quality.', notes: 'Deep cleaning required after party.' },
      { userId: customerUsers[4], service: createdServices[10], duration: 180, status: 'completed', paymentStatus: 'paid', rating: 3, comment: 'Screen replacement was slow, but it works.', notes: 'Macbook Pro screen replacement.' },
      // Pending/Confirmed/Cancelled Bookings (15) - Future Dates
      { userId: customerUsers[5], service: createdServices[1], duration: 120, status: 'pending', paymentStatus: 'unpaid', notes: 'Toilet installation on ground floor.' },
      { userId: customerUsers[6], service: createdServices[4], duration: 60, status: 'confirmed', paymentStatus: 'unpaid', notes: 'Need to install three light fixtures.' },
      { userId: customerUsers[7], service: createdServices[7], duration: 150, status: 'pending', paymentStatus: 'unpaid', notes: 'Kitchen deep clean requested.' },
      { userId: customerUsers[8], service: createdServices[8], duration: 150, status: 'confirmed', paymentStatus: 'paid', notes: 'Regular weekly clean.' },
      { userId: customerUsers[9], service: createdServices[11], duration: 120, status: 'pending', paymentStatus: 'unpaid', notes: 'System infected with malware.' },
      { userId: customerUsers[0], service: createdServices[2], duration: 90, status: 'confirmed', paymentStatus: 'paid', notes: 'Heater maintenance check.' },
      { userId: customerUsers[1], service: createdServices[5], duration: 90, status: 'pending', paymentStatus: 'unpaid', notes: 'Breaker keeps tripping.' },
      { userId: customerUsers[2], service: createdServices[8], duration: 150, status: 'confirmed', paymentStatus: 'paid', notes: 'Deep clean, special focus on bathroom.' },
      { userId: customerUsers[3], service: createdServices[9], duration: 60, status: 'completed', paymentStatus: 'paid', rating: 5, comment: 'Great PT session, very motivating.', notes: 'Focus on core strength.' }, 
      { userId: customerUsers[4], service: createdServices[12], duration: 30, status: 'cancelled', paymentStatus: 'unpaid', notes: 'RAM upgrade planned, but cancelled.' },
      { userId: customerUsers[5], service: createdServices[0], duration: 60, status: 'confirmed', paymentStatus: 'unpaid', notes: 'Emergency drain unclogging.' },
      { userId: customerUsers[6], service: createdServices[3], duration: 60, status: 'pending', paymentStatus: 'unpaid', notes: 'Wiring diagnosis, flickering lights.' },
      { userId: customerUsers[7], service: createdServices[6], duration: 180, status: 'confirmed', paymentStatus: 'paid', notes: 'Standard home clean requested.' },
      { userId: customerUsers[8], service: createdServices[10], duration: 180, status: 'completed', paymentStatus: 'paid', rating: 4, comment: 'Laptop repair was smooth.', notes: 'Another screen replacement needed.' }, 
      { userId: customerUsers[9], service: createdServices[12], duration: 30, status: 'confirmed', paymentStatus: 'unpaid', notes: 'Need RAM installed.' },
    ];

    const createdBookings = [];
    const reviewQueue = []; 
    
    const DAY_IN_MS = 24 * 3600000;
    // Use IST for scheduled time reference
    const nowIST = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"})); 

    for (let i = 0; i < bookingTemplates.length; i++) {
        const template = bookingTemplates[i];
        
        // Calculate a specific scheduled time: always start at 10:00 AM on the target date
        const daysOffset = template.status === 'completed' ? -7 : i % 5;
        const targetDate = new Date(nowIST.getTime() + daysOffset * DAY_IN_MS);
        targetDate.setHours(10, 0, 0, 0); // Set time to 10:00 AM IST for simplicity

        // Calculate total price: Hourly Rate * Hours
        const hours = template.duration / 60;
        const totalPrice = template.service.price * hours; 
        
        const booking = await Booking.create({
            userId: template.userId._id,
            serviceId: template.service._id,
            providerId: template.service.providerId,
            
            scheduledAt: targetDate, 
            durationMinutes: template.duration, 
            
            totalPrice: totalPrice, 
            status: template.status,
            paymentStatus: template.paymentStatus,
            meta: { notes: template.notes } 
        });
        createdBookings.push(booking);
        
        if (template.status === 'completed' && template.rating) {
            reviewQueue.push({
                userId: template.userId._id,
                providerId: template.service.providerId,
                bookingId: booking._id,
                rating: template.rating,
                comment: template.comment || 'Great service!',
            });
        }
    }

    // 7. Insert Reviews
    console.log('Inserting Reviews...');
    await Review.insertMany(reviewQueue);

    // 8. Re-calculate Provider Ratings
    console.log('Recalculating Provider Ratings...');
    for (const provider of createdProviders) {
        const stats = await Review.aggregate([
            { $match: { providerId: provider._id } },
            {
                $group: {
                    _id: '$providerId',
                    ratingAvg: { $avg: '$rating' },
                    reviewCount: { $sum: 1 },
                },
            },
        ]);

        const updateData = stats.length > 0
            ? { ratingAvg: stats[0].ratingAvg, reviewCount: stats[0].reviewCount }
            : { ratingAvg: 0, reviewCount: 0 };

        await Provider.findByIdAndUpdate(provider._id, updateData);
    }


    console.log('Data Imported Successfully! ✅');
    await disconnectDB();
    process.exit();
  } catch (error) {
    console.error(`ERROR: ${error.message}`);
    await disconnectDB();
    process.exit(1);
  }
};

// Handle command line arguments
if (process.argv[2] === '-d' || process.argv[2] === '--destroy') {
  console.log('Use `npm run seed` to clear and recreate data.');
  process.exit();
} else {
  importData();
}