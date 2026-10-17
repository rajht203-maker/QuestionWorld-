import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { CommunityPost, CommunityComment, CommunityRestriction } from '../types';

const LOCAL_COMMUNITY_POSTS_KEY = 'cbse_community_posts_cache';
const LOCAL_RESTRICTIONS_KEY = 'cbse_community_restrictions_cache';

const INITIAL_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 'welcome-post-1',
    authorId: 'admin-seed',
    authorName: 'Board Exam Conductor',
    authorEmail: 'conductor@cbseclass10.edu',
    content: '🎉 Welcome to the QuestionWorld Class 10 Scholar Lounge! Here you can ask your toughest NCERT doubts, share handwritten formulas, discuss sample papers, and prepare together for Board Examinations 2026. Keep discussions polite and academic!',
    subject: 'all',
    tag: 'Tips & Tricks',
    likesCount: 24,
    likedBy: ['student1@cbse-scholars.org', 'student2@cbse-scholars.org'],
    commentsCount: 3,
    comments: [
      {
        id: 'c-1',
        authorId: 'user-arjun',
        authorName: 'Arjun Sharma',
        authorEmail: 'arjun@cbse-scholars.org',
        text: 'Super excited for the 50% competency question practice! Trigonometry and Heredity are my main focus right now.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
      {
        id: 'c-2',
        authorId: 'user-priya',
        authorName: 'Priya Patel',
        authorEmail: 'priya@cbse-scholars.org',
        text: 'Can anyone share quick mnemonic tricks for the Reactivity Series in Science?',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      }
    ],
    isPinned: true,
    isDisabled: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: 'post-math-proofs',
    authorId: 'user-rohit',
    authorName: 'Rohit Verma',
    authorEmail: 'rohit10@cbse-scholars.org',
    content: '⚡ Proving √5 is Irrational (Chapter 1 Real Numbers) - 3 Mark Guarantee! Remember to state the fundamental theorem of arithmetic and show that p and q share a common factor other than 1.',
    subject: 'mathematics',
    tag: 'Study Notes',
    likesCount: 18,
    likedBy: ['student3@cbse-scholars.org'],
    commentsCount: 1,
    comments: [
      {
        id: 'c-3',
        authorId: 'user-meera',
        authorName: 'Meera Sen',
        authorEmail: 'meera@cbse-scholars.org',
        text: 'Yes! CBSE repeatedly asks this theorem almost every year in Section C.',
        createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
      }
    ],
    isPinned: false,
    isDisabled: false,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'post-science-ray-diagrams',
    authorId: 'user-ananya',
    authorName: 'Ananya Gupta',
    authorEmail: 'ananya@cbse-scholars.org',
    content: '🔬 Light - Reflection & Refraction: Quick reminder for concave mirror ray diagrams when the object is between Pole and Focus (P & F) - the image formed is Virtual, Erect, and Enlarged behind the mirror! Watch out for sign conventions: Focal length of concave mirror is always negative (f < 0).',
    subject: 'science',
    tag: 'Doubt',
    likesCount: 31,
    likedBy: ['student1@cbse-scholars.org', 'student4@cbse-scholars.org'],
    commentsCount: 0,
    comments: [],
    isPinned: false,
    isDisabled: false,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

export function getLocalCommunityPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(LOCAL_COMMUNITY_POSTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to parse cached community posts:', err);
  }
  return INITIAL_COMMUNITY_POSTS;
}

export function saveLocalCommunityPosts(posts: CommunityPost[]): void {
  try {
    localStorage.setItem(LOCAL_COMMUNITY_POSTS_KEY, JSON.stringify(posts));
  } catch (err) {
    console.warn('Failed to cache community posts locally:', err);
  }
}

/**
 * Fetch all community posts from Firestore with fallback to cached posts
 */
export async function fetchCommunityPosts(): Promise<CommunityPost[]> {
  try {
    const snap = await getDocs(collection(db, 'communityPosts'));
    const list: CommunityPost[] = [];
    snap.forEach(docSnap => {
      list.push(docSnap.data() as CommunityPost);
    });

    if (list.length > 0) {
      // Sort pinned first, then newest
      list.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      saveLocalCommunityPosts(list);
      return list;
    }
  } catch (err) {
    console.warn('Firestore fetchCommunityPosts failed, using local cache:', err);
  }

  // If Firestore empty, populate with seed posts
  const local = getLocalCommunityPosts();
  return local.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * Real-time subscription to community posts
 */
export function subscribeToCommunityPosts(
  callback: (posts: CommunityPost[]) => void
): () => void {
  try {
    const q = collection(db, 'communityPosts');
    return onSnapshot(
      q,
      snapshot => {
        const list: CommunityPost[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as CommunityPost);
        });

        if (list.length > 0) {
          list.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          saveLocalCommunityPosts(list);
          callback(list);
        } else {
          callback(getLocalCommunityPosts());
        }
      },
      error => {
        console.warn('onSnapshot communityPosts error:', error);
        callback(getLocalCommunityPosts());
      }
    );
  } catch (err) {
    console.warn('subscribeToCommunityPosts failed:', err);
    callback(getLocalCommunityPosts());
    return () => {};
  }
}

/**
 * Create a new community post
 */
