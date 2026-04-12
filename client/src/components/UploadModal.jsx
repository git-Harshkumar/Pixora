import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Image, Upload } from 'lucide-react'

const UploadModal = ({ file, preview, onFileChange, onClose }) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      const f = acceptedFiles[0]
      if (f) onFileChange(f, URL.createObjectURL(f))
    },
    [onFileChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-md mx-4 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-white">Select Photo</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-all">
            <X size={18} />
          </button>
        </div>

        {/* Drop Zone */}
        {!preview ? (
          <div
            {...getRootProps()}
            className={`m-5 h-56 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-3 cursor-pointer transition-all
              ${isDragActive ? 'border-brand-500 bg-brand-500/10' : 'border-surface-border hover:border-brand-400 hover:bg-surface-elevated'}`}
          >
            <input {...getInputProps()} />
            <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center">
              <Image size={26} className="text-white" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-white text-sm">
                {isDragActive ? 'Drop it here!' : 'Drag & drop a photo'}
              </p>
              <p className="text-xs text-gray-500 mt-1">or click to browse · max 10MB</p>
            </div>
          </div>
        ) : (
          <div className="m-5 relative rounded-xl overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
            <button
              onClick={() => onFileChange(null, null)}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 transition-all"
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadModal
