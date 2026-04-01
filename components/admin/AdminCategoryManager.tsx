'use client';

import { useState } from 'react';
import { school_report_images_createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Props {
  categories: Category[];
}

export default function AdminCategoryManager({ categories: initialCategories }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    display_order: categories.length + 1,
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      display_order: categories.length + 1,
      is_active: true,
    });
    setIsCreating(false);
    setEditingId(null);
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('create');
    setError(null);

    try {
      const supabase = school_report_images_createClient();

      const { data, error: createError } = await supabase
        .from('school_report_images_categories')
        .insert({
          name: formData.name,
          description: formData.description || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
        })
        .select()
        .single();

      if (createError) throw createError;

      setCategories([...categories, data]);
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading('update');
    setError(null);

    try {
      const supabase = school_report_images_createClient();

      const { data, error: updateError } = await supabase
        .from('school_report_images_categories')
        .update({
          name: formData.name,
          description: formData.description || null,
          display_order: formData.display_order,
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId)
        .select()
        .single();

      if (updateError) throw updateError;

      setCategories(categories.map((c) => (c.id === editingId ? data : c)));
      resetForm();
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update category');
    } finally {
      setLoading(null);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      description: category.description || '',
      display_order: category.display_order,
      is_active: category.is_active,
    });
    setIsCreating(false);
  };

  const handleToggleActive = async (category: Category) => {
    setLoading(category.id);

    try {
      const supabase = school_report_images_createClient();

      const { data, error: toggleError } = await supabase
        .from('school_report_images_categories')
        .update({
          is_active: !category.is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', category.id)
        .select()
        .single();

      if (toggleError) throw toggleError;

      setCategories(categories.map((c) => (c.id === category.id ? data : c)));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle category status');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure? This will delete all images in this category.')) {
      return;
    }

    setLoading(categoryId);

    try {
      const supabase = school_report_images_createClient();

      const { error: deleteError } = await supabase
        .from('school_report_images_categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;

      setCategories(categories.filter((c) => c.id !== categoryId));
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete category');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900">Category Management</h2>
          {!isCreating && !editingId && (
            <button
              onClick={() => setIsCreating(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm"
            >
              + New Category
            </button>
          )}
        </div>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="p-6 border-b border-slate-200 bg-blue-50">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            {editingId ? 'Edit Category' : 'Create New Category'}
          </h3>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={editingId ? handleUpdate : handleCreate}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                  Name *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="display_order" className="block text-sm font-medium text-slate-700 mb-1">
                  Display Order
                </label>
                <input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-slate-700">Active (visible to schools)</span>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading !== null}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg font-medium"
              >
                {loading ? 'Saving...' : editingId ? 'Update Category' : 'Create Category'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="p-6">
        {categories.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No categories yet. Create one to get started.</p>
        ) : (
          <div className="space-y-3">
            {categories
              .sort((a, b) => a.display_order - b.display_order)
              .map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{category.name}</h3>
                    <span className="text-xs text-slate-500">#{category.display_order}</span>
                    {!category.is_active && (
                      <span className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded-lg">
                        Inactive
                      </span>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-slate-600 mt-1">{category.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    disabled={loading !== null}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    disabled={loading !== null}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
