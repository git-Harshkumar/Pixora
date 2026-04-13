import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Grid, Settings, Loader2, X, Check, Trash2 } from 'lucide-react'
import api from '../lib/api'
import Navbar from '../components/Navbar'
import Avatar from '../components/Avatar'
import FollowButton from '../components/FollowButton'
import PostGrid from '../components/PostGrid'
import { useAuthStore } from '../store/authStore'
import { usePostStore } from '../store/postStore'
import toast from 'react-hot-toast'

const Profile = () => {
  const { username } = useParams()
  const { user: currentUser, updateProfile } = useAuthStore()
  const { fetchFeed } = usePostStore()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ bio: '' })
  const [avatarFile, setAvatarFile] = useState(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [listOpen, setListOpen] = useState(false)
  const [listType, setListType] = useState('followers') // 'followers' | 'following'
  const [listLoading, setListLoading] = useState(false)
  const [listUsers, setListUsers] = useState([])

  const isOwn = currentUser?.username === username

  const fetchProfile = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/users/${username}`)
      setProfile(data.data.user)
      setEditForm({ bio: data.data.user.bio || '' })
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [username])

  const openList = async (type) => {
    setListType(type)
    setListOpen(true)
    setListLoading(true)
    try {
      const { data } = await api.get(`/users/${username}/${type}`)
      const users = type === 'followers' ? data.data.followers : data.data.following
      setListUsers(users || [])
    } catch {
      setListUsers([])
      toast.error('Could not load list')
    } finally {
      setListLoading(false)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('bio', editForm.bio)
      if (avatarFile) fd.append('avatar', avatarFile)
      if (removeAvatar && !avatarFile) fd.append('removeAvatar', 'true')
      const { data } = await api.put('/users/me', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      updateProfile(data.data.user)
      setProfile((p) => ({ ...p, ...data.data.user }))
      toast.success('Profile updated!')
      setEditOpen(false)
      setAvatarFile(null)
      setRemoveAvatar(false)
    } catch {
      toast.error('Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex justify-center items-center min-h-screen pt-14">
          <Loader2 size={32} className="animate-spin text-brand-500" />
        </div>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-screen pt-14 gap-3">
          <p className="text-white font-semibold">User not found</p>
          <Link to="/" className="btn-primary">Go Home</Link>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-14">
        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <div className="flex items-start gap-6 mb-8">
            <Avatar src={profile.avatar} username={profile.username} size="xl" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1 className="text-xl font-bold text-white">{profile.username}</h1>
                {isOwn ? (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="btn-secondary flex items-center gap-1.5 text-xs"
                  >
                    <Settings size={13} /> Edit Profile
                  </button>
                ) : (
                  <FollowButton
                    userId={profile.id}
                    initialFollowing={!!profile.isFollowing}
                    onToggle={() => fetchFeed(true)}
                  />
                )}
                {!isOwn && (
                  <Link
                    to={`/messages/${profile.id}`}
                    className="btn-secondary text-xs px-3 py-2"
                  >
                    Message
                  </Link>
                )}
              </div>

              {/* Stats */}
              <div className="flex gap-6 mb-3">
                <Stat label="posts" value={profile._count.posts} />
                <Stat
                  label="followers"
                  value={profile._count.followers}
                  onClick={() => openList('followers')}
                />
                <Stat
                  label="following"
                  value={profile._count.following}
                  onClick={() => openList('following')}
                />
              </div>

              {profile.bio && (
                <p className="text-sm text-gray-300 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          </div>

          {/* Divider + Tab */}
          <div className="flex items-center gap-1.5 border-t border-surface-border pt-4 mb-4">
            <Grid size={16} className="text-white" />
            <span className="text-sm font-semibold text-white">Posts</span>
          </div>

          <PostGrid posts={profile.posts} />
        </div>
      </div>

      {/* Edit Profile Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-sm mx-4 animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-white">Edit Profile</h2>
              <button onClick={() => setEditOpen(false)} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-elevated transition-all">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-5 space-y-4">
              {/* Avatar picker */}
              <div className="flex items-center gap-4">
                <Avatar
                  src={
                    removeAvatar && !avatarFile
                      ? null
                      : avatarFile
                      ? URL.createObjectURL(avatarFile)
                      : profile.avatar
                  }
                  username={profile.username}
                  size="lg"
                />
                <div className="flex flex-col gap-2">
                  <label className="btn-secondary text-xs cursor-pointer">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setAvatarFile(e.target.files[0])
                        setRemoveAvatar(false)
                      }}
                    />
                  </label>
                  {(profile.avatar || avatarFile) && !removeAvatar && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveAvatar(true)
                        setAvatarFile(null)
                      }}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={12} />
                      Remove Photo
                    </button>
                  )}
                  {removeAvatar && !avatarFile && (
                    <button
                      type="button"
                      onClick={() => setRemoveAvatar(false)}
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Undo remove
                    </button>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell the world about yourself…"
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <button type="submit" disabled={saving} className="btn-primary w-full">
                {saving ? <Loader2 size={16} className="animate-spin mx-auto" /> : (
                  <span className="flex items-center justify-center gap-1.5"><Check size={15} /> Save Changes</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Followers / Following Modal */}
      {listOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setListOpen(false)
          }}
        >
          <div className="card w-full max-w-sm mx-4 overflow-hidden animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-white capitalize">{listType}</h2>
              <button
                onClick={() => setListOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-surface-elevated transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {listLoading ? (
                <div className="p-6 flex justify-center">
                  <Loader2 size={22} className="animate-spin text-brand-500" />
                </div>
              ) : listUsers.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No {listType} yet.
                </div>
              ) : (
                <div className="p-2">
                  {listUsers.map((u) => (
                    <Link
                      key={u.id}
                      to={`/profile/${u.username}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-elevated transition-colors"
                      onClick={() => setListOpen(false)}
                    >
                      <Avatar src={u.avatar} username={u.username} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{u.username}</p>
                        {u.bio && <p className="text-xs text-gray-500 truncate">{u.bio}</p>}
                      </div>
                      <p className="text-xs text-gray-500">
                        {u._count?.followers ?? 0}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const Stat = ({ label, value, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!onClick}
    className={`text-center ${onClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
  >
    <p className="font-bold text-white text-base">{value}</p>
    <p className="text-xs text-gray-500">{label}</p>
  </button>
)

export default Profile