export async function createCommunityPost(postData: Omit<CommunityPost, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'likedBy' | 'commentsCount' | 'comments' | 'isDisabled'>): Promise<CommunityPost> {
  const newId = `post-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newPost: CommunityPost = {
    ...postData,
    id: newId,
    likesCount: 0,
    likedBy: [],
    commentsCount: 0,
    comments: [],
    isDisabled: false,
    isPinned: false,
    createdAt: now,
    updatedAt: now,
  };

  // Local update
  const current = getLocalCommunityPosts();
  const updated = [newPost, ...current];
  saveLocalCommunityPosts(updated);

  // Firestore update
  try {
    await setDoc(doc(db, 'communityPosts', newId), newPost);
  } catch (err) {
    console.warn('Firestore setDoc communityPosts failed:', err);
  }

  return newPost;
}

/**
 * Toggle like on a community post
 */
export async function togglePostLike(postId: string, userIdentifier: string): Promise<CommunityPost | null> {
  const posts = getLocalCommunityPosts();
  const index = posts.findIndex(p => p.id === postId);
  if (index === -1) return null;

  const target = { ...posts[index] };
  const hasLiked = target.likedBy.includes(userIdentifier);

  if (hasLiked) {
    target.likedBy = target.likedBy.filter(id => id !== userIdentifier);
    target.likesCount = Math.max(0, target.likesCount - 1);
  } else {
    target.likedBy = [...target.likedBy, userIdentifier];
    target.likesCount += 1;
  }
  target.updatedAt = new Date().toISOString();

  posts[index] = target;
  saveLocalCommunityPosts(posts);

  try {
    await setDoc(doc(db, 'communityPosts', postId), target);
  } catch (err) {
    console.warn('Firestore togglePostLike failed:', err);
  }

  return target;
}

/**
 * Add a comment/message to a post
 */
export async function addPostComment(
  postId: string,
  comment: Omit<CommunityComment, 'id' | 'createdAt'>
): Promise<CommunityComment | null> {
  const posts = getLocalCommunityPosts();
  const index = posts.findIndex(p => p.id === postId);
  if (index === -1) return null;

  const newComment: CommunityComment = {
    ...comment,
    id: `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  const target = { ...posts[index] };
  target.comments = [...target.comments, newComment];
  target.commentsCount = target.comments.length;
  target.updatedAt = new Date().toISOString();

  posts[index] = target;
  saveLocalCommunityPosts(posts);

  try {
    await setDoc(doc(db, 'communityPosts', postId), target);
  } catch (err) {
    console.warn('Firestore addPostComment failed:', err);
  }

  return newComment;
}

/**
 * Admin Conductor: Disable / flag / mute any post
 */
export async function adminDisablePost(
  postId: string,
  reason: string,
  adminEmail: string
): Promise<void> {
  const posts = getLocalCommunityPosts();
  const index = posts.findIndex(p => p.id === postId);
  if (index !== -1) {
    posts[index].isDisabled = true;
    posts[index].disabledReason = reason;
    posts[index].disabledBy = adminEmail;
    posts[index].updatedAt = new Date().toISOString();
    saveLocalCommunityPosts(posts);
  }

  try {
    await updateDoc(doc(db, 'communityPosts', postId), {
      isDisabled: true,
      disabledReason: reason,
      disabledBy: adminEmail,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Firestore adminDisablePost failed:', err);
  }
}

/**
 * Admin Conductor: Re-enable / unhide a disabled post
 */
export async function adminEnablePost(postId: string): Promise<void> {
  const posts = getLocalCommunityPosts();
  const index = posts.findIndex(p => p.id === postId);
  if (index !== -1) {
    posts[index].isDisabled = false;
    delete posts[index].disabledReason;
    delete posts[index].disabledBy;
    posts[index].updatedAt = new Date().toISOString();
    saveLocalCommunityPosts(posts);
  }

  try {
    await updateDoc(doc(db, 'communityPosts', postId), {
      isDisabled: false,
      disabledReason: '',
      disabledBy: '',
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Firestore adminEnablePost failed:', err);
  }
}

/**
 * Admin Conductor: Pin / unpin a post
 */
export async function adminTogglePinPost(postId: string, isPinned: boolean): Promise<void> {
  const posts = getLocalCommunityPosts();
  const index = posts.findIndex(p => p.id === postId);
  if (index !== -1) {
    posts[index].isPinned = isPinned;
    posts[index].updatedAt = new Date().toISOString();
    saveLocalCommunityPosts(posts);
  }

  try {
    await updateDoc(doc(db, 'communityPosts', postId), {
      isPinned,
      updatedAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Firestore adminTogglePinPost failed:', err);
  }
}

/**
 * Delete a post (by Admin or Post Author)
 */
export async function deleteCommunityPost(postId: string): Promise<void> {
  const posts = getLocalCommunityPosts().filter(p => p.id !== postId);
  saveLocalCommunityPosts(posts);

  try {
    await deleteDoc(doc(db, 'communityPosts', postId));
  } catch (err) {
    console.warn('Firestore deleteCommunityPost failed:', err);
  }
}

/**
 * User Restriction Management for Admin Conductor
 */
export function getLocalRestrictions(): Record<string, CommunityRestriction> {
  try {
    const raw = localStorage.getItem(LOCAL_RESTRICTIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to read local restrictions:', err);
  }
  return {};
}

export async function checkUserRestriction(userEmail?: string | null): Promise<CommunityRestriction | null> {
  if (!userEmail) return null;
  const key = userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

  try {
    const snap = await getDoc(doc(db, 'communityRestrictions', key));
    if (snap.exists()) {
      return snap.data() as CommunityRestriction;
    }
  } catch (err) {
    console.warn('Firestore checkUserRestriction error:', err);
  }

  const local = getLocalRestrictions();
  return local[key] || null;
}

export async function saveUserRestriction(restriction: CommunityRestriction): Promise<void> {
  const key = restriction.userEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  const local = getLocalRestrictions();
  local[key] = restriction;
  localStorage.setItem(LOCAL_RESTRICTIONS_KEY, JSON.stringify(local));

  try {
    await setDoc(doc(db, 'communityRestrictions', key), restriction);
  } catch (err) {
    console.warn('Firestore saveUserRestriction failed:', err);
  }
}
