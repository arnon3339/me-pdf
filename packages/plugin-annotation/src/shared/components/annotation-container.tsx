import { PdfAnnotationObject } from '@embedpdf/models';
import {
  useState,
  JSX,
  CSSProperties,
  useRef,
  mapDoubleClick,
  useEffect,
  Fragment,
} from '@framework';
import { CounterRotate, useInteractionHandles } from '@embedpdf/utils/@framework';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { useAnnotationCapability } from '../hooks';
import { SelectionMenuProps, VertexConfig } from '../types';

interface AnnotationContainerProps<T extends PdfAnnotationObject> {
  scale: number;
  pageIndex: number;
  rotation: number;
  pageWidth: number;
  pageHeight: number;
  trackedAnnotation: TrackedAnnotation<T>;
  children: JSX.Element | ((annotation: T) => JSX.Element);
  isSelected: boolean;
  isDraggable: boolean;
  isResizable: boolean;
  lockAspectRatio?: boolean;
  style?: CSSProperties;
  vertexConfig?: VertexConfig<T>;
  selectionMenu?: (props: SelectionMenuProps) => JSX.Element;
  outlineOffset?: number;
  onDoubleClick?: (event: any) => void; // You'll need to import proper MouseEvent type
  zIndex?: number;
}

// Simplified AnnotationContainer
export function AnnotationContainer<T extends PdfAnnotationObject>({
  scale,
  pageIndex,
  rotation,
  pageWidth,
  pageHeight,
  trackedAnnotation,
  children,
  isSelected,
  isDraggable,
  isResizable,
  lockAspectRatio = false,
  style = {},
  vertexConfig,
  selectionMenu,
  outlineOffset = 1,
  onDoubleClick,
  zIndex = 1,
  ...props
}: AnnotationContainerProps<T>): JSX.Element {
  const [preview, setPreview] = useState<T>(trackedAnnotation.object);
  const { provides: annotationProvides } = useAnnotationCapability();
  const gestureBaseRef = useRef<T | null>(null);

  const currentObject = preview
    ? { ...trackedAnnotation.object, ...preview }
    : trackedAnnotation.object;

  const { dragProps, vertices, resize } = useInteractionHandles({
    controller: {
      element: currentObject.rect,
      vertices: vertexConfig?.extractVertices(currentObject),
      constraints: {
        minWidth: 25,
        minHeight: 25,
        boundingBox: { width: pageWidth / scale, height: pageHeight / scale },
      },
      maintainAspectRatio: lockAspectRatio,
      pageRotation: rotation,
      scale: scale,
      enabled: isSelected,
      onUpdate: (event) => {
        if (!event.transformData?.type) return;

        if (event.state === 'start') {
          gestureBaseRef.current = currentObject;
        }

        const transformType = event.transformData.type;
        const base = gestureBaseRef.current ?? currentObject;

        const changes = event.transformData.changes.vertices
          ? vertexConfig?.transformAnnotation(base, event.transformData.changes.vertices)
          : { rect: event.transformData.changes.rect };

        const patched = annotationProvides?.transformAnnotation<T>(base, {
          type: transformType,
          changes: changes as Partial<T>,
          metadata: event.transformData.metadata,
        });

        if (patched) {
          setPreview((prev) => ({
            ...prev,
            ...patched,
          }));
        }

        if (event.state === 'end' && patched) {
          gestureBaseRef.current = null;
          annotationProvides?.updateAnnotation(pageIndex, trackedAnnotation.object.id, patched);
        }
      },
    },
    resizeUI: {
      handleSize: 12,
      spacing: outlineOffset,
      offsetMode: 'outside',
      includeSides: true,
      zIndex: zIndex + 1,
    },
    vertexUI: {
      vertexSize: 12,
      zIndex: zIndex + 2,
    },
    includeVertices: vertexConfig ? true : false,
  });

  useEffect(() => {
    setPreview(trackedAnnotation.object);
  }, [trackedAnnotation.object]);

  return (
    <div data-no-interaction>
      <div
        {...(isDraggable && isSelected ? dragProps : {})}
        {...mapDoubleClick(onDoubleClick)}
        style={{
          position: 'absolute',
          left: currentObject.rect.origin.x * scale,
          top: currentObject.rect.origin.y * scale,
          width: currentObject.rect.size.width * scale,
          height: currentObject.rect.size.height * scale,
          outline: isSelected ? '1px solid #007ACC' : 'none',
          outlineOffset: isSelected ? `${outlineOffset}px` : '0px',
          pointerEvents: isSelected ? 'auto' : 'none',
          touchAction: 'none',
          cursor: isSelected && isDraggable ? 'move' : 'default',
          zIndex,
          ...style,
        }}
        {...props}
      >
        {typeof children === 'function' ? children(currentObject) : children}

        {isSelected &&
          isResizable &&
          resize.map((p) => <div {...p} style={{ ...p.style, backgroundColor: '#007ACC' }} />)}

        {isSelected &&
          vertices.map((p) => <div {...p} style={{ ...p.style, backgroundColor: '#007ACC' }} />)}
      </div>
      {/* CounterRotate remains unchanged */}
      <CounterRotate
        rect={{
          origin: {
            x: currentObject.rect.origin.x * scale,
            y: currentObject.rect.origin.y * scale,
          },
          size: {
            width: currentObject.rect.size.width * scale,
            height: currentObject.rect.size.height * scale,
          },
        }}
        rotation={rotation}
      >
        {({ rect, menuWrapperProps }) =>
          selectionMenu &&
          selectionMenu({
            annotation: trackedAnnotation,
            selected: isSelected,
            rect,
            menuWrapperProps,
          })
        }
      </CounterRotate>
    </div>
  );
}
