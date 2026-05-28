"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { ImageIcon, RotateCcw, Save, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { uploadFile } from "@/lib/upload";
import {
  DEFAULT_SEO_SETTINGS,
  SEO_SETTINGS_COLLECTION,
  SEO_SETTINGS_DOC_ID,
  type SeoSettings,
  mergeSeoSettings,
} from "@/lib/seo-config";

export default function AdminSeoPage() {
  const [formData, setFormData] = useState<SeoSettings>(DEFAULT_SEO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, SEO_SETTINGS_COLLECTION, SEO_SETTINGS_DOC_ID),
      (snapshot) => {
        setFormData(mergeSeoSettings(snapshot.exists() ? snapshot.data() : null));
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load SEO settings", error);
        toast.error("Failed to load SEO settings");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const updateField = <Key extends keyof SeoSettings>(key: Key, value: SeoSettings[Key]) => {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setUploadingImage(true);

    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, "-");
      const imageUrl = await uploadFile(file, `seo-images/${Date.now()}_${safeFileName}`);

      setFormData((current) => ({
        ...current,
        ogImageUrl: imageUrl,
        twitterImageUrl: current.twitterImageUrl || imageUrl,
      }));
      toast.success("SEO image uploaded");
    } catch (error) {
      console.error("Failed to upload SEO image", error);
      toast.error("Failed to upload SEO image");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      await setDoc(
        doc(db, SEO_SETTINGS_COLLECTION, SEO_SETTINGS_DOC_ID),
        {
          ...formData,
          updated_at: serverTimestamp(),
        },
        { merge: true }
      );
      toast.success("SEO settings saved");
    } catch (error) {
      console.error("Failed to save SEO settings", error);
      toast.error("Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  };

  const resetToRecommended = () => {
    setFormData(DEFAULT_SEO_SETTINGS);
    toast.info("Recommended SEO copy loaded. Save to publish it.");
  };

  if (loading) {
    return <div className="text-gray-500">Loading SEO settings...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">SEO Meta</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Manage the title, description, social preview, canonical URL, and crawler settings used
            across the public site.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" className="gap-2" onClick={resetToRecommended}>
            <RotateCcw className="h-4 w-4" />
            Recommended copy
          </Button>
          <Button type="submit" className="gap-2" disabled={saving}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save SEO"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search result metadata</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site name</Label>
            <Input
              id="siteName"
              value={formData.siteName}
              onChange={(event) => updateField("siteName", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="title">Default title</Label>
              <span className="text-xs text-gray-500">{formData.title.length} characters</span>
            </div>
            <Input
              id="title"
              value={formData.title}
              onChange={(event) => updateField("title", event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="titleTemplate">Page title template</Label>
            <Input
              id="titleTemplate"
              value={formData.titleTemplate}
              onChange={(event) => updateField("titleTemplate", event.target.value)}
              placeholder="%s | Catalyst Innovation Showcase"
            />
            <p className="text-xs text-gray-500">
              Use <code>%s</code> where individual page titles should appear.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="description">Meta description</Label>
              <span className="text-xs text-gray-500">{formData.description.length} characters</span>
            </div>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => updateField("description", event.target.value)}
              className="min-h-28"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <Textarea
              id="keywords"
              value={formData.keywords}
              onChange={(event) => updateField("keywords", event.target.value)}
              className="min-h-24"
            />
            <p className="text-xs text-gray-500">Separate keywords with commas.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canonicalUrl">Canonical site URL</Label>
            <Input
              id="canonicalUrl"
              type="url"
              value={formData.canonicalUrl}
              onChange={(event) => updateField("canonicalUrl", event.target.value)}
              placeholder="https://example.com"
            />
            <p className="text-xs text-gray-500">
              Leave blank to use <code>NEXT_PUBLIC_SITE_URL</code> or the deployed Vercel URL.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social sharing preview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ogTitle">Open Graph title</Label>
              <Input
                id="ogTitle"
                value={formData.ogTitle}
                onChange={(event) => updateField("ogTitle", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterTitle">Twitter/X title</Label>
              <Input
                id="twitterTitle"
                value={formData.twitterTitle}
                onChange={(event) => updateField("twitterTitle", event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ogDescription">Open Graph description</Label>
              <Textarea
                id="ogDescription"
                value={formData.ogDescription}
                onChange={(event) => updateField("ogDescription", event.target.value)}
                className="min-h-28"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterDescription">Twitter/X description</Label>
              <Textarea
                id="twitterDescription"
                value={formData.twitterDescription}
                onChange={(event) => updateField("twitterDescription", event.target.value)}
                className="min-h-28"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label>Social preview image</Label>
            <div className="flex flex-col gap-4 rounded-md border bg-gray-50 p-4 md:flex-row md:items-center">
              <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-md border bg-white md:w-56">
                {formData.ogImageUrl ? (
                  <div
                    role="img"
                    aria-label={formData.ogImageAlt || "SEO social preview"}
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url("${formData.ogImageUrl}")` }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <ImageIcon className="h-8 w-8" />
                    <span className="text-xs">No image selected</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-4 w-4" />
                    {uploadingImage ? "Uploading..." : "Upload image"}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Recommended size is 1200x630. If this field is empty, the site will fall back to
                  the first homepage hero image when available.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ogImageUrl">Open Graph image URL</Label>
              <Input
                id="ogImageUrl"
                value={formData.ogImageUrl}
                onChange={(event) => updateField("ogImageUrl", event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterImageUrl">Twitter/X image URL</Label>
              <Input
                id="twitterImageUrl"
                value={formData.twitterImageUrl}
                onChange={(event) => updateField("twitterImageUrl", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ogImageAlt">Image alt text</Label>
            <Input
              id="ogImageAlt"
              value={formData.ogImageAlt}
              onChange={(event) => updateField("ogImageAlt", event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Crawler settings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row">
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={formData.robotsIndex}
              onChange={(event) => updateField("robotsIndex", event.target.checked)}
            />
            Allow search engines to index this site
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={formData.robotsFollow}
              onChange={(event) => updateField("robotsFollow", event.target.checked)}
            />
            Allow search engines to follow links
          </label>
        </CardContent>
      </Card>
    </form>
  );
}

