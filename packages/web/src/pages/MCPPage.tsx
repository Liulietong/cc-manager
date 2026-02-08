import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Server,
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  Folder,
} from 'lucide-react';

interface MCPServer {
  name: string;
  type: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  scope: 'global' | 'project';
  projectPath?: string;
}

interface MCPResponse {
  servers: MCPServer[];
}

function getMCPServers(): Promise<MCPResponse> {
  return fetch('/api/mcp').then((res) => res.json());
}

function deleteMCPServer(name: string): Promise<{ success: boolean }> {
  return fetch(`/api/mcp/servers/${name}`, {
    method: 'DELETE',
  }).then((res) => res.json());
}

function addMCPServer(server: { name: string; command: string; args: string }): Promise<{ success: boolean }> {
  return fetch(`/api/mcp/servers/${server.name}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: server.command,
      args: server.args.split(',').map((a) => a.trim()).filter(Boolean),
    }),
  }).then((res) => res.json());
}

export function MCPPage() {
  const queryClient = useQueryClient();
  const [showNewServer, setShowNewServer] = useState(false);
  const [newServer, setNewServer] = useState({
    name: '',
    command: '',
    args: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mcp'],
    queryFn: getMCPServers,
  });

  const addMutation = useMutation({
    mutationFn: addMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp'] });
      setShowNewServer(false);
      setNewServer({ name: '', command: '', args: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMCPServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mcp'] });
    },
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const servers = data?.servers || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MCP Servers</h1>
          <p className="text-muted-foreground">
            {servers.length} servers configured
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewServer(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Server
          </Button>
        </div>
      </div>

      {showNewServer && (
        <Card>
          <CardHeader>
            <CardTitle>Add MCP Server</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={newServer.name}
                onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                placeholder="server-name"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Command</label>
              <Input
                value={newServer.command}
                onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                placeholder="npx"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Args (comma-separated)</label>
              <Input
                value={newServer.args}
                onChange={(e) => setNewServer({ ...newServer, args: e.target.value })}
                placeholder="-s,server-name"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  if (newServer.name && newServer.command) {
                    addMutation.mutate(newServer);
                  }
                }}
                disabled={!newServer.name || !newServer.command || addMutation.isPending}
              >
                Add Server
              </Button>
              <Button variant="outline" onClick={() => setShowNewServer(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {servers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Server className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No MCP servers configured</p>
            <p className="text-sm mt-2">
              Add servers to extend Claude&apos;s capabilities
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {servers.map((server) => (
            <Card key={`${server.name}-${server.scope}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Server className="h-5 w-5 text-green-500" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{server.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {server.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {server.scope === 'global' ? (
                            <><Globe className="h-3 w-3 mr-1" />Global</>
                          ) : (
                            <><Folder className="h-3 w-3 mr-1" />Project</>
                          )}
                        </Badge>
                      </div>
                      <code className="text-sm text-muted-foreground">
                        {server.command} {server.args.join(' ')}
                      </code>
                      {server.scope === 'project' && server.projectPath && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate" title={server.projectPath}>
                          {server.projectPath}
                        </p>
                      )}
                    </div>
                  </div>
                  {server.scope === 'global' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete MCP server "${server.name}"?`)) {
                          deleteMutation.mutate(server.name);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
