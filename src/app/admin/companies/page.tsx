"use client";

import { useEffect, useRef, useState } from "react";
import Papa from "papaparse";
import { useFirestore } from "@/hooks/useFirestore";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Upload } from "lucide-react";
import { uploadFile } from "@/lib/upload";

interface Company {
  company_name: string;
  linkedin_url: string;
  website_url: string;
  location_city: string;
  location_province_state: string;
  location_country: string;
  full_location: string;
  year_founded: string;
  company_description: string;
  mission_statement: string;
  catalyst_program: string;
  image_url?: string;
  relevant_sectors?: string[];
}

const initialCompany: Company = {
  company_name: "",
  linkedin_url: "",
  website_url: "",
  location_city: "",
  location_province_state: "",
  location_country: "",
  full_location: "",
  year_founded: "",
  company_description: "",
  mission_statement: "",
  catalyst_program: "",
  image_url: "",
  relevant_sectors: [],
};

const requiredCsvHeaders = [
  "company_name",
  "linkedin_url",
  "website_url",
  "location_city",
  "location_province_state",
  "location_country",
  "full_location",
  "year_founded",
  "company_description",
  "mission_statement",
  "catalyst_program",
] as const satisfies readonly (keyof Company)[];

function normalizeCompanyRow(row: Record<string, unknown>): Company {
  const company = requiredCsvHeaders.reduce((company, key) => {
    company[key] = String(row[key] ?? "").trim();
    return company;
  }, { ...initialCompany });

  const sectors = String(row.relevant_sectors ?? "").trim();

  return {
    ...company,
    relevant_sectors: sectors
      ? sectors.split(",").map((sector) => sector.trim()).filter(Boolean)
      : [],
  };
}

function normalizeSector(sector: string) {
  return sector.trim().replace(/\s+/g, " ");
}

