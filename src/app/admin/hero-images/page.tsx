"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import Image from "next/image";
import { deleteObject, ref } from "firebase/storage";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useFirestore } from "@/hooks/useFirestore";
import { uploadFile } from "@/lib/upload";
import { storage } from "@/lib/firebase";

interface HeroImage {
  image_url: string;
  storage_path: string;
  order: number;
}

const MAX_HERO_IMAGES = 3;

export default function AdminHeroImages() {
  const { data: heroImages, add, update, remove, loading } = useFirestore<HeroImage>("hero_images");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orderedHeroImages = useMemo(
    () => [...heroImages].sort((a, b) => a.order - b.order),
    [heroImages]
  );

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (orderedHeroImages.length >= MAX_HERO_IMAGES) {
      toast.error("You can only upload 3 hero images.");
      event.target.value = "";
      return;
    }

    setIsUploading(true);

    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, "-");
      const storagePath = `hero-images/${Date.now()}_${safeFileName}`;
      const imageUrl = await uploadFile(file, storagePath);

      await add({
        image_url: imageUrl,
        storage_path: storagePath,
        order: orderedHeroImages.length,
      });

      toast.success("Hero image uploaded");
    } catch (error) {
      console.error("Failed to upload hero image", error);
      toast.error("Failed to upload hero image");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleDelete = async (image: HeroImage & { id: string }) => {
    if (!confirm("Are you sure you want to delete this hero image?")) return;

    try {
      await deleteObject(ref(storage, image.storage_path)).catch(() => undefined);
      await remove(image.id);

      const remainingImages = orderedHeroImages.filter((item) => item.id !== image.id);
      await Promise.all(
        remainingImages.map((item, index) =>
          update(item.id, {
            order: index,
          })
        )
      );

      toast.success("Hero image deleted");
    } catch (error) {
      console.error("Failed to delete hero image", error);
      toast.error("Failed to delete hero image");
    }
  };

  const moveImage = async (imageIndex: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? imageIndex - 1 : imageIndex + 1;
    const currentImage = orderedHeroImages[imageIndex];
    const targetImage = orderedHeroImages[targetIndex];

    if (!currentImage || !targetImage) return;

    try {
      await Promise.all([
        update(currentImage.id, { order: targetIndex }),
        update(targetImage.id, { order: imageIndex }),
      ]);
      toast.success("Hero image order updated");
    } catch (error) {
      console.error("Failed to reorder hero image", error);
      toast.error("Failed to reorder hero image");
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hero Images</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload and reorder the 3 images shown in the homepage hero.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || orderedHeroImages.length >= MAX_HERO_IMAGES}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Image"}
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-white">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading hero images...</div>
        ) : orderedHeroImages.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No hero images uploaded yet. The homepage will show placeholder icons until images are added.
          </div>
        ) : (
          <div className="divide-y">
            {orderedHeroImages.map((image, index) => (
              <div
                key={image.id}
                className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex size-28 shrink-0 items-center justify-center border bg-white p-3">
                    <Image
                      src={image.image_url}
                      alt={`Hero image ${index + 1}`}
                      fill
                      className="object-contain p-3"
                    />
                  </div>
                  <div>
                    <div className="font-medium">Hero Image {index + 1}</div>
                    <div className="text-sm text-gray-500">
                      Position {index + 1} of {MAX_HERO_IMAGES}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveImage(index, "up")}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={index === orderedHeroImages.length - 1}
                    onClick={() => moveImage(index, "down")}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(image)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-4 text-sm text-gray-500">
        The first uploaded image appears in the top-right hero card, the second in the large middle
        card, and the third in the bottom-right hero card.
      </p>
    </div>
  );
}
