import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Music } from 'lucide-react';

export default function IndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(createPageUrl('Library'));
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <Music className="w-12 h-12 text-blue-500 mx-auto animate-bounce" />
        <h1 className="mt-4 text-2xl font-bold text-slate-800">Loading FigTunes...</h1>
        <p className="mt-2 text-slate-600">Redirecting to your music library.</p>
      </div>
    </div>
  );
}