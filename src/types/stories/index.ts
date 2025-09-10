export type StoryCategory = 
  | 'childhood' 
  | 'milestones' 
  | 'adventures' 
  | 'synchronicity' 
  | 'achievements' 
  | 'memories'
  | 'other';

export type MediaType = 'photo' | 'video' | 'audio';

export interface StoryMedia {
  id: string;
  type: MediaType;
  uri: string;
  thumbnail?: string;
  duration?: number; // for video/audio in seconds
  size: number;
  mimeType: string;
  compressed?: boolean;
  originalUri?: string;
  caption?: string;
}

export interface StoryLocation {
  latitude: number;
  longitude: number;
  address?: string;
  placeName?: string;
}

export interface StoryMilestone {
  type: 'birthday' | 'anniversary' | 'achievement' | 'first' | 'last' | 'custom';
  date: string;
  ageAtTime?: number;
  significance: string;
}

export interface StoryCollaboration {
  twinId: string;
  contributedAt: string;
  contribution: 'text' | 'media' | 'edit' | 'comment';
  content?: string;
}

export interface StoryComment {
  id: string;
  authorId: string;
  content: string;
  timestamp: string;
  isEdited?: boolean;
}

export interface Story {
  id: string;
  title: string;
  content: string;
  category: StoryCategory;
  tags: string[];
  
  // Media attachments
  media: StoryMedia[];
  
  // Metadata
  timestamp: string;
  lastModified: string;
  authorId: string;
  
  // Sharing & privacy
  isShared: boolean;
  isPrivate: boolean;
  sharedWith: string[]; // twin IDs
  sharePermissions: 'view' | 'comment' | 'edit';
  
  // Story features
  milestone?: StoryMilestone;
  location?: StoryLocation;
  collaborations: StoryCollaboration[];
  comments: StoryComment[];
  
  // Engagement
  likes: string[]; // user IDs who liked
  favorites: string[]; // user IDs who favorited
  views: { userId: string; timestamp: string }[];
  
  // Rich content
  richText?: boolean;
  textFormatting?: any; // Rich text editor state
  
  // Anniversary reminders
  anniversaryReminder?: boolean;
  reminderFrequency?: 'yearly' | 'monthly' | 'custom';
  nextReminder?: string;
}

export interface StoryDraft {
  id: string;
  title: string;
  content: string;
  category: StoryCategory;
  tags: string[];
  media: StoryMedia[];
  milestone?: StoryMilestone;
  location?: StoryLocation;
  lastSaved: string;
  autoSaved: boolean;
}

export interface StoryFilter {
  categories?: StoryCategory[];
  tags?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  milestoneOnly?: boolean;
  sharedOnly?: boolean;
  authorId?: string;
  hasMedia?: boolean;
  searchText?: string;
}

export interface StoryStats {
  totalStories: number;
  storiesThisMonth: number;
  categoryCounts: Record<StoryCategory, number>;
  totalMedia: number;
  totalViews: number;
  totalLikes: number;
  collaborationCount: number;
  milestoneCount: number;
}

export interface MemoryTimeline {
  year: number;
  stories: Story[];
  milestones: Story[];
  highlights: Story[];
}