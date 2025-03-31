import { DividerComponent, FlyOutComponent, GroupedItemsComponent, HeaderComponent, ToggleButtonComponent, ToolButtonComponent } from "@embedpdf/plugin-ui";
import { h, Fragment, Ref, RefObject, ComponentType } from 'preact';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { useState, useRef, useEffect } from 'preact/hooks';
import { useUI } from "@embedpdf/plugin-ui/preact";
import { Dropdown, DropdownItems, DropdownItem, DropdownDivider } from './ui/dropdown';

export const toolButtonRenderer = (props: ToolButtonComponent) => (
  <Tooltip content={props.label!}>
    <Button
      onClick={() => console.log(`Tool ${props.toolName} clicked`)}
    >
      {props.img && <img src={props.img} alt={props.label} className="w-5 h-5" />}
    </Button>
  </Tooltip>
);

export const toggleButtonRenderer = (props: ToggleButtonComponent) => {
  // Create a ref to store the button element
  const buttonRef = useRef<any>(null);
  // Get the UI instance
  const ui = useUI();

  useEffect(() => {
    const flyout = ui?.getComponent(props.toggleElement);

    if (flyout && buttonRef.current) {
      flyout.update({ triggerHTMLElement: buttonRef.current.base, triggerElement: props.dataElement });
    }
  }, []);

  const handleClick = () => {
    const flyout = ui?.getComponent<FlyOutComponent>(props.toggleElement);
    if (flyout) {
      if(flyout.props.open) return;

      flyout.update({ open: !flyout.props.open });
    }
  };

  return (
    <Tooltip content={props.label!} trigger={props.active ? 'none' : 'hover'} targetElement={props.dataElement}>
      <Button
        ref={buttonRef}
        onClick={handleClick}
        active={props.active}
        data-element={props.dataElement}
        className="toggleButton"
      >
        {props.img && <img src={props.img} alt={props.label} className="w-5 h-5" />}
      </Button>
    </Tooltip>
  );
};

export const flyOutRenderer = (props: FlyOutComponent, children: any[]) => {
  const ui = useUI();

  if (!props.triggerHTMLElement) {
    return null;
  }

  console.log('props', props);

  return (
    <Dropdown
      id={props.dataElement}
      trigger={props.triggerHTMLElement}
      placement="bottom"
      open={props.open}
      onShow={() => {
        if (!props.triggerElement) return;
        ui?.getComponent(props.triggerElement)?.update({ active: true });
      }}
      onHide={() => {
        if (!props.triggerElement) return;
        ui?.getComponent(props.triggerElement)?.update({ active: false });
        setTimeout(() => {
          ui?.getComponent(props.dataElement)?.update({ open: false });
        }, 200);
      }}
    >
      <DropdownItems>
        {children}
      </DropdownItems>
    </Dropdown>
  );
};

export const dividerRenderer = (props: DividerComponent) => {
  return <div className="h-6 w-[1px] bg-gray-200 self-center" />;
};

export const groupedItemsRenderer = (props: GroupedItemsComponent, children: any[]) => {
  const style: h.JSX.CSSProperties = {
    display: 'flex',
    justifyContent: props.justifyContent || 'start',
    gap: `${props.gap || 0}px`,
  };

  console.log('props', props);

  return <div style={style}>{children}</div>;
};

export const headerRenderer = (props: HeaderComponent, children: any[]) => {
  const style: h.JSX.CSSProperties = {
    [props.placement === 'top' ? 'borderBottom' : 'borderTop']: '1px solid #cfd4da',
    width: props.placement === 'top' || props.placement === 'bottom' ? '100%' : 'auto',
    height: props.placement === 'left' || props.placement === 'right' ? '100%' : 'auto',
    zIndex: 10, // Ensure header stays above other content
    ...props.style,
  };

  return <div style={style} className="header">{children}</div>;
};