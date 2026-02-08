import { useState } from 'react';
import { useProjects, useSessionDetail, useDeleteSession } from '../hooks/useSessions';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Folder,
  MessageSquare,
  ChevronRight,
  ChevronDown,
  Trash2,
  Wrench,
  User,
  Bot,
  Download,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { SessionMeta } from '../lib/api';

export function SessionsPage() {
  const { data, isLoading, error } = useProjects();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const deleteSession = useDeleteSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-500">
          <p>Error loading sessions</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4">
      {/* Projects List */}
      <div className="lg:w-1/3 space-y-4 overflow-auto">
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.projects.length === 0 ? (
              <p className="text-muted-foreground">No projects found</p>
            ) : (
              <div className="space-y-1">
                {data?.projects.map((project) => (
                  <div key={project.encodedPath}>
                    <button
                      onClick={() => {
                        setSelectedProject(
                          selectedProject === project.encodedPath ? null : project.encodedPath
                        );
                        setSelectedSession(null);
                      }}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors',
                        selectedProject === project.encodedPath
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      {selectedProject === project.encodedPath ? (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-sm">{project.path}</p>
                        <p className="text-xs opacity-70">
                          {project.sessions.length} sessions
                        </p>
                      </div>
                    </button>

                    {selectedProject === project.encodedPath && (
                      <div className="ml-6 mt-1 space-y-0.5 border-l-2 pl-3">
                        {project.sessions.map((session: SessionMeta) => (
                          <button
                            key={session.id}
                            onClick={() => setSelectedSession(session.id)}
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-left transition-colors text-sm',
                              selectedSession === session.id
                                ? 'bg-secondary text-secondary-foreground'
                                : 'hover:bg-muted'
                            )}
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="truncate font-mono text-xs">
                                {session.id.slice(0, 8)}...
                              </p>
                              <p className="text-xs opacity-70">
                                {format(new Date(session.createdAt), 'MMM d, yyyy')} · {session.messageCount} msgs
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Session Detail */}
      <div className="lg:w-2/3 overflow-auto">
        {selectedProject && selectedSession ? (
          <SessionDetail
            encodedPath={selectedProject}
            sessionId={selectedSession}
            onDelete={() => {
              deleteSession.mutate({
                encodedPath: selectedProject,
                sessionId: selectedSession,
              });
              setSelectedSession(null);
            }}
          />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a session to view details</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface SessionDetailProps {
  encodedPath: string;
  sessionId: string;
  onDelete: () => void;
}

function extractTextContent(message: any): string | null {
  const msg = message?.message;
  if (!msg) return null;

  const content = msg.content;
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    const textBlocks = content.filter((b: any) => b.type === 'text' && b.text);
    if (textBlocks.length > 0) {
      return textBlocks.map((b: any) => b.text).join('\n');
    }
  }
  return null;
}

function extractToolUses(message: any): any[] {
  const msg = message?.message;
  if (!msg) return [];
  const content = msg.content;
  if (!Array.isArray(content)) return [];
  return content.filter((b: any) => b.type === 'tool_use');
}

function extractToolResults(message: any): any[] {
  const msg = message?.message;
  if (!msg) return [];
  const content = msg.content;
  if (!Array.isArray(content)) return [];
  return content.filter((b: any) => b.type === 'tool_result');
}

function isVisibleMessage(message: any): boolean {
  const type = message?.type;
  if (!type) return false;
  if (['queue-operation', 'progress', 'file-history-snapshot'].includes(type)) return false;
  if (message?.isMeta) return false;
  const text = extractTextContent(message);
  const tools = extractToolUses(message);
  const results = extractToolResults(message);
  return !!(text || tools.length > 0 || results.length > 0);
}

function ToolUseBlock({ tool }: { tool: any }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mt-2 border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted text-left text-sm"
      >
        <Wrench className="h-3.5 w-3.5 shrink-0 text-orange-500" />
        <span className="font-mono font-medium">{tool.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {expanded ? 'collapse' : 'expand'}
        </span>
      </button>
      {expanded && (
        <pre className="p-3 text-xs overflow-auto bg-muted/30 max-h-60">
          {JSON.stringify(tool.input, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ToolResultBlock({ result }: { result: any }) {
  const [expanded, setExpanded] = useState(false);
  const content = result.content;
  let displayText = '';
  if (typeof content === 'string') {
    displayText = content;
  } else if (Array.isArray(content)) {
    displayText = content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('\n');
  }
  if (!displayText) return null;

  const preview = displayText.slice(0, 200);
  const hasMore = displayText.length > 200;

  return (
    <div className="mt-2 border rounded-lg overflow-hidden border-green-200">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-green-50 hover:bg-green-100 text-left text-sm dark:bg-green-950/20 dark:hover:bg-green-950/30"
      >
        <span className="text-xs font-medium text-green-700 dark:text-green-400">Tool Result</span>
        {hasMore && (
          <span className="text-xs text-muted-foreground ml-auto">
            {expanded ? 'collapse' : 'expand'}
          </span>
        )}
      </button>
      <pre className="p-3 text-xs overflow-auto bg-green-50/50 dark:bg-green-950/10 max-h-60 whitespace-pre-wrap">
        {expanded ? displayText : preview}{!expanded && hasMore ? '...' : ''}
      </pre>
    </div>
  );
}

function SessionDetail({ encodedPath, sessionId, onDelete }: SessionDetailProps) {
  const { data: session, isLoading } = useSessionDetail(encodedPath, sessionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <div className="text-center text-red-500">Session not found</div>;
  }

  const visibleMessages = session.messages.filter(isVisibleMessage);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="font-mono text-sm">{sessionId}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(session.createdAt), 'PPpp')} · {visibleMessages.length} messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `/api/sessions/${encodedPath}/${sessionId}/export?format=markdown`;
              window.open(url, '_blank');
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export MD
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const url = `/api/sessions/${encodedPath}/${sessionId}/export?format=json`;
              window.open(url, '_blank');
            }}
          >
            Export JSON
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <div className="space-y-4">
          {visibleMessages.map((message: any, index: number) => {
            const role = message?.message?.role || message?.type;
            const isUser = role === 'user';
            const isAssistant = role === 'assistant';
            const text = extractTextContent(message);
            const toolUses = extractToolUses(message);
            const toolResults = extractToolResults(message);

            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg',
                  isUser
                    ? 'bg-blue-50 dark:bg-blue-950/20 ml-4'
                    : isAssistant
                      ? 'bg-gray-50 dark:bg-gray-900/50 mr-4'
                      : 'bg-muted/50 mx-4'
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isUser ? (
                    <User className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bot className="h-4 w-4 text-gray-600" />
                  )}
                  <span className="text-xs font-medium uppercase opacity-70">
                    {isUser ? 'User' : 'Assistant'}
                  </span>
                </div>

                {text && (
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    {text}
                  </div>
                )}

                {toolUses.map((tool: any, i: number) => (
                  <ToolUseBlock key={i} tool={tool} />
                ))}

                {toolResults.map((result: any, i: number) => (
                  <ToolResultBlock key={i} result={result} />
                ))}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
