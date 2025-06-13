import { useViewportCapability } from '@embedpdf/plugin-viewport/react';
import { useScrollCapability } from '@embedpdf/plugin-scroll/react';
import { Box, IconButton, TextField, Typography } from '@mui/material';
import { useEffect, useRef, useState, useCallback } from 'react';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

export const PageControls = () => {
  const { provides: viewport } = useViewportCapability();
  const { provides: scroll } = useScrollCapability();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout>(null);

  const startHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    hideTimeoutRef.current = setTimeout(() => {
      if (!isHovering) {
        setIsVisible(false);
      }
    }, 4000);
  }, [isHovering]);

  useEffect(() => {
    if (!viewport) return;

    return viewport.onScrollActivity((activity) => {
      if (activity) {
        setIsVisible(true);
        startHideTimer();
      }
    });
  }, [viewport, startHideTimer]);

  useEffect(() => {
    if (!scroll) return;

    return scroll.onPageChange(({ pageNumber, totalPages }) => {
      setCurrentPage(pageNumber);
      setTotalPages(totalPages);
    });
  }, [scroll]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    startHideTimer();
  };

  const handlePageChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const pageStr = formData.get('page') as string;
    const page = parseInt(pageStr);

    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      scroll?.scrollToPage({
        pageNumber: page,
      });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      scroll?.scrollToPage({
        pageNumber: currentPage - 1,
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      scroll?.scrollToPage({
        pageNumber: currentPage + 1,
      });
    }
  };

  return (
    <Box
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      sx={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          bgcolor: '#f8f9fa',
          borderRadius: 1,
          border: '1px solid #cfd4da',
          p: 1,
        }}
      >
        <IconButton onClick={handlePreviousPage} disabled={currentPage === 1} size="small">
          <NavigateBeforeIcon />
        </IconButton>

        <form onSubmit={handlePageChange} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TextField
            name="page"
            value={currentPage}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value) {
                const page = parseInt(value);
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page);
                }
              }
            }}
            inputProps={{
              style: {
                width: '32px',
                height: '32px',
                padding: '4px',
                textAlign: 'center',
                fontSize: '14px',
              },
            }}
            variant="outlined"
            size="small"
          />
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {totalPages}
          </Typography>
        </form>

        <IconButton onClick={handleNextPage} disabled={currentPage === totalPages} size="small">
          <NavigateNextIcon />
        </IconButton>
      </Box>
    </Box>
  );
};
