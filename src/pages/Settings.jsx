import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useTheme } from '@/components/providers/ThemeProvider';
import { runLibraryMaintenance } from '@/api/functions';
import { Loader2, Palette, DatabaseZap, Download, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { exportLibraryData } from '@/api/functions';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [isMaintenanceRunning, setIsMaintenanceRunning] = useState(false);
  const navigate = useNavigate();

  const handleRunMaintenance = async () => {
    setIsMaintenanceRunning(true);
    try {
      const { data } = await runLibraryMaintenance();
      alert(`Library maintenance complete! ${data.details}`);
    } catch (error) {
      console.error("Maintenance error:", error);
      alert("An error occurred during library maintenance.");
    }
    setIsMaintenanceRunning(false);
  };

  const handleExportData = async () => {
    try {
        const { data, headers } = await exportLibraryData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDisposition = headers['content-disposition'];
        let filename = 'beatbox_library_export.json';
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
            if (filenameMatch && filenameMatch.length > 1) {
                filename = filenameMatch[1];
            }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Error exporting data:", err);
        alert('Failed to export library data. Please check the console for details.');
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 material-elevation-1">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Configure application settings and manage your library.
        </p>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 material-elevation-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Library Maintenance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Run Maintenance Tasks</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Update smart playlists and perform other background tasks.</p>
                </div>
                <Button variant="outline" onClick={handleRunMaintenance} disabled={isMaintenanceRunning}>
                    {isMaintenanceRunning ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <DatabaseZap className="w-4 h-4 mr-2" />
                    )}
                    Run Now
                </Button>
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 material-elevation-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Appearance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Theme</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Switch between light and dark mode.</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                    <Button
                        variant={theme === "light" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTheme("light")}
                        className={`ripple-effect ${theme === "light" ? 'bg-white shadow-sm dark:bg-slate-500' : 'dark:hover:bg-slate-600'}`}
                    >
                        Light
                    </Button>
                    <Button
                        variant={theme === "dark" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setTheme("dark")}
                        className={`ripple-effect ${theme === "dark" ? 'bg-white shadow-sm dark:bg-slate-500' : 'dark:hover:bg-slate-600'}`}
                    >
                        Dark
                    </Button>
                </div>
            </div>
          </div>
        </div>

        {/* Data Management Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 material-elevation-1 col-span-1 lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Data Management</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Find Duplicates</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Scan your library for duplicate tracks and clean them up.</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/Duplicates')}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Find Duplicates
                </Button>
            </div>
            <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div>
                    <h3 className="font-semibold text-slate-800 dark:text-slate-200">Export Library Data</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Export all your playlists, play history, and favorites to a JSON file.</p>
                </div>
                <Button variant="outline" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Data
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}