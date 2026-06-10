'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Text, H1, FlexLayout } from '@salt-ds/core';
import { updateProfileMultipart } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './edit.module.css';

export default function EditProfilePage() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();

  const [bio, setBio] = useState(profile?.bio ?? '');
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    profile?.profile_picture ?? null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPictureFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('bio', bio);
      if (pictureFile) {
        formData.append('profile_picture', pictureFile);
      }

      await updateProfileMultipart(formData);

      if (refreshProfile) {
        await refreshProfile();
      }

      setSuccess('Profile updated!');
      setTimeout(() => router.push('/profile'), 800);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className={styles.page}>
      <div className="page-container">
        <Link href="/profile" className={styles.backLink}>
          ← Back to Profile
        </Link>

        <H1 className={styles.title}>Edit Profile</H1>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          {/* Profile picture */}
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Profile Picture</Text>
            <div className={styles.avatarSection}>
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Profile" className={styles.currentAvatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {user.username[0].toUpperCase()}
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className={styles.fileInput}
                onChange={handleFileChange}
              />
              <Text className={styles.fileHint}>
                Accepted: JPG, PNG, GIF (max 5MB)
              </Text>
            </div>
          </div>

          {/* Bio */}
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Bio</Text>
            <textarea
              className={styles.textarea}
              placeholder="Tell people about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={500}
              rows={4}
            />
          </div>

          {error && <Text className={styles.error}>{error}</Text>}
          {success && <Text className={styles.success}>{success}</Text>}

          <FlexLayout gap={2} align="center" className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              className={styles.submitBtn}
              loading={submitting}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={styles.cancelBtn}
              onClick={() => router.push('/profile')}
            >
              Cancel
            </Button>
          </FlexLayout>
        </form>
      </div>
    </div>
  );
}
