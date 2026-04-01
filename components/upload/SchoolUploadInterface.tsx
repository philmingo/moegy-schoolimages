'use client';

import { useState } from 'react';
import CategoryUploadSection from './CategoryUploadSection';

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

interface ExistingImage {
  id: string;
  category_id: string;
  storage_path: string;
  filename: string;
  comment: string | null;
  created_at: string;
}

interface Props {
  categories: Category[];
  existingImages: ExistingImage[];
  schoolCode: string;
  userId: string;
  userEmail: string;
}

export default function SchoolUploadInterface({
  categories,
  existingImages,
  schoolCode,
  userId,
  userEmail,
}: Props) {
  const [images, setImages] = useState<ExistingImage[]>(existingImages);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleImageUploaded = (newImage: ExistingImage) => {
    setImages([...images, newImage]);
  };

  const handleImageDeleted = (imageId: string) => {
    setImages(images.filter((img) => img.id !== imageId));
  };

  const handleImageUpdated = (updatedImage: ExistingImage) => {
    setImages(images.map((img) => img.id === updatedImage.id ? updatedImage : img));
  };

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const totalUploaded = images.length;
  const totalPossible = categories.length * 4;
  const categoriesWithImages = new Set(images.map((img) => img.category_id)).size;
  const progressPercent = totalPossible > 0 ? Math.round((totalUploaded / totalPossible) * 100) : 0;

  return (
    <div>
      {/* Progress Summary */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Upload Progress</h3>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-slate-600 mt-2">
            {totalUploaded} of {totalPossible} images uploaded across {categoriesWithImages} categor{categoriesWithImages === 1 ? 'y' : 'ies'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {categories.map((category) => {
        const categoryImages = images.filter(
          (img) => img.category_id === category.id
        );
        const isExpanded = expandedCategories.has(category.id);

        return (
          <div
            key={category.id}
            className={isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}
          >
            <CategoryUploadSection
              category={category}
              existingImages={categoryImages}
              schoolCode={schoolCode}
              userId={userId}
              userEmail={userEmail}
              onImageUploaded={handleImageUploaded}
              onImageDeleted={handleImageDeleted}
              onImageUpdated={handleImageUpdated}
              isExpanded={isExpanded}
              onToggle={() => toggleCategory(category.id)}
            />
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-slate-500">
            No categories available. Please contact an administrator.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
