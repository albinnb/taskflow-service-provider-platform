import multer from 'multer';
import path from 'path';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// --- Local Storage Configuration (Fallback) ---
const localDiskStorage = multer.diskStorage({
  // Store files in the 'uploads' directory
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  // Use original name + timestamp for filename
  filename: (req, file, cb) => {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// --- Cloudinary Storage Configuration ---
let cloudinaryStorage;
if (isCloudinaryConfigured()) {
  cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'locallink_uploads', // Folder in your Cloudinary account
      format: async (req, file) => 'jpeg', // Force jpeg format
      public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
      // Max file size limit check can be done in Multer config below
    },
  });
}

// --- Multer Configuration ---
const upload = multer({
  storage: isCloudinaryConfigured() ? cloudinaryStorage : localDiskStorage,
  limits: { fileSize: 1024 * 1024 * 5 }, // 5MB file size limit
  fileFilter: (req, file, cb) => {
    // Check file type
    const filetypes = /jpe?g|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, jpeg, png, webp) are allowed!'));
  },
});

/**
 * @desc Middleware to handle single image uploads.
 * If Cloudinary is configured, it uploads to Cloudinary and returns the secure_url.
 * If not configured, it saves to the local 'uploads' folder.
 * @usage router.post('/', protect, uploadImage.single('image'), createService);
 */
const uploadImage = upload;

export default uploadImage;