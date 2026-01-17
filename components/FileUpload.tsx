import React, { useRef, useState } from 'react';
import { isValidFileType, isValidFileSize, formatFileSize } from '../utils/validation';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string;
  maxFiles?: number;
  maxFileSizeMB?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFilesSelected, 
  acceptedTypes = 'image/*,.pdf,.doc,.docx',
  maxFiles = 10,
  maxFileSizeMB = 10
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setError(null);
    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    Array.from(files).forEach((file, index) => {
      // Check file count limit
      if (selectedFiles.length + validFiles.length >= maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed.`);
        return;
      }
      
      // Check file type
      if (!isValidFileType(file, acceptedTypes)) {
        errors.push(`${file.name}: Invalid file type.`);
        return;
      }
      
      // Check file size
      if (!isValidFileSize(file, maxSizeBytes)) {
        errors.push(`${file.name}: File size exceeds ${maxFileSizeMB}MB limit.`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (errors.length > 0) {
      setError(errors.join(' '));
    }
    
    if (validFiles.length > 0) {
      const updatedFiles = [...selectedFiles, ...validFiles].slice(0, maxFiles);
      setSelectedFiles(updatedFiles);
      onFilesSelected(updatedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`
          border-2 border-dashed rounded-lg p-4 sm:p-6 cursor-pointer transition-all
          ${isDragging 
            ? 'border-[#2563eb] bg-[#EDF5FF]' 
            : 'border-[#E5E5E5] hover:border-[#FFE5A0] hover:bg-[#FFFBEB]'
          }
        `}
        role="button"
        tabIndex={0}
        aria-label="File upload area"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileInputChange}
          className="hidden"
        />
        <div className="text-center">
          <svg
            className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-[#888888]"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="mt-2 text-sm sm:text-base text-[#2C2C2C]">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs sm:text-sm text-[#888888] mt-1">
            Images, PDF, DOC, DOCX (max {maxFiles} files)
          </p>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
      
      {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-white border border-[#E5E5E5] rounded-lg"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                <svg
                  className="h-5 w-5 text-[#888888] shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm text-[#2C2C2C] truncate">{file.name}</span>
                <span className="text-xs text-[#888888] shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(index);
                }}
                className="ml-2 text-[#888888] hover:text-[#2C2C2C] transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;

