import User from '../models/User.js';
import Provider from '../models/Provider.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateToken } from '../utils/jwt.js';

// @desc Register a new user - FIXED
// @route POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;

    console.log('Registration attempt for:', email);

    const userExists = await User.findOne({ email });

    if (userExists) {
        console.log('User already exists:', email);
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        passwordHash: password, // Mongoose pre-save hook handles hashing
        role: role || 'customer',
    });

    console.log('User created successfully:', user._id, user.email);

    if (user) {
        if (user.role === 'provider') {
            // Automatically create a provider profile linked to this user
            await Provider.create({
                userId: user._id,
                businessName: user.name + ' Services',
                description: 'New Provider Profile',
                // Location fields removed as per cleanup
                address: user.address,
            });
        }
        
        // Check if address fields are complete to determine onboarding status
        const isProfileComplete = user.isAddressComplete();

        const token = generateToken(user, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
        console.log('Token generated for user:', user._id);

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isProfileComplete,
            token: token,
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc Auth user & get token
// @route POST /api/auth/login
// @access Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    console.log('Login attempt for email:', email);

    // We must select the passwordHash explicitly
    const user = await User.findOne({ email }).select('+passwordHash');

    if (!user) {
        console.log('User not found for email:', email);
        res.status(401);
        throw new Error('Invalid email or password');
    }

    if (!user.passwordHash) {
        console.log('User has no password hash:', email);
        res.status(401);
        throw new Error('Invalid email or password');
    }

    // Try to match the password
    const isPasswordMatch = await user.matchPassword(password);
    console.log('Password match result:', isPasswordMatch);

    if (isPasswordMatch) {
        // Check if address fields are complete to determine onboarding status
        const isProfileComplete = user.isAddressComplete();

        const token = generateToken(user, process.env.JWT_SECRET, process.env.JWT_EXPIRES_IN);
        console.log('Login successful for:', email);

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isProfileComplete,
            token: token,
        });
    } else {
        console.log('Password mismatch for user:', email);
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc Get user profile data (used for /api/auth/me)
// @route GET /api/auth/me
// @access Private
const getMe = asyncHandler(async (req, res) => {
    // req.user is set by the protect middleware, which only fetches essential fields
    
    // Fetch the full user object including address fields (for isProfileComplete check)
    const user = await User.findById(req.user._id);

    if (user) {
        const isProfileComplete = user.isAddressComplete();

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            address: user.address,
            isProfileComplete,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});


// @desc Get provider specific profile data
// @route GET /api/auth/provider
// @access Private/Provider
const getProviderProfile = asyncHandler(async (req, res) => {
    // Ensure the user is a provider
    if (req.user.role !== 'provider') {
        res.status(403);
        throw new Error('Access denied. Not a provider.');
    }

    // Find the provider profile linked to the user ID
    const providerProfile = await Provider.findOne({ userId: req.user._id })
        .populate('categories', 'name slug')
        .populate('services', 'title price')
        .lean();

    if (providerProfile) {
        res.json(providerProfile);
    } else {
        // This could happen if a provider logs in but their provider profile hasn't been created yet (Edge case)
        res.status(404);
        throw new Error('Provider profile not found');
    }
});

// @desc Logout user
// @route POST /api/auth/logout
// @access Private
const logoutUser = asyncHandler(async (req, res) => {
    console.log('User logged out:', req.user.email);
    res.json({ message: 'Logout successful' });
});

export { registerUser, authUser, getMe, getProviderProfile, logoutUser };
