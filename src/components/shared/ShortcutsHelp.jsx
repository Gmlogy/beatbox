import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Keyboard } from 'lucide-react';

export default function ShortcutsHelp({ open, onOpenChange }) {
  const shortcutSections = [
    {
      title: "Navigation",
      shortcuts: [
        { keys: "Alt + N + H", description: "Go to Home/Discover" },
        { keys: "Alt + N + S", description: "Go to Songs Library" },
        { keys: "Alt + N + A", description: "Go to Artists" },
        { keys: "Alt + N + B", description: "Go to Albums" },
        { keys: "Alt + N + P", description: "Go to Playlists" },
        { keys: "Alt + N + F", description: "Go to Favorites" },
        { keys: "Alt + N + R", description: "Go to Recently Added" },
        { keys: "Alt + N + D", description: "Go to Discover" },
        { keys: "Alt + N + T", description: "Go to Statistics" },
        { keys: "Alt + N + Y", description: "Go to Sync" },
        { keys: "Alt + N + E", description: "Go to Settings" },
      ]
    },
    {
      title: "Playback Control",
      shortcuts: [
        { keys: "Space", description: "Play/Pause current track" },
        { keys: "Alt + L + P", description: "Play/Pause" },
        { keys: "Alt + L + N", description: "Next track" },
        { keys: "Alt + L + B", description: "Previous track" },
        { keys: "→", description: "Next track" },
        { keys: "←", description: "Previous track" },
        { keys: "Alt + L + S", description: "Toggle shuffle" },
        { keys: "Alt + L + R", description: "Toggle repeat" },
        { keys: "Alt + L + Q", description: "Toggle player size" },
      ]
    },
    {
      title: "Volume & Seeking",
      shortcuts: [
        { keys: "↑", description: "Volume up" },
        { keys: "↓", description: "Volume down" },
        { keys: "Alt + L + V", description: "Show volume control" },
        { keys: "Ctrl + Alt + →", description: "Fast forward" },
        { keys: "Ctrl + Alt + ←", description: "Rewind" },
      ]
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {shortcutSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-lg mb-3 text-slate-900 dark:text-slate-100">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, index) => (
                  <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                    <span className="text-slate-700 dark:text-slate-300">
                      {shortcut.description}
                    </span>
                    <Badge variant="secondary" className="font-mono text-xs dark:bg-slate-700 dark:text-slate-200">
                      {shortcut.keys}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Tips</h4>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Press and hold Alt to see your current key sequence</li>
            <li>• Sequences timeout after 2 seconds if not completed</li>
            <li>• Media keys work globally, navigation keys require Alt sequences</li>
            <li>• Shortcuts are disabled when typing in text fields</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}