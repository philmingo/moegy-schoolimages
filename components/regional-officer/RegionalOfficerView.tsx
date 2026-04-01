'use client';

import { useState, useMemo } from 'react';
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

  const filteredSchools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((school) =>
      school.name.toLowerCase().includes(q) ||
      school.code.toLowerCase().includes(q)
    );
  }, [schools, searchQuery]);

  const selectedSchoolData = schools.find((s) => s.code === selectedSchool);
  const schoolImages = images.filter((img) => img.school_code === selectedSchool);

  const handleImageUploaded = (newImage: { id: string; category_id: string; storage_path: string; filename: string; comment: string | null; created_at: string }) => {
    setImages([...images, { ...newImage, school_code: selectedSchool }]);
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

  // Summary: how many images per school
  const schoolImageCounts = new Map<string, number>();
  images.forEach((img) => {
    schoolImageCounts.set(img.school_code, (schoolImageCounts.get(img.school_code) || 0) + 1);
  });

  // Compute how many distinct categories have at least 1 image for each school
  const categoriesWithImagesForSchool = useMemo(() => {
    const map = new Map<string, number>();
    const seen = new Map<string, Set<string>>();
    images.forEach((img) => {
      if (!seen.has(img.school_code)) {
        seen.set(img.school_code, new Set());
      }
      seen.get(img.school_code)!.add(img.category_id);
    });
    seen.forEach((categorySet, schoolCode) => {
      map.set(schoolCode, categorySet.size);
    });
    return map;
  }, [images]);

  const totalCategories = categories.length;

  // Progress pill helper
  const getProgressPill = (schoolCode: string) => {
    const filled = categoriesWithImagesForSchool.get(schoolCode) || 0;
    if (filled === 0) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">
          0/{totalCategories}
        </span>
      );
    }
    if (filled >= totalCategories) {
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">
          {filled}/{totalCategories}
        </span>
      );
    }
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
        {filled}/{totalCategories}
      </span>
    );
  };

  // Mobile select label
  const getMobileLabel = (school: School) => {
    const filled = categoriesWithImagesForSchool.get(school.code) || 0;
    return `${school.name} (${school.code}) - ${filled}/${totalCategories}`;
  };

  return (
    <div className="flex gap-6 items-start">
      {/* Mobile school selector - visible below md */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 shadow-sm px-4 py-3">
        <label htmlFor="mobile-school-select" className="block text-xs font-medium text-slate-500 mb-1">
          Select School
        </label>
        <select
          id="mobile-school-select"
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="">-- Choose a school --</option>
          {schools.map((school) => (
            <option key={school.code} value={school.code}>
              {getMobileLabel(school)}
            </option>
          ))}
        </select>
      </div>

      {/* Spacer for fixed mobile header */}
      <div className="md:hidden h-20 w-full flex-shrink-0" />

      {/* Left sidebar - hidden on mobile, sticky on md+ */}
      <aside className="hidden md:block w-72 flex-shrink-0 sticky top-20">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">
            Schools in {regionName}
          </h2>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schools..."
            className="w-full px-3 py-2 bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 text-sm mb-3"
          />

          <div className="overflow-y-auto max-h-[calc(100vh-200px)] -mx-1 px-1 space-y-1">
            {filteredSchools.map((school, index) => {
              const isSelected = selectedSchool === school.code;

              return (
                <button
                  key={`${school.code}-${index}`}
                  onClick={() => setSelectedSchool(school.code)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                    {school.name}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-slate-500">{school.code}</p>
                    {getProgressPill(school.code)}
                  </div>
                </button>
              );
            })}

            {filteredSchools.length === 0 && (
              <p className="text-slate-500 text-center py-4 text-sm">No schools match your search</p>
            )}
          </div>
        </div>
      </aside>

      {/* Right column - main content */}
      <main className="flex-1 min-w-0">
        {selectedSchoolData ? (
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">
                Uploading for: {selectedSchoolData.name}
              </h2>
              <p className="text-slate-500 text-sm">
                School Code: {selectedSchoolData.code} — Upload up to 4 images per category
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-slate-500 text-lg">Select a school to start uploading</p>
            <p className="text-slate-400 text-sm mt-1">
              You can upload images on behalf of any school in {regionName}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
