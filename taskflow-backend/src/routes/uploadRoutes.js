import express from 'express';
import uploadImage from '../middleware/uploadMiddleware.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/upload
 * @desc Upload an image file
 * @access Private (Provider/Admin)
 */
router.post('/', protect, authorize(['provider', 'admin']), uploadImage.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    // Cloudinary storage puts the URL in 'path'
    // Local disk storage puts the system path in 'path'
    let imageUrl = req.file.path;

    // If it's a local file (doesn't start with http), construct the full URL
    if (!imageUrl.startsWith('http')) {
        // Normalize path separators for URL
        const normalizedPath = imageUrl.replace(/\\/g, '/');
        // The server should serve the 'uploads' directory statically
        // We'll assume the client can access it via /uploads/... or just return relative
        // But construction full URL is safer for clients.
        imageUrl = `${req.protocol}://${req.get('host')}/${normalizedPath}`;
    }

    res.status(200).json({
        success: true,
        data: {
            url: imageUrl,
            public_id: req.file.filename, // Multer filename
            originalName: req.file.originalname
        }
    });
});

export default router;
