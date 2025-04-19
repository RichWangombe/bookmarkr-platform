import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertBookmarkSchema } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmarkToEdit?: any;
}

const formSchema = insertBookmarkSchema.extend({
  tags: z.array(z.string()).optional(),
});

export function AddBookmarkDialog({
  open,
  onOpenChange,
  bookmarkToEdit,
}: AddBookmarkDialogProps) {
  const { toast } = useToast();
  const [tagInput, setTagInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: "",
      title: "",
      description: "",
      thumbnailUrl: "",
      folderId: undefined,
      favorite: false,
      tags: [],
    },
  });

  // Reset form when dialog opens/closes or when bookmarkToEdit changes
  useEffect(() => {
    if (open) {
      if (bookmarkToEdit) {
        form.reset({
          ...bookmarkToEdit,
          tags: bookmarkToEdit.tags?.map((tag: any) => tag.name) || [],
        });
      } else {
        form.reset({
          url: "",
          title: "",
          description: "",
          thumbnailUrl: "",
          folderId: undefined,
          favorite: false,
          tags: [],
        });
      }
    }
  }, [open, bookmarkToEdit, form]);

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
    enabled: open,
  });

  const bookmarkMutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (bookmarkToEdit) {
        return apiRequest("PATCH", `/api/bookmarks/${bookmarkToEdit.id}`, values);
      } else {
        return apiRequest("POST", "/api/bookmarks", values);
      }
    },
    onSuccess: () => {
      toast({
        title: bookmarkToEdit ? "Bookmark updated" : "Bookmark added",
        description: "Your bookmark has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${bookmarkToEdit ? "update" : "add"} bookmark: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const fetchMetadataMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/metadata", { url });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.title) form.setValue("title", data.title);
      if (data.description) form.setValue("description", data.description);
      if (data.image) form.setValue("thumbnailUrl", data.image);
      if (data.domain) form.setValue("domain", data.domain);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to fetch metadata: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    bookmarkMutation.mutate(values);
  };

  const handleUrlBlur = async () => {
    const url = form.getValues("url");
    if (url && !form.getValues("title")) {
      fetchMetadataMutation.mutate(url);
    }
  };

  const addTag = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && tagInput.trim()) {
      event.preventDefault();
      const tags = form.getValues("tags") || [];
      const normalizedTag = tagInput.trim().toLowerCase();
      
      if (!tags.includes(normalizedTag)) {
        form.setValue("tags", [...tags, normalizedTag]);
      }
      
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const tags = form.getValues("tags") || [];
    form.setValue(
      "tags",
      tags.filter((tag) => tag !== tagToRemove)
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {bookmarkToEdit ? "Edit Bookmark" : "Add New Bookmark"}
          </DialogTitle>
          <DialogDescription>
            Save a website to your bookmarks collection.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://"
                      {...field}
                      onBlur={handleUrlBlur}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add a description..."
                      rows={2}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value) : undefined)
                    }
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a folder" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="">None</SelectItem>
                      {folders?.map((folder: any) => (
                        <SelectItem key={folder.id} value={folder.id.toString()}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="flex flex-wrap items-center gap-2 p-2 border border-gray-200 rounded-md">
                    {field.value?.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className="bg-primary bg-opacity-10 text-primary"
                      >
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1 text-primary"
                          onClick={() => removeTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                    <Input
                      className="flex-1 min-w-[100px] border-0 focus:outline-none focus:ring-0 text-sm p-0"
                      placeholder="Add tags..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={addTag}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="favorite"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    Add to favorites
                  </FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={bookmarkMutation.isPending || fetchMetadataMutation.isPending}
              >
                {bookmarkMutation.isPending || fetchMetadataMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">&#8987;</span>
                    {bookmarkToEdit ? "Updating..." : "Saving..."}
                  </>
                ) : (
                  <>{bookmarkToEdit ? "Update" : "Save"} Bookmark</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
