"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useFirestore } from "@/hooks/useFirestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db, storage } from "@/lib/firebase";
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
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

interface Event {
  title: string;
  description: string;
  date: string;
  start_time: string;
  end_time?: string;
}

interface ScheduleDocument {
  file_name: string;
  download_url: string;
  storage_path: string;
}

const initialEvent: Event = {
  title: "",
  description: "",
  date: "",
  start_time: "",
  end_time: "",
};

export default function AdminSchedule() {
  const { data: events, add, update, remove, loading } = useFirestore<Event>("schedule");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<(Event & { id: string }) | null>(null);
  const [formData, setFormData] = useState<Event>(initialEvent);
  const [scheduleDocument, setScheduleDocument] = useState<ScheduleDocument | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [isDeletingDocument, setIsDeletingDocument] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "schedule_documents", "current"), (snapshot) => {
      setScheduleDocument(snapshot.exists() ? (snapshot.data() as ScheduleDocument) : null);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingEvent) {
        await update(editingEvent.id, formData);
        toast.success("Event updated successfully");
      } else {
        await add(formData);
        toast.success("Event added successfully");
      }
      setIsAddOpen(false);
      setEditingEvent(null);
      setFormData(initialEvent);
    } catch (error) {
      toast.error("Failed to save event");
    }
  };

  const handleScheduleDocumentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploadingDocument(true);

    try {
      if (scheduleDocument?.storage_path) {
        await deleteObject(ref(storage, scheduleDocument.storage_path)).catch(() => undefined);
      }

      const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]+/g, "-");
      const storagePath = `schedule-documents/${Date.now()}-${safeFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(storageRef);

      await setDoc(doc(db, "schedule_documents", "current"), {
        file_name: file.name,
        download_url: downloadUrl,
        storage_path: storagePath,
        uploaded_at: serverTimestamp(),
      });

      toast.success("Schedule document uploaded");
    } catch (error) {
      toast.error("Failed to upload schedule document");
    } finally {
      setIsUploadingDocument(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleScheduleDocumentDelete = async () => {
    if (!scheduleDocument) return;

    if (!confirm("Are you sure you want to delete the uploaded schedule document?")) {
      return;
    }

    setIsDeletingDocument(true);

    try {
      await deleteObject(ref(storage, scheduleDocument.storage_path)).catch(() => undefined);
      await deleteDoc(doc(db, "schedule_documents", "current"));
      toast.success("Schedule document deleted");
    } catch (error) {
      toast.error("Failed to delete schedule document");
    } finally {
      setIsDeletingDocument(false);
    }
  };

  const handleEdit = (event: Event & { id: string }) => {
    setEditingEvent(event);
    setFormData(event);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await remove(id);
        toast.success("Event deleted successfully");
      } catch (error) {
        toast.error("Failed to delete event");
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Event Schedule</h1>
        <Dialog open={isAddOpen} onOpenChange={(open) => {
          setIsAddOpen(open);
          if (!open) {
            setEditingEvent(null);
            setFormData(initialEvent);
          }
        }}>
          <DialogTrigger render={<Button>Add Event</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEvent ? "Edit Event" : "Add New Event"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time (Optional)</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingEvent ? "Update Event" : "Add Event"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-8 rounded-md border bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold">Schedule document</h2>
            {scheduleDocument ? (
              <div className="group mt-2 inline-flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="max-w-[360px] truncate font-medium">
                  {scheduleDocument.file_name}
                </span>
                <button
                  type="button"
                  aria-label="Delete uploaded schedule document"
                  className="hidden size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive group-hover:flex"
                  onClick={handleScheduleDocumentDelete}
                  disabled={isDeletingDocument}
                >
                  ×
                </button>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                No schedule document has been uploaded yet.
              </p>
            )}
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleScheduleDocumentUpload}
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingDocument || isDeletingDocument}
            >
              {isUploadingDocument
                ? "Uploading..."
                : scheduleDocument
                  ? "Replace schedule doc"
                  : "Upload schedule doc"}
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : events.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center">No events found.</TableCell>
              </TableRow>
            ) : (
              events
                .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                .map((event) => (
                <TableRow key={event.id}>
                  <TableCell>{event.date}</TableCell>
                  <TableCell>{event.start_time}{event.end_time ? ` - ${event.end_time}` : ""}</TableCell>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(event)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(event.id)}>
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
