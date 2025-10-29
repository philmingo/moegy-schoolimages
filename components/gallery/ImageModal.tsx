'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  imageName: string;
  categoryName: string;
  uploadDate: string;
  schoolName?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export default function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  imageName,
  categoryName,
  uploadDate,
  schoolName,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: ImageModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) onPrevious();
      if (e.key === 'ArrowRight' && hasNext && onNext) onNext();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, hasPrevious, hasNext, onPrevious, onNext]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-50"
        aria-label="Close"
      >
        <X size={32} />
      </button>

      {/* Previous button */}
      {hasPrevious && onPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full p-2"
          aria-label="Previous image"
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* Next button */}
      {hasNext && onNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-50 bg-black bg-opacity-50 rounded-full p-2"
          aria-label="Next image"
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* Image container */}
      <div
        className="max-w-7xl max-h-[90vh] w-full mx-4 flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative flex items-center justify-center mb-4">
          <div className="relative max-w-full max-h-[75vh]">
            <Image
              src={imageUrl}
              alt={imageName}
              width={1200}
              height={800}
              className="object-contain max-h-[75vh] w-auto"
              unoptimized
            />
          </div>
        </div>

        {/* Image info */}
        <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 text-white flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <span className="text-gray-300 text-sm">Filename:</span>
              <p className="font-medium break-words">{imageName}</p>
            </div>
            <div>
              <span className="text-gray-300 text-sm">Category:</span>
              <p className="font-medium break-words">{categoryName}</p>
            </div>
            {schoolName && (
              <div>
                <span className="text-gray-300 text-sm">School:</span>
                <p className="font-medium break-words">{schoolName}</p>
              </div>
            )}
            <div>
              <span className="text-gray-300 text-sm">Upload Date:</span>
              <p className="font-medium">{new Date(uploadDate).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop click to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close modal"
      />
    </div>
  );
}
