import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * @desc Generate a JWT for a user.
 */
const generateToken = (user, secret, expiresIn) => {
	return jwt.sign(
		{
			id: user._id,
			role: user.role,
		},
		secret,
		{
			expiresIn: expiresIn,
		}
	);
};

/**
 * @desc Sends an access token in an HTTP-only cookie and includes profile status in the body.
 * @param {object} res - Express response object
 * @param {object} user - Mongoose User object
 * @param {boolean} [isProfileComplete=false] - Status of the user profile completion
 */
// --- MODIFICATION START ---
// Added isProfileComplete as a parameter with a default value of false
const sendTokenResponse = (res, user, isProfileComplete = false) => {
	// 1. Generate Access Token (short-lived)
	const accessToken = generateToken(
		user,
		process.env.JWT_SECRET,
		process.env.JWT_EXPIRES_IN
	);

	// 2. Define cookie options
	const cookieOptions = {
		// Set cookie to expire in 7 days (in milliseconds)
		expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
		httpOnly: true, // Prevent client-side JS access (XSS protection)
		secure: process.env.NODE_ENV === 'production', // Use secure in production (HTTPS)
		sameSite: 'strict', // CSRF protection
	};

	// 3. Set the access token cookie
	res.cookie('token', accessToken, cookieOptions);

	// 4. Send a JSON response including the profile status
	res.status(200).json({
		success: true,
		token: accessToken,
		role: user.role,
		userId: user._id,
		// New: Send the profile completion status to the frontend
		isProfileComplete: isProfileComplete,
	});
};
// --- MODIFICATION END ---

export { generateToken, sendTokenResponse };