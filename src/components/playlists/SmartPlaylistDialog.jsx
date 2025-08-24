import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Plus, Trash2, Zap } from "lucide-react";
import { Playlist } from '@/api/entities';

const fields = [
    { value: 'title', label: 'Title', type: 'text' },
    { value: 'artist', label: 'Artist', type: 'text' },
    { value: 'album', label: 'Album', type: 'text' },
    { value: 'genre', label: 'Genre', type: 'text' },
    { value: 'year', label: 'Year', type: 'number' },
    { value: 'play_count', label: 'Play Count', type: 'number' },
    { value: 'duration', label: 'Duration (seconds)', type: 'number' },
    { value: 'is_favorite', label: 'Favorite', type: 'boolean' },
    { value: 'file_format', label: 'Format', type: 'text' },
];

const operators = {
    text: [
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
        { value: 'contains', label: 'contains' },
        { value: 'does_not_contain', label: 'does not contain' },
        { value: 'starts_with', label: 'starts with' },
        { value: 'ends_with', label: 'ends with' },
    ],
    number: [
        { value: 'is', label: 'is' },
        { value: 'is_not', label: 'is not' },
        { value: 'is_greater_than', label: 'is greater than' },
        { value: 'is_less_than', label: 'is less than' },
    ],
    boolean: [
        { value: 'is_true', label: 'is' },
        { value: 'is_false', label: 'is not' },
    ]
};

export default function SmartPlaylistDialog({ open, onOpenChange, onCreated }) {
    const [name, setName] = useState('');
    const [rules, setRules] = useState([{ field: 'artist', operator: 'contains', value: '' }]);
    const [matchAll, setMatchAll] = useState(true);

    const handleRuleChange = (index, key, value) => {
        const newRules = [...rules];
        newRules[index][key] = value;
        
        // Reset operator and value if field changes
        if(key === 'field') {
            const fieldType = fields.find(f => f.value === value)?.type || 'text';
            newRules[index].operator = operators[fieldType][0].value;
            newRules[index].value = fieldType === 'boolean' ? true : '';
        }

        setRules(newRules);
    };

    const addRule = () => {
        setRules([...rules, { field: 'artist', operator: 'contains', value: '' }]);
    };

    const removeRule = (index) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name) {
            alert("Please enter a name for the playlist.");
            return;
        }

        try {
            await Playlist.create({
                name,
                is_smart: true,
                smart_criteria: {
                    match_all: matchAll,
                    rules
                }
            });
            onCreated();
            onOpenChange(false);
            resetForm();
        } catch (error) {
            console.error("Failed to create smart playlist:", error);
            alert("Error creating playlist. See console for details.");
        }
    };
    
    const resetForm = () => {
        setName('');
        setRules([{ field: 'artist', operator: 'contains', value: '' }]);
        setMatchAll(true);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-600" />
                        Create Smart Playlist
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div>
                        <Label htmlFor="playlist-name">Playlist Name</Label>
                        <Input id="playlist-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., 90s Rock Hits" />
                    </div>

                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                        <div className="flex items-center gap-2">
                            <Label>Match</Label>
                            <Select value={matchAll ? "all" : "any"} onValueChange={(v) => setMatchAll(v === "all")}>
                                <SelectTrigger className="w-[80px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">all</SelectItem>
                                    <SelectItem value="any">any</SelectItem>
                                </SelectContent>
                            </Select>
                            <Label>of the following rules:</Label>
                        </div>
                        
                        <div className="space-y-2">
                            {rules.map((rule, index) => {
                                const fieldType = fields.find(f => f.value === rule.field)?.type || 'text';
                                return (
                                    <div key={index} className="flex items-center gap-2">
                                        <Select value={rule.field} onValueChange={(v) => handleRuleChange(index, 'field', v)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>{fields.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <Select value={rule.operator} onValueChange={(v) => handleRuleChange(index, 'operator', v)}>
                                            <SelectTrigger><SelectValue/></SelectTrigger>
                                            <SelectContent>{operators[fieldType].map(op => <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>)}</SelectContent>
                                        </Select>
                                        {fieldType !== 'boolean' ? (
                                            <Input 
                                                type={fieldType === 'number' ? 'number' : 'text'}
                                                value={rule.value} 
                                                onChange={(e) => handleRuleChange(index, 'value', e.target.value)}
                                                className="flex-grow"
                                            />
                                        ) : (
                                            <Select value={rule.value} onValueChange={(v) => handleRuleChange(index, 'value', v === 'true')}>
                                               <SelectTrigger><SelectValue/></SelectTrigger>
                                               <SelectContent>
                                                    <SelectItem value={true}>true</SelectItem>
                                                    <SelectItem value={false}>false</SelectItem>
                                               </SelectContent>
                                            </Select>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => removeRule(index)} disabled={rules.length <= 1}>
                                            <Trash2 className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                        <Button variant="outline" size="sm" onClick={addRule}>
                            <Plus className="w-4 h-4 mr-2" /> Add Rule
                        </Button>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Create Playlist</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}