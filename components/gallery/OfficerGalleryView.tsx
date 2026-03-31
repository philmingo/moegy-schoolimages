'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { school_report_images_createClient } from '@/lib/supabase/client';
import ImageModal from './ImageModal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

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

interface SchoolData {
  name: string;
  region: Region | null;
  schoolLevel: SchoolLevel | null;
}

interface Props {
  images: ImageData[];
  categories: Category[];
  schoolMap: Map<string, string>;
  schoolDataMap?: Map<string, SchoolData>;
  regions?: Region[];
  schoolLevels?: SchoolLevel[];
  userRole?: 'officer' | 'admin';
}

const IMAGES_PER_PAGE = 24;

export default function OfficerGalleryView({
  images,
  categories,
  schoolMap,
  schoolDataMap,
  regions = [],
  schoolLevels = [],
  userRole = 'officer'
}: Props) {
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedSchoolLevel, setSelectedSchoolLevel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [imageToDelete, setImageToDelete] = useState<ImageData | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [localImages, setLocalImages] = useState<ImageData[]>(images);

  const schoolCodes = Array.from(schoolMap.keys()).sort();

  // Update local images when prop changes
  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: localImages.length };
    localImages.forEach((img) => {
      counts[img.category_id] = (counts[img.category_id] || 0) + 1;
    });
    return counts;
  }, [localImages]);

  // Filter images based on active tab and filters
  const filteredImages = useMemo(() => {
    return localImages.filter((img) => {
      const matchesCategory = activeTab === 'all' || img.category_id === activeTab;
      const matchesSchool = selectedSchool === 'all' || img.school_code === selectedSchool;

      // Region and school level filtering
      const schoolData = schoolDataMap?.get(img.school_code);
      const matchesRegion = selectedRegion === 'all' || schoolData?.region?.id === selectedRegion;
      const matchesSchoolLevel = selectedSchoolLevel === 'all' || schoolData?.schoolLevel?.id === selectedSchoolLevel;

      const matchesSearch = searchQuery === '' ||
        img.school_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (schoolMap.get(img.school_code) || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.filename.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSchool && matchesRegion && matchesSchoolLevel && matchesSearch;
    });
  }, [localImages, activeTab, selectedSchool, selectedRegion, selectedSchoolLevel, searchQuery, schoolMap, schoolDataMap]);

  // Paginate images
  const totalPages = Math.ceil(filteredImages.length / IMAGES_PER_PAGE);
  const paginatedImages = useMemo(() => {
    const startIndex = (currentPage - 1) * IMAGES_PER_PAGE;
    return filteredImages.slice(startIndex, startIndex + IMAGES_PER_PAGE);
  }, [filteredImages, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedSchool, selectedRegion, selectedSchoolLevel, searchQuery]);

  const getImageUrl = (storagePath: string) => {
    const supabase = school_report_images_createClient();
    const { data } = supabase.storage
      .from('school-report-images')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const handleDeleteClick = (image: ImageData, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the image modal
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

  const handleImageClick = (image: ImageData) => {
    const index = filteredImages.findIndex((img) => img.id === image.id);
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < filteredImages.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const selectedImage = selectedImageIndex !== null ? filteredImages[selectedImageIndex] : null;

  return (
    <div>
      {/* Category Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <div className="flex border-b border-gray-200 min-w-max">
            {/* All Categories Tab */}
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                activeTab === 'all'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              All Categories
              <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {categoryCounts.all || 0}
              </span>
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>

            {/* Individual Category Tabs */}
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveTab(category.id)}
                className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors relative ${
                  activeTab === category.id
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {category.name}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  activeTab === category.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {categoryCounts[category.id] || 0}
                </span>
                {activeTab === category.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              placeholder="School name, code, or filename..."
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-500"
            />
          </div>

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

          {/* School Filter */}
          <div>
            <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
              Filter by School
            </label>
            <select
              id="school"
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Schools ({schoolCodes.length})</option>
              {schoolCodes.map((code) => (
                <option key={code} value={code}>
                  {code} - {schoolMap.get(code) || 'Unknown'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <p>
            Showing <span className="font-semibold">{filteredImages.length}</span> image{filteredImages.length !== 1 ? 's' : ''}
            {activeTab !== 'all' && (
              <span className="text-gray-500"> in {categories.find(c => c.id === activeTab)?.name}</span>
            )}
          </p>
          {(selectedSchool !== 'all' || selectedRegion !== 'all' || selectedSchoolLevel !== 'all' || searchQuery !== '') && (
            <button
              onClick={() => {
                setSelectedSchool('all');
                setSelectedRegion('all');
                setSelectedSchoolLevel('all');
                setSearchQuery('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Images Grid */}
      {filteredImages.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 text-lg">No images found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          {/* Masonry Grid */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {paginatedImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                  onClick={() => handleImageClick(img)}
                >
                  <Image
                    src={getImageUrl(img.storage_path)}
                    alt={img.filename}
                    fill
                    className="object-cover"
                  />

                  {/* Always visible category badge */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
                    <span className="bg-gray-800 bg-opacity-75 text-white text-[10px] font-medium px-2 py-1 rounded shadow-sm inline-block">
                      {img.category.name}
                    </span>

                    {/* Delete button - only for admins */}
                    {userRole === 'admin' && (
                      <button
                        onClick={(e) => handleDeleteClick(img, e)}
                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md"
                        aria-label="Delete image"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Hover overlay with details */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                      <p className="text-sm font-bold truncate">
                        {schoolMap.get(img.school_code) || 'Unknown School'}
                      </p>
                      <p className="text-xs text-blue-300 font-medium mt-0.5">
                        {img.school_code}
                      </p>
                      <p className="text-xs text-gray-300 truncate mt-1">{img.filename}</p>
                      {img.comment && (
                        <p className="text-xs text-gray-300 truncate mt-0.5 italic">{img.comment}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(img.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-md p-4 mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page <span className="font-semibold">{currentPage}</span> of{' '}
                  <span className="font-semibold">{totalPages}</span>
                  <span className="text-gray-500 ml-2">
                    ({(currentPage - 1) * IMAGES_PER_PAGE + 1}-
                    {Math.min(currentPage * IMAGES_PER_PAGE, filteredImages.length)} of{' '}
                    {filteredImages.length})
                  </span>
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

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
          hasNext={selectedImageIndex !== null && selectedImageIndex < filteredImages.length - 1}
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
