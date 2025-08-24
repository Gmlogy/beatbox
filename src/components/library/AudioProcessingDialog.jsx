// --- START OF FILE src/components/library/AudioProcessingDialog.jsx ---
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { processAudioFiles } from '@/api/functions';
import { Settings, Zap, Volume2, FileAudio, Loader2, CheckCircle } from 'lucide-react';

const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AudioProcessingDialog({ open, onOpenChange, selectedTracks, onUpdate }) {
    const [operation, setOperation] = useState('transcode');
    const [targetFormat, setTargetFormat] = useState('MP3');
    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [progress, setProgress] = useState(0);

    const handleProcess = async () => {
        if (!selectedTracks || selectedTracks.length === 0) return;
        
        setProcessing(true);
        setResults(null);
        setProgress(0);
        
        // Simulate progress for the UI
        const interval = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + 10 : prev));
        }, 200);

        try {
            // In a real app, this would call Electron's backend. Here, it calls our mock SDK.
            const { data } = await processAudioFiles({
                operation,
                trackIds: selectedTracks.map(t => t.id),
                targetFormat: operation === 'transcode' ? targetFormat : undefined,
            });
            
            clearInterval(interval);
            setProgress(100);
            setResults(data);
            onUpdate(); // Refresh the library to show potential changes (like format)
        } catch (error) {
            console.error("Processing error:", error);
            clearInterval(interval);
            alert("An error occurred during processing.");
        }
        
        setProcessing(false);
    };

    const resetAndClose = () => {
        onOpenChange(false);
        // Delay reset to allow for closing animation
        setTimeout(() => {
            setResults(null);
            setProgress(0);
            setProcessing(false);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && resetAndClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600" />Audio Processing</DialogTitle>
                </DialogHeader>
                
                {!results ? (
                    <div className="space-y-6 py-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Process {selectedTracks?.length || 0} selected track{selectedTracks?.length !== 1 ? 's' : ''}.</p>
                        
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="operation">Operation</Label>
                                <Select value={operation} onValueChange={setOperation} disabled={processing}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transcode"><div className="flex items-center gap-2"><FileAudio className="w-4 h-4" />Convert Format</div></SelectItem>
                                        <SelectItem value="normalize"><div className="flex items-center gap-2"><Volume2 className="w-4 h-4" />Normalize Volume</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            {operation === 'transcode' && (
                                <div>
                                    <Label htmlFor="targetFormat">Target Format</Label>
                                    <Select value={targetFormat} onValueChange={setTargetFormat} disabled={processing}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MP3">MP3 (High Compatibility)</SelectItem>
                                            <SelectItem value="AAC">AAC (Good Quality)</SelectItem>
                                            <SelectItem value="FLAC">FLAC (Lossless)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                            {operation === 'transcode' 
                                ? `This will create new copies of the selected files in ${targetFormat} format. The original files will not be deleted.`
                                : 'This will analyze the loudness of each track and apply ReplayGain values for consistent volume during playback.'
                            }
                        </div>
                        
                        {processing && (
                            <div className="space-y-2">
                                <Progress value={progress} className="w-full" />
                                <p className="text-xs text-center text-slate-500">Processing...</p>
                            </div>
                        )}
                        
                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="outline" onClick={resetAndClose} disabled={processing}>Cancel</Button>
                            <Button onClick={handleProcess} disabled={processing || !selectedTracks || selectedTracks.length === 0} className="btn-primary">
                                {processing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</> : <><Zap className="w-4 h-4 mr-2" />Start Process</>}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4 text-center space-y-4">
                        <CheckCircle className="w-12 h-12 text-green-600 mx-auto" />
                        <h3 className="text-lg font-semibold">Processing Complete</h3>
                        <p className="text-slate-600 dark:text-slate-400">{results.processed} tracks were processed successfully.</p>
                        {results.totalSpaceSaved > 0 && <p className="text-sm">Total space saved: {formatBytes(results.totalSpaceSaved)}</p>}
                        <Button onClick={resetAndClose} className="btn-primary w-full">Done</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
// --- END OF FILE src/components/library/AudioProcessingDialog.jsx ---