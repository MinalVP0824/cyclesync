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
          <div className="p-2 rounded-xl bg-rose-500 text-white shadow-lg">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-display font-black text-rose-900 dark:text-rose-100 tracking-tight">Community Forum</h2>
        </div>
        <Badge variant="outline" className="bg-emerald-50/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-700/50 gap-1 backdrop-blur-sm font-bold">
          <ShieldCheck className="w-3 h-3" /> Anonymous
        </Badge>
      </div>

      <Card className="border-none glass-card overflow-hidden">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-500 font-black shadow-sm">
              A
            </div>
            <div className="flex-1 space-y-3">
              <textarea
                placeholder="Share your experience or ask a question anonymously..."
                className="w-full min-h-[100px] p-4 rounded-2xl glass border-none focus:ring-2 focus:ring-rose-500 focus:outline-none resize-none text-sm dark:text-white dark:placeholder:text-gray-500 font-medium"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex justify-end">
                <Button onClick={handlePost} className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl px-8 py-6 font-black tracking-tight glass-button border-none shadow-lg">
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
              transition={{ duration: 0.5 }}
            >
              <Card className="border-none glass-card hover:shadow-xl transition-all duration-500 group">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 to-orange-400 flex items-center justify-center text-white text-xs font-black shadow-md group-hover:scale-110 transition-transform">
                        {post.authorName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-display font-black text-gray-900 dark:text-white tracking-tight">{post.authorName}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[50%]">
                      {post.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-rose-100/50 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-none px-2">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed font-medium">{post.content}</p>
                </CardContent>
                <CardFooter className="pt-0 flex gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-all duration-300 text-xs font-black uppercase tracking-widest group/btn"
                  >
                    <div className="p-2 rounded-xl group-hover/btn:bg-rose-50 dark:group-hover/btn:bg-rose-900/20 transition-colors">
                      <Heart className="w-4 h-4 group-hover/btn:fill-current" />
                    </div>
                    {post.likes}
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-all duration-300 text-xs font-black uppercase tracking-widest group/btn">
                    <div className="p-2 rounded-xl group-hover/btn:bg-rose-50 dark:group-hover/btn:bg-rose-900/20 transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    Reply
                  </button>
                  <button className="flex items-center gap-1.5 text-gray-400 hover:text-rose-500 transition-all duration-300 text-xs font-black uppercase tracking-widest group/btn ml-auto">
                    <div className="p-2 rounded-xl group-hover/btn:bg-rose-50 dark:group-hover/btn:bg-rose-900/20 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </div>
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
