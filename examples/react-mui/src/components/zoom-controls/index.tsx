import { IconButton, Typography, Box } from '@mui/material';
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

import { useZoom } from '@embedpdf/plugin-zoom/react';

export const ZoomControls = () => {
  const { currentZoom, zoomIn, zoomOut } = useZoom();

  const zoomPercentage = Math.round(currentZoom * 100);

  return (
    <Box
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 1,
        pl: 1,
        pr: 0.3,
        py: 0.3,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
      }}
    >
      <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
        {zoomPercentage}%
      </Typography>
      <IconButton edge="start" size="small" sx={{ color: 'white', p: 0.4 }} aria-label="menu">
        <KeyboardArrowDownIcon fontSize="small" />
      </IconButton>
      <IconButton
        onClick={zoomOut}
        edge="start"
        size="small"
        sx={{ color: 'white', p: 0.4 }}
        aria-label="menu"
      >
        <RemoveCircleOutlineOutlinedIcon fontSize="small" />
      </IconButton>
      <IconButton
        onClick={zoomIn}
        edge="start"
        size="small"
        sx={{ color: 'white', p: 0.4 }}
        aria-label="menu"
      >
        <AddCircleOutlineOutlinedIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};
