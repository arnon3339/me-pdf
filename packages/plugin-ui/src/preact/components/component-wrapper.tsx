import { useState, useEffect } from 'preact/hooks';
import { UIComponent } from '@embedpdf/plugin-ui';

export function ComponentWrapper({ component }: { component: UIComponent<any> }) {
  const [_, forceUpdate] = useState({});

  useEffect(() => {
    const updateCallback = () => forceUpdate({});
    // If there was an update before we attached the listener, force an update
    if (component.onUpdate(updateCallback)) {
      forceUpdate({});
    }
    return () => component.offUpdate(updateCallback);
  }, [component]);

  return component.render();
}