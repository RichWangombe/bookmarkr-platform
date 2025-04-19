import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// Form schema for source suggestion
const sourceSuggestionSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  websiteUrl: z.string().url({
    message: "Please enter a valid URL.",
  }),
  rssUrl: z.string().optional().or(z.literal('')),
  category: z.enum(["technology", "business", "news", "science", "design", "ai"], {
    required_error: "Please select a category.",
  }),
  description: z.string().optional().or(z.literal('')),
  hasRssFeed: z.boolean().default(false),
});

type SourceSuggestionValues = z.infer<typeof sourceSuggestionSchema>;

export function SourceSuggestionDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  // Initialize form
  const form = useForm<SourceSuggestionValues>({
    resolver: zodResolver(sourceSuggestionSchema),
    defaultValues: {
      name: "",
      websiteUrl: "",
      rssUrl: "",
      category: "technology",
      description: "",
      hasRssFeed: false,
    },
  });
  
  // Mutation for submitting a source suggestion
  const submitMutation = useMutation({
    mutationFn: async (values: SourceSuggestionValues) => {
      return await apiRequest('POST', '/api/suggestions/source', values);
    },
    onSuccess: () => {
      toast({
        title: "Source suggestion submitted",
        description: "Thank you for contributing to our content sources!",
      });
      form.reset();
      setOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error submitting suggestion",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  function onSubmit(values: SourceSuggestionValues) {
    // If hasRssFeed is false, make sure rssUrl is empty
    if (!values.hasRssFeed) {
      values.rssUrl = "";
    }
    
    submitMutation.mutate(values);
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/95"
        >
          <i className="ri-add-line"></i>
          Suggest Source
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Suggest a Content Source</DialogTitle>
          <DialogDescription>
            Help us improve content discovery by suggesting websites or RSS feeds
            that you find valuable.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. TechCrunch, The Verge" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the publication or website.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://example.com" 
                      type="url" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    The main website address.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="news">News</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="ai">AI & ML</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The main content category of this source.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hasRssFeed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      This source has an RSS feed
                    </FormLabel>
                    <FormDescription>
                      Check this if you know the website has an RSS feed available.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch("hasRssFeed") && (
              <FormField
                control={form.control}
                name="rssUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RSS Feed URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/rss" 
                        type="url" 
                        {...field}
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormDescription>
                      The direct URL to the RSS feed (if known).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="What makes this source valuable?"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly explain why this source would be a good addition.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={submitMutation.isPending}
              >
                {submitMutation.isPending ? (
                  <>
                    <i className="ri-loader-2-line animate-spin mr-2"></i>
                    Submitting...
                  </>
                ) : (
                  "Submit Suggestion"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}