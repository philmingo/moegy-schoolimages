'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { school_report_images_createClient } from '@/lib/supabase/client';
import ImageModal from '../gallery/ImageModal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageData {
  id: string;
  school_code: string;
  category_id: string;
  storage_path: string;
  filename: string;
  comment: string | null;
  uploaded_by_email: string;
  created_at: string;
  category: {
    name: string;
    description: string | null;
  };
}

interface Region {
  id: string;
  name: string;
}

interface SchoolLevel {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface SchoolData {
  name: string;
  region: Region | null;
  schoolLevel: SchoolLevel | null;
}

interface Props {
  images: ImageData[];
  schoolMap: Map<string, string>;
  schoolDataMap?: Map<string, SchoolData>;
  regions?: Region[];
  schoolLevels?: SchoolLevel[];
  categories?: Category[];
  canDelete?: boolean;
}

export default function AdminImageListView({
  images,
  schoolMap,
  schoolDataMap,
  regions = [],
  schoolLevels = [],
  categories = [],
  canDelete = false
}: Props) {
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState<ImageData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<ImageData[]>(images);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSchools, setTotalSchools] = useState(0);
  const [totalImages, setTotalImages] = useState(0);
  const [loading, setLoading] = useState(false);
  const schoolsPerPage = 10;

