import { Fragment, h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
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
import { useScrollCapability } from '@embedpdf/plugin-scroll/preact';

export interface CommentRenderProps {
  sidebarAnnotations: Record<number, SidebarAnnotationEntry[]>;
  selectedAnnotation: TrackedAnnotation | null;
}

// Menu Dropdown Component
interface MenuDropdownProps {
  isOpen: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const MenuDropdown = ({ isOpen, onEdit, onDelete, onClose }: MenuDropdownProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      // Use capture phase to ensure outside clicks are handled after button clicks
      document.addEventListener('mousedown', handleClickOutside, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-6 z-10 w-32 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div className="py-1">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEdit();
            onClose();
          }}
          className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
        >
          Edit
        </button>
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
            onClose();
          }}
          className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

// Truncated Text Component
interface TruncatedTextProps {
  text?: string;
  maxWords?: number;
  className?: string;
  expandedId: string;
  isExpanded: boolean;
  onToggle: (id: string, isExpanded: boolean) => void;
}

const TruncatedText = ({
  text,
  maxWords = 16,
  className = '',
  expandedId,
  isExpanded,
  onToggle,
}: TruncatedTextProps) => {
  if (!text) return null;

  const words = text.split(' ');
  const shouldTruncate = words.length > maxWords;
  const displayText = shouldTruncate && !isExpanded ? words.slice(0, maxWords).join(' ') : text;

  return (
    <div className={className}>
      {displayText}
      {shouldTruncate && (
        <Fragment>
          {' '}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(expandedId, !isExpanded);
            }}
            className="text-sm font-medium text-blue-500 hover:text-blue-600 focus:outline-none"
          >
            {isExpanded ? 'less' : 'more'}
          </button>
        </Fragment>
      )}
    </div>
  );
};

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
  const { provides: scroll } = useScrollCapability();
  const [replyTexts, setReplyTexts] = useState<Record<string, string>>({});
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [editingItems, setEditingItems] = useState<Record<string, boolean>>({});
  const [editTexts, setEditTexts] = useState<Record<string, string>>({});

  // Refs for annotation elements and input fields
  const annotationRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Effect to handle scrolling to selected annotation and focusing input
  useEffect(() => {
    if (props.selectedAnnotation && scrollContainerRef.current) {
      const selectedId = props.selectedAnnotation.object.id;
      const annotationElement = annotationRefs.current[selectedId];
      const inputElement = inputRefs.current[selectedId];

      if (annotationElement) {
        // Scroll to the annotation with smooth behavior
        annotationElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });

        // Focus the input after a short delay to ensure scrolling completes
        if (inputElement) {
          setTimeout(() => {
            inputElement.focus();
          }, 300);
        }
      }
    }
  }, [props.selectedAnnotation]);

  const selectAnnotation = (selectedAnnotation: TrackedAnnotation) => {
    annotation?.selectAnnotation(selectedAnnotation.object.pageIndex, selectedAnnotation.object.id);
    scroll?.scrollToPage({
      pageNumber: selectedAnnotation.object.pageIndex + 1,
      pageCoordinates: {
        x: selectedAnnotation.object.rect.origin.x,
        y: selectedAnnotation.object.rect.origin.y,
      },
      center: true,
      behavior: 'smooth',
    });
  };

  const handleExpandToggle = (id: string, isExpanded: boolean) => {
    setExpandedItems((prev) => ({ ...prev, [id]: isExpanded }));
  };

  const deleteComment = (currentAnnotation: TrackedAnnotation) => {
    annotation?.deleteAnnotation(currentAnnotation.object.pageIndex, currentAnnotation.object.id);
  };

  const deleteReply = (reply: TrackedAnnotation) => {
    annotation?.deleteAnnotation(reply.object.pageIndex, reply.object.id);
  };

  const startEditing = (id: string, currentText: string) => {
    setEditingItems((prev) => ({ ...prev, [id]: true }));
    setEditTexts((prev) => ({ ...prev, [id]: currentText }));
  };

  const cancelEditing = (id: string) => {
    setEditingItems((prev) => ({ ...prev, [id]: false }));
    setEditTexts((prev) => ({ ...prev, [id]: '' }));
  };

  const saveEdit = (currentAnnotation: PdfAnnotationObject, id: string) => {
    const newText = editTexts[id];

    if (!newText.trim()) {
      return;
    }

    annotation?.updateAnnotation(currentAnnotation.pageIndex, currentAnnotation.id, {
      contents: newText,
      modified: new Date(),
    });

    setEditingItems((prev) => ({ ...prev, [id]: false }));
    setEditTexts((prev) => ({ ...prev, [id]: '' }));
  };

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const closeMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: false }));
  };

  const addComment = (currentAnnotation: PdfAnnotationObject, comment: string) => {
    if (!comment.trim()) return;

    annotation?.updateAnnotation(currentAnnotation.pageIndex, currentAnnotation.id, {
      contents: comment,
      modified: new Date(),
    });

    // Clear the comment text after adding
    setCommentTexts((prev) => ({ ...prev, [currentAnnotation.id]: '' }));
  };

  const addReply = (currentAnnotation: PdfAnnotationObject, reply: string) => {
    if (!reply.trim()) return;

    annotation?.createAnnotation(currentAnnotation.pageIndex, {
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
      pageIndex: currentAnnotation.pageIndex,
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

  const handleCommentChange = (annotationId: string, value: string) => {
    setCommentTexts((prev) => ({ ...prev, [annotationId]: value }));
  };

  // Sort pages by page number
  const sortedPages = Object.keys(props.sidebarAnnotations)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div ref={scrollContainerRef} className="h-full overflow-auto">
      {/* Header */}

      {/* Comments List Grouped by Page */}
      <div className="space-y-6 p-3">
        {sortedPages.map((pageNumber) => (
          <div key={pageNumber} className="space-y-3">
            {/* Page Header */}
            <div className="sticky top-0 bg-white px-1">
              <div className="border-b border-gray-200 py-2">
                <h3 className="text-md font-semibold text-gray-800">Page {pageNumber + 1}</h3>
                <p className="text-sm text-gray-500">
                  {props.sidebarAnnotations[pageNumber].length} comment
                  {props.sidebarAnnotations[pageNumber].length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Annotations for this page */}
            <div className="space-y-3 px-1">
              {props.sidebarAnnotations[pageNumber].map((entry) => {
                const replyText = replyTexts[entry.annotation.object.id] || '';
                const commentText = commentTexts[entry.annotation.object.id] || '';
                const config = getAnnotationConfig(entry.annotation);
                const hasContent = entry.annotation.object.contents;
                const hasReplies = entry.replies.length > 0;
                const showCommentInput = !hasContent && !hasReplies;
                const isSelected =
                  props.selectedAnnotation?.object.id === entry.annotation.object.id;
                const isEditing = editingItems[entry.annotation.object.id];
                const editText = editTexts[entry.annotation.object.id] || '';

                if (!config) {
                  return null;
                }
                return (
                  <div
                    key={entry.annotation.object.id}
                    ref={(el) => {
                      annotationRefs.current[entry.annotation.object.id] = el;
                    }}
                    onClick={() => selectAnnotation(entry.annotation)}
                    className={`cursor-pointer rounded-lg border bg-white shadow-sm transition-colors hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Main Comment */}
                    <div className="p-4">
                      <div className="flex flex-col items-start justify-between">
                        <div className="flex w-full flex-1 items-start space-x-3">
                          <AnnotationIcon
                            annotation={entry.annotation}
                            config={config}
                            className="h-8 w-8"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
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
                              {/* Menu Button */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu(entry.annotation.object.id);
                                  }}
                                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                >
                                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                  </svg>
                                </button>
                                <MenuDropdown
                                  isOpen={openMenus[entry.annotation.object.id] || false}
                                  onEdit={() =>
                                    startEditing(
                                      entry.annotation.object.id,
                                      entry.annotation.object.contents || '',
                                    )
                                  }
                                  onDelete={() => deleteComment(entry.annotation)}
                                  onClose={() => closeMenu(entry.annotation.object.id)}
                                />
                              </div>
                            </div>
                            {entry.annotation.object.custom?.text && (
                              <TruncatedText
                                text={entry.annotation.object.custom.text}
                                maxWords={14}
                                className="mt-2 text-sm text-gray-500"
                                expandedId={`custom-${entry.annotation.object.id}`}
                                isExpanded={
                                  expandedItems[`custom-${entry.annotation.object.id}`] || false
                                }
                                onToggle={handleExpandToggle}
                              />
                            )}
                            {(entry.annotation.object.contents || config.label) && (
                              <div className="mt-2">
                                {isEditing ? (
                                  <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                                    <textarea
                                      value={editText}
                                      onInput={(e) =>
                                        setEditTexts((prev) => ({
                                          ...prev,
                                          [entry.annotation.object.id]: e.currentTarget.value,
                                        }))
                                      }
                                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      rows={3}
                                    />
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() =>
                                          saveEdit(
                                            entry.annotation.object,
                                            entry.annotation.object.id,
                                          )
                                        }
                                        className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                                      >
                                        Save
                                      </button>
                                      <button
                                        onClick={() => cancelEditing(entry.annotation.object.id)}
                                        className="rounded-md bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-800">
                                    {entry.annotation.object.contents || config.label}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {entry.replies.length > 0 && (
                        <div className="mt-5 space-y-5">
                          {entry.replies.map((reply) => {
                            const isReplyEditing = editingItems[reply.object.id];
                            const replyEditText = editTexts[reply.object.id] || '';

                            return (
                              <div key={reply.object.id} className="flex items-start space-x-3">
                                <UserAvatar name={reply.object.author} className="h-8 w-8" />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <div className="leading-none">
                                        <h5 className="text-sm font-medium text-gray-900">
                                          {reply.object.author || 'Guest'}
                                        </h5>
                                        <span className="text-xs text-gray-400">
                                          {reply.object.modified || reply.object.created
                                            ? formatDate(
                                                reply.object.modified || reply.object.created,
                                              )
                                            : '(no date)'}
                                        </span>
                                      </div>
                                    </div>
                                    {/* Reply Menu Button */}
                                    <div className="relative">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleMenu(reply.object.id);
                                        }}
                                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                      >
                                        <svg
                                          className="h-4 w-4"
                                          fill="currentColor"
                                          viewBox="0 0 20 20"
                                        >
                                          <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                                        </svg>
                                      </button>
                                      <MenuDropdown
                                        isOpen={openMenus[reply.object.id] || false}
                                        onEdit={() =>
                                          startEditing(reply.object.id, reply.object.contents || '')
                                        }
                                        onDelete={() => deleteReply(reply)}
                                        onClose={() => closeMenu(reply.object.id)}
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-2">
                                    {isReplyEditing ? (
                                      <div
                                        className="space-y-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <textarea
                                          value={replyEditText}
                                          onInput={(e) =>
                                            setEditTexts((prev) => ({
                                              ...prev,
                                              [reply.object.id]: e.currentTarget.value,
                                            }))
                                          }
                                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                          rows={2}
                                        />
                                        <div className="flex space-x-2">
                                          <button
                                            onClick={() => saveEdit(reply.object, reply.object.id)}
                                            className="rounded-md bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                                          >
                                            Save
                                          </button>
                                          <button
                                            onClick={() => cancelEditing(reply.object.id)}
                                            className="rounded-md bg-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-400"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700">
                                        {reply.object.contents}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Comment/Reply Input - only show when not editing */}
                      {!isEditing && (
                        <div
                          className="mt-4 border-t border-gray-100 pt-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-end space-x-2">
                            <div className="flex-1">
                              <input
                                ref={(el) => {
                                  inputRefs.current[entry.annotation.object.id] = el;
                                }}
                                type="text"
                                placeholder={showCommentInput ? 'Add comment...' : 'Add reply...'}
                                value={showCommentInput ? commentText : replyText}
                                onInput={(e) => {
                                  if (showCommentInput) {
                                    handleCommentChange(
                                      entry.annotation.object.id,
                                      e.currentTarget.value,
                                    );
                                  } else {
                                    handleReplyChange(
                                      entry.annotation.object.id,
                                      e.currentTarget.value,
                                    );
                                  }
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (showCommentInput) {
                                      addComment(entry.annotation.object, commentText);
                                    } else {
                                      addReply(entry.annotation.object, replyText);
                                    }
                                  }
                                }}
                                className={`w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-500 transition-colors focus:border-transparent focus:outline-none focus:ring-2 ${
                                  isSelected
                                    ? 'border-blue-300 focus:ring-blue-500'
                                    : 'border-gray-300 focus:ring-blue-500'
                                }`}
                              />
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (showCommentInput) {
                                  addComment(entry.annotation.object, commentText);
                                } else {
                                  addReply(entry.annotation.object, replyText);
                                }
                              }}
                              disabled={showCommentInput ? !commentText.trim() : !replyText.trim()}
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
                      )}
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
