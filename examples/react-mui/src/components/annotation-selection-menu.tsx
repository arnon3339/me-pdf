import { Box, Paper, IconButton, Tooltip } from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import { TrackedAnnotation } from '@embedpdf/plugin-annotation';
import { useAnnotationCapability } from '@embedpdf/plugin-annotation/react';

interface AnnotationSelectionMenuProps {
  selected: TrackedAnnotation;
  topOffset: number;
}

export function AnnotationSelectionMenu({ selected, topOffset }: AnnotationSelectionMenuProps) {
  const { provides: annotation } = useAnnotationCapability();

  const handleDelete = () => {
    if (!annotation) return;
    const { pageIndex, id } = selected.object;
    annotation.deleteAnnotation(pageIndex, id);
  };

  return (
    <Paper
      elevation={2}
      sx={{
        px: 0.5,
        py: 0.25,
        display: 'flex',
        alignItems: 'center',
        gap: 0.25,
        position: 'absolute',
        top: topOffset,
        borderRadius: 1,
        pointerEvents: 'auto',
        cursor: 'default',
      }}
    >
      <Tooltip title="Delete" arrow>
        <IconButton size="small" onClick={handleDelete} aria-label="Delete annotation">
          <DeleteOutlineOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Paper>
  );
}
