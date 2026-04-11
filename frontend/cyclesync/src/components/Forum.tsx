import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ForumPost } from '@/types';
import { MessageSquare, Heart, Share2, Send, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, increment } from 'firebase/firestore';

export function Forum() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    const path = 'forum_posts';
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ForumPost));
      setPosts(fetchedPosts);
    }, (error) => handleFirestoreError(error, OperationType.LIST, path));
    return () => unsubscribe();
  }, []);

  const handlePost = async () => {
    if (!newPostContent.trim() || !auth.currentUser) return;
    const path = 'forum_posts';
    const newPost = {
      authorId: auth.currentUser.uid,
      authorName: `CycleWarrior${Math.floor(Math.random() * 1000)}`,
      content: newPostContent,
      timestamp: new Date().toISOString(),
      likes: 0,
      tags: ['General']
    };

    try {
      await addDoc(collection(db, path), newPost);
      setNewPostContent('');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
    }
  };

  const handleLike = async (postId: string) => {
    const path = `forum_posts/${postId}`;
    try {
      await updateDoc(doc(db, path), {
        likes: increment(1)
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, path);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-rose-600" />
          <h2 className="text-2xl font-serif font-bold text-rose-900">Community Forum</h2>
        </div>
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1">
          <ShieldCheck className="w-3 h-3" /> Anonymous
        </Badge>
      </div>

      <Card className="border-none shadow-md bg-white overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold">
              A
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                placeholder="Share your experience or ask a question anonymously..."
                className="w-full min-h-[100px] p-3 rounded-xl border border-rose-100 focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none text-sm"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handlePost} className="bg-rose-500 hover:bg-rose-600 text-white rounded-full px-6">
                  <Send className="w-4 h-4 mr-2" /> Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold">
                        {post.authorName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{post.authorName}</p>
                        <p className="text-xs text-gray-500">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[10px] bg-rose-50 text-rose-600 border-none">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 text-sm leading-relaxed">{post.content}</p>
                </CardContent>
                <CardFooter className="pt-0 flex gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 text-gray-400 hover:text-rose-500 transition-colors text-xs"
                  >
                    <Heart className="w-4 h-4" /> {post.likes}
                  </button>
                  <button className="flex items-center gap-1 text-gray-400 hover:text-rose-500 transition-colors text-xs">
                    <MessageSquare className="w-4 h-4" /> Reply
                  </button>
                  <button className="flex items-center gap-1 text-gray-400 hover:text-rose-500 transition-colors text-xs ml-auto">
                    <Share2 className="w-4 h-4" />
                  </button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
