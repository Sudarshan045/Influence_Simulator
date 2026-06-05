import { useState, useEffect } from 'react';
import { getTopIdeas, getTrendingIdeas } from '../services/api';

export function useLiveIdeas() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getTopIdeas().then(data => {
      if (mounted) {
        setIdeas(data || []);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return { ideas, loading };
}
