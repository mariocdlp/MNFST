"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { useSurveyStore } from "@/lib/store";

export function PhotoUpload() {
  const { uploadedPhotos, addPhoto, removePhoto } = useSurveyStore();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const remaining = 6 - uploadedPhotos.length;
      acceptedFiles.slice(0, remaining).forEach((file) => addPhoto(file));
    },
    [uploadedPhotos.length, addPhoto]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 6 - uploadedPhotos.length,
    disabled: uploadedPhotos.length >= 6,
  });

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Upload 3-6 photos of yourself
      </label>

      {/* Upload zone */}
      {uploadedPhotos.length < 6 && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all
            ${isDragActive ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}
          `}
        >
          <input {...getInputProps()} />
          <svg className="w-8 h-8 mx-auto text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-muted">
            {isDragActive ? "Drop photos here" : "Drag photos here or click to browse"}
          </p>
          <p className="text-xs text-muted/60 mt-1">
            {uploadedPhotos.length}/6 photos &middot; JPG, PNG, WebP &middot; Max 10MB each
          </p>
        </div>
      )}

      {/* Photo guidance */}
      <div className="p-3 rounded-xl bg-accent/5 border border-accent/10">
        <p className="text-xs text-muted leading-relaxed">
          <span className="font-medium text-accent">Photo tips:</span> Well-lit, clear face, no sunglasses.
          Include at least one front-facing photo, one at an angle, and one full body if possible.
          These are used to place you inside your own content.
        </p>
      </div>

      {/* Photo grid */}
      <AnimatePresence>
        {uploadedPhotos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 gap-3"
          >
            {uploadedPhotos.map((file, i) => (
              <motion.div
                key={`${file.name}-${i}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="relative aspect-square rounded-xl overflow-hidden bg-surface-light"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(i);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-error/80 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-[10px] text-white">
                  {i === 0 ? "Front" : i === 1 ? "Angle" : i === 2 ? "Full body" : `Photo ${i + 1}`}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
