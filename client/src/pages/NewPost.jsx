import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Image, Loader2 } from 'lucide-react'
import Navbar from '../components/Navbar'
import UploadModal from '../components/UploadModal'
import { usePostStore } from '../store/postStore'
import toast from 'react-hot-toast'

const NewPost = () => {
  const { createPost } = usePostStore()
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [showModal, setShowModal] = useState(true)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = (f, p) => {
    setFile(f)
    setPreview(p)
    if (f) setShowModal(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      toast.error('Please select an image')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      if (caption.trim()) fd.append('caption', caption.trim())
      await createPost(fd)
      toast.success('Post shared')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-14">
        <div className="max-w-lg mx-auto px-4 py-8">
          <h1 className="text-xl font-bold text-white mb-6">Create New Post</h1>

          <div className="card overflow-hidden">
            {/* Image Preview */}
            {preview ? (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
                <button
                  onClick={() => { setFile(null); setPreview(null); setShowModal(true) }}
                  className="absolute top-3 right-3 p-2 rounded-xl text-xs font-medium"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="w-full aspect-square flex flex-col items-center justify-center gap-3 bg-surface-elevated "
              >
                <div className="w-16 h-16 rounded-2xl bg-brand-600 flex items-center justify-center">
                  <Image size={28} className="text-white" />
                </div>
                <p className="text-gray-400 text-sm">Click to select a photo</p>
              </button>
            )}

            {/* Caption + Submit */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write a caption…"
                rows={3}
                maxLength={2200}
                className="input resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{caption.length}/2200</span>
              </div>
              <button
                type="submit"
                disabled={!file || uploading}
                className="btn-primary w-full py-3"
              >
                {uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Sharing…
                  </span>
                ) : (
                  'Share Post'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {showModal && (
        <UploadModal
          file={file}
          preview={preview}
          onFileChange={handleFileChange}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}

export default NewPost
