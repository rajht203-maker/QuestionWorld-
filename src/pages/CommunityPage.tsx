import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  CommunityPost,
  CommunityComment,
  CommunityRestriction
} from '../types';
import {
  fetchCommunityPosts,
  subscribeToCommunityPosts,
  createCommunityPost,
  togglePostLike,
  addPostComment,
  adminDisablePost,
  adminEnablePost,
  adminTogglePinPost,
  deleteCommunityPost,
  checkUserRestriction,
  getLocalRestrictions,
  saveUserRestriction
} from '../services/communityService';
import {
  MessageSquare,
  Heart,
  Share2,
  Image as ImageIcon,
  FileText,
  Pin,
  Trash2,
  Shield,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
  Send,
  X,
  Search,
  Plus,
  Sparkles,
  Award,
  Flame,
  HelpCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Download,
  Paperclip,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface CommunityPageProps {
  currentUser: User | null;
  isAdmin: boolean;
  onShowToast: (message: string, type?: 'success' | 'info' | 'error') => void;
  onNavigateToSubject?: (subjectKey: string) => void;
}

const MATH_SCIENCE_SYMBOLS = ['√', 'π', 'θ', '∑', '∆', '²', '³', '±', '÷', '×', '∝', '→', '⇌', 'Ω', '°C', 'λ'];

export const CommunityPage: React.FC<CommunityPageProps> = ({
  currentUser,
  isAdmin,
  onShowToast,
  onNavigateToSubject,
}) => {
  // Posts & Loading
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showDisabledOnly, setShowDisabledOnly] = useState<boolean>(false);

  // Post Creator State
  const [isCreatingPost, setIsCreatingPost] = useState<boolean>(false);
  const [newContent, setNewContent] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Science');
  const [newTag, setNewTag] = useState<CommunityPost['tag']>('Doubt');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [attachmentData, setAttachmentData] = useState<{
    name: string;
    url: string;
    type: string;
  } | null>(null);
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);

  // Comment Thread State (per post open state)
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Image Lightbox Modal
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null);

  // Admin Conductor Disable Modal
  const [disableModalPost, setDisableModalPost] = useState<CommunityPost | null>(null);
  const [disableReason, setDisableReason] = useState<string>('');

  // Admin User Restrictions Modal
  const [showRestrictionsModal, setShowRestrictionsModal] = useState<boolean>(false);
  const [restrictionEmail, setRestrictionEmail] = useState<string>('');
  const [restrictionReason, setRestrictionReason] = useState<string>('Violation of community academic guidelines');
  const [restrictPosting, setRestrictPosting] = useState<boolean>(true);
  const [restrictCommenting, setRestrictCommenting] = useState<boolean>(true);
  const [allRestrictions, setAllRestrictions] = useState<Record<string, CommunityRestriction>>({});

  // Current User's restriction status
  const [myRestriction, setMyRestriction] = useState<CommunityRestriction | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load posts and real-time subscription
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    const loadInitial = async () => {
      setLoading(true);
      const initialPosts = await fetchCommunityPosts();
      setPosts(initialPosts);
      setLoading(false);

      unsubscribe = subscribeToCommunityPosts(updatedPosts => {
        setPosts(updatedPosts);
      });
    };

    loadInitial();
    return () => unsubscribe();
  }, []);

  // Check user restriction status
  useEffect(() => {
    if (currentUser?.email) {
      checkUserRestriction(currentUser.email).then(setMyRestriction);
    } else {
      setMyRestriction(null);
    }
  }, [currentUser]);

  // Load all restrictions for admin
  useEffect(() => {
    if (isAdmin) {
      setAllRestrictions(getLocalRestrictions());
    }
  }, [isAdmin, showRestrictionsModal]);

  // Handle Image Upload -> Base64
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      onShowToast('Image size must be less than 3MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setImagePreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle File / PDF Attachment -> Base64
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('File size must be under 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = ev => {
      setAttachmentData({
        name: file.name,
        url: ev.target?.result as string,
        type: file.type || 'application/octet-stream',
      });
      onShowToast(`Attached file: ${file.name}`, 'info');
    };
    reader.readAsDataURL(file);
  };

  // Insert Symbol into Content
  const handleInsertSymbol = (sym: string) => {
    setNewContent(prev => prev + sym);
  };

  // Submit Post
  const handleCreatePost = async () => {
    if (!newContent.trim()) {
      onShowToast('Please enter some text or doubt description', 'error');
      return;
    }

    if (myRestriction && myRestriction.isRestricted && !myRestriction.canPost) {
      onShowToast(`You are restricted from posting: ${myRestriction.reason || 'Conductor restriction'}`, 'error');
      return;
    }

    setIsSubmittingPost(true);
    try {
      const authorId = currentUser?.uid || 'guest-student';
      const authorName = currentUser?.displayName || 'Class 10 Scholar';
      const authorEmail = currentUser?.email || 'scholar@cbseclass10.edu';
      const authorPhoto = currentUser?.photoURL || undefined;

      await createCommunityPost({
        authorId,
        authorName,
        authorEmail,
        authorPhoto,
        content: newContent.trim(),
        subject: newSubject,
        tag: newTag,
        imageUrl: imagePreview || undefined,
        attachmentName: attachmentData?.name,
        attachmentUrl: attachmentData?.url,
        attachmentType: attachmentData?.type,
        isPinned: false
      });

      onShowToast('Post shared to the Scholar Community!', 'success');
      setNewContent('');
      setImagePreview(null);
      setAttachmentData(null);
      setIsCreatingPost(false);
    } catch (err) {
      console.error(err);
      onShowToast('Failed to create post. Please try again.', 'error');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Toggle Like
  const handleLike = async (postId: string) => {
    const userIdentifier = currentUser?.email || currentUser?.uid || 'guest';
    const updated = await togglePostLike(postId, userIdentifier);
    if (updated) {
      setPosts(prev => prev.map(p => (p.id === postId ? updated : p)));
    }
  };

  // Toggle Comments visibility
  const toggleComments = (postId: string) => {
    setOpenComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Submit Comment
  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;

    if (myRestriction && myRestriction.isRestricted && !myRestriction.canComment) {
      onShowToast(`You are restricted from commenting: ${myRestriction.reason || 'Conductor restriction'}`, 'error');
      return;
    }

    setSubmittingComment(prev => ({ ...prev, [postId]: true }));
    try {
      const authorId = currentUser?.uid || 'guest-student';
      const authorName = currentUser?.displayName || 'Class 10 Scholar';
      const authorEmail = currentUser?.email || 'scholar@cbseclass10.edu';
      const authorPhoto = currentUser?.photoURL || undefined;

      const newComm = await addPostComment(postId, {
        authorId,
        authorName,
        authorEmail,
        authorPhoto,
        text
      });

      if (newComm) {
        setPosts(prev =>
          prev.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                comments: [...p.comments, newComm],
                commentsCount: p.comments.length + 1
              };
            }
            return p;
          })
        );
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        onShowToast('Comment posted!', 'success');
      }
    } catch (err) {
      console.error(err);
      onShowToast('Failed to post comment', 'error');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }));
    }
  };

  // Admin Actions
  const handleOpenDisableModal = (post: CommunityPost) => {
    setDisableModalPost(post);
    setDisableReason('');
  };

  const handleConfirmDisable = async () => {
    if (!disableModalPost) return;
    const adminEmail = currentUser?.email || 'admin@cbseclass10.edu';
    await adminDisablePost(
      disableModalPost.id,
      disableReason.trim() || 'Moderated by Admin Conductor for academic guideline compliance',
      adminEmail
    );
    setPosts(prev =>
      prev.map(p =>
        p.id === disableModalPost.id
          ? {
              ...p,
              isDisabled: true,
              disabledReason: disableReason.trim() || 'Moderated by Admin Conductor',
              disabledBy: adminEmail
            }
          : p
      )
    );
    onShowToast('Post disabled and hidden from student feed.', 'info');
    setDisableModalPost(null);
  };

  const handleEnablePost = async (postId: string) => {
    await adminEnablePost(postId);
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isDisabled: false, disabledReason: undefined, disabledBy: undefined } : p))
    );
    onShowToast('Post restored and visible again.', 'success');
  };

  const handleTogglePin = async (postId: string, currentPin: boolean) => {
    await adminTogglePinPost(postId, !currentPin);
    setPosts(prev =>
      prev.map(p => (p.id === postId ? { ...p, isPinned: !currentPin } : p))
    );
    onShowToast(!currentPin ? 'Post pinned to top!' : 'Post unpinned', 'info');
  };

  const handleDeletePost = async (postId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this post?')) {
      await deleteCommunityPost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      onShowToast('Post deleted', 'info');
    }
  };

  // Admin Save Restriction
  const handleSaveRestriction = async () => {
    if (!restrictionEmail.trim()) {
      onShowToast('Please enter user email to restrict', 'error');
      return;
    }
    const adminEmail = currentUser?.email || 'conductor@cbseclass10.edu';
    const emailClean = restrictionEmail.trim().toLowerCase();
    const newRest: CommunityRestriction = {
      id: `rest-${Date.now()}`,
      userEmail: emailClean,
      isRestricted: true,
      reason: restrictionReason.trim(),
      restrictedBy: adminEmail,
      restrictedAt: new Date().toISOString(),
      canPost: !restrictPosting,
      canComment: !restrictCommenting,
    };

    await saveUserRestriction(newRest);
    setAllRestrictions(prev => ({
      ...prev,
      [emailClean.replace(/[^a-z0-9]/g, '_')]: newRest
    }));
    onShowToast(`Restrictions applied to ${emailClean}`, 'success');
    setRestrictionEmail('');
  };

  const handleLiftRestriction = async (emailKey: string) => {
    const item = allRestrictions[emailKey];
    if (!item) return;

    const lifted: CommunityRestriction = {
      ...item,
      isRestricted: false,
      canPost: true,
      canComment: true
    };
    await saveUserRestriction(lifted);
    setAllRestrictions(prev => {
      const copy = { ...prev };
      delete copy[emailKey];
      return copy;
    });
    onShowToast(`Restrictions lifted for ${item.userEmail}`, 'info');
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    // If post is disabled, regular students shouldn't see it (or only see masked state)
    if (!isAdmin && post.isDisabled) {
      return false;
    }

    if (showDisabledOnly && !post.isDisabled) return false;

    if (selectedSubject !== 'all' && (post.subject || '').toLowerCase() !== selectedSubject.toLowerCase()) {
      return false;
    }

    if (selectedTag !== 'all' && post.tag !== selectedTag) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchContent = (post.content || '').toLowerCase().includes(q);
      const matchAuthor = (post.authorName || '').toLowerCase().includes(q);
      const matchSubject = (post.subject || '').toLowerCase().includes(q);
      const matchTag = (post.tag || '').toLowerCase().includes(q);
      if (!matchContent && !matchAuthor && !matchSubject && !matchTag) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12 max-w-7xl mx-auto">
      {/* RESTRICTION WARNING IF ACTIVE ON CURRENT USER */}
      {myRestriction && myRestriction.isRestricted && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 shadow-xs animate-in fade-in">
          <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-sm">
              Community Moderation Notice: Your account has posting restrictions
            </p>
            <p>
              Reason: <span className="font-semibold">{myRestriction.reason || 'Academic policy violation'}</span>
            </p>
            <div className="flex gap-4 pt-1 font-medium">
              <span>Posting Privileges: {myRestriction.canPost ? '✅ Allowed' : '🚫 Restricted'}</span>
              <span>Commenting Privileges: {myRestriction.canComment ? '✅ Allowed' : '🚫 Restricted'}</span>
            </div>
          </div>
        </div>
      )}

      {/* HERO BANNER & ATMOSPHERE */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white p-6 md:p-8 shadow-xl border border-indigo-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-indigo-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Study Lounge • 140+ Class 10 Scholars Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
              Class 10 Scholar Community & Doubts
            </h1>
            <p className="text-indigo-200 text-xs sm:text-sm leading-relaxed">
              Ask tricky NCERT numericals, share verified handwritten notes, solve board sample paper doubts,
              and conquer CBSE Board Examinations together!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowRestrictionsModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600/80 hover:bg-violet-600 text-white font-bold text-xs sm:text-sm backdrop-blur-xs border border-violet-400/30 transition-all cursor-pointer shadow-md"
              >
                <Shield className="w-4 h-4 text-violet-200" />
                <span>Conductor Restrictions ({Object.keys(allRestrictions).length})</span>
              </button>
            )}

            <button
              onClick={() => setIsCreatingPost(prev => !prev)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-indigo-600/30 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingPost ? 'Close Composer' : 'Ask Doubt or Share Post'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* POST COMPOSER MODAL / ACCORDION */}
      {isCreatingPost && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 md:p-6 border-2 border-indigo-500/40 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Create a Community Post or Ask a Doubt
              </h3>
            </div>
            <button
              onClick={() => setIsCreatingPost(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Subject & Tag Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Subject
              </label>
              <select
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Science">Science (Physics, Chemistry, Biology)</option>
                <option value="Mathematics">Mathematics (Standard & Basic)</option>
                <option value="Social Science">Social Science (History, Geo, Civics, Eco)</option>
                <option value="English">English Language & Literature</option>
                <option value="General">General / Board Strategy / Exam Tips</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Post Category
              </label>
              <select
                value={newTag}
                onChange={e => setNewTag(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Doubt">❓ Doubt / Question Help</option>
                <option value="Study Notes">📝 Handwritten Notes / Formula Sheet</option>
                <option value="Tips & Tricks">⚡ Exam Tips & Mnemonic Shortcuts</option>
                <option value="Question Paper">📄 Sample Paper / HOTS Question</option>
                <option value="Solution">💡 Step-by-Step Solution</option>
                <option value="General">💬 Discussion / General</option>
              </select>
            </div>
          </div>

          {/* Math & Science Symbol Keyboard Bar */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Quick Math & Science Symbols (Click to insert):
            </span>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700">
              {MATH_SCIENCE_SYMBOLS.map(sym => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => handleInsertSymbol(sym)}
                  className="px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          {/* Text Content Area */}
          <div>
            <textarea
              rows={4}
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Describe your question in detail, paste numericals, or share study insights... (e.g. 'How do we calculate the effective resistance when 3 resistors are in parallel?')"
              className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 resize-y"
            />
          </div>

          {/* Image & File Previews */}
          {(imagePreview || attachmentData) && (
            <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700">
              {imagePreview && (
                <div className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setImagePreview(null)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {attachmentData && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200">
                  <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span className="font-semibold truncate max-w-[200px]">
                    {attachmentData.name}
                  </span>
                  <button
                    onClick={() => setAttachmentData(null)}
                    className="p-1 rounded-full hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300 ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Composer Footer Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Attach Diagram / Photo</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
              >
                <Paperclip className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <span>Attach Notes / PDF</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreatingPost(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingPost || !newContent.trim()}
                onClick={handleCreatePost}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingPost ? 'Posting...' : 'Publish Post'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN LAYOUT: FEEDS (LEFT) & ENGAGEMENT WIDGETS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT COLUMN: FILTERS & POSTS STREAM (3 COLS) */}
        <div className="lg:col-span-3 space-y-4">
          {/* SEARCH & FILTER CONTROLS */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search community posts, doubts, formulas or student names..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Subject Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All Subjects' },
                { id: 'Science', label: 'Science' },
                { id: 'Mathematics', label: 'Mathematics' },
                { id: 'Social Science', label: 'Social Science' },
                { id: 'English', label: 'English' },
                { id: 'General', label: 'Tips & Strategy' },
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubject(sub.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ${
                    selectedSubject === sub.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/70 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {sub.label}
                </button>
              ))}

              {isAdmin && (
                <button
                  onClick={() => setShowDisabledOnly(prev => !prev)}
                  className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all cursor-pointer ml-auto flex items-center gap-1 ${
                    showDisabledOnly
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/70 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Moderated Posts</span>
                </button>
              )}
            </div>

            {/* Category / Tag Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <span className="text-slate-400 font-semibold shrink-0">Tags:</span>
              {['all', 'Doubt', 'Study Notes', 'Tips & Tricks', 'Question Paper', 'Solution'].map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2.5 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                    selectedTag === tag
                      ? 'bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 font-bold border border-violet-300 dark:border-violet-700'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tag === 'all' ? 'All Tags' : tag}
                </button>
              ))}
            </div>
          </div>

          {/* POSTS LIST */}
          {loading ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Connecting to Scholar Community...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 space-y-3">
              <HelpCircle className="w-10 h-10 text-indigo-400 mx-auto opacity-70" />
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                No community posts match your criteria
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Be the first scholar to ask a question or share valuable Class 10 study tips!
              </p>
              <button
                onClick={() => setIsCreatingPost(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Post</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map(post => {
                const userIdentifier = currentUser?.email || currentUser?.uid || 'guest';
                const hasLiked = post.likedBy?.includes(userIdentifier);
                const isAuthor = currentUser?.uid === post.authorId || currentUser?.email === post.authorEmail;
                const canModerate = isAdmin;
                const isPostDisabled = post.isDisabled;

                return (
                  <article
                    key={post.id}
                    className={`rounded-2xl transition-all overflow-hidden ${
                      post.isPinned
                        ? 'bg-gradient-to-r from-amber-500/10 via-white to-amber-500/10 dark:from-amber-950/20 dark:via-slate-800 dark:to-amber-950/20 border-2 border-amber-400/60 dark:border-amber-500/40 shadow-md'
                        : isPostDisabled
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-800/60'
                        : 'bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* PINNED BADGE */}
                    {post.isPinned && (
                      <div className="bg-amber-500 text-white px-4 py-1 text-[11px] font-bold flex items-center gap-1.5 shadow-inner">
                        <Pin className="w-3 h-3 fill-white" />
                        <span>Pinned by Admin Conductor • Important Board Announcement</span>
                      </div>
                    )}

                    {/* DISABLED NOTICE IF MODERATED */}
                    {isPostDisabled && (
                      <div className="bg-rose-500 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Post Moderated: {post.disabledReason || 'Under academic review'}</span>
                        </span>
                        {canModerate && (
                          <button
                            onClick={() => handleEnablePost(post.id)}
                            className="underline text-[11px] hover:text-rose-100 cursor-pointer"
                          >
                            Restore Post
                          </button>
                        )}
                      </div>
                    )}

                    <div className="p-4 md:p-5 space-y-3.5">
                      {/* POST HEADER: AUTHOR & BADGES & ACTIONS */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Author Avatar */}
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                            {post.authorPhoto ? (
                              <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                            ) : (
                              post.authorName.charAt(0).toUpperCase()
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {post.authorName}
                              </span>

                              {post.authorEmail.includes('admin') || post.authorEmail === 'princerajmth5@gmail.com' || post.authorEmail === 'rajht203@gmail.com' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 text-[10px] font-extrabold uppercase tracking-wide">
                                  <Shield className="w-3 h-3" />
                                  <span>Conductor</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-semibold">
                                  Scholar
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>
                                {new Date(post.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span>•</span>
                              <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                                {post.subject || 'All Subjects'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CATEGORY TAG & MODERATION DROPDOWN */}
                        <div className="flex items-center gap-2">
                          {post.tag && (
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                              {post.tag}
                            </span>
                          )}

                          {/* Conductor & Author Controls */}
                          <div className="flex items-center gap-1">
                            {canModerate && (
                              <>
                                <button
                                  onClick={() => handleTogglePin(post.id, !!post.isPinned)}
                                  title={post.isPinned ? 'Unpin' : 'Pin to top'}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    post.isPinned
                                      ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/60'
                                      : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                  }`}
                                >
                                  <Pin className="w-4 h-4" />
                                </button>

                                {!post.isDisabled ? (
                                  <button
                                    onClick={() => handleOpenDisableModal(post)}
                                    title="Conductor: Disable / Mute Post"
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                  >
                                    <EyeOff className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEnablePost(post.id)}
                                    title="Conductor: Restore Post"
                                    className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}

                            {(canModerate || isAuthor) && (
                              <button
                                onClick={() => handleDeletePost(post.id)}
                                title="Delete Post"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* POST CONTENT BODY */}
                      <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                        {post.content}
                      </div>

                      {/* IMAGE ATTACHMENT (WITH CLICK-TO-EXPAND LIGHTBOX) */}
                      {post.imageUrl && (
                        <div className="pt-1">
                          <div
                            onClick={() => setPreviewImageModal(post.imageUrl!)}
                            className="relative max-h-96 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 group cursor-pointer"
                          >
                            <img
                              src={post.imageUrl}
                              alt="Post attachment"
                              className="w-full h-full object-contain max-h-96 transition-transform group-hover:scale-[1.01]"
                            />
                            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              <span>Click to Expand</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* DOCUMENT / NOTES ATTACHMENT */}
                      {post.attachmentName && post.attachmentUrl && (
                        <div className="pt-1">
                          <a
                            href={post.attachmentUrl}
                            download={post.attachmentName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-600 transition-colors text-xs font-semibold text-slate-800 dark:text-slate-200 group"
                          >
                            <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="group-hover:text-indigo-600 transition-colors">
                              {post.attachmentName}
                            </span>
                            <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                          </a>
                        </div>
                      )}

                      {/* POST ACTIONS BAR: LIKE, COMMENT, SHARE */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center gap-4">
                          {/* Like Button */}
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                              hasLiked
                                ? 'text-rose-600 font-bold bg-rose-50 dark:bg-rose-950/60'
                                : 'text-slate-500 dark:text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-600' : ''}`} />
                            <span>{post.likesCount || 0}</span>
                            <span className="hidden sm:inline">Upvotes</span>
                          </button>

                          {/* Comment Button */}
                          <button
                            onClick={() => toggleComments(post.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.commentsCount || post.comments?.length || 0}</span>
                            <span className="hidden sm:inline">Discussions</span>
                          </button>
                        </div>

                        {/* Copy Link / Share Button */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}#community-${post.id}`);
                            onShowToast('Post link copied to clipboard!', 'info');
                          }}
                          className="flex items-center gap-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Share</span>
                        </button>
                      </div>

                      {/* EXPANDABLE COMMENTS & REPLIES THREAD */}
                      {openComments[post.id] && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 space-y-3 animate-in fade-in duration-200">
                          {/* Existing Comments */}
                          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                            {post.comments && post.comments.length > 0 ? (
                              post.comments.map(c => (
                                <div
                                  key={c.id}
                                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50 space-y-1 text-xs"
                                >
                                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-slate-800 dark:text-slate-200">
                                        {c.authorName}
                                      </span>
                                      {c.authorEmail.includes('admin') && (
                                        <span className="px-1.5 py-0.2 rounded bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-extrabold text-[9px]">
                                          Conductor
                                        </span>
                                      )}
                                    </div>
                                    <span>
                                      {new Date(c.createdAt).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {c.text}
                                  </p>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-4 text-xs text-slate-400">
                                No discussions yet. Be the first to share an answer or tip!
                              </p>
                            )}
                          </div>

                          {/* New Comment Input */}
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={e =>
                                setCommentInputs(prev => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              onKeyDown={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }
                              }}
                              placeholder="Write a helpful answer or question reply..."
                              className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                            />
                            <button
                              disabled={
                                submittingComment[post.id] ||
                                !(commentInputs[post.id] || '').trim()
                              }
                              onClick={() => handleAddComment(post.id)}
                              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: ENGAGEMENT BOOSTERS & CONDUCTOR TOOLS (1 COL) */}
        <div className="space-y-5">
          {/* COMMUNITY STUDY CHALLENGE / BRAIN TEASER OF THE DAY */}
          <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20">
                Daily Board Teaser
              </span>
              <Flame className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h4 className="font-bold text-sm">
                Science • Light & Refraction
              </h4>
              <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                "A convex lens produces an inverted image of magnification -1 on a screen at 40 cm. What is the focal length of the lens?"
              </p>
            </div>
            <div className="pt-1">
              <button
                onClick={() => {
                  setIsCreatingPost(true);
                  setNewContent('💡 Solution for Daily Board Teaser (Convex Lens):\n\nSince magnification m = -v/u = -1, the object is placed at 2F (center of curvature).\nImage distance v = +40 cm, so 2f = 40 cm => f = +20 cm.');
                  setNewSubject('Science');
                  setNewTag('Solution');
                }}
                className="w-full py-1.5 rounded-xl bg-white text-indigo-900 font-bold text-xs hover:bg-indigo-50 transition-colors cursor-pointer text-center"
              >
                Post Your Answer & Discuss
              </button>
            </div>
          </div>

          {/* SCHOLAR LEADERBOARD */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Top Scholar Contributors</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">This Week</span>
            </div>

            <div className="space-y-2">
              {[
                { name: 'Arjun Sharma', medal: '🥇', doubtsSolved: 19, points: 940 },
                { name: 'Priya Patel', medal: '🥈', doubtsSolved: 14, points: 720 },
                { name: 'Rohan Mehra', medal: '🥉', doubtsSolved: 11, points: 580 },
                { name: 'Ananya Roy', medal: '⭐', doubtsSolved: 8, points: 410 },
              ].map(scholar => (
                <div
                  key={scholar.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700/50 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{scholar.medal}</span>
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        {scholar.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {scholar.doubtsSolved} doubts answered
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                    {scholar.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* COMMUNITY GUIDELINES & CONDUCTOR CODE */}
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-500" />
              <span>Lounge Guidelines</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] list-disc list-inside text-slate-500 dark:text-slate-400 leading-relaxed">
              <li>Keep questions strictly centered on CBSE Class 10 curriculum.</li>
              <li>Explain steps clearly when posting mathematical derivations.</li>
              <li>Respect fellow scholars; zero tolerance for offensive or promotional content.</li>
              <li>Conductors actively moderate and can disable abusive posts immediately.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* LIGHTBOX MODAL FOR EXPANDED IMAGE PREVIEW */}
      {previewImageModal && (
        <div
          onClick={() => setPreviewImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2 border border-slate-700"
          >
            <button
              onClick={() => setPreviewImageModal(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImageModal}
              alt="Full preview"
              className="w-full h-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* CONDUCTOR DISABLE POST MODAL */}
      {disableModalPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Admin Conductor: Moderate & Disable Post
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Disabling this post will hide it from the active student community feed. You can specify a reason that will be recorded in the audit trail.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs italic text-slate-600 dark:text-slate-300 line-clamp-3">
              "{disableModalPost.content}"
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Moderation Reason:
              </label>
              <input
                type="text"
                value={disableReason}
                onChange={e => setDisableReason(e.target.value)}
                placeholder="e.g. Non-academic content / Off-topic spam / Inappropriate tone"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDisableModalPost(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDisable}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Disable Post Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONDUCTOR USER RESTRICTIONS MANAGEMENT MODAL */}
      {showRestrictionsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-xl w-full p-5 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Conductor Community Restrictions Manager
                </h3>
              </div>
              <button
                onClick={() => setShowRestrictionsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ADD NEW RESTRICTION */}
            <div className="p-4 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60 space-y-3">
              <h4 className="font-bold text-xs text-violet-900 dark:text-violet-200 flex items-center gap-1.5">
                <UserX className="w-4 h-4" />
                <span>Restrict a Specific User Email</span>
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  User Email Address:
                </label>
                <input
                  type="email"
                  value={restrictionEmail}
                  onChange={e => setRestrictionEmail(e.target.value)}
                  placeholder="student.email@example.com"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  Reason for Restriction:
                </label>
                <input
                  type="text"
                  value={restrictionReason}
                  onChange={e => setRestrictionReason(e.target.value)}
                  placeholder="e.g. Repeated spam or non-academic behavior"
                  className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restrictPosting}
                    onChange={e => setRestrictPosting(e.target.checked)}
                    className="rounded text-violet-600"
                  />
                  <span>Block New Posts</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restrictCommenting}
                    onChange={e => setRestrictCommenting(e.target.checked)}
                    className="rounded text-violet-600"
                  />
                  <span>Block Comments</span>
                </label>
              </div>

              <button
                onClick={handleSaveRestriction}
                className="w-full py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Apply User Restriction
              </button>
            </div>

            {/* CURRENT ACTIVE RESTRICTIONS LIST */}
            <div className="space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                Active Restrictions ({Object.keys(allRestrictions).length})
              </h4>

              {Object.keys(allRestrictions).length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No active user restrictions. The community is healthy!
                </p>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {Object.entries(allRestrictions).map(([key, rest]) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {rest.userEmail}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {rest.reason} • {!rest.canPost ? 'No Posts' : ''} {!rest.canComment ? 'No Comments' : ''}
                        </div>
                      </div>

                      <button
                        onClick={() => handleLiftRestriction(key)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] hover:bg-emerald-200 cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Lift</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
