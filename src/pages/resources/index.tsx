import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { FileUpload } from "@/components/resources/FileUpload";
import { FileList } from "@/components/resources/FileList";
import { FilePreview } from "@/components/resources/FilePreview";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ResourcesPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchFiles();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user?.id)
        .single();

      if (error) throw error;
      setIsAdmin(data?.username === "rmrayakar2004");
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const fetchFiles = async () => {
    try {
      // Fetch both public files and user's private files
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .or(`is_public.eq.true,user_id.eq.${user?.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setIsUploading(true);
    try {
      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("files")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("files").getPublicUrl(fileName);

      // Create file record in database
      const { error: dbError } = await supabase.from("files").insert({
        user_id: user.id,
        name: file.name,
        type: file.type,
        size: file.size,
        url: publicUrl,
        is_public: isAdmin, // If admin uploads, make it public
      });

      if (dbError) throw dbError;

      await fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const file = files.find((f) => f.id === fileId);
      if (!file || file.is_public) return; // Don't allow deletion of public files

      // Delete from storage
      const fileName = file.url.split("/").pop();
      const { error: storageError } = await supabase.storage
        .from("files")
        .remove([`${user?.id}/${fileName}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("files")
        .delete()
        .eq("id", fileId);

      if (dbError) throw dbError;

      await fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Resources</h1>
        <FileUpload onUpload={handleFileUpload} isUploading={isUploading}>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Upload File
          </Button>
        </FileUpload>
      </div>

      <FileList
        files={files}
        onFileSelect={setSelectedFile}
        onFileDelete={(file) =>
          !file.is_public ? handleFileDelete(file.id) : undefined
        }
      />

      {selectedFile && (
        <FilePreview
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
}