export default function AdminCompanies() {
  const { data: companies, add, update, remove, loading } = useFirestore<Company>("companies");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<(Company & { id: string }) | null>(null);
  const [formData, setFormData] = useState<Company>(initialCompany);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sectorInput, setSectorInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sectorSuggestions = Array.from(
    new Set(
      companies
        .flatMap((company) => company.relevant_sectors ?? [])
        .map(normalizeSector)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let imageUrl = formData.image_url ?? "";

      if (imageFile) {
        const safeFileName = imageFile.name.replace(/[^a-zA-Z0-9.\-_]+/g, "-");
        imageUrl = await uploadFile(
          imageFile,
          `company-images/${Date.now()}_${safeFileName}`
        );
      }

      const companyToSave = {
        ...formData,
        image_url: imageUrl,
      };

      if (editingCompany) {
        await update(editingCompany.id, companyToSave);
        toast.success("Company updated successfully");
      } else {
        await add(companyToSave);
        toast.success("Company added successfully");
      }
      setIsAddOpen(false);
      setEditingCompany(null);
      setFormData(initialCompany);
      setImageFile(null);
      setSectorInput("");
    } catch (error) {
      toast.error("Failed to save company");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (company: Company & { id: string }) => {
    setEditingCompany(company);
    setFormData({ ...initialCompany, ...company });
    setImageFile(null);
    setSectorInput("");
    setIsAddOpen(true);
  };

  const addSector = (sector: string) => {
    const normalizedSector = normalizeSector(sector);

    if (!normalizedSector) return;

    const currentSectors = formData.relevant_sectors ?? [];
    const sectorExists = currentSectors.some(
      (currentSector) => currentSector.toLowerCase() === normalizedSector.toLowerCase()
    );

    if (sectorExists) {
      setSectorInput("");
      return;
    }

    setFormData({
      ...formData,
      relevant_sectors: [...currentSectors, normalizedSector],
    });
    setSectorInput("");
  };

  const addSectorsFromText = (text: string) => {
    const sectors = text
      .split(",")
      .map(normalizeSector)
      .filter(Boolean);

    if (sectors.length === 0) {
      setSectorInput("");
      return;
    }

    const currentSectors = formData.relevant_sectors ?? [];
    const mergedSectors = [...currentSectors];

    for (const sector of sectors) {
      const sectorExists = mergedSectors.some(
        (currentSector) => currentSector.toLowerCase() === sector.toLowerCase()
      );

      if (!sectorExists) {
        mergedSectors.push(sector);
      }
    }

    setFormData({
      ...formData,
      relevant_sectors: mergedSectors,
    });
    setSectorInput("");
  };

  const removeSector = (sectorToRemove: string) => {
    setFormData({
      ...formData,
      relevant_sectors: (formData.relevant_sectors ?? []).filter(
        (sector) => sector !== sectorToRemove
      ),
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this company?")) {
      try {
        await remove(id);
        toast.success("Company deleted successfully");
      } catch (error) {
        toast.error("Failed to delete company");
      }
    }
  };

  const handleImportFile = (file: File | undefined) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast.error("Please choose a CSV file.");
      return;
    }

    setCsvFile(file);
  };

  const handleImport = async () => {
    if (!csvFile) {
      toast.error("Please choose a CSV file to import.");
      return;
    }

    setIsImporting(true);

    Papa.parse<Record<string, unknown>>(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const headers = results.meta.fields ?? [];
          const missingHeaders = requiredCsvHeaders.filter((header) => !headers.includes(header));

          if (missingHeaders.length > 0) {
            toast.error(`Missing required CSV columns: ${missingHeaders.join(", ")}`);
            setIsImporting(false);
            return;
          }

          const rows = results.data
            .map(normalizeCompanyRow)
            .filter((company) => company.company_name.length > 0);

          if (rows.length === 0) {
            toast.error("No valid company rows found in the CSV.");
            setIsImporting(false);
            return;
          }

          for (const company of rows) {
            await add(company);
          }

          toast.success(`Imported ${rows.length} companies.`);
          setCsvFile(null);
          setIsImportOpen(false);
        } catch (error) {
          console.error("CSV import failed", error);
          toast.error("Failed to import companies.");
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error("CSV parse failed", error);
        toast.error("Could not parse the CSV file.");
        setIsImporting(false);
      },
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Companies</h1>
        <div className="flex gap-3">
          <Dialog open={isImportOpen} onOpenChange={(open) => {
            setIsImportOpen(open);
            if (!open) {
              setCsvFile(null);
              setIsDragging(false);
            }
          }}>
            <DialogTrigger render={<Button variant="outline">Import CSV</Button>} />
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Companies</DialogTitle>
              </DialogHeader>
              <div className="space-y-5">
                <div
                  className={`flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handleImportFile(event.dataTransfer.files?.[0]);
                  }}
                >
                  <Upload className="mb-4 h-10 w-10 text-gray-500" />
                  <p className="text-base font-semibold">
                    {csvFile ? csvFile.name : "Drag and drop your CSV file here"}
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Or click to choose a file from your computer.
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(event) => handleImportFile(event.target.files?.[0])}
                  />
                </div>

                <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Expected columns:</p>
                  <p className="mt-1 break-words">
                    {requiredCsvHeaders.join(", ")}
                  </p>
                  <p className="mt-2">
                    Optional: relevant_sectors, image_url
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsImportOpen(false)}
                    disabled={isImporting}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleImport} disabled={!csvFile || isImporting}>
                    {isImporting ? "Importing..." : "Import Companies"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddOpen} onOpenChange={(open) => {
            setIsAddOpen(open);
            if (!open) {
              setEditingCompany(null);
              setFormData(initialCompany);
              setImageFile(null);
              setSectorInput("");
            }
          }}>
            <DialogTrigger render={<Button>Add Company</Button>} />
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
              <DialogHeader>
                <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company_image">Company Image</Label>
                <Input
                  id="company_image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                />
                {(imagePreviewUrl || formData.image_url) && (
                  <div className="mt-3 flex items-center gap-4 rounded-md border p-3">
                    <div className="relative h-20 w-20 overflow-hidden rounded-md bg-gray-100">
                      {imagePreviewUrl ? (
                        <img
                          src={imagePreviewUrl}
                          alt="Selected company image preview"
                          className="h-full w-full object-cover"
                        />
                      ) : formData.image_url ? (
                        <Image
                          src={formData.image_url}
                          alt="Current company image"
                          fill
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="text-sm text-gray-600">
                      {imageFile ? imageFile.name : "Current uploaded image"}
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="year_founded">Year Founded</Label>
                  <Input
                    id="year_founded"
                    value={formData.year_founded}
                    onChange={(e) => setFormData({ ...formData, year_founded: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_city">City</Label>
                  <Input
                    id="location_city"
                    value={formData.location_city}
                    onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_province_state">Province/State</Label>
                  <Input
                    id="location_province_state"
                    value={formData.location_province_state}
                    onChange={(e) => setFormData({ ...formData, location_province_state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location_country">Country</Label>
                  <Input
                    id="location_country"
                    value={formData.location_country}
                    onChange={(e) => setFormData({ ...formData, location_country: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_location">Full Location String</Label>
                  <Input
                    id="full_location"
                    value={formData.full_location}
                    onChange={(e) => setFormData({ ...formData, full_location: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="catalyst_program">Catalyst Program</Label>
                <Input
                  id="catalyst_program"
                  value={formData.catalyst_program}
                  onChange={(e) => setFormData({ ...formData, catalyst_program: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relevant_sectors">Relevant Sectors</Label>
                <Input
                  id="relevant_sectors"
                  list="relevant-sector-suggestions"
                  value={sectorInput}
                  placeholder="Type a sector, then press Enter or comma"
                  onChange={(event) => {
                    const value = event.target.value;

                    if (value.includes(",")) {
                      addSectorsFromText(value);
                      return;
                    }

                    setSectorInput(value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === ",") {
                      event.preventDefault();
                      addSector(sectorInput);
                    }
                  }}
                  onPaste={(event) => {
                    const pastedText = event.clipboardData.getData("text");

                    if (pastedText.includes(",")) {
                      event.preventDefault();
                      addSectorsFromText(pastedText);
                    }
                  }}
                />
                <datalist id="relevant-sector-suggestions">
                  {sectorSuggestions.map((sector) => (
                    <option key={sector} value={sector} />
                  ))}
                </datalist>
                {(formData.relevant_sectors ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(formData.relevant_sectors ?? []).map((sector) => (
                      <button
                        key={sector}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                        onClick={() => removeSector(sector)}
                      >
                        {sector}
                        <span aria-hidden="true" className="text-blue-500">×</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Existing sectors are suggested as you type. Click a pill to remove it.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_description">Company Description</Label>
                <Textarea
                  id="company_description"
                  value={formData.company_description}
                  onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mission_statement">Mission Statement</Label>
                <Textarea
                  id="mission_statement"
                  value={formData.mission_statement}
                  onChange={(e) => setFormData({ ...formData, mission_statement: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isSaving}>
                {isSaving ? "Saving..." : editingCompany ? "Update Company" : "Add Company"}
              </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Catalyst Program</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No companies found.</TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    {company.image_url ? (
                      <div className="relative h-12 w-12 overflow-hidden rounded-md bg-gray-100">
                        <Image
                          src={company.image_url}
                          alt={company.company_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100 text-xs font-bold text-gray-400">
                        —
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{company.company_name}</TableCell>
                  <TableCell>{company.full_location || `${company.location_city}, ${company.location_country}`}</TableCell>
                  <TableCell>{company.catalyst_program || "—"}</TableCell>
                  <TableCell>{company.year_founded}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(company)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(company.id)}>
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
