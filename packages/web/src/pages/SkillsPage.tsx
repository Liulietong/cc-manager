import { useState } from 'react';
import { useSkills, useDeleteSkill } from '../hooks/useSkills';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Skill } from '../lib/api';
import {
  Zap,
  ChevronDown,
  ChevronRight,
  Trash2,
  Globe,
  FileText,
  X,
  Package,
} from 'lucide-react';
import { cn } from '../lib/utils';

function SkillPreview({ skill }: { skill: Skill }) {
  const lines = skill.content.split('\n').slice(0, 5);
  return (
    <div className="text-xs text-muted-foreground mt-2 font-mono bg-muted/30 p-2 rounded max-h-20 overflow-hidden">
      {lines.map((line, i) => (
        <div key={i} className="truncate">{line || '\u00A0'}</div>
      ))}
      {skill.content.split('\n').length > 5 && (
        <div className="text-xs opacity-50">...</div>
      )}
    </div>
  );
}

function SkillDetail({ skill, onClose }: { skill: Skill; onClose: () => void }) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between shrink-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            /{skill.name}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {skill.description || 'No description'}
          </p>
          {skill.argumentHint && (
            <p className="text-xs font-mono text-muted-foreground mt-1">
              Args: {skill.argumentHint}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
            {skill.scope === 'user' ? (
              <>
                <Globe className="h-3 w-3" />
                <span>User scope</span>
              </>
            ) : (
              <>
                <Package className="h-3 w-3" />
                <span>{skill.pluginName}</span>
              </>
            )}
            <span className="opacity-50">|</span>
            <FileText className="h-3 w-3" />
            <span className="font-mono truncate max-w-xs">{skill.path.split('/.claude/')[1] || skill.path}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <pre className="text-sm whitespace-pre-wrap font-mono bg-muted/30 p-4 rounded-lg leading-relaxed">
          {skill.content}
        </pre>
      </CardContent>
    </Card>
  );
}

export function SkillsPage() {
  const { data, isLoading } = useSkills();
  const deleteSkill = useDeleteSkill();
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  const userSkills = data?.skills.filter((s) => s.scope === 'user') || [];
  const pluginSkills = data?.skills.filter((s) => s.scope === 'plugin') || [];

  if (selectedSkill) {
    return (
      <SkillDetail
        skill={selectedSkill}
        onClose={() => setSelectedSkill(null)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Skills</h1>

      {data?.skills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No skills found</p>
            <p className="text-sm mt-2">
              Add .md files to ~/.claude/commands/ to create skills
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* User Skills */}
          {userSkills.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                User Skills ({userSkills.length})
              </h2>
              <div className="grid gap-3">
                {userSkills.map((skill) => (
                  <SkillCard
                    key={skill.path}
                    skill={skill}
                    expanded={expandedSkill === skill.path}
                    onToggleExpand={() =>
                      setExpandedSkill(expandedSkill === skill.path ? null : skill.path)
                    }
                    onView={() => setSelectedSkill(skill)}
                    onDelete={() => deleteSkill.mutate(skill.path)}
                    isDeleting={deleteSkill.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Plugin Skills */}
          {pluginSkills.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Plugin Skills ({pluginSkills.length})
              </h2>
              <div className="grid gap-3">
                {pluginSkills.map((skill) => (
                  <SkillCard
                    key={skill.path}
                    skill={skill}
                    expanded={expandedSkill === skill.path}
                    onToggleExpand={() =>
                      setExpandedSkill(expandedSkill === skill.path ? null : skill.path)
                    }
                    onView={() => setSelectedSkill(skill)}
                    onDelete={() => {}} // Disable delete for plugin skills
                    isDeleting={false}
                    deletable={false}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

interface SkillCardProps {
  skill: Skill;
  expanded: boolean;
  onToggleExpand: () => void;
  onView: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  deletable?: boolean;
}

function SkillCard({ skill, expanded, onToggleExpand, onView, onDelete, isDeleting, deletable = true }: SkillCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button onClick={onToggleExpand} className="shrink-0">
              {expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg shrink-0">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium font-mono">/{skill.name}</h3>
                {skill.scope === 'plugin' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                    {skill.pluginName}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {skill.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-4">
            <Button variant="outline" size="sm" onClick={onView}>
              <FileText className="h-4 w-4 mr-1" />
              View
            </Button>
            {deletable && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {expanded && <SkillPreview skill={skill} />}
      </CardContent>
    </Card>
  );
}
