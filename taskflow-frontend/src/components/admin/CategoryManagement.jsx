import React, { useState, useEffect } from 'react';
import { coreApi } from '../../api/serviceApi';
import { toast } from 'react-toastify';
import { FaTrash, FaPlus, FaTags } from 'react-icons/fa';
import { Button } from '../../components/ui/Button';

// NOTE: We need to ensure coreApi has methods for categories. 
// If not, we might need to add them or use a generic request here.
// For this task, I'll assume we can add them to serviceApi or fetch directly.
// To follow clean patterns, I'll update serviceApi later or assume it exists.
// Actually, I should check serviceApi first, but I can implement this assuming standard axios calls.
import axiosClient from '../../api/axiosClient';

const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategorySlug, setNewCategorySlug] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await axiosClient.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            toast.error('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post('/categories', {
                name: newCategoryName,
                slug: newCategorySlug
            });
            toast.success('Category created!');
            setNewCategoryName('');
            setNewCategorySlug('');
            fetchCategories();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create category');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await axiosClient.delete(`/categories/${id}`);
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            toast.error('Failed to delete category');
        }
    };

    // Auto-generate slug from name
    const handleNameChange = (e) => {
        const val = e.target.value;
        setNewCategoryName(val);
        setNewCategorySlug(val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''));
    };

    if (loading) return <div>Loading Categories...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <FaPlus className="text-primary" /> Add New Category
                </h3>
                <form onSubmit={handleCreate} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Category Name</label>
                        <input
                            type="text"
                            value={newCategoryName}
                            onChange={handleNameChange}
                            className="w-full p-2 rounded-md border border-input bg-background"
                            required
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-1">Slug (Auto-generated)</label>
                        <input
                            type="text"
                            value={newCategorySlug}
                            onChange={(e) => setNewCategorySlug(e.target.value)}
                            className="w-full p-2 rounded-md border border-input bg-background text-muted-foreground"
                            required
                        />
                    </div>
                    <Button type="submit">Create</Button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((cat) => (
                    <div key={cat._id} className="p-4 border border-border rounded-xl bg-card shadow-sm flex justify-between items-center group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary rounded-lg">
                                <FaTags className="text-primary" />
                            </div>
                            <div>
                                <p className="font-bold">{cat.name}</p>
                                <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(cat._id)}
                            className="text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <FaTrash />
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryManagement;
