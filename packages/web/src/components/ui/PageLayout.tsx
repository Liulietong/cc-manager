import { ReactNode } from 'react';
import { Card, CardContent } from '../ui/card';

interface PageLayoutProps {
  title: string;
  children: ReactNode;
  loading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

export function PageLayout({ title, children, loading, error, onRetry }: PageLayoutProps) {
  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading {title}...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center text-red-500">
            <p>Error loading {title}</p>
            <p className="text-sm mt-2">{error.message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Retry
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardContent className="h-full overflow-auto p-4">
        {children}
      </CardContent>
    </Card>
  );
}
