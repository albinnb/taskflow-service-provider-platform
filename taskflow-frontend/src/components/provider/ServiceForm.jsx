import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaTimes, FaSave, FaImage, FaCloudUploadAlt } from 'react-icons/fa';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { Button } from '../ui/Button';

/**
 * @desc Redesigned Modal/Form component for creating or updating a Service (with Dark Mode).
 * Uses the TaskRabbit model: Price is Hourly Rate (₹), Duration is Provider Minimum.
 */
const ServiceForm = ({ serviceId, providerId, onClose, onSuccess }) => {
    const isEditing = !!serviceId;
    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
        defaultValues: {
            isActive: true, // Default new services to active
            imageUrl: '',
        }
    });
    const [categories, setCategories] = useState([]);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [imageFile, setImageFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'

    // Define reusable Tailwind classes
    const labelClass = "block text-sm font-semibold text-foreground mb-2";
    const inputClass = "w-full border border-input bg-background text-foreground rounded-lg shadow-sm text-sm p-2.5 focus:ring-2 focus:ring-primary focus:border-primary";
    const errorClass = "mt-1 text-sm text-destructive";

    // Fetch categories and (if editing) service data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingInitial(true);

                // 1. Fetch Categories from the API
                const categoryRes = await coreApi.getCategories();
                setCategories(categoryRes.data.data);

                // 2. If editing, fetch the service data
                if (isEditing) {
                    const res = await coreApi.getServiceDetails(serviceId);
                    const service = res.data.data;

                    // Populate the form with current service data
                    reset({
                        title: service.title,
                        description: service.description,
                        category: service.category._id || service.category,
                        price: service.price,
                        durationMinutes: service.durationMinutes,
                        isActive: service.isActive,
                        imageUrl: '', // default
                    });

                    if (service.images && service.images.length > 0) {
                        setPreviewUrl(service.images[0].url);
                        setValue('imageUrl', service.images[0].url); // In case they switch to URL mode
                    }
                }
            } catch (error) {
                toast.error('Failed to load form data.');
                onClose();
            } finally {
                setLoadingInitial(false);
            }
        };
        loadData();
    }, [serviceId, isEditing, onClose, reset, setValue]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUrlChange = (e) => {
        const url = e.target.value;
        setValue('imageUrl', url);
        setPreviewUrl(url);
    }

    const onSubmit = async (data) => {
        // Prepare service data
        const serviceData = { ...data, providerId };

        // Handle Image Upload logic
        let finalImageUrl = null;

        if (uploadMode === 'file' && imageFile) {
            try {
                const formData = new FormData();
                formData.append('image', imageFile);

                // Show uploading toast? 
                const loadingToast = toast.loading("Uploading image...");

                const uploadRes = await coreApi.uploadImage(formData);
                toast.dismiss(loadingToast);

                finalImageUrl = uploadRes.data.data.url;
            } catch (err) {
                console.error(err);
                toast.error("Image upload failed. Please try again or use a URL.");
                return;
            }
        } else if (data.imageUrl) {
            // If using URL mode or provided URL
            finalImageUrl = data.imageUrl;
        }

        // Attach image if we found one (either new upload or existing URL kept in the form)
        // If editing and no new image, we might want to keep existing. 
        // Logic: if finalImageUrl is set, use it. if not, backend usually keeps old if not sent?
        // Our backend Service schema: images is an array. Update replaces fields.
        // If we want to KEEP existing image when no change happens:
        // WE need to send it back or handle in backend. 
        // Current Backend `updateService` uses `findByIdAndUpdate` with `req.body`. 
        // If we don't send `images`, it won't overwrite `images` field unless we explicitly set it?
        // Actually, `findByIdAndUpdate` updates fields present in update object.
        // So if we don't send `images`, it stays.
        // BUT if user WANTS to delete image?
        // Let's assume if finalImageUrl is set, we update. 

        if (finalImageUrl) {
            serviceData.images = [{ url: finalImageUrl }];
        } else if (isEditing && previewUrl && !imageFile && !data.imageUrl) {
            // Case: Editing, have a preview (existing image), no new file, URL field empty?
            // If we are in 'file' mode and didn't touch anything, imageFile is null.
            // We should NOT send images array to avoid wiping it, OR send existing.
            // Safest is to NOT send `images` key if no change.
            // But if user cleared it?

            // Simplified: If previewUrl exists and no file/input change, we assume keep it.
            // We won't send 'images' key.
        }

        // Clean up temporary fields
        delete serviceData.imageUrl;

        try {
            if (isEditing) {
                await coreApi.updateService(serviceId, serviceData);
                toast.success('Service updated successfully!');
            } else {
                await coreApi.createService(serviceData);
                toast.success('New service created successfully!');
            }
            onSuccess(); // This will close the modal and refresh the list
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${isEditing ? 'update' : 'create'} service.`);
        }
    };

    // Loading state for the modal itself
    if (loadingInitial) {
        return (
            <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <p className='text-foreground text-xl'>Loading form...</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            {/* Modal Container */}
            <div className="bg-card dark:bg-card rounded-xl shadow-2xl max-w-2xl w-full transform transition-all border border-border flex flex-col max-h-[90vh]">

                {/* Modal Header */}
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                    <h2 className="text-2xl font-bold text-foreground">
                        {isEditing ? 'Edit Service' : 'Create New Service'}
                    </h2>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors duration-300">
                        <FaTimes className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Modal Body */}
                    <div className="p-6 space-y-4 flex-1 overflow-y-auto max-h-[60vh]">

                        {/* Image Upload Section */}
                        <div className="space-y-3">
                            <label className={labelClass}>Service Image</label>

                            <div className="flex gap-4 mb-2">
                                <button type="button" onClick={() => setUploadMode('file')} className={`text-xs px-3 py-1 rounded-full border ${uploadMode === 'file' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border'}`}>
                                    Upload File
                                </button>
                                <button type="button" onClick={() => setUploadMode('url')} className={`text-xs px-3 py-1 rounded-full border ${uploadMode === 'url' ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground border-border'}`}>
                                    Image URL
                                </button>
                            </div>

                            <div className="flex gap-4 items-start">
                                {/* Preview */}
                                <div className="w-24 h-24 bg-secondary rounded-lg border border-border overflow-hidden flex-shrink-0 flex items-center justify-center">
                                    {previewUrl ? (
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <FaImage className="text-muted-foreground text-3xl opacity-20" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    {uploadMode === 'file' ? (
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="block w-full text-sm text-muted-foreground
                                                file:mr-4 file:py-2 file:px-4
                                                file:rounded-full file:border-0
                                                file:text-sm file:font-semibold
                                                file:bg-primary/10 file:text-primary
                                                hover:file:bg-primary/20
                                              "
                                            />
                                            <p className="mt-1 text-xs text-muted-foreground">Recommended: 500x300px, JPG/PNG</p>
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="text"
                                                placeholder="https://example.com/image.jpg"
                                                className={inputClass}
                                                {...register('imageUrl')}
                                                onChange={handleUrlChange}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <div>
                            <label htmlFor="title" className={labelClass}>Service Title</label>
                            <input
                                id="title"
                                type="text"
                                className={inputClass}
                                placeholder="e.g., Emergency Drain Unclogging"
                                {...register('title', { required: 'Title is required' })}
                            />
                            {errors.title && <p className={errorClass}>{errors.title.message}</p>}
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className={labelClass}>Description</label>
                            <textarea
                                id="description"
                                rows="3"
                                className={inputClass}
                                placeholder="Detailed description of the service..."
                                {...register('description', { required: 'Description is required' })}
                            ></textarea>
                            {errors.description && <p className={errorClass}>{errors.description.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Category */}
                            <div>
                                <label htmlFor="category" className={labelClass}>Category</label>
                                <select
                                    id="category"
                                    className={inputClass}
                                    {...register('category', { required: 'Category is required' })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                                {errors.category && <p className={errorClass}>{errors.category.message}</p>}
                            </div>

                            {/* Price (Service Price) */}
                            <div>
                                <label htmlFor="price" className={labelClass}>Service Price (₹)</label>
                                <input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className={inputClass}
                                    placeholder="e.g., 500.00"
                                    {...register('price', { required: 'Service Price is required', valueAsNumber: true })}
                                />
                                {errors.price && <p className={errorClass}>{errors.price.message}</p>}
                            </div>

                            {/* Duration (Minimum Minutes) */}
                            <div>
                                <label htmlFor="durationMinutes" className={labelClass}>Predicted Completion Time (Minutes)</label>
                                <input
                                    id="durationMinutes"
                                    type="number"
                                    min="30" // Minimum duration should align with your booking interval
                                    step="1"
                                    className={inputClass}
                                    placeholder="e.g., 60 (Minimum one hour)"
                                    {...register('durationMinutes', {
                                        required: 'Duration is required',
                                        valueAsNumber: true,
                                        min: { value: 30, message: "Minimum duration must be 30 minutes." }
                                    })}
                                />
                                <p className='mt-1 text-xs text-muted-foreground'>
                                    This sets the minimum time customers must book this service for.
                                </p>
                                {errors.durationMinutes && <p className={errorClass}>{errors.durationMinutes.message}</p>}
                            </div>
                        </div>

                        {/* Active Status */}
                        <div className="flex items-center pt-2">
                            <input
                                id="isActive"
                                type="checkbox"
                                className="h-4 w-4 text-primary border-input rounded focus:ring-primary"
                                {...register('isActive')}
                            />
                            <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-foreground">
                                Service is Active (Visible to customers)
                            </label>
                        </div>

                    </div>

                    {/* Modal Footer */}
                    <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : <><FaSave className='mr-2' /> {isEditing ? 'Save Changes' : 'Create Service'}</>}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ServiceForm;