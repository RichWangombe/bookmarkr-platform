import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle } from "lucide-react";

// Source suggestion schema
const sourceSuggestionSchema = z.object({
  name: z.string().min(2, { message: "Source name must be at least 2 characters" }),
  url: z.string().url({ message: "Please enter a valid URL" }),
  category: z.string().min(1, { message: "Please select a category" }),
  rssUrl: z.string().url({ message: "Please enter a valid RSS URL" }).optional().or(z.literal("")),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
});

type SourceSuggestionForm = z.infer<typeof sourceSuggestionSchema>;

interface SourceSuggestionDialogProps {
  className?: string;
}

export function SourceSuggestionDialog({ className }: SourceSuggestionDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Define form with validation
  const form = useForm<SourceSuggestionForm>({
    resolver: zodResolver(sourceSuggestionSchema),
    defaultValues: {
      name: "",
      url: "",
      category: "",
      rssUrl: "",
      description: "",
    },
  });

  const onSubmit = async (data: SourceSuggestionForm) => {
    try {
      const response = await fetch("/api/suggestions/source", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit suggestion");
      }

      toast({
        title: "Suggestion Submitted",
        description: "Thank you for suggesting a new source!",
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your suggestion. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={`gap-1 text-xs ${className}`}
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Suggest Source</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Suggest a New Source</DialogTitle>
          <DialogDescription>
            Help us grow our content library by suggesting a new website or blog for us to include.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Wired Magazine" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the website or publication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The main URL of the website
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="science">Science</SelectItem>
                      <SelectItem value="ai">AI & Machine Learning</SelectItem>
                      <SelectItem value="culture">Culture & Entertainment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    The primary topic of this source
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rssUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RSS Feed URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.example.com/feed" {...field} />
                  </FormControl>
                  <FormDescription>
                    If you know the RSS feed URL, please provide it
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Why should we add this source?</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us why this source would be valuable to include..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Submit Suggestion</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}