  // Fetch paginated images by schools
  const fetchImages = async (page: number, categoryId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: schoolsPerPage.toString(),
      });

      if (categoryId !== 'all') {
        params.append('categoryId', categoryId);
      }

      const response = await fetch(`/api/images?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setLocalImages(data.images || []);
      setTotalPages(data.totalPages || 1);
      setTotalSchools(data.totalSchools || 0);
      setTotalImages(data.totalImages || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch images when category filter changes
  useEffect(() => {
    fetchImages(1, selectedCategory);
  }, [selectedCategory]);

  // Update local images when prop changes (initial load)
  useEffect(() => {
    if (images.length > 0) {
      setLocalImages(images);
    }
  }, [images]);

  // Group images by school (category filter already applied server-side)
  const imagesBySchool = useMemo(() => {
    const grouped = new Map<string, ImageData[]>();
    localImages.forEach((img) => {
      const existing = grouped.get(img.school_code) || [];
      grouped.set(img.school_code, [...existing, img]);
    });
    return grouped;
  }, [localImages]);

  // Filter schools based on search, region, and school level
  const filteredSchools = useMemo(() => {
    const schoolCodes = Array.from(imagesBySchool.keys()).sort();

    return schoolCodes.filter((code) => {
      // Search filter
      const schoolName = schoolMap.get(code) || '';
      const matchesSearch = !searchQuery ||
        code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schoolName.toLowerCase().includes(searchQuery.toLowerCase());

      // Region filter
      const schoolData = schoolDataMap?.get(code);
      const matchesRegion = selectedRegion === 'all' || schoolData?.region?.id === selectedRegion;

      // School level filter
      const matchesSchoolLevel = selectedSchoolLevel === 'all' || schoolData?.schoolLevel?.id === selectedSchoolLevel;

      return matchesSearch && matchesRegion && matchesSchoolLevel;
    });
  }, [imagesBySchool, schoolMap, searchQuery, selectedRegion, selectedSchoolLevel, schoolDataMap]);

  const toggleSchool = (schoolCode: string) => {
    const newExpanded = new Set(expandedSchools);
    if (newExpanded.has(schoolCode)) {
      newExpanded.delete(schoolCode);
    } else {
      newExpanded.add(schoolCode);
    }
    setExpandedSchools(newExpanded);
  };

  const expandAll = () => {
    setExpandedSchools(new Set(filteredSchools));
  };

  const collapseAll = () => {
    setExpandedSchools(new Set());
  };

  const getImageUrl = (storagePath: string) => {
    const supabase = school_report_images_createClient();
    const { data } = supabase.storage
      .from('school-report-images')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleImageClick = (image: ImageData) => {
    const index = localImages.findIndex((img) => img.id === image.id);
    setSelectedImageIndex(index);
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
    setSelectedImageIndex(null);
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      const newIndex = selectedImageIndex - 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(localImages[newIndex]);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < localImages.length - 1) {
      const newIndex = selectedImageIndex + 1;
      setSelectedImageIndex(newIndex);
      setSelectedImage(localImages[newIndex]);
    }
  };

  const handleDeleteClick = (image: ImageData, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the image modal
    e.preventDefault();
    setImageToDelete(image);
    setShowDeleteDialog(true);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const supabase = school_report_images_createClient();

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('school-report-images')
        .remove([imageToDelete.storage_path]);

      if (storageError) {
        throw storageError;
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('school_report_images_uploaded_images')
        .delete()
        .eq('id', imageToDelete.id);

      if (dbError) {
        throw dbError;
      }

      // Remove from local state
      setLocalImages((prev) => prev.filter((img) => img.id !== imageToDelete.id));
      setShowDeleteDialog(false);
      setImageToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete image');
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setImageToDelete(null);
    setDeleteError(null);
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Images by School
            <span className="ml-2 text-sm font-normal text-gray-600">
              ({filteredSchools.length} school{filteredSchools.length !== 1 ? 's' : ''})
            </span>
          </h2>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="School name or code..."
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
            />
          </div>

          {/* Category Filter */}
          {categories.length > 0 && (
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Region Filter */}
          {regions.length > 0 && (
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Region
              </label>
              <select
                id="region"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions ({regions.length})</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* School Level Filter */}
          {schoolLevels.length > 0 && (
            <div>
              <label htmlFor="schoolLevel" className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Level
              </label>
              <select
                id="schoolLevel"
                value={selectedSchoolLevel}
                onChange={(e) => setSelectedSchoolLevel(e.target.value)}
                className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Levels ({schoolLevels.length})</option>
                {schoolLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Clear Filters Button */}
        {(selectedCategory !== 'all' || selectedRegion !== 'all' || selectedSchoolLevel !== 'all' || searchQuery !== '') && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedRegion('all');
                setSelectedSchoolLevel('all');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* School List */}
      <div className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSchools.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No schools found</p>
        ) : (
          <div className="space-y-3">
            {filteredSchools.map((schoolCode) => {
              const schoolImages = imagesBySchool.get(schoolCode) || [];
              const isExpanded = expandedSchools.has(schoolCode);

              return (
                <div key={schoolCode} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* School Header */}
                  <div
                    className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleSchool(schoolCode)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {schoolMap.get(schoolCode) || 'Unknown School'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-600">{schoolCode}</p>
                          {schoolDataMap?.get(schoolCode)?.region && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                                {schoolDataMap.get(schoolCode)?.region?.name}
                              </span>
                            </>
                          )}
                          {schoolDataMap?.get(schoolCode)?.schoolLevel && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                {schoolDataMap.get(schoolCode)?.schoolLevel?.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                      {schoolImages.length} {schoolImages.length === 1 ? 'image' : 'images'}
                    </span>
                  </div>

                  {/* Images Grid */}
                  {isExpanded && (
                    <div className="p-4 bg-white">
                      {schoolImages.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No images</p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {schoolImages.map((img) => (
                            <div
                              key={img.id}
                              className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                            >
                              <div
                                className="absolute inset-0 cursor-pointer"
                                onClick={() => handleImageClick(img)}
                              >
                                <Image
                                  src={getImageUrl(img.storage_path)}
                                  alt={img.filename}
                                  fill
                                  className="object-cover"
                                />
                              </div>

                              {/* Category Badge and Delete Button */}
                              <div className="absolute top-2 left-2 right-2 flex justify-between items-start z-10">
                                <span className="bg-gray-800 bg-opacity-75 text-white text-[10px] font-medium px-2 py-1 rounded shadow-sm inline-block truncate max-w-[70%] pointer-events-none">
                                  {img.category.name}
                                </span>
                                {/* Delete button - only show if user has permission */}
                                {canDelete && (
                                  <button
                                    onClick={(e) => handleDeleteClick(img, e)}
                                    className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md z-20"
                                    aria-label="Delete image"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>

                              {/* Hover Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-5">
                                <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
                                  <p className="text-xs truncate">{img.filename}</p>
                                  {img.comment && (
                                    <p className="text-xs text-gray-300 truncate mt-0.5 italic">{img.comment}</p>
                                  )}
                                  <p className="text-xs text-gray-300 mt-1">
                                    {new Date(img.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <span className="text-gray-400">•</span>
              <span>{totalSchools} school{totalSchools !== 1 ? 's' : ''}</span>
              <span className="text-gray-400">•</span>
              <span>{totalImages} image{totalImages !== 1 ? 's' : ''} on this page</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchImages(currentPage - 1, selectedCategory)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;

                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchImages(pageNum, selectedCategory)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => fetchImages(currentPage + 1, selectedCategory)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white flex items-center gap-1"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          imageUrl={getImageUrl(selectedImage.storage_path)}
          imageName={selectedImage.filename}
          categoryName={selectedImage.category.name}
          uploadDate={selectedImage.created_at}
          schoolName={schoolMap.get(selectedImage.school_code)}
          comment={selectedImage.comment}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
          hasPrevious={selectedImageIndex !== null && selectedImageIndex > 0}
          hasNext={selectedImageIndex !== null && selectedImageIndex < localImages.length - 1}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Image"
        message={`Are you sure you want to delete this image from ${schoolMap.get(imageToDelete?.school_code || '')}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting}
      />

      {/* Delete Error Message */}
      {deleteError && (
        <div className="fixed bottom-4 right-4 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4 z-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Failed to delete image</h3>
              <p className="text-sm text-red-700 mt-1">{deleteError}</p>
            </div>
            <button
              onClick={() => setDeleteError(null)}
              className="flex-shrink-0 text-red-600 hover:text-red-800"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
