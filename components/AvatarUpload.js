import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function AvatarUpload({ userId }) {
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (event) => {
    try {
      setUploading(true)

      const file = event.target.files[0]
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError
    } catch (error) {
      alert('Error uploading avatar!')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={uploadAvatar}
        disabled={uploading}
      />
    </div>
  )
}