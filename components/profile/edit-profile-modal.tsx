"use client";

import { useState } from "react";
import Image from "next/image";
import { XIcon } from "@/components/icons";

interface EditProfileModalProps {
  user: {
    fullName: string;
    bio: string | null;
    profilePhoto: string | null;
    avatar: string | null;
    height: number | null;
    weight: number | null;
  };
  onClose: () => void;
  onSave: () => void;
}

export function EditProfileModal({ user, onClose, onSave }: EditProfileModalProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [bio, setBio] = useState(user.bio || "");
  const [height, setHeight] = useState(user.height?.toString() || "");
  const [weight, setWeight] = useState(user.weight?.toString() || "");
  const [profilePhoto, setProfilePhoto] = useState(user.profilePhoto || user.avatar || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          bio: bio || undefined,
          profilePhoto: profilePhoto || undefined,
          height: height ? parseFloat(height) : null,
          weight: weight ? parseFloat(weight) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
        return;
      }

      onSave();
      onClose();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <button onClick={onClose}>
            <XIcon className="w-6 h-6 text-gray-500" />
          </button>
          <h2 className="font-semibold">Edit Profile</h2>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="text-brand-500 font-semibold text-sm disabled:opacity-40"
          >
            {loading ? "Saving..." : "Done"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 m-4 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden">
              {profilePhoto ? (
                <Image
                  src={profilePhoto}
                  alt="Profile"
                  width={80}
                  height={80}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
                  {fullName[0]}
                </div>
              )}
            </div>
            <label className="text-sm text-brand-500 font-semibold cursor-pointer">
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:border-brand-500"
            />
            <p className="text-xs text-gray-400 mt-1">{bio.length}/300</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Height (cm)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Weight (kg)</label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
