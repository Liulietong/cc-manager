import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  User,
  Check,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Globe,
  Folder,
  Edit2,
  X,
  Save,
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Profile {
  name: string;
  path: string;
  isCommon?: boolean;
}

interface SettingsData {
  userSettings: { path: string; content: Record<string, unknown> };
  activeProfile: string;
  profiles: string[];
  mergedEnv: Record<string, string>;
  mainSettings: Record<string, unknown> | null;
}

function getProfiles(): Promise<{ profiles: Profile[]; activeProfile: string }> {
  return fetch('/api/settings/profiles').then((res) => res.json());
}

function switchProfile(profile: string): Promise<{ success: boolean }> {
  return fetch('/api/settings/active-profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  }).then((res) => res.json());
}

function createProfile(name: string): Promise<{ success: boolean }> {
  return fetch('/api/settings/profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  }).then((res) => res.json());
}

function deleteProfile(name: string): Promise<{ success: boolean }> {
  return fetch(`/api/settings/profiles/${name}`, {
    method: 'DELETE',
  }).then((res) => res.json());
}

function updateProfileEnv(profileName: string, env: Record<string, string>): Promise<{ success: boolean }> {
  return fetch(`/api/settings/profiles/${profileName}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ env }),
  }).then((res) => res.json());
}

function getProfileSettings(profileName: string): Promise<{ path: string; content: Record<string, unknown> }> {
  return fetch(`/api/settings/profiles/${profileName}`).then((res) => res.json());
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [expandedProfile, setExpandedProfile] = useState<string | null>(null);
  const [expandedProfileSettings, setExpandedProfileSettings] = useState<Record<string, Record<string, unknown>>>({});
  const [newProfileName, setNewProfileName] = useState('');
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [envEntries, setEnvEntries] = useState<{ key: string; value: string }[]>([]);
  const envEntriesRef = useRef<{ key: string; value: string }[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvValue, setNewEnvValue] = useState('');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => fetch('/api/settings').then((res) => res.json()) as Promise<SettingsData>,
    staleTime: 0, // Always fetch fresh data
  });

  const switchMutation = useMutation({
    mutationFn: switchProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const createMutation = useMutation({
    mutationFn: createProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setShowNewProfileInput(false);
      setNewProfileName('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const updateEnvMutation = useMutation({
    mutationFn: ({ profileName, env }: { profileName: string; env: Record<string, string> }) =>
      updateProfileEnv(profileName, env),
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // Refresh the expanded profile settings
      const data = await getProfileSettings(variables.profileName);
      setExpandedProfileSettings(prev => ({ ...prev, [variables.profileName]: data.content }));
      setEditingProfile(null);
      setEnvEntries([]);
      envEntriesRef.current = [];
    },
  });

  const startEdit = (profileName: string, env: Record<string, string>) => {
    setEditingProfile(profileName);
    const entries = Object.entries(env).map(([key, value]) => ({ key, value: String(value) }));
    setEnvEntries(entries);
    envEntriesRef.current = entries;
  };

  const addEnvEntry = () => {
    if (newEnvKey && newEnvValue) {
      const newEntry = { key: newEnvKey, value: newEnvValue };
      const newEntries = [...envEntriesRef.current, newEntry];
      console.log('Adding entry:', newEntry, 'Total entries:', newEntries);
      setEnvEntries(newEntries);
      envEntriesRef.current = newEntries;
      setNewEnvKey('');
      setNewEnvValue('');
    }
  };

  const removeEnvEntry = (key: string) => {
    const updated = envEntriesRef.current.filter((e) => e.key !== key);
    setEnvEntries(updated);
    envEntriesRef.current = updated;
  };

  const updateEnvEntry = (key: string, updates: { key?: string; value?: string }) => {
    const updated = envEntriesRef.current.map((item) =>
      item.key === key ? { ...item, ...updates } : item
    );
    setEnvEntries(updated);
    envEntriesRef.current = updated;
  };

  const saveEnv = () => {
    if (editingProfile) {
      // 如果有待添加的条目，先添加它
      let entries = [...envEntries];
      if (newEnvKey && newEnvValue) {
        entries = [...entries, { key: newEnvKey, value: newEnvValue }];
      }

      const env: Record<string, string> = {};
      entries.forEach((e) => {
        if (e.key && e.value) {  // Only save non-empty entries
          env[e.key] = e.value;
        }
      });
      console.log('Saving env:', env);
      updateEnvMutation.mutate({ profileName: editingProfile, env });
    }
  };

  const cancelEdit = () => {
    setEditingProfile(null);
    setEnvEntries([]);
    envEntriesRef.current = [];
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const profiles = settings?.profiles || [];
  const activeProfile = settings?.activeProfile || 'default';
  const currentEnv = settings?.userSettings?.content?.env || {};
  const mergedEnv = settings?.mergedEnv || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Active Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Active Profile
          </CardTitle>
          <CardDescription>
            Current profile: <span className="font-mono font-medium">{activeProfile}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Select a profile to switch. The merged environment variables will be used.
          </p>

          <div className="space-y-2">
            {/* Common Profile */}
            <button
              onClick={async () => {
                if (expandedProfile === 'common') {
                  setExpandedProfile(null);
                } else {
                  setExpandedProfile('common');
                  // Fetch common profile settings
                  const data = await getProfileSettings('common');
                  setExpandedProfileSettings(prev => ({ ...prev, ['common']: data.content }));
                }
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors',
                expandedProfile === 'common' ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              )}
            >
              {expandedProfile === 'common' ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              <Globe className="h-4 w-4 text-purple-500" />
              <div className="flex-1 text-left">
                <span className="font-medium">common</span>
                <span className="text-xs text-muted-foreground ml-2">(shared across all profiles)</span>
              </div>
            </button>

            {expandedProfile === 'common' && (
              <div className="ml-8 p-4 bg-muted/50 rounded-lg">
                {editingProfile === 'common' ? (
                  // Edit mode
                  <div className="space-y-2">
                    {envEntries.map((entry) => (
                      <div key={entry.key} className="flex gap-2">
                        <input
                          type="text"
                          value={entry.key}
                          onChange={(evt) => updateEnvEntry(entry.key, { key: evt.target.value })}
                          className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                        />
                        <input
                          type="text"
                          value={entry.value}
                          onChange={(evt) => updateEnvEntry(entry.key, { value: evt.target.value })}
                          className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                        />
                        <Button variant="ghost" size="icon" onClick={() => removeEnvEntry(entry.key)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        placeholder="KEY"
                        value={newEnvKey}
                        onChange={(e) => setNewEnvKey(e.target.value)}
                        className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                      />
                      <input
                        type="text"
                        placeholder="VALUE"
                        value={newEnvValue}
                        onChange={(e) => setNewEnvValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newEnvKey && newEnvValue) {
                            const newEntry = { key: newEnvKey, value: newEnvValue };
                            setEnvEntries([...envEntriesRef.current, newEntry]);
                            envEntriesRef.current = [...envEntriesRef.current, newEntry];
                            setNewEnvKey('');
                            setNewEnvValue('');
                          }
                        }}
                        className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                      />
                      <Button size="sm" onClick={() => {
                        if (newEnvKey && newEnvValue) {
                          const newEntry = { key: newEnvKey, value: newEnvValue };
                          setEnvEntries(prev => [...prev, newEntry]);
                          envEntriesRef.current = [...envEntriesRef.current, newEntry];
                          setNewEnvKey('');
                          setNewEnvValue('');
                        }
                      }}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" onClick={saveEnv} disabled={updateEnvMutation.isPending}>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEdit}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="space-y-1">
                      {Object.entries((expandedProfileSettings['common']?.env || {}) as Record<string, string>).map(([key, value]) => (
                        <div key={key} className="flex gap-4 text-sm">
                          <span className="font-mono text-purple-600 w-48 truncate" title={key}>{key}</span>
                          <span className="font-mono text-muted-foreground flex-1 truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => startEdit('common', (expandedProfileSettings['common']?.env || {}) as Record<string, string>)}
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* User Profiles */}
            {profiles
              .filter((p) => p !== 'common')
              .map((profile) => (
                <div key={profile}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={async () => {
                      if (expandedProfile === profile) {
                        setExpandedProfile(null);
                      } else {
                        setExpandedProfile(profile);
                        // Fetch profile-specific settings
                        const data = await getProfileSettings(profile);
                        setExpandedProfileSettings(prev => ({ ...prev, [profile]: data.content }));
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.currentTarget.click();
                      }
                    }}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors cursor-pointer',
                      profile === activeProfile && 'bg-green-50 border-green-500 dark:bg-green-950/20',
                      expandedProfile === profile && profile !== activeProfile && 'bg-primary/10'
                    )}
                  >
                    {expandedProfile === profile ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 text-left">
                      <span className="font-medium">{profile}</span>
                      {profile === activeProfile && (
                        <span className="text-xs text-green-600 ml-2">(active)</span>
                      )}
                    </div>
                    {profile !== activeProfile && (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            switchMutation.mutate(profile);
                          }}
                          disabled={switchMutation.isPending}
                        >
                          Switch
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete profile "${profile}"?`)) {
                              deleteMutation.mutate(profile);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {expandedProfile === profile && (
                    <div className="ml-8 p-4 bg-muted/50 rounded-lg">
                      {editingProfile === profile ? (
                        // Edit mode
                        <div className="space-y-2">
                          {envEntries.map((entry) => (
                            <div key={entry.key} className="flex gap-2">
                              <input
                                type="text"
                                value={entry.key}
                                onChange={(evt) => updateEnvEntry(entry.key, { key: evt.target.value })}
                                className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                              />
                              <input
                                type="text"
                                value={entry.value}
                                onChange={(evt) => updateEnvEntry(entry.key, { value: evt.target.value })}
                                className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                              />
                              <Button variant="ghost" size="icon" onClick={() => removeEnvEntry(entry.key)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <div className="flex gap-2 mt-2">
                            <input
                              type="text"
                              placeholder="KEY"
                              value={newEnvKey}
                              onChange={(e) => setNewEnvKey(e.target.value)}
                              className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                            />
                            <input
                              type="text"
                              placeholder="VALUE"
                              value={newEnvValue}
                              onChange={(e) => setNewEnvValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && newEnvKey && newEnvValue) {
                                  const newEntry = { key: newEnvKey, value: newEnvValue };
                                  setEnvEntries([...envEntriesRef.current, newEntry]);
                                  envEntriesRef.current = [...envEntriesRef.current, newEntry];
                                  setNewEnvKey('');
                                  setNewEnvValue('');
                                }
                              }}
                              className="flex-1 px-2 py-1 border rounded text-sm font-mono"
                            />
                            <Button
                              size="sm"
                              onClick={() => {
                                if (newEnvKey && newEnvValue) {
                                  const newEntry = { key: newEnvKey, value: newEnvValue };
                                  setEnvEntries(prev => [...prev, newEntry]);
                                  envEntriesRef.current = [...envEntriesRef.current, newEntry];
                                  setNewEnvKey('');
                                  setNewEnvValue('');
                                }
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="flex gap-2 mt-2">
                            <Button size="sm" onClick={saveEnv} disabled={updateEnvMutation.isPending}>
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEdit}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <>
                          <div className="space-y-1">
                            {Object.entries((expandedProfileSettings[profile]?.env || {}) as Record<string, string>).map(([key, value]) => (
                              <div key={key} className="flex gap-4 text-sm">
                                <span className="font-mono text-blue-600 w-48 truncate" title={key}>{key}</span>
                                <span className="font-mono text-muted-foreground flex-1 truncate">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-3"
                            onClick={() => startEdit(profile, (expandedProfileSettings[profile]?.env || {}) as Record<string, string>)}
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {/* Create New Profile */}
          <div className="mt-4 pt-4 border-t">
            {showNewProfileInput ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="Profile name"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newProfileName) {
                      createMutation.mutate(newProfileName);
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => newProfileName && createMutation.mutate(newProfileName)}
                  disabled={!newProfileName || createMutation.isPending}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowNewProfileInput(false);
                    setNewProfileName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowNewProfileInput(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Global Settings - shows complete ~/.claude/settings.json */}
      <Card>
        <CardHeader>
          <CardTitle>Global Settings</CardTitle>
          <CardDescription>
            <span className="flex items-center gap-2">
              <Folder className="h-4 w-4" />
              ~/.claude/settings.json
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted/30 p-4 rounded-lg overflow-auto max-h-[500px]">
            {JSON.stringify(settings?.mainSettings || {}, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
