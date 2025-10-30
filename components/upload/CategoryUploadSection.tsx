'use client';

import { useState } from 'react';
import { school_report_images_createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface ExistingImage {
  id: string;
  category_id: string;
  storage_path: string;
  filename: string;
  created_at: string;
}

interface Props {
  category: Category;
  existingImages: ExistingImage[];
  schoolCode: string;
  userId: string;
  userEmail: string;
  onImageUploaded: (image: ExistingImage) => void;
  onImageDeleted: (imageId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function CategoryUploadSection({
  category,
  existingImages,
  schoolCode,
  userId,
  userEmail,
  onImageUploaded,
  onImageDeleted,
  isExpanded,
  onToggle,
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [imageToDelete, setImageToDelete] = useState<ExistingImage | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const MAX_IMAGES = 4;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const canUploadMore = existingImages.length < MAX_IMAGES;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WEBP images are allowed');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size must be less than 5MB');
      return;
    }

    // Check if limit reached
    if (!canUploadMore) {
      setError('Maximum of 4 images per category');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const supabase = school_report_images_createClient();

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storagePath = `${schoolCode}/${category.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('school-report-images')
        .upload(storagePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Insert metadata into database
      const { data, error: dbError } = await supabase
        .from('school_report_images_uploaded_images')
        .insert({
          school_code: schoolCode,
          category_id: category.id,
          storage_path: storagePath,
          filename: file.name,
          uploaded_by_email: userEmail,
          uploaded_by_user_id: userId,
        })
        .select()
        .single();

      if (dbError) {
        // If DB insert fails, delete the uploaded file
        await supabase.storage.from('school-report-images').remove([storagePath]);
        throw dbError;
      }

      onImageUploaded(data);
      e.target.value = ''; // Reset file input
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (image: ExistingImage) => {
    setImageToDelete(image);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!imageToDelete) return;

    setDeleting(imageToDelete.id);
    setError(null);

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

      onImageDeleted(imageToDelete.id);
      setShowDeleteDialog(false);
      setImageToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setDeleting(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setImageToDelete(null);
  };

  const getImageUrl = (storagePath: string) => {
    const supabase = school_report_images_createClient();
    const { data } = supabase.storage
      .from('school-report-images')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${!isExpanded ? 'h-full' : ''}`}>
      {/* Header - Always visible, clickable to toggle */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-start justify-between hover:bg-gray-50 transition-colors text-left ${!isExpanded ? 'h-full' : 'rounded-t-lg'}`}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {category.name}
            </h3>
            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
              existingImages.length === MAX_IMAGES
                ? 'bg-green-100 text-green-700'
                : existingImages.length > 0
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {existingImages.length}/{MAX_IMAGES}
            </span>
          </div>
          {category.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{category.description}</p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 mt-0.5 ${isExpanded ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {existingImages.map((image) => (
              <div key={image.id} className="relative group aspect-square">
                <Image
                  src={getImageUrl(image.storage_path)}
                  alt={image.filename}
                  fill
                  className="object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeleteClick(image)}
                  disabled={deleting === image.id}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  aria-label="Delete image"
                >
                  {deleting === image.id ? (
                    <span className="block w-4 h-4">...</span>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="truncate">{image.filename}</p>
                </div>
              </div>
            ))}

            {/* Upload Slot */}
            {canUploadMore && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
                {uploading ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-sm text-gray-600">Upload Image</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP</p>
                  </div>
                )}
              </label>
            )}

            {/* Empty slots */}
            {Array.from({ length: MAX_IMAGES - existingImages.length - (canUploadMore ? 1 : 0) }).map((_, i) => (
              <div key={i} className="aspect-square border-2 border-dashed border-gray-200 rounded-lg bg-gray-50"></div>
            ))}
          </div>

          {!canUploadMore && (
            <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3 mt-4">
              Maximum images reached. Delete an image to upload a new one.
            </p>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Image"
        message={`Are you sure you want to delete "${imageToDelete?.filename}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleting !== null}
      />
    </div>
  );
}
