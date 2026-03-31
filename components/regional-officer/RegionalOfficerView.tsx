'use client';

import { useState } from 'react';
import CategoryUploadSection from '@/components/upload/CategoryUploadSection';

interface School {
  code: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
}

interface ExistingImage {
  id: string;
  school_code: string;
  category_id: string;
  storage_path: string;
  filename: string;
  comment: string | null;
  created_at: string;
}

interface Props {
  schools: School[];
  categories: Category[];
  existingImages: ExistingImage[];
  userId: string;
  userEmail: string;
  regionName: string;
}

export default function RegionalOfficerView({
  schools,
  categories,
  existingImages: initialImages,
  userId,
  userEmail,
  regionName,
}: Props) {
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [images, setImages] = useState<ExistingImage[]>(initialImages);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSchools = schools.filter((school) => {
    if (!searchQuery) return true;
    return (
      school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      school.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const selectedSchoolData = schools.find((s) => s.code === selectedSchool);
  const schoolImages = images.filter((img) => img.school_code === selectedSchool);

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

  // Summary: how many images per school
  const schoolImageCounts = new Map<string, number>();
  images.forEach((img) => {
    schoolImageCounts.set(img.school_code, (schoolImageCounts.get(img.school_code) || 0) + 1);
  });

  return (
    <div>
      {/* School Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select a School to Upload For
        </h2>

        <div className="mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schools by name or code..."
            className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          {filteredSchools.map((school) => {
            const imageCount = schoolImageCounts.get(school.code) || 0;
            const isSelected = selectedSchool === school.code;

            return (
              <button
                key={school.code}
                onClick={() => {
                  setSelectedSchool(school.code);
                  setExpandedCategories(new Set());
                }}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                  {school.name}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-500">{school.code}</p>
                  {imageCount > 0 && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      {imageCount} image{imageCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {filteredSchools.length === 0 && (
          <p className="text-gray-500 text-center py-4">No schools match your search</p>
        )}
      </div>

      {/* Upload Interface for Selected School */}
      {selectedSchoolData ? (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Uploading for: {selectedSchoolData.name}
            </h2>
            <p className="text-gray-600 text-sm">
              School Code: {selectedSchoolData.code} — Upload up to 4 images per category
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => {
              const categoryImages = schoolImages.filter(
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
                    schoolCode={selectedSchoolData.code}
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
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-500 text-lg">Select a school above to start uploading</p>
          <p className="text-gray-400 text-sm mt-1">
            You can upload images on behalf of any school in {regionName}
          </p>
        </div>
      )}
    </div>
  );
}
