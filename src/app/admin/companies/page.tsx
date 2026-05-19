"use client";

import { useState } from "react";
import { useFirestore } from "@/hooks/useFirestore";
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
};

export default function AdminCompanies() {
  const { data: companies, add, update, remove, loading } = useFirestore<Company>("companies");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<(Company & { id: string }) | null>(null);
  const [formData, setFormData] = useState<Company>(initialCompany);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await update(editingCompany.id, formData);
        toast.success("Company updated successfully");
      } else {
        await add(formData);
        toast.success("Company added successfully");
      }
      setIsAddOpen(false);
      setEditingCompany(null);
      setFormData(initialCompany);
    } catch (error) {
      toast.error("Failed to save company");
    }
  };

  const handleEdit = (company: Company & { id: string }) => {
    setEditingCompany(company);
    setFormData(company);
    setIsAddOpen(true);
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

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Companies</h1>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingCompany(null);
            setFormData(initialCompany);
          }
        }}>
          <DialogTrigger asChild>
            <Button>Add Company</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit Company" : "Add New Company"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <Button type="submit" className="w-full">
                {editingCompany ? "Update Company" : "Add Company"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Year</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No companies found.</TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.company_name}</TableCell>
                  <TableCell>{company.full_location || `${company.location_city}, ${company.location_country}`}</TableCell>
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
