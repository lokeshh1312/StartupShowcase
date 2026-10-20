import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AVAILABLE_MONTHS } from '../data/startups';
import { apiRequest, jsonBody } from '../lib/api';
import { useAuth } from './AuthContext';

const StartupsContext = createContext(null);

export const StartupsProvider = ({ children }) => {
  const [activeMonth, setActiveMonth] = useState('oct-2026');
  const [startups, setStartups] = useState([]);
  const [commentsMap, setCommentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, openAuthModal } = useAuth();

  const refreshStartups = useCallback(async () => {
    try {
      const { items } = await apiRequest('/api/startups');
      setStartups(items);
      setError('');
      return items;
    } catch (requestError) {
      setError(requestError.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refreshStartups(); }, [refreshStartups, user]);

  const startupsByMonth = useMemo(
    () => startups.filter((startup) => startup.month === activeMonth),
    [startups, activeMonth]
  );

  const availableMonths = useMemo(() => AVAILABLE_MONTHS.map((month) => ({
    ...month,
    ideasCount: startups.filter((startup) => startup.month === month.id).length,
  })), [startups]);

  const toggleLike = async (startupId) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const result = await apiRequest(`/api/startups/${encodeURIComponent(startupId)}/vote`, { method: 'POST' });
      setStartups((current) => current.map((startup) => startup.id === startupId
        ? { ...startup, likes: result.likes, isLiked: result.liked }
        : startup));
      await refreshStartups();
      return result;
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const isLiked = (startupId) => Boolean(startups.find((startup) => startup.id === startupId)?.isLiked);

  const toggleSave = async (startupId) => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    try {
      const { saved } = await apiRequest(`/api/startups/${encodeURIComponent(startupId)}/save`, { method: 'POST' });
      setStartups((current) => current.map((startup) => startup.id === startupId ? { ...startup, isSaved: saved } : startup));
      return { saved };
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const isSaved = (startupId) => Boolean(startups.find((startup) => startup.id === startupId)?.isSaved);

  const submitStartup = async (formData) => {
    if (!user) {
      openAuthModal('signup');
      throw new Error('Create an account to submit a startup.');
    }
    const { startup } = await apiRequest('/api/startups', { method: 'POST', body: jsonBody(formData) });
    return startup;
  };

  const loadStartup = useCallback(async (slug) => {
    const result = await apiRequest(`/api/startups/${encodeURIComponent(slug)}`);
    setCommentsMap((current) => ({ ...current, [result.startup.slug]: result.comments }));
    setStartups((current) => current.map((startup) => startup.id === result.startup.id ? result.startup : startup));
    return result.startup;
  }, []);

  const getStartupBySlug = (slug) => startups.find((startup) => startup.slug === slug || startup.id === slug);

  const addComment = async (startupSlug, commentText) => {
    if (!user) {
      openAuthModal('login');
      throw new Error('Sign in to join the discussion.');
    }
    const { comment } = await apiRequest(`/api/startups/${encodeURIComponent(startupSlug)}/comments`, {
      method: 'POST', body: jsonBody({ content: commentText }),
    });
    setCommentsMap((current) => ({
      ...current,
      [startupSlug]: [comment, ...(current[startupSlug] || [])],
    }));
    return comment;
  };

  return (
    <StartupsContext.Provider value={{
      startups, startupsByMonth, activeMonth, setActiveMonth, availableMonths,
      toggleLike, isLiked, toggleSave, isSaved, submitStartup, getStartupBySlug,
      loadStartup, commentsMap, addComment, loading, error, refreshStartups,
    }}>
      {children}
    </StartupsContext.Provider>
  );
};

export const useStartups = () => {
  const context = useContext(StartupsContext);
  if (!context) throw new Error('useStartups must be used within a StartupsProvider');
  return context;
};
