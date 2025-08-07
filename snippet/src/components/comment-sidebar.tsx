import { h } from 'preact';
import { useState } from 'preact/hooks';
import {
  isSidebarAnnotation,
  SidebarAnnotationEntry,
  SidebarSubtype,
  TrackedAnnotation,
} from '@embedpdf/plugin-annotation';
import { ComponentRenderFunction } from '@embedpdf/plugin-ui';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/preact';
import {
  PdfAnnotationIcon,
  PdfAnnotationSubtype,
  PdfAnnotationObject,
  uuidV4,
} from '@embedpdf/models';
import { formatDate } from './utils';
import { Icon } from './ui/icon';

export interface CommentRenderProps {
  sidebarAnnotations: Record<number, SidebarAnnotationEntry[]>;
}

// Annotation type configuration
interface AnnotationConfig {
  label: string;
  icon: string;
  iconProps: (annotation: PdfAnnotationObject) => {
    primaryColor?: string;
    secondaryColor?: string;
    size?: number;
    strokeWidth?: number;
  };
}

const annotationConfigs: Record<SidebarSubtype, AnnotationConfig> = {
  [PdfAnnotationSubtype.HIGHLIGHT]: {
    label: 'Highlight',
    icon: 'highlight',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.color || '#ffff00',
    }),
  },
  [PdfAnnotationSubtype.CIRCLE]: {
    label: 'Circle',
    icon: 'circle',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.strokeColor || '#000000',
      secondaryColor: annotation.color,
    }),
  },
  [PdfAnnotationSubtype.SQUARE]: {
    label: 'Square',
    icon: 'square',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.strokeColor || '#000000',
      secondaryColor: annotation.color,
    }),
  },
  [PdfAnnotationSubtype.LINE]: {
    label: 'Line',
    icon: 'line',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.strokeColor || '#000000',
    }),
  },
  [PdfAnnotationSubtype.UNDERLINE]: {
    label: 'Underline',
    icon: 'underline',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.color || '#000000',
    }),
  },
  [PdfAnnotationSubtype.SQUIGGLY]: {
    label: 'Squiggly',
    icon: 'squiggly',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.color || '#000000',
    }),
  },
  [PdfAnnotationSubtype.STRIKEOUT]: {
    label: 'Strikethrough',
    icon: 'strikethrough',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.color || '#000000',
    }),
  },
  [PdfAnnotationSubtype.INK]: {
    label: 'Ink',
    icon: 'pencilMarker',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.color || '#000000',
    }),
  },
  [PdfAnnotationSubtype.FREETEXT]: {
    label: 'Text',
    icon: 'text',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.color || '#000000',
    }),
  },
  [PdfAnnotationSubtype.POLYGON]: {
    label: 'Polygon',
    icon: 'polygon',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.strokeColor || '#000000',
      secondaryColor: annotation.color,
    }),
  },
  [PdfAnnotationSubtype.POLYLINE]: {
    label: 'Polyline',
    icon: 'zigzag',
    iconProps: (annotation: any) => ({
      primaryColor: annotation.strokeColor || '#000000',
    }),
  },
  [PdfAnnotationSubtype.STAMP]: {
    label: 'Stamp',
    icon: 'deviceFloppy',
    iconProps: () => ({
      primaryColor: '#dc2626',
    }),
  },
};

