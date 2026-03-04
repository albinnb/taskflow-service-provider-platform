import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Provider from './src/models/Provider.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        try {
            const sarah = await Provider.findOne({ businessName: /Sarah/i });
            if (sarah) {
                console.log("Sarah's coordinates:", JSON.stringify(sarah.location));

                // Let's also do a direct geoNear query from mongoose
                const nearProviders = await Provider.aggregate([
                    {
                        $geoNear: {
                            near: { type: "Point", coordinates: [75.259, 12.4731] },
                            distanceField: "dist.calculated",
                            maxDistance: 500000,
                            spherical: true,
                            distanceMultiplier: 0.001
                        }
                    }
                ]);
                console.log("Providers found via $geoNear:", nearProviders.length);
                if (nearProviders.length > 0) {
                    console.log("First provider:", nearProviders[0].businessName, "Distance:", nearProviders[0].dist.calculated);
                }
            } else {
                console.log("Sarah not found");
            }
        } catch (e) {
            console.error('Error:', e);
        }
        process.exit(0);
    });
