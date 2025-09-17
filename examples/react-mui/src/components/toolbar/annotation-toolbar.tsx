import { AppBar, Toolbar as MuiToolbar } from '@mui/material';
import TextFieldsOutlinedIcon from '@mui/icons-material/TextFieldsOutlined';
import GestureOutlinedIcon from '@mui/icons-material/GestureOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { AnnotationTool, useAnnotationCapability } from '@embedpdf/plugin-annotation/react';
import { useEffect, useState } from 'react';
import { ToggleIconButton } from '../toggle-icon-button';

export const AnnotationToolbar = () => {
  const { provides: annotationProvider } = useAnnotationCapability();
  const [activeTool, setActiveTool] = useState<AnnotationTool | null>(null);

  useEffect(() => {
    if (!annotationProvider) return;

    // Initialize current tool on mount
    setActiveTool(annotationProvider.getActiveTool());

    // Subscribe to changes
    return annotationProvider.onActiveToolChange((tool) => {
      setActiveTool(tool);
    });
  }, [annotationProvider]);

  const handleFreeTextAnnotation = () => {
    if (!annotationProvider) return;
    const currentId = activeTool?.id ?? null;
    annotationProvider.setActiveTool(currentId === 'freeText' ? null : 'freeText');
  };

  const handleInkAnnotation = () => {
    if (!annotationProvider) return;
    const currentId = activeTool?.id ?? null;
    annotationProvider.setActiveTool(currentId === 'ink' ? null : 'ink');
  };

  const handleStampApprovedAnnotation = () => {
    if (!annotationProvider) return;
    const currentId = activeTool?.id ?? null;
    annotationProvider.setActiveTool(currentId === 'stampApproved' ? null : 'stampApproved');
  };

  return (
    <AppBar
      position="static"
      color="default"
      elevation={0}
      sx={{ borderBottom: '1px solid #cfd4da' }}
    >
      <MuiToolbar
        variant="dense"
        disableGutters
        sx={{ gap: 1.5, px: 1.5, justifyContent: 'center' }}
      >
        <ToggleIconButton
          tone="light"
          isOpen={activeTool?.id === 'freeText'}
          onClick={handleFreeTextAnnotation}
          aria-label="Text annotation"
        >
          <TextFieldsOutlinedIcon fontSize="small" />
        </ToggleIconButton>
        <ToggleIconButton
          tone="light"
          isOpen={activeTool?.id === 'ink'}
          onClick={handleInkAnnotation}
          aria-label="Freehand annotation"
        >
          <GestureOutlinedIcon fontSize="small" />
        </ToggleIconButton>
        <ToggleIconButton
          tone="light"
          isOpen={activeTool?.id === 'stampApproved'}
          onClick={handleStampApprovedAnnotation}
          aria-label="Stamp approved"
        >
          <CheckCircleOutlinedIcon fontSize="small" />
        </ToggleIconButton>
      </MuiToolbar>
    </AppBar>
  );
};
