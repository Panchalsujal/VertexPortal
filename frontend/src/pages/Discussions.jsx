import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchDiscussions, fetchDiscussionById, addDiscussion,
  acceptAnswer,
  setDiscussionsSnapshot,
  optimisticToggleDiscussionUpvote,
  optimisticToggleReplyUpvote,
  optimisticRemoveDiscussion,
  optimisticRemoveReply,
  optimisticAddReply,
  optimisticModerateDiscussion,
  fetchVoteStatus,
  selectDiscussions, selectCurrentDiscussion, selectDiscussionLoading, selectDiscussionVoteStatus,
} from '../store/slices/discussionsSlice';
import {
  deleteDiscussion,
  deleteDiscussionReply,
  createDiscussionReply,
  updateDiscussionModeration,
  updateDiscussionResolved,
  toggleDiscussionUpvote,
  toggleReplyUpvote,
} from '../api/discussion.api';
import { getAllCourses } from '../api/course.api';
import { MessageSquare, ThumbsUp, CheckCircle, Lock, Pin, Send, Plus, Filter, Trash2, Shield, Unlock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Discussions() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const discussions = useAppSelector(selectDiscussions);
  const current = useAppSelector(selectCurrentDiscussion);
  const loading = useAppSelector(selectDiscussionLoading);
  const voteStatus = useAppSelector(selectDiscussionVoteStatus);

  const [coursesList, setCoursesList] = useState([]);
  const [filterCourseId, setFilterCourseId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [replyText, setReplyText] = useState('');
  const [submittingDiscussion, setSubmittingDiscussion] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // 1. Fetch available courses for dropdowns
  useEffect(() => {
    getAllCourses({ limit: 100 })
      .then((res) => {
        const list = res.data.courses || res.data.data?.courses || res.data.data || [];
        setCoursesList(list);
        if (list.length > 0) {
          setNewCourseId(list[0]._id);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Fetch discussions based on course filter
  useEffect(() => {
    const params = {};
    if (filterCourseId) params.courseId = filterCourseId;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchDiscussions(params));
  }, [dispatch, filterCourseId, statusFilter]);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    if (submittingDiscussion) return;
    if (!newTitle?.trim() || !newBody?.trim() || !newCourseId) {
      return toast.error('Please select a Course and fill all fields');
    }
    setSubmittingDiscussion(true);
    try {
      await dispatch(addDiscussion({ title: newTitle.trim(), content: newBody.trim(), body: newBody.trim(), courseId: newCourseId })).unwrap();
      toast.success('Discussion created');
      setShowCreateModal(false);
      setNewTitle('');
      setNewBody('');
      dispatch(fetchDiscussions(filterCourseId ? { courseId: filterCourseId } : {}));
    } catch (err) {
      toast.error(typeof err === 'string' ? err : err?.message || 'Failed to create discussion');
    } finally {
      setSubmittingDiscussion(false);
    }
  };

  const handleDeleteDiscussion = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this discussion?')) return;
    const snapshot = { list: discussions, current };
    // Optimistic removal
    dispatch(optimisticRemoveDiscussion(discussionId));
    toast.success('Discussion deleted');

    try {
      await deleteDiscussion(discussionId);
      dispatch(fetchDiscussions(filterCourseId ? { courseId: filterCourseId } : {}));
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(err.response?.data?.message || err.message || 'Failed to delete discussion. Action rolled back.');
    }
  };

  const handleDeleteReply = async (replyId) => {
    if (!current || !window.confirm('Delete this reply?')) return;
    const snapshot = { current: { ...current, replies: [...(current.replies || [])] } };
    // Optimistic removal
    dispatch(optimisticRemoveReply({ discussionId: current._id, replyId }));
    toast.success('Reply deleted');

    try {
      await deleteDiscussionReply(current._id, replyId);
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(err.response?.data?.message || err.message || 'Failed to delete reply. Action rolled back.');
    }
  };

  const handleTogglePin = async () => {
    if (!current) return;
    const nextState = !current.isPinned;
    const snapshot = { current: { ...current }, list: [...discussions] };
    // Optimistic toggle
    dispatch(optimisticModerateDiscussion({ id: current._id, data: { isPinned: nextState } }));
    toast.success(nextState ? 'Discussion pinned' : 'Discussion unpinned');

    try {
      await updateDiscussionModeration(current._id, { isPinned: nextState });
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle pin. Action rolled back.');
    }
  };

  const handleToggleLock = async () => {
    if (!current) return;
    const nextState = !current.isLocked;
    const snapshot = { current: { ...current }, list: [...discussions] };
    // Optimistic toggle
    dispatch(optimisticModerateDiscussion({ id: current._id, data: { isLocked: nextState } }));
    toast.success(nextState ? 'Discussion locked' : 'Discussion unlocked');

    try {
      await updateDiscussionModeration(current._id, { isLocked: nextState });
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle lock. Action rolled back.');
    }
  };

  const handleToggleResolved = async () => {
    if (!current) return;
    const nextState = !current.isResolved;
    const snapshot = { current: { ...current }, list: [...discussions] };
    // Optimistic toggle
    dispatch(optimisticModerateDiscussion({ id: current._id, data: { isResolved: nextState } }));
    toast.success(nextState ? 'Discussion marked resolved' : 'Discussion reopened');

    try {
      await updateDiscussionResolved(current._id, { isResolved: nextState });
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(err.response?.data?.message || err.message || 'Failed to update resolved status. Action rolled back.');
    }
  };

  const handleSelectDiscussion = (id) => {
    dispatch(fetchDiscussionById(id));
  };

  const handleAddReply = async (e) => {
    e.preventDefault();
    if (submittingReply || !replyText?.trim() || !current) return;
    const content = replyText.trim();
    setReplyText('');
    setSubmittingReply(true);

    const tempReplyId = 'temp-' + Date.now();
    const tempReply = {
      _id: tempReplyId,
      content,
      user: {
        _id: user?._id || user?.id || 'temp-user',
        fullName: user?.fullName || user?.name || 'You',
        avatar: user?.avatar || null,
      },
      upvoteCount: 0,
      isAccepted: false,
      createdAt: new Date().toISOString(),
    };

    const snapshot = { current: { ...current, replies: [...(current.replies || [])] } };
    // Optimistically add reply
    dispatch(optimisticAddReply({ discussionId: current._id, reply: tempReply }));
    toast.success('Reply posted');

    try {
      await createDiscussionReply(current._id, { content });
      dispatch(fetchDiscussionById(current._id));
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      setReplyText(content);
      toast.error(err.response?.data?.message || err.message || 'Failed to post reply. Action rolled back.');
    } finally {
      setSubmittingReply(false);
    }
  };

  // 3. Fetch vote status when selecting a discussion
  useEffect(() => {
    if (current?._id) {
      dispatch(fetchVoteStatus(current._id));
    }
  }, [current?._id, dispatch]);

  const handleUpvoteDiscussion = async (id) => {
    const snapshot = {
      current: current ? { ...current } : null,
      list: [...discussions],
      voteStatus: voteStatus ? { ...voteStatus } : null,
    };
    // Optimistic toggle
    dispatch(optimisticToggleDiscussionUpvote({ id }));

    try {
      await toggleDiscussionUpvote(id);
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(typeof err === 'string' ? err : err?.response?.data?.message || err?.message || 'Failed to update vote. Rolled back.');
    }
  };

  const handleUpvoteReply = async (replyId) => {
    if (!current) return;
    const snapshot = {
      current: { ...current, replies: (current.replies || []).map((r) => ({ ...r })) },
      voteStatus: voteStatus ? { ...voteStatus, replyUpvotes: [...(voteStatus.replyUpvotes || [])] } : null,
    };
    // Optimistic toggle
    dispatch(optimisticToggleReplyUpvote({ replyId }));

    try {
      await toggleReplyUpvote(current._id, replyId);
    } catch (err) {
      // Rollback
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(typeof err === 'string' ? err : err?.response?.data?.message || err?.message || 'Failed to update reply vote. Rolled back.');
    }
  };

  const handleAcceptAnswer = async (replyId) => {
    if (!current) return;
    const snapshot = { current: { ...current, replies: (current.replies || []).map(r => ({ ...r, isAccepted: r._id === replyId })) } };
    dispatch(setDiscussionsSnapshot({ current: { ...current, replies: (current.replies || []).map(r => ({ ...r, isAccepted: r._id === replyId })) } }));
    toast.success('Answer marked as accepted');

    try {
      await dispatch(acceptAnswer({ discussionId: current._id, replyId })).unwrap();
    } catch (err) {
      dispatch(setDiscussionsSnapshot(snapshot));
      toast.error(err?.response?.data?.message || err?.message || 'Failed to accept answer. Rolled back.');
    }
  };

  const currentAuthorId = (current?.author?._id || current?.author || current?.user?._id || current?.user || '').toString();
  const currentUserId = (user?._id || user?.id || '').toString();
  const isAdminOrInstructor = user && (user.role === 'admin' || user.role === 'instructor');
  const isOwnerOrAdmin = user && (currentAuthorId === currentUserId || user.role === 'admin');

  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (window.history.length > 1 && window.history.state?.idx > 0) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600 transition cursor-pointer"
            title="Go back to previous page"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Community Discussions</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions, share ideas and help fellow students</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Start Discussion
        </button>
      </div>

      {/* Course Filter & Moderation Bar Header */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-slate-800 mb-6 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
        <div className="flex items-center gap-2 flex-1 w-full">
          <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">Filter Course:</span>
          <select
            value={filterCourseId}
            onChange={(e) => setFilterCourseId(e.target.value)}
            className="border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 font-medium text-gray-800 dark:text-gray-200 w-full"
          >
            <option value="">All Platform Courses</option>
            {coursesList.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {isAdminOrInstructor && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider shrink-0">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-800 font-medium text-gray-800 dark:text-gray-200"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="answered">Answered</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Discussion List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-4 divide-y divide-gray-100 dark:divide-slate-800 max-h-[75vh] overflow-y-auto shadow-xs">
          {loading && <p className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">Loading discussions...</p>}
          {!loading && discussions.length === 0 && (
            <p className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">No discussions found</p>
          )}
          {discussions.map((item) => (
            <div
              key={item._id}
              onClick={() => handleSelectDiscussion(item._id)}
              className={`py-3.5 px-3 cursor-pointer rounded-xl transition ${
                current?._id === item._id
                  ? 'bg-purple-50 dark:bg-purple-950/40 border-l-4 border-purple-600'
                  : 'hover:bg-gray-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.isPinned && <Pin className="w-3.5 h-3.5 text-purple-600 fill-purple-600 shrink-0" title="Pinned Discussion" />}
                {item.isLocked && <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" title="Locked Discussion" />}
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.title}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{item.content || item.body}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                <div className="flex items-center gap-2">
                  <span>{item.replies?.length || item.answerCount || 0} replies</span>
                  {item.isResolved && (
                    <span className="text-[10px] bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 px-1.5 py-0.2 rounded font-semibold">Resolved</span>
                  )}
                </div>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="w-3 h-3" /> {item.upvotesCount || item.upvoteCount || 0}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Discussion Detail */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col justify-between min-h-[75vh] shadow-xs">
          {current ? (
            <div>
              <div className="border-b border-gray-100 dark:border-slate-800 pb-4 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{current.title}</h2>
                      {current.isPinned && <Pin className="w-4 h-4 text-purple-600 fill-purple-600" title="Pinned" />}
                      {current.isLocked && <Lock className="w-4 h-4 text-amber-600" title="Locked" />}
                      {current.isResolved && (
                        <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 text-xs font-semibold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Resolved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Posted by {current.author?.fullName || current.user?.fullName || current.user?.name || 'User'}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {(() => {
                      const isDiscussionUpvoted = Boolean(voteStatus?.discussionUpvoted);
                      return (
                        <button
                          onClick={() => handleUpvoteDiscussion(current._id)}
                          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer ${
                            isDiscussionUpvoted
                              ? 'bg-purple-600 text-white shadow-md shadow-purple-950/20'
                              : 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 hover:text-purple-600'
                          }`}
                          title={isDiscussionUpvoted ? 'Remove upvote' : 'Upvote discussion'}
                        >
                          <ThumbsUp className={`w-4 h-4 ${isDiscussionUpvoted ? 'fill-white' : ''}`} />
                          <span>{current.upvoteCount ?? current.upvotesCount ?? 0}</span>
                        </button>
                      );
                    })()}

                    {isOwnerOrAdmin && (
                      <button
                        onClick={() => handleDeleteDiscussion(current._id)}
                        className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-medium px-3 py-1.5 rounded-xl transition"
                        title="Delete Discussion"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin Moderation Toolbar */}
                {isAdminOrInstructor && (
                  <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-800/80 p-2.5 rounded-xl">
                    <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1 uppercase tracking-wider mr-1">
                      <Shield className="w-3.5 h-3.5 text-purple-600" /> Admin Controls:
                    </span>
                    <button
                      onClick={handleTogglePin}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                        current.isPinned
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" /> {current.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={handleToggleLock}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                        current.isLocked
                          ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {current.isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {current.isLocked ? 'Unlock' : 'Lock'}
                    </button>
                    <button
                      onClick={handleToggleResolved}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-md transition flex items-center gap-1 ${
                        current.isResolved
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> {current.isResolved ? 'Reopen' : 'Mark Resolved'}
                    </button>
                  </div>
                )}
              </div>

              <div className="prose text-sm text-gray-700 mb-6 whitespace-pre-wrap">{current.content || current.body}</div>

              {/* Replies Section */}
              <div className="mt-8">
                <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Replies ({current.replies?.length || 0})
                </h4>

                <div className="space-y-3 max-h-[35vh] overflow-y-auto pr-1">
                  {current.replies?.map((r) => {
                    const replyAuthorId = (r.user?._id || r.user || r.author?._id || r.author || '').toString();
                    const isReplyOwnerOrAdmin = user && (replyAuthorId === currentUserId || user.role === 'admin');

                    return (
                      <div
                        key={r._id}
                        className={`p-3 rounded-lg border text-sm ${
                          r.isAccepted ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-xs text-gray-900">{r.user?.fullName || r.user?.name || 'User'}</span>
                          <div className="flex items-center gap-2">
                            {r.isAccepted ? (
                              <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5" /> Accepted Answer
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAcceptAnswer(r._id)}
                                className="text-xs text-gray-400 hover:text-green-600"
                              >
                                Mark Accepted
                              </button>
                            )}
                            {(() => {
                              const isReplyUpvoted = (voteStatus?.replyUpvotes || []).includes(r._id?.toString());
                              return (
                                <button
                                  onClick={() => handleUpvoteReply(r._id)}
                                  className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg transition cursor-pointer ${
                                    isReplyUpvoted
                                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold'
                                      : 'text-gray-500 hover:text-purple-600'
                                  }`}
                                  title={isReplyUpvoted ? 'Remove upvote' : 'Upvote reply'}
                                >
                                  <ThumbsUp className={`w-3.5 h-3.5 ${isReplyUpvoted ? 'fill-purple-600 text-purple-600' : ''}`} />
                                  <span>{r.upvoteCount ?? r.upvotesCount ?? 0}</span>
                                </button>
                              );
                            })()}
                            {isReplyOwnerOrAdmin && (
                              <button
                                onClick={() => handleDeleteReply(r._id)}
                                className="text-xs text-gray-400 hover:text-red-600 p-1 transition"
                                title="Delete Reply"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-gray-700 text-xs">{r.content}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Post Reply */}
              {!current.isLocked ? (
                <form onSubmit={handleAddReply} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={submittingReply}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium inline-flex items-center gap-1"
                  >
                    <Send className="w-4 h-4" /> {submittingReply ? 'Posting...' : 'Reply'}
                  </button>
                </form>
              ) : (
                <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg text-center font-medium mt-4 border border-amber-200">
                  🔒 This discussion has been locked by an administrator. Replies are disabled.
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-12">
              <MessageSquare className="w-12 h-12 mb-2 text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">No discussion selected</p>
              <p className="text-xs text-gray-400 mt-1">Select a discussion from the left list to read and reply</p>
            </div>
          )}
        </div>
      </div>

      {/* Start New Discussion Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Start New Discussion</h2>
            <form onSubmit={handleCreateDiscussion} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select Course *</label>
                <select
                  required
                  value={newCourseId}
                  onChange={(e) => setNewCourseId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">-- Choose Course --</option>
                  {coursesList.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="What is your discussion about?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Body *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details..."
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiscussion}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm"
                >
                  {submittingDiscussion ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
