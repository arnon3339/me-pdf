import { Drawer as MuiDrawer, DrawerProps as MuiDrawerProps } from '@mui/material';

import { useDrawer } from './drawer-context';
import { DrawerPosition } from './types';

interface DrawerProps extends MuiDrawerProps {
  position: DrawerPosition;
  width?: number;
}

export const Drawer: React.FC<DrawerProps> = ({ position, width = 280, ...props }) => {
  const { drawerStates, getActiveComponent } = useDrawer();
  const { isOpen } = drawerStates[position];
  const activeComponent = getActiveComponent(position);

  const ActiveComponent = activeComponent?.component;

  return (
    <MuiDrawer
      variant="persistent"
      anchor={position}
      open={isOpen}
      slotProps={{
        paper: {
          sx: {
            width,
            boxSizing: 'border-box',
            position: 'relative',
            height: '100%',
            transition: 'none !important',
          },
        },
      }}
      sx={{
        width: isOpen ? width : 0,
        flexShrink: 0,
        transition: 'none',
      }}
      {...props}
    >
      {ActiveComponent && <ActiveComponent {...activeComponent.props} />}
    </MuiDrawer>
  );
};
