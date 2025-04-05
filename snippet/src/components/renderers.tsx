import { ActionTabsComponent, ActionTabsProps, ComponentRenderFunction, DividerComponent, FlyOutComponent, FlyOutProps, GroupedItemsComponent, GroupedItemsProps, HeaderComponent, HeaderProps, PanelProps, ToggleButtonComponent, ToggleButtonProps, ToolButtonComponent, ToolButtonProps } from "@embedpdf/plugin-ui";
import { h, Fragment, Ref, RefObject, ComponentType } from 'preact';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { useState, useRef, useEffect } from 'preact/hooks';
import { useUI } from "@embedpdf/plugin-ui/preact";
import { Dropdown, DropdownItems, DropdownItem, DropdownDivider } from './ui/dropdown';

export const toolButtonRenderer: ComponentRenderFunction<ToolButtonProps> = (props, children, context) => (
  <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={props.label!} trigger={context?.variant === 'flyout' ? 'none' : 'hover'}>
    <Button
      onClick={() => console.log(`Tool ${props.toolName} clicked`)}
      className={`
        ${context?.variant === 'flyout' ? 'px-2 rounded-none w-full' : ''}
      `}
    >
      {props.img && <img src={props.img} alt={props.label} className="w-5 h-5" />}
      {context?.variant === 'flyout' && props.label && <span className="text-sm pl-2">{props.label}</span>}
    </Button>
  </Tooltip>
);

export const toggleButtonRenderer: ComponentRenderFunction<ToggleButtonProps> = (props, _children, context) => {
  // Create a ref to store the button element
  const buttonRef = useRef<any>(null);
  // Get the UI instance
  const ui = useUI();

  const toggleType = ui?.getComponent(props.toggleElement)?.type;

  useEffect(() => {
    if (buttonRef.current) {
      if(toggleType === 'flyOut') {
        ui?.initFlyout(props.toggleElement, buttonRef.current.base);
      }
    }
  }, []);

  const handleClick = () => {
    if(toggleType === 'flyOut') {
      ui?.toggleFlyout(props.toggleElement);
    } else if(toggleType === 'panel') {
      ui?.togglePanel(props.toggleElement);
    }
  };

  return (
    <Tooltip 
      position={context?.direction === 'horizontal' ? 'bottom' : 'right'} 
      content={props.label!} 
      trigger={props.active ? 'none' : 'hover'} 
      targetElement={props.id}
    >
      <Button
        ref={buttonRef}
        onClick={handleClick}
        active={props.active}
        data-element={props.id}
        data-dropdown-placement="right"
        data-dropdown-toggle={props.id}
        className="toggleButton"
      >
        {props.img && <img src={props.img} alt={props.label} className="w-5 h-5" />}
      </Button>
    </Tooltip>
  );
};

export const flyOutRenderer: ComponentRenderFunction<FlyOutProps> = (props, children) => {
  const ui = useUI();

  if (!props.triggerElement) {
    return null;
  }

  return (
    <Dropdown
      id={props.id}
      trigger={props.triggerElement}
      open={props.open}
      placement={props.placement || 'bottom'}
      onShow={() => {
        if (!props.triggerElement) return;
      }}
      onHide={() => {
        if (!props.triggerElement) return;

        ui?.toggleFlyout(props.id, false);
      }}
    >
      <DropdownItems>
        {children()}
      </DropdownItems>
    </Dropdown>
  );
};

export const dividerRenderer: ComponentRenderFunction<DividerComponent> = (props, _: any, context) => {
  const className = context?.direction === 'horizontal' 
    ? 'h-6 w-[1px] bg-gray-200 self-center'
    : 'h-[1px] w-6 bg-gray-200 self-center';
    
  return <div className={className} />;
};

export const groupedItemsRenderer: ComponentRenderFunction<GroupedItemsProps> = (props, children, context) => {
  const style: h.JSX.CSSProperties = {
    display: 'flex',
    flexDirection: context?.direction === 'horizontal' ? 'row' : 'column',
    justifyContent: props.justifyContent || 'start',
    gap: `${props.gap || 0}px`,
  };

  return <div style={style}>{children()}</div>;
};

export const headerRenderer: ComponentRenderFunction<HeaderProps> = (props, children) => {
  const style: h.JSX.CSSProperties = {
    // Get the correct border based on placement
    ...(props.placement === 'top' ? { borderBottom: '1px solid #cfd4da' } :
        props.placement === 'bottom' ? { borderTop: '1px solid #cfd4da' } :
        props.placement === 'left' ? { borderRight: '1px solid #cfd4da' } :
        { borderLeft: '1px solid #cfd4da' }),
    width: props.placement === 'top' || props.placement === 'bottom' ? '100%' : 'auto',
    height: props.placement === 'left' || props.placement === 'right' ? '100%' : 'auto',
    zIndex: 10,
    justifyContent: 'space-between',
    display: 'flex',
    flexDirection: props.placement === 'top' || props.placement === 'bottom' ? 'row' : 'column',
    // Conditional padding based on placement
    ...(props.placement === 'top' || props.placement === 'bottom' 
      ? {
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '16px',
          paddingRight: '16px',
        }
      : {
          paddingLeft: '8px',
          paddingRight: '8px',
          paddingTop: '16px',
          paddingBottom: '16px',
        }
    ),
    ...props.style,
  };

  if(props.visible !== undefined && !props.visible) return null;

  return <div style={style} className="header">{children({
    ...props.renderChild && {
      filter: (childId) => childId === props.renderChild
    }
  })}</div>;
};

export const actionTabsRenderer: ComponentRenderFunction<ActionTabsProps> = (props, children) => {
  const [activeTab, setActiveTab] = useState(props.tabs[0].id);
  const ui = useUI();

  return <div className="flex flex-row items-center gap-4">
    {props.tabs.map((tab) => (
      <Button 
        key={tab.id} 
        className={`text-sm px-2 py-1 rounded-none hover:bg-transparent ${activeTab === tab.id ? 'border-b-2 border-b-blue-500 text-blue-500' : 'border-b-2 border-b-transparent'}`} 
        onClick={() => {
          setActiveTab(tab.id);
          ui?.setHeaderVisible(props.targetHeader, tab.triggerComponent ? true : false, tab.triggerComponent);
        }}
      >
        {tab.label}
      </Button>
    ))}
  </div>;
};

export const panelRenderer: ComponentRenderFunction<PanelProps> = (props, children) => {
  if(!props.open) return null;

  // Determine border class based on position
  const borderClass = props.location === 'left' ? 'border-r' : 'border-l';

  return <div className={`w-[250px] min-w-[250px] bg-white shrink-0 flex flex-col flex-none ${borderClass} border-[#cfd4da]`}>{children()}</div>;
};

export const searchRenderer: ComponentRenderFunction<any> = (props, children) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState("");
  
  useEffect(() => {
    // Focus the input element when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setInputValue(target.value);
  };
  
  const clearInput = () => {
    setInputValue("");
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  return (
    <div className="w-full h-full bg-white p-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <svg className="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
        <input 
          ref={inputRef}
          type="text" 
          placeholder="Search" 
          autoFocus
          value={inputValue}
          onInput={handleInputChange}
          className="w-full pl-10 pr-9 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        />
        {inputValue && (
          <div 
            className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
            onClick={clearInput}
          >
            <svg className="w-4 h-4 text-gray-500 hover:text-gray-700" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};