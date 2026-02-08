import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Store,
  Globe,
  Folder,
  ExternalLink,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';

interface Marketplace {
  id: string;
  source: {
    source: 'github' | 'directory';
    repo?: string;
    path?: string;
  };
  pluginCount: number;
}

interface PluginInfo {
  name: string;
  marketplace: string;
  version: string;
  scope: string;
  status: 'enabled' | 'disabled';
}

interface MarketplaceData {
  marketplaces: Marketplace[];
}

interface PluginsData {
  marketplacePlugins: {
    marketplace: string;
    plugins: {
      name: string;
      version: string;
      scope: string;
      status: string;
    }[];
  }[];
}

function getMarketplaces(): Promise<MarketplaceData> {
  return fetch('/api/marketplace').then((res) => res.json());
}

function getPlugins(): Promise<PluginsData> {
  return fetch('/api/marketplace/plugins').then((res) => res.json());
}

function MarketplaceHeader({ marketplace }: { marketplace: Marketplace }) {
  const sourceType = marketplace.source.source;
  const sourceLabel = marketplace.source.source === 'github'
    ? marketplace.source.repo
    : marketplace.source.path;

  return (
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-lg">{marketplace.id}</h3>
          <Badge variant="secondary">
            {sourceType === 'github' ? (
              <><Globe className="h-3 w-3 mr-1" />GitHub</>
            ) : (
              <><Folder className="h-3 w-3 mr-1" />Local</>
            )}
          </Badge>
          <Badge variant="outline">{marketplace.pluginCount} plugins</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1 font-mono truncate" title={sourceLabel || ''}>
          {sourceLabel}
        </p>
      </div>
      {sourceType === 'github' && marketplace.source.repo && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(`https://github.com/${marketplace.source.repo}`, '_blank')}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function PluginItem({ plugin }: { plugin: { name: string; version: string; scope: string; status: string } }) {
  return (
    <div className="flex items-center justify-between py-2 border-t first:border-0">
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm">{plugin.name}</span>
        <Badge variant="secondary" className="text-xs">
          v{plugin.version}
        </Badge>
        <Badge variant="outline" className="text-xs">
          {plugin.scope}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {plugin.status === 'enabled' ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <X className="h-4 w-4 text-gray-400" />
        )}
      </div>
    </div>
  );
}

export function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: marketplaceData, isLoading: isLoadingMarketplaces, refetch: refetchMarketplaces, error: marketplaceError } = useQuery({
    queryKey: ['marketplaces'],
    queryFn: getMarketplaces,
    staleTime: 0, // Disable cache to get fresh data
  });

  const { data: pluginsData, isLoading: isLoadingPlugins, refetch: refetchPlugins, error: pluginsError } = useQuery({
    queryKey: ['marketplace-plugins'],
    queryFn: getPlugins,
    staleTime: 0, // Disable cache to get fresh data
  });

  const refetch = () => {
    refetchMarketplaces();
    refetchPlugins();
  };

  if (marketplaceError || pluginsError) {
    return (
      <div className="flex items-center justify-center h-full text-red-500">
        Error loading marketplace data
      </div>
    );
  }

  if (isLoadingMarketplaces || isLoadingPlugins) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const marketplaces = marketplaceData?.marketplaces || [];
  const marketplacePlugins = pluginsData?.marketplacePlugins || [];

  // Filter marketplaces by search
  const filteredMarketplaces = marketplaces.filter((mp) =>
    mp.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplaces</h1>
          <p className="text-muted-foreground">
            {marketplaces.length} marketplaces configured
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Input
          placeholder="Search marketplaces..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Marketplaces with Plugins */}
      <div className="space-y-6">
        {filteredMarketplaces.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No marketplaces found</p>
            </CardContent>
          </Card>
        ) : (
          filteredMarketplaces.map((marketplace) => {
            const plugins = marketplacePlugins.find((mp) => mp.marketplace === marketplace.id)?.plugins || [];

            return (
              <Card key={marketplace.id}>
                <CardHeader className="pb-2">
                  <MarketplaceHeader marketplace={marketplace} />
                </CardHeader>
                <CardContent>
                  {plugins.length > 0 ? (
                    <div>
                      {plugins.map((plugin, idx) => (
                        <PluginItem key={idx} plugin={plugin} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No plugins installed from this marketplace
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
