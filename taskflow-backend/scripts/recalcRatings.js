import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Review from '../src/models/Review.js';
import Provider from '../src/models/Provider.js';

dotenv.config();

const recalcRatings = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const providers = await Provider.find({});
        console.log(`Found ${providers.length} providers to check.`);

        for (const provider of providers) {
            console.log(`Processing provider: ${provider.businessName} (${provider._id})`);

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

            if (stats.length > 0) {
                const { ratingAvg, reviewCount } = stats[0];
                console.log(`  -> Calculated: Avg ${ratingAvg.toFixed(1)}, Count ${reviewCount}`);

                provider.ratingAvg = ratingAvg;
                provider.reviewCount = reviewCount;
                await provider.save();
                console.log('  -> Updated successfully.');
            } else {
                console.log('  -> No reviews found. Resetting to 0.');
                provider.ratingAvg = 0;
                provider.reviewCount = 0;
                await provider.save();
            }
        }

        console.log('Recalculation Complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

recalcRatings();
