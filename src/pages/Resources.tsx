import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Upload,
  File,
  Trash2,
  Download,
  FileText,
  Image,
  FileVideo,
  FileAudio,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Presentation,
  Eye,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

interface FileRecord {
  id: string;
  name: string;
  description: string | null;
  file_path: string;
  file_type: string;
  file_size: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  user_id: string;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return Image;
  if (fileType.startsWith("video/")) return FileVideo;
  if (fileType.startsWith("audio/")) return FileAudio;
  if (fileType.includes("pdf")) return FileText;
  if (fileType.includes("word") || fileType.includes("document"))
    return FileText;
  if (fileType.includes("excel") || fileType.includes("spreadsheet"))
    return FileSpreadsheet;
  if (fileType.includes("powerpoint") || fileType.includes("presentation"))
    return Presentation;
  if (fileType.includes("zip") || fileType.includes("archive"))
    return FileArchive;
  if (fileType.includes("code") || fileType.includes("text")) return FileCode;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function Resources() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  useEffect(() => {
    if (user) {
      checkAdminStatus();
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

  const { data: files, isLoading } = useQuery<FileRecord[]>({
    queryKey: ["files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("files")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FileRecord[];
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `File ${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });
    setSelectedFiles(validFiles);
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (selectedFiles.length === 0) throw new Error("No files selected");
      setIsUploading(true);

      for (const file of selectedFiles) {
        try {
          setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));
          const fileExt = file.name.split(".").pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${user?.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("files")
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { error: dbError } = await supabase.from("files").insert({
            name: file.name,
            description,
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            is_public: isPublic,
            user_id: user?.id,
          });

          if (dbError) throw dbError;

          setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      setSelectedFiles([]);
      setDescription("");
      setIsPublic(false);
      setUploadProgress({});
      toast({
        title: "Success",
        description: "Files uploaded successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (file: FileRecord) => {
      try {
        // First delete from database
        const { error: dbError } = await supabase
          .from("files")
          .delete()
          .eq("id", file.id)
          .select()
          .single();

        if (dbError) {
          console.error("Database deletion error:", dbError);
          throw new Error("Only the admin can delete this file");
        }

        // Then delete from storage
        // Ensure we're using the correct path format
        const filePath = file.file_path;
        console.log("Attempting to delete file from storage:", filePath);

        const { data: listData, error: listError } = await supabase.storage
          .from("files")
          .list(filePath.split("/")[0]); // List files in user's directory

        if (listError) {
          console.error("Error listing files:", listError);
        } else {
          console.log("Files in directory:", listData);
        }

        const { error: storageError } = await supabase.storage
          .from("files")
          .remove([filePath]);

        if (storageError) {
          console.error("Storage deletion error:", storageError);
          // If storage deletion fails, we should try to restore the database record
          const { error: restoreError } = await supabase.from("files").insert({
            id: file.id,
            name: file.name,
            description: file.description,
            file_path: file.file_path,
            file_type: file.file_type,
            file_size: file.file_size,
            user_id: file.user_id,
            is_public: file.is_public,
            created_at: file.created_at,
            updated_at: file.updated_at,
          });

          if (restoreError) {
            console.error("Database restore error:", restoreError);
          }
          throw new Error(
            `Failed to delete file from storage: ${storageError.message}`
          );
        }

        // Verify storage deletion
        const { data: verifyData, error: verifyError } = await supabase.storage
          .from("files")
          .list(filePath.split("/")[0]);

        if (verifyError) {
          console.error("Error verifying deletion:", verifyError);
        } else {
          console.log("Files after deletion:", verifyData);
        }
      } catch (error) {
        console.error("Delete operation error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
    },
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }
    await uploadMutation.mutateAsync();
  };

  const handleDownload = async (file: FileRecord) => {
    const { data, error } = await supabase.storage
      .from("files")
      .download(file.file_path);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePreview = async (file: FileRecord) => {
    setPreviewFile(file);
    try {
      const { data, error } = await supabase.storage
        .from("files")
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file preview",
        variant: "destructive",
      });
    }
  };

  const closePreview = () => {
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const renderPreview = () => {
    if (!previewFile || !previewUrl) return null;

    const fileType = previewFile.file_type.toLowerCase();

    if (fileType.startsWith("image/")) {
      return (
        <img
          src={previewUrl}
          alt={previewFile.name}
          className="max-w-full max-h-[70vh] object-contain"
        />
      );
    }

    if (fileType.startsWith("video/")) {
      return (
        <video src={previewUrl} controls className="max-w-full max-h-[70vh]" />
      );
    }

    if (fileType.startsWith("audio/")) {
      return <audio src={previewUrl} controls className="w-full" />;
    }

    if (fileType.includes("pdf")) {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-[70vh]"
          title={previewFile.name}
        />
      );
    }

    return (
      <div className="text-center p-4">
        <p className="text-muted-foreground">
          Preview not available for this file type.
          <br />
          <Button
            variant="link"
            onClick={() => handleDownload(previewFile)}
            className="mt-2"
          >
            Download to view
          </Button>
        </p>
      </div>
    );
  };

  const handleDelete = async (file: FileRecord) => {
    if (window.confirm("Are you sure you want to delete this file?")) {
      try {
        await deleteMutation.mutateAsync(file);
      } catch (error) {
        console.error("Delete operation failed:", error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold mb-8">Resources</h1>

            {/* Upload Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Upload File</CardTitle>
                <CardDescription>
                  Share your study materials with others
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">Select Files</Label>
                    <Input
                      id="file"
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      disabled={isUploading}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Selected files ({selectedFiles.length}):
                        </p>
                        <ul className="text-sm space-y-1">
                          {selectedFiles.map((file) => (
                            <li
                              key={file.name}
                              className="flex items-center justify-between"
                            >
                              <span className="truncate">{file.name}</span>
                              {uploadProgress[file.name] !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {uploadProgress[file.name]}%
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description for your files"
                      disabled={isUploading}
                    />
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="public"
                        checked={isPublic}
                        onCheckedChange={setIsPublic}
                        disabled={isUploading}
                      />
                      <Label htmlFor="public">Make these files public</Label>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || isUploading}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload {selectedFiles.length} File
                      {selectedFiles.length !== 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Files List */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold mb-4">Your Files</h2>
              {isLoading ? (
                <div className="flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : files?.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  No files uploaded yet
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {files?.map((file) => {
                    const FileIcon = getFileIcon(file.file_type);
                    return (
                      <Card key={file.id} className="flex flex-col h-full">
                        <CardHeader className="flex-none">
                          <CardTitle className="flex items-center text-base">
                            <FileIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{file.name}</span>
                          </CardTitle>
                          <CardDescription className="line-clamp-2">
                            {file.description || "No description"}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-none">
                          <div className="text-sm text-muted-foreground">
                            <p className="truncate">Type: {file.file_type}</p>
                            <p>Size: {formatFileSize(file.file_size)}</p>
                            <p>Public: {file.is_public ? "Yes" : "No"}</p>
                          </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2 mt-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePreview(file)}
                            className="w-full text-xs sm:text-sm"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                            <span className="ml-1 sm:ml-2 hidden sm:inline">
                              Preview
                            </span>
                          </Button>
                          <div className="flex gap-1 sm:gap-2 w-full">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownload(file)}
                              className="flex-1 text-xs sm:text-sm"
                            >
                              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 sm:ml-2 hidden sm:inline">
                                Download
                              </span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(file)}
                              className="flex-1 text-xs sm:text-sm"
                            >
                              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span className="ml-1 sm:ml-2 hidden sm:inline">
                                Delete
                              </span>
                            </Button>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={!!previewFile} onOpenChange={closePreview}>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>{previewFile?.name}</DialogTitle>
                  <DialogDescription>
                    {previewFile?.description || "No description"}
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">{renderPreview()}</div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
