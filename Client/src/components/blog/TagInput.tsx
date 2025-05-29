"use client";

import { useState, type KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { suggestTagsAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  getBlogContentForAISuggestion?: () => string; // Optional: function to get current blog content
};

export default function TagInput({ value: tags, onChange, getBlogContentForAISuggestion }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoadingAISuggestions, setIsLoadingAISuggestions] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = inputValue.trim().toLowerCase();
      if (newTag && !tags.includes(newTag)) {
        onChange([...tags, newTag]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSuggestTags = async () => {
    if (!getBlogContentForAISuggestion) {
      toast({ title: "Error", description: "Blog content provider not configured for AI suggestions.", variant: "destructive" });
      return;
    }
    const content = getBlogContentForAISuggestion();
    if (!content.trim()) {
      toast({ title: "Cannot Suggest Tags", description: "Please write some content before suggesting tags.", variant: "destructive" });
      return;
    }

    setIsLoadingAISuggestions(true);
    try {
      const suggested = await suggestTagsAction(content);
      if (suggested.length > 0) {
        const newTags = suggested.filter(st => !tags.includes(st.toLowerCase()));
        onChange([...tags, ...newTags.map(t => t.toLowerCase())]);
        toast({ title: "Tags Suggested", description: `${newTags.length} new tags added.` });
      } else {
        toast({ title: "No New Tags", description: "AI couldn't find new relevant tags or no content provided." });
      }
    } catch (error) {
      toast({ title: "AI Suggestion Failed", description: "Could not fetch tag suggestions.", variant: "destructive" });
    } finally {
      setIsLoadingAISuggestions(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <Badge key={tag} variant="secondary" className="py-1 px-2 text-sm">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1.5 appearance-none outline-none focus:ring-1 focus:ring-ring rounded-full"
              aria-label={`Remove ${tag}`}
            >
              <X size={14} className="hover:text-destructive"/>
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Add a tag and press Enter or ,"
          className="flex-grow"
        />
        {getBlogContentForAISuggestion && (
          <Button
            type="button"
            variant="outline"
            onClick={handleSuggestTags}
            disabled={isLoadingAISuggestions}
            className="shrink-0"
          >
            {isLoadingAISuggestions ? (
              <Loader2 size={18} className="animate-spin mr-2" />
            ) : (
              <Sparkles size={18} className="mr-2 text-yellow-400" />
            )}
            Suggest Tags
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Separate tags with commas or by pressing Enter. Use Backspace to delete the last tag.
      </p>
    </div>
  );
}
