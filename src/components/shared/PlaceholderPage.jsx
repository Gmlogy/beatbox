import React from 'react';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";

export default function PlaceholderPage({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-100/50">
      <div className="w-20 h-20 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mb-6">
        {Icon && <Icon className="w-10 h-10 text-slate-500" />}
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-600 max-w-md mb-6">
        {description}
      </p>
      <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 ripple-effect">
        <Link to={createPageUrl('Library')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Link>
      </Button>
    </div>
  );
}