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

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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
              isExpanded={isExpanded}
              onToggle={() => toggleCategory(category.id)}
            />
          </div>
        );
      })}

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">
            No categories available. Please contact an administrator.
          </p>
        </div>
      )}
    </div>
  );
}
