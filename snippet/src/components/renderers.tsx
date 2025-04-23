import { ActionTabsComponent, ActionTabsProps, ComponentRenderFunction, DividerComponent, FloatingComponentProps, FlyOutComponent, FlyOutProps, GroupedItemsComponent, GroupedItemsProps, HeaderComponent, HeaderProps, PanelProps, ToggleButtonComponent, ToggleButtonProps, ToolButtonComponent, ToolButtonProps } from "@embedpdf/plugin-ui";
import { h, Fragment, Ref, RefObject, ComponentType } from 'preact';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useUI } from "@embedpdf/plugin-ui/preact";
import { Dropdown, DropdownItems, DropdownItem, DropdownDivider } from './ui/dropdown';
import { useZoom } from "@embedpdf/plugin-zoom/preact";
import { useViewport } from "@embedpdf/plugin-viewport/preact";
import { useScroll } from "@embedpdf/plugin-scroll/preact";

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
        className={`text-sm px-2 py-1 rounded-none hover:bg-transparent ${activeTab === tab.id ? 'border-b-2 border-b-blue-500 text-blue-500' : 'border-b-2 border-b-transparent'} hover:ring-transparent`} 
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

interface ZoomRendererProps {
  zoomLevel: number;
}

export const zoomRenderer: ComponentRenderFunction<ZoomRendererProps> = (props, children, context) => {
  const zoom = useZoom();
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);
  const zoomDropdownRef = useRef<any>(null);
  // Format zoom level as percentage and round to avoid floating point issues
  const zoomPercentage = Math.round(props.zoomLevel * 100);

  const handleZoomOut = () => {
    zoom?.zoomOut();
  };

  const handleZoomIn = () => {
    zoom?.zoomIn();
  };

  useEffect(() => {
    if(zoomDropdownRef.current) {
      console.log(zoomDropdownRef.current);
    }
  }, [zoomDropdownRef.current]);

  return <div className="flex flex-row items-center bg-[#f1f3f5] rounded-md">
    <div className="ZoomText">
      <input type="text" className="border-0 bg-transparent text-sm text-right p-0 h-6 w-8" aria-label="Set zoom" value={zoomPercentage} />
      <span className="text-sm">%</span>
    </div>
    <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={'Zoom Options'} trigger={'hover'}>
      <Button className="p-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </Button>
    </Tooltip>
    <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={'Zoom Out'} trigger={'hover'}>
      <Button className="p-1" onClick={handleZoomOut}>
        <svg  xmlns="http://www.w3.org/2000/svg"  width="22"  height="22"  viewBox="0 0 24 24"  fill="none"  stroke="#343a40"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle-minus">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
          <path d="M9 12l6 0" />
        </svg>
      </Button>
    </Tooltip>
    <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={'Zoom In'} trigger={'hover'}>
      <Button className="p-1" onClick={handleZoomIn}>
        <svg  xmlns="http://www.w3.org/2000/svg"  width="22"  height="22"  viewBox="0 0 24 24"  fill="none"  stroke="#343a40"  strokeWidth="2"  strokeLinecap="round"  strokeLinejoin="round"  class="icon icon-tabler icons-tabler-outline icon-tabler-circle-plus">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
          <path d="M9 12h6" />
          <path d="M12 9v6" />
        </svg>
      </Button>
    </Tooltip>
  </div>;
};

export const pageControlsContainerRenderer: ComponentRenderFunction<FloatingComponentProps> = (props, children) => {
  const viewport = useViewport();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout>();

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
    if(!viewport) return;

    return viewport.onScrollChange((scrollMetrics) => {
      if(scrollMetrics.scrollTop > 0 || scrollMetrics.scrollLeft > 0) {
        setIsVisible(true);
        startHideTimer();
      }
    });
  }, [viewport, startHideTimer]);

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

  return (
    <div 
      className="absolute bottom-4 left-1/2 -translate-x-1/2"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`bg-[#f8f9fa] rounded-md border border-[#cfd4da] p-1 transition-opacity duration-200 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        {children()}
      </div>
    </div>
  );
};

export interface PageControlsProps {
  currentPage: number;
  pageCount: number;
}

export const pageControlsRenderer: ComponentRenderFunction<PageControlsProps> = (props) => {
  const scroll = useScroll();
  const isFirstPage = props.currentPage === 1;
  const isLastPage = props.currentPage === props.pageCount;

  const handlePageChange = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const pageStr = formData.get('page') as string;
    const page = parseInt(pageStr);

    if (!isNaN(page) && page >= 1) {
      scroll?.scrollToPage(page);
    }
  };

  const handleNextPage = () => {
    scroll?.scrollToNextPage();
  };

  const handlePreviousPage = () => {
    scroll?.scrollToPreviousPage();
  };

  return <div className="flex flex-row items-center justify-between rounded-md gap-3">
    <Tooltip position={'top'} content={'Previous Page'} trigger={isFirstPage ? 'none' : 'hover'}>
      <Button 
        className={`p-1 ${isFirstPage ? 'opacity-50 cursor-not-allowed hover:ring-0' : ''}`} 
        onClick={handlePreviousPage}
        disabled={isFirstPage}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-left"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 6l-6 6l6 6" /></svg>
      </Button>
    </Tooltip>
    <form className="flex flex-row items-center gap-3" onSubmit={handlePageChange}>
      <input name="page" type="text" className="border-1 border-gray-600 rounded-md bg-white text-sm text-center p-0 h-8 w-8" aria-label="Set page" value={props.currentPage} />
      <span className="text-sm">{props.pageCount}</span>
    </form>
    <Tooltip position={'top'} content={'Next Page'} trigger={isLastPage ? 'none' : 'hover'}>
      <Button 
        className={`p-1 ${isLastPage ? 'opacity-50 cursor-not-allowed hover:ring-0' : ''}`}
        onClick={handleNextPage}
        disabled={isLastPage}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-right"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 6l6 6l-6 6" /></svg>
      </Button>
    </Tooltip>
  </div>;
};