"use client";

import { useState } from "react";
import { useFirestore } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { uploadFile } from "@/lib/upload";
import Image from "next/image";

interface Supporter {
  company_name: string;
  logo: string;
}

const initialSupporter: Supporter = {
  company_name: "",
  logo: "",
};

export default function AdminSupporters() {
  const { data: supporters, add, update, remove, loading } = useFirestore<Supporter>("supporters");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingSupporter, setEditingSupporter] = useState<(Supporter & { id: string }) | null>(null);
  const [formData, setFormData] = useState<Supporter>(initialSupporter);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let logoUrl = formData.logo;
      if (file) {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, "-");
        logoUrl = await uploadFile(file, `supporter-logos/${Date.now()}_${safeFileName}`);
      }

      const dataToSave = { ...formData, logo: logoUrl };

      if (editingSupporter) {
        await update(editingSupporter.id, dataToSave);
        toast.success("Supporter updated successfully");
      } else {
        await add(dataToSave);
        toast.success("Supporter added successfully");
      }
      setIsAddOpen(false);
      setEditingSupporter(null);
      setFormData(initialSupporter);
      setFile(null);
    } catch (error) {
      console.error("Failed to save supporter", error);
      toast.error("Failed to save supporter");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (supporter: Supporter & { id: string }) => {
    setEditingSupporter(supporter);
    setFormData(supporter);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supporter?")) {
      try {
        await remove(id);
        toast.success("Supporter deleted successfully");
      } catch (error) {
        toast.error("Failed to delete supporter");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Supporters</h1>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingSupporter(null);
            setFormData(initialSupporter);
            setFile(null);
          }
        }}>
          <DialogTrigger render={<Button>Add Supporter</Button>} />
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingSupporter ? "Edit Supporter" : "Add New Supporter"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required={!editingSupporter}
                />
                {formData.logo && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Current Logo:</p>
                    <div className="relative w-20 h-20 border rounded overflow-hidden">
                      <Image
                        src={formData.logo}
                        alt="Logo"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>
                {uploading ? "Uploading..." : editingSupporter ? "Update Supporter" : "Add Supporter"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Logo</TableHead>
              <TableHead>Company Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : supporters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">No supporters found.</TableCell>
              </TableRow>
            ) : (
              supporters.map((supporter) => (
                <TableRow key={supporter.id}>
                  <TableCell>
                    <div className="relative w-12 h-12">
                      <Image
                        src={supporter.logo}
                        alt={supporter.company_name}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{supporter.company_name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(supporter)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(supporter.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
