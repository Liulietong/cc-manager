import { usePlugins, useTogglePlugin } from '../hooks/usePlugins';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Puzzle, Power, PowerOff, Globe, Folder } from 'lucide-react';
import { cn } from '../lib/utils';

export function PluginsPage() {
  const { data, isLoading } = usePlugins();
  const togglePlugin = useTogglePlugin();

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Plugins</h1>

      {data?.plugins.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Puzzle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No plugins installed</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {data?.plugins.map((plugin, idx) => (
            <Card key={`${plugin.name}-${plugin.version}-${plugin.scope}-${idx}`}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Puzzle className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{plugin.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {plugin.version}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      {plugin.scope === 'user' ? (
                        <>
                          <Globe className="h-3 w-3" />
                          <span>User scope</span>
                        </>
                      ) : (
                        <>
                          <Folder className="h-3 w-3" />
                          <span>{plugin.projectPath}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant={plugin.enabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() =>
                    togglePlugin.mutate({ name: plugin.name, enabled: !plugin.enabled })
                  }
                  disabled={togglePlugin.isPending}
                >
                  {plugin.enabled ? (
                    <>
                      <Power className="h-4 w-4 mr-2" />
                      Enabled
                    </>
                  ) : (
                    <>
                      <PowerOff className="h-4 w-4 mr-2" />
                      Disabled
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
