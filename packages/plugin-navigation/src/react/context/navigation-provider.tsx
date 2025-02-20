import React, { ReactNode, useEffect, createContext, useContext, useState } from 'react';
import { usePDFCore } from '@embedpdf/core/react';
import { NavigationState, INavigationPlugin } from '../../lib/types';

interface NavigationContextValue extends NavigationState {
  goToPage: (page: number) => Promise<void>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

interface NavigationProviderProps {
  navigationPlugin: INavigationPlugin;
  children: ReactNode;
}

export function NavigationProvider({
  navigationPlugin: navigationPluginProp,
  children
}: NavigationProviderProps) {
  const core = usePDFCore();

  const [navigationPlugin, setNavigationPlugin] = useState<INavigationPlugin | null>(null);
  const [state, setState] = useState<NavigationState>(navigationPluginProp.getState());

  useEffect(() => {
    core.registerPlugin(navigationPluginProp);
    setNavigationPlugin(navigationPluginProp);

    // Subscribe to state changes
    const unsubscribe = navigationPluginProp.subscribe((newState) => {
      setState(newState);
    });

    return () => {
      unsubscribe();
      core.unregisterPlugin(navigationPluginProp.name);
    };
  }, [core, navigationPluginProp]);

  const value = navigationPlugin ? {
    ...state,
    goToPage: navigationPlugin.goToPage.bind(navigationPlugin),
  } : null;

  if (!value) {
    return null;
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}