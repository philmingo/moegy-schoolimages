'use client';

import { useState, useCallback } from 'react';
import { school_report_images_createClient } from '@/lib/supabase/client';
import Image from 'next/image';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ImageModal from '@/components/gallery/ImageModal';

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
  comment: string | null;
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
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const MAX_IMAGES = 4;
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const canUploadMore = existingImages.length < MAX_IMAGES;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setError(null);
    setPendingFile(file);
    setComment('');
    e.target.value = ''; // Reset file input
  };

  const handleCancelPending = () => {
    setPendingFile(null);
    setComment('');
  };

  const handleUpload = async () => {
    if (!pendingFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('school_code', schoolCode);
      formData.append('category_id', category.id);
      formData.append('filename', pendingFile.name);
      if (comment.trim()) {
        formData.append('comment', comment.trim());
      }

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to upload image');
      }

      const data = await res.json();

      onImageUploaded(data);
      setPendingFile(null);
      setComment('');
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
      const res = await fetch('/api/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_id: imageToDelete.id,
          storage_path: imageToDelete.storage_path,
        }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || 'Failed to delete image');
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

  const openModal = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  }, []);

  const goToPreviousImage = useCallback(() => {
    setSelectedImageIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

  const goToNextImage = useCallback(() => {
    setSelectedImageIndex((prev) =>
      prev !== null && prev < existingImages.length - 1 ? prev + 1 : prev
    );
  }, [existingImages.length]);

  const getImageUrl = (storagePath: string) => {
    const supabase = school_report_images_createClient();
    const { data } = supabase.storage
      .from('school-report-images')
      .getPublicUrl(storagePath);
    return data.publicUrl;
  };

  const getCategoryIcon = () => {
    const name = category.name.toLowerCase();
    const baseIconClass = "w-5 h-5 flex-shrink-0";

    // Walls - Painting (Purple)
    if (name.includes('painting')) {
      return <svg className={`${baseIconClass} text-purple-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
    }
    // Walls - Cleaning (Cyan)
    if (name.includes('cleaning') || name.includes('unclean')) {
      return <svg className={`${baseIconClass} text-cyan-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>;
    }
    // Walls - Damage/Holes/Cracks (Red)
    if (name.includes('holes') || name.includes('damage') || name.includes('cracks')) {
      return <svg className={`${baseIconClass} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    }

    // Roofs (Brown)
    if (name.includes('roof') || name.includes('gutter')) {
      return <svg className={`${baseIconClass} text-amber-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    }

    // Ceilings (Slate)
    if (name.includes('ceiling')) {
      return <svg className={`${baseIconClass} text-slate-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;
    }

    // Stairs (Indigo)
    if (name.includes('stair') || name.includes('rail')) {
      return <svg className={`${baseIconClass} text-indigo-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>;
    }

    // Floors (Stone)
    if (name.includes('floor')) {
      return <svg className={`${baseIconClass} text-stone-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>;
    }

    // Windows (Sky)
    if (name.includes('window')) {
      return <svg className={`${baseIconClass} text-sky-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>;
    }

    // Doors (Orange)
    if (name.includes('door') || name.includes('lock')) {
      return <svg className={`${baseIconClass} text-orange-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>;
    }

    // Pest (Pink) - Bug icon
    if (name.includes('pest') || name.includes('infestation')) {
      return <svg className={`${baseIconClass} text-pink-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 11V7a4 4 0 00-8 0v4m-2 0h12m-6 5a3 3 0 100-6 3 3 0 000 6zm0 0v5m-3-8l-3-3m6 3l3-3m-9 11l3-3m3 3l3 3" /></svg>;
    }

    // Science Labs (Teal)
    if (name.includes('science')) {
      return <svg className={`${baseIconClass} text-teal-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>;
    }

    // Home Economics Labs (Rose) - Utensils/Cooking
    if (name.includes('home economics')) {
      return <svg className={`${baseIconClass} text-rose-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    }

    // IT Labs (Blue)
    if (name.includes('it lab')) {
      return <svg className={`${baseIconClass} text-blue-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
    }

    // Technical Labs/Workshops (Violet)
    if (name.includes('technical') || name.includes('workshop')) {
      return <svg className={`${baseIconClass} text-violet-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
    }

    // Blackboards/Chalkboards (Emerald)
    if (name.includes('blackboard') || name.includes('chalkboard')) {
      return <svg className={`${baseIconClass} text-emerald-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>;
    }

    // Furniture (Lime)
    if (name.includes('furniture')) {
      return <svg className={`${baseIconClass} text-lime-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
    }

    // Washrooms (Fuchsia) - User icon for restroom
    if (name.includes('washroom')) {
      return <svg className={`${baseIconClass} text-fuchsia-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
    }

    // Plumbing - Taps/Pipes/Water/Sewerage/Drains (Blue)
    if (name.includes('tap') || name.includes('pipe') || name.includes('water') || name.includes('sewerage') || name.includes('drain')) {
      return <svg className={`${baseIconClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10h18M3 14h18M3 18a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zM10 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM10 18a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3zM17 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1V4zM17 18a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-3z" /></svg>;
    }

    // Electrical (Yellow)
    if (name.includes('electrical') || name.includes('switch') || name.includes('outlet') || name.includes('light')) {
      return <svg className={`${baseIconClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    }

    // Fence (Green)
    if (name.includes('fence')) {
      return <svg className={`${baseIconClass} text-green-700`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7H4V5zM10 5a1 1 0 011-1h2a1 1 0 011 1v7h-4V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7h-6V5zM4 12h16M6 19v-7M10 19v-7M14 19v-7M18 19v-7" /></svg>;
    }

    // Compound - Levelling (Amber)
    if (name.includes('levelling')) {
      return <svg className={`${baseIconClass} text-amber-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>;
    }

    // Compound - Pruning / Vegetation (Green) - Plant/Leaf icon
    if (name.includes('pruning') || name.includes('vegetation')) {
      return <svg className={`${baseIconClass} text-green-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }

    // Compound - Remove Items (Red)
    if (name.includes('remove items')) {
      return <svg className={`${baseIconClass} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
    }

    // Other (Gray)
    return <svg className={`${baseIconClass} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>;
  };

  return (
    <div className={`bg-white rounded-xl border border-slate-200 transition-shadow ${!isExpanded ? 'h-full hover:shadow-md' : 'shadow-sm'}`}>
      {/* Header - Always visible, clickable to toggle */}
      <button
        onClick={onToggle}
        className={`w-full px-4 py-3 flex items-start justify-between hover:bg-slate-50 transition-colors text-left ${!isExpanded ? 'h-full' : 'rounded-t-xl'}`}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="flex items-center gap-2 mb-1">
            {getCategoryIcon()}
            <h3 className="text-sm font-semibold text-slate-900 truncate">
              {category.name}
            </h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 font-medium border ${
              existingImages.length === MAX_IMAGES
                ? 'border-green-200 bg-green-50 text-green-700'
                : existingImages.length > 0
                ? 'border-blue-200 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}>
              {existingImages.length}/{MAX_IMAGES}
            </span>
          </div>
          {category.description && (
            <p className="text-xs text-slate-500 line-clamp-2">{category.description}</p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 mt-0.5 ${isExpanded ? 'transform rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-slate-100">
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {existingImages.map((image, index) => (
              <div key={image.id} className="flex flex-col">
                <div
                  className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => openModal(index)}
                >
                  <Image
                    src={getImageUrl(image.storage_path)}
                    alt={image.filename}
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(image);
                    }}
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
                </div>
                <div className="mt-1.5 min-w-0">
                  <p className="text-xs text-slate-700 truncate" title={image.filename}>{image.filename}</p>
                  {image.comment && (
                    <p className="text-xs text-slate-500 truncate italic" title={image.comment}>{image.comment}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Pending File Preview with Comment */}
            {pendingFile && (
              <div className="col-span-2 md:col-span-4 border border-blue-300 bg-blue-50 rounded-lg p-4">
                <div className="flex gap-4 items-start">
                  <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={URL.createObjectURL(pendingFile)}
                      alt={pendingFile.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{pendingFile.name}</p>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Add a comment (optional)"
                      rows={2}
                      className="mt-2 w-full px-3 py-2 text-sm bg-white text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400 resize-none"
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleUpload}
                        disabled={uploading}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center gap-2"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Uploading...
                          </>
                        ) : (
                          'Upload'
                        )}
                      </button>
                      <button
                        onClick={handleCancelPending}
                        disabled={uploading}
                        className="px-4 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Upload Slot */}
            {canUploadMore && !pendingFile && (
              <label className="aspect-square border-2 border-dashed border-slate-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center justify-center">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="text-center p-4">
                  <svg className="w-8 h-8 text-slate-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm text-slate-600">Upload Image</p>
                  <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</p>
                </div>
              </label>
            )}

            {/* Empty slots */}
            {Array.from({ length: Math.max(0, MAX_IMAGES - existingImages.length - (canUploadMore && !pendingFile ? 1 : 0)) }).map((_, i) => (
              <div key={i} className="aspect-square border-2 border-dashed border-slate-200 rounded-lg bg-slate-50"></div>
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

      {/* Image Preview Modal */}
      {selectedImageIndex !== null && existingImages[selectedImageIndex] && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={closeModal}
          imageUrl={getImageUrl(existingImages[selectedImageIndex].storage_path)}
          imageName={existingImages[selectedImageIndex].filename}
          categoryName={category.name}
          uploadDate={existingImages[selectedImageIndex].created_at}
          comment={existingImages[selectedImageIndex].comment}
          onPrevious={goToPreviousImage}
          onNext={goToNextImage}
          hasPrevious={selectedImageIndex > 0}
          hasNext={selectedImageIndex < existingImages.length - 1}
        />
      )}
    </div>
  );
}
