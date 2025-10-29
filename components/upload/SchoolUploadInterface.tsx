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

  const handleImageUploaded = (newImage: ExistingImage) => {
    setImages([...images, newImage]);
  };

  const handleImageDeleted = (imageId: string) => {
    setImages(images.filter((img) => img.id !== imageId));
  };

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const categoryImages = images.filter(
          (img) => img.category_id === category.id
        );

        return (
          <CategoryUploadSection
            key={category.id}
            category={category}
            existingImages={categoryImages}
            schoolCode={schoolCode}
            userId={userId}
            userEmail={userEmail}
            onImageUploaded={handleImageUploaded}
            onImageDeleted={handleImageDeleted}
          />
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