// Avatar component for users
const UserAvatar = ({ name, className = '' }: { name?: string; className?: string }) => {
  const getInitials = (name?: string) => {
    if (!name) return 'G';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name?: string) => {
    if (!name) return 'bg-red-500';
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium text-white ${getAvatarColor(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

// Get annotation configuration
const getAnnotationConfig = (annotation: TrackedAnnotation): AnnotationConfig | null => {
  if (!isSidebarAnnotation(annotation)) {
    return null;
  }
  return annotationConfigs[annotation.object.type];
};

// Annotation Icon Component
const AnnotationIcon = ({
  annotation,
  config,
  className = '',
}: {
  annotation: TrackedAnnotation;
  config: AnnotationConfig;
  className?: string;
}) => {
  const iconProps = config.iconProps(annotation.object);

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gray-100 ${className}`}
      title={config.label}
    >
      <Icon icon={config.icon} {...iconProps} />
    </div>
  );
};

export const commentRender: ComponentRenderFunction<CommentRenderProps> = (props, children) => {
  const { provides: annotation } = useAnnotationCapability();
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});

  const addReply = (pageIndex: number, currentAnnotation: PdfAnnotationObject, reply: string) => {
    if (!reply.trim()) return;

    annotation?.createAnnotation(pageIndex, {
      id: uuidV4(),
      rect: {
        origin: {
          x: currentAnnotation.rect.origin.x,
          y: currentAnnotation.rect.origin.y,
        },
        size: {
          width: 24,
          height: 24,
        },
      },
      pageIndex,
      created: new Date(),
      modified: new Date(),
      type: PdfAnnotationSubtype.TEXT,
      contents: reply,
      inReplyToId: currentAnnotation.id,
      flags: ['noRotate', 'noZoom', 'print'],
      icon: PdfAnnotationIcon.Comment,
    });

    // Clear the reply text after sending
    setReplyTexts((prev) => ({ ...prev, [currentAnnotation.id]: '' }));
  };

  const handleReplyChange = (annotationId: string, value: string) => {
    setReplyTexts((prev) => ({ ...prev, [annotationId]: value }));
  };

  // Sort pages by page number
  const sortedPages = Object.keys(props.sidebarAnnotations)
    .map(Number)
    .sort((a, b) => a - b);

  console.log(props.sidebarAnnotations);

  return (
    <div className="h-full overflow-auto bg-gray-50">
      {/* Header */}

      {/* Comments List Grouped by Page */}
      <div className="space-y-6 p-4">
        {sortedPages.map((pageNumber) => (
          <div key={pageNumber} className="space-y-3">
            {/* Page Header */}
            <div className="sticky top-0 border-b border-gray-200 bg-gray-50 py-2">
              <h3 className="text-lg font-semibold text-gray-800">Page {pageNumber + 1}</h3>
              <p className="text-sm text-gray-500">
                {props.sidebarAnnotations[pageNumber].length} comment
                {props.sidebarAnnotations[pageNumber].length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Annotations for this page */}
            <div className="space-y-3">
              {props.sidebarAnnotations[pageNumber].map((entry) => {
                const replyText = replyTexts[entry.annotation.object.id] || '';
                const config = getAnnotationConfig(entry.annotation);
                if (!config) {
                  return null;
                }
                return (
                  <div
                    key={entry.annotation.object.id}
                    className="rounded-lg border border-gray-200 bg-white shadow-sm"
                  >
                    {/* Main Comment */}
                    <div className="p-4">
                      <div className="flex flex-col items-start justify-between">
                        <div className="flex flex-1 items-start space-x-3">
                          <AnnotationIcon
                            annotation={entry.annotation}
                            config={config}
                            className="h-8 w-8"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-2">
                              <div className="leading-none">
                                <h4 className="text-sm font-medium text-gray-900">
                                  {entry.annotation.object.author || 'Guest'}
                                </h4>
                                <span className="text-xs text-gray-400">
                                  {entry.annotation.object.modified ||
                                  entry.annotation.object.created
                                    ? formatDate(
                                        entry.annotation.object.modified ||
                                          entry.annotation.object.created,
                                      )
                                    : '(no date)'}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-700">
                              {entry.annotation.object.contents || config.label}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {entry.replies.length > 0 && (
                        <div className="mt-5 space-y-5">
                          {entry.replies.map((reply) => (
                            <div key={reply.object.id} className="flex items-start space-x-3">
                              <UserAvatar name={reply.object.author} className="h-8 w-8" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2">
                                  <div className="leading-none">
                                    <h5 className="text-sm font-medium text-gray-900">
                                      {reply.object.author || 'Guest'}
                                    </h5>
                                    <span className="text-xs text-gray-400">
                                      {reply.object.modified || reply.object.created
                                        ? formatDate(reply.object.modified || reply.object.created)
                                        : '(no date)'}
                                    </span>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-700">
                                  {reply.object.contents}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      <div className="mt-4 border-t border-gray-100 pt-4">
                        <div className="flex items-end space-x-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="Add reply..."
                              value={replyText}
                              onInput={(e) =>
                                handleReplyChange(entry.annotation.object.id, e.currentTarget.value)
                              }
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  addReply(
                                    entry.annotation.object.pageIndex,
                                    entry.annotation.object,
                                    replyText,
                                  );
                                }
                              }}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            onClick={() =>
                              addReply(
                                entry.annotation.object.pageIndex,
                                entry.annotation.object,
                                replyText,
                              )
                            }
                            disabled={!replyText.trim()}
                            className="rounded-lg bg-blue-500 p-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
