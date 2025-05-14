import { Action, CommandMenuProps, ComponentRenderFunction, DividerComponent, FloatingComponentProps, Group, GroupedItemsProps, HeaderProps, IconButtonProps, Menu, MenuItem, PanelProps, SelectButtonProps, TabButtonProps } from "@embedpdf/plugin-ui";
import { h, Fragment } from 'preact';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';
import { useState, useRef, useEffect, useCallback } from 'preact/hooks';
import { useUICapability } from "@embedpdf/plugin-ui/preact";
import { Dropdown } from './ui/dropdown';
import { useZoomCapability } from "@embedpdf/plugin-zoom/preact";
import { useViewportCapability } from "@embedpdf/plugin-viewport/preact";
import { useScrollCapability } from "@embedpdf/plugin-scroll/preact";
import { Icon } from "./ui/icon";
import { useSearchCapability } from "@embedpdf/plugin-search/preact";
import { useDebounce } from "@/hooks/use-debounce";
import { SearchAllPagesResult, SearchResult } from "@embedpdf/models";
import { MatchFlag } from "@embedpdf/models";
import { Checkbox } from "./ui/checkbox";

export const iconButtonRenderer: ComponentRenderFunction<IconButtonProps> = ({commandId, onClick, active, ...props}, children, context) => {
  const {provides: ui} = useUICapability();
  const command = commandId ? ui?.getMenuOrAction(commandId) : null;
  
  const handleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if(onClick) {
      onClick();
      return;
    }
    
    if (!commandId || !ui || !command) return;
    
    // Get the button element to use for positioning menus
    const triggerElement = e.currentTarget as HTMLElement;

    ui.executeCommand(commandId, { 
      source: 'click',
      triggerElement,
      position: context?.direction === 'horizontal' ? 'bottom' : 'right'
    });
  }, [command, commandId, ui, onClick]);

  return (
    <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={props.label!} trigger={active ? 'none' : 'hover'} delay={500}>
      <Button
        active={active}
        onClick={handleClick}
        className={`
          ${context?.variant === 'flyout' ? 'px-2 rounded-none w-full' : ''}
        `}
      >
        {!command?.icon && props.img && <img src={props.img} alt={props.label} className="w-5 h-5" /> }
        {command?.icon && <Icon icon={command.icon} className="w-5 h-5" />}
      </Button>
    </Tooltip>
  );
};

export const tabButtonRenderer: ComponentRenderFunction<TabButtonProps> = ({commandId, onClick, active, ...props}, children) => {
  const {provides: ui} = useUICapability();
  const command = commandId ? ui?.getMenuOrAction(commandId) : null;

  const handleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if(onClick) {
      onClick();
      return;
    }
    
    if (!commandId || !ui || !command) return;
    
    ui.executeCommand(commandId, { 
      source: 'click'
    });
  }, [command, commandId, ui, onClick]);

  return (
    <Button 
      key={props.id} 
      className={`text-sm px-2 py-1 rounded-none hover:bg-transparent ${active ? 'border-b-2 border-b-blue-500 text-blue-500' : 'border-b-2 border-b-transparent'} hover:ring-transparent`} 
      onClick={handleClick}
    >
      {props.label}
    </Button>
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
    ...props.visibleChild && {
      filter: (childId) => childId === props.visibleChild
    }
  })}</div>;
};

export const panelRenderer: ComponentRenderFunction<PanelProps> = (props, children) => {
  if(!props.open) return null;

  // Determine border class based on position
  const borderClass = props.location === 'left' ? 'md:border-r' : 'md:border-l';

  return <div className={`border-t md:border-t-0 w-full md:w-[275px] md:min-w-[275px] bg-white shrink-0 flex flex-col flex-none ${borderClass} border-[#cfd4da] h-full`}>
    {children({
      ...props.visibleChild && {
        filter: (childId) => childId === props.visibleChild
      }
    })}
  </div>;
};

function groupByPage(results: SearchResult[]) {
  return results.reduce<Record<number, { hit: SearchResult, index: number }[]>>((map, r, i) => {
    (map[r.pageIndex] ??= []).push({ hit: r, index: i });
    return map;
  }, {});
}

/** one hit line – click jumps to the first rect */
function HitLine({ hit, onClick, active }: { hit: SearchResult, onClick: (hit: SearchResult) => void, active: boolean }) {
  const { before, match, after, truncatedLeft, truncatedRight } = hit.context;
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (active && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [active]);

  return (
    <button
      ref={ref}
      onClick={() => onClick(hit)}
      className={`text-left w-full text-xs leading-tight p-3 rounded shadow-xs border border-[#cfd4da] text-gray-600 cursor-pointer ${active ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-100 hover:border-[#1a466b]'}`}
    >
      {truncatedLeft && "… "}
      {before}
      <span className="text-blue-500 font-bold">{match}</span>
      {after}
      {truncatedRight && " …"}
    </button>
  );
}

interface SearchRendererProps {
  flags: MatchFlag[];
  results: SearchResult[];
  total: number;
  activeResultIndex: number;
  active: boolean;
  query: string;
  loading: boolean;
}

export const searchRenderer: ComponentRenderFunction<SearchRendererProps> = (props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputValue, setInputValue] = useState(props.query || '');
  const {provides: search} = useSearchCapability();
  
  const debouncedValue = useDebounce(inputValue, 400);

  useEffect(() => {
    // Focus the input element when the component mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [search]);

  useEffect(() => {
    if(debouncedValue === '') {
      search?.stopSearch();
    } else {
      search?.searchAllPages(debouncedValue);
    }
  }, [debouncedValue, search]);
  
  const handleInputChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setInputValue(target.value);
  };

  const handleFlagChange = (flag: MatchFlag, checked: boolean) => {
    if(checked) {
      search?.setFlags([...props.flags, flag]);
    } else {
      search?.setFlags(props.flags.filter(f => f !== flag));
    }
  };
  
  const clearInput = () => {
    setInputValue("");
    // Focus the input after clearing
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const grouped = groupByPage(props.results);
  
  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
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
            className="w-full pl-8 pr-9 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="flex flex-row gap-4 mt-3">
          <Checkbox
            label="Case sensitive"
            checked={props.flags.includes(MatchFlag.MatchCase)}
            onChange={(checked) => handleFlagChange(MatchFlag.MatchCase, checked)}
          />
          <Checkbox
            label="Whole word"
            checked={props.flags.includes(MatchFlag.MatchWholeWord)}
            onChange={(checked) => handleFlagChange(MatchFlag.MatchWholeWord, checked)}
          />
        </div>
        <hr className="border-gray-200 mt-5 mb-2" />
        {props.active && !props.loading && <div className="flex flex-row justify-between items-center h-[32px]">
          <div className="text-xs text-gray-500">
            {props.total} results found
          </div>
          {props.total > 1 && <div className="flex flex-row">
            <Button onClick={() => {
              search?.previousResult();
            }}>
              <Icon icon={'chevronLeft'} className="w-4 h-4" />
            </Button>
            <Button onClick={() => {
              search?.nextResult();
            }}>
              <Icon icon={'chevronRight'} className="w-4 h-4" />
            </Button>
          </div>}
        </div>}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 px-4">
        {props.loading && <div className="flex flex-row justify-center items-center h-full">
          <div className="text-xs text-gray-500">
            Loading...
          </div>
        </div>}
        {!props.loading && Object.entries(grouped).map(([page, hits]) => (
          <div key={page} className="mt-2 first:mt-0">
            <div className="bg-white/80 backdrop-blur text-xs text-gray-500 py-2">
              Page {Number(page) + 1}
            </div>

            <div className="flex flex-col gap-2">
              {hits.map(({ hit, index }) => (
                <HitLine 
                  key={index} 
                  hit={hit} 
                  active={index === props.activeResultIndex}
                  onClick={() => {
                    search?.goToResult(index);
                  }} 
                />
              ))}
            </div>
          </div>
        ))}
        <div />
      </div>
    </div>
  );
};

export interface ZoomRendererProps {
  zoomLevel: number;
  commandZoomIn: string;
  commandZoomOut: string;
  commandZoomMenu: string;
  zoomMenuActive: boolean;
}

export const zoomRenderer: ComponentRenderFunction<ZoomRendererProps> = (props, children, context) => {
  const {provides: zoom} = useZoomCapability();
  const {provides: ui} = useUICapability();

  if(!ui) return null;

  const commandZoomMenu = props.commandZoomMenu ? ui.getMenuOrAction(props.commandZoomMenu) : null;
  const commandZoomIn = props.commandZoomIn ? ui.getMenuOrAction(props.commandZoomIn) : null;
  const commandZoomOut = props.commandZoomOut ? ui.getMenuOrAction(props.commandZoomOut) : null;

  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);
  const zoomDropdownRef = useRef<any>(null);
  // Format zoom level as percentage and round to avoid floating point issues
  const zoomPercentage = Math.round(props.zoomLevel * 100);

  const handleClick = (e: MouseEvent, command: Menu<any> | Action<any> | null | undefined) => {
    if (command) {
      ui.executeCommand(command.id, {
        source: 'click',
        triggerElement: e.currentTarget as HTMLElement,
        position: context?.direction === 'horizontal' ? 'bottom' : 'right',
        flatten: true
      });
    }
  };

  const handleZoomChange = (e: Event) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const zoomStr = formData.get('zoom') as string;

    zoom?.requestZoom(parseFloat(zoomStr) / 100);
  };

  useEffect(() => {
    if(zoomDropdownRef.current) {
      console.log(zoomDropdownRef.current);
    }
  }, [zoomDropdownRef.current]);

  return <div className="flex flex-row items-center bg-[#f1f3f5] rounded-md">
    <form onSubmit={handleZoomChange} className="hidden @3xl:block">
      <input
        name="zoom"
        type="text"
        inputMode="numeric"
        pattern="\d*"
        className="border-0 bg-transparent text-sm text-right p-0 h-6 w-8"
        aria-label="Set zoom"
        value={zoomPercentage}
        onInput={e => {
          // Only allow numbers
          const target = e.target as HTMLInputElement;
          target.value = target.value.replace(/[^0-9]/g, '');
        }}
      />
      <span className="text-sm">%</span>
    </form>
    <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={'Zoom Options'} trigger={props.zoomMenuActive ? 'none' : 'hover'}>
      <Button className={`p-1`} onClick={(e) => handleClick(e, commandZoomMenu)} active={props.zoomMenuActive}>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-chevron-down">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M6 9l6 6l6 -6" />
        </svg>
      </Button>
    </Tooltip>
    <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={'Zoom Out'} trigger={'hover'}>
      <Button className="p-1" onClick={(e) => handleClick(e, commandZoomOut)}>
        {commandZoomOut?.icon && <Icon icon={commandZoomOut.icon} className="w-5 h-5" />}
      </Button>
    </Tooltip>
    <Tooltip position={context?.direction === 'horizontal' ? 'bottom' : 'right'} content={'Zoom In'} trigger={'hover'}>
      <Button className="p-1" onClick={(e) => handleClick(e, commandZoomIn)}>
        {commandZoomIn?.icon && <Icon icon={commandZoomIn.icon} className="w-5 h-5" />}
      </Button>
    </Tooltip>
  </div>;
};

export const pageControlsContainerRenderer: ComponentRenderFunction<FloatingComponentProps> = (props, children) => {
  const {provides: viewport} = useViewportCapability();
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
  nextPageCommandId: string;
  previousPageCommandId: string;
}

export const pageControlsRenderer: ComponentRenderFunction<PageControlsProps> = (props) => {
  const {provides: scroll} = useScrollCapability();
  const {provides: ui} = useUICapability();
  const isFirstPage = props.currentPage === 1;
  const isLastPage = props.currentPage === props.pageCount;

  const commandNextPage = props.nextPageCommandId ? ui?.getMenuOrAction(props.nextPageCommandId) : null;
  const commandPreviousPage = props.previousPageCommandId ? ui?.getMenuOrAction(props.previousPageCommandId) : null;

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

  const handleClick = (e: MouseEvent, command: Menu<any> | Action<any> | null | undefined) => {
    if (command && ui) {
      ui.executeCommand(command.id, {
        source: 'click',
        triggerElement: e.currentTarget as HTMLElement,
      });
    }
  };

  return <div className="flex flex-row items-center justify-between rounded-md gap-3">
    <Tooltip position={'top'} content={'Previous Page'} trigger={isFirstPage ? 'none' : 'hover'}>
      <Button 
        className={`p-1 ${isFirstPage ? 'opacity-50 cursor-not-allowed hover:ring-0' : ''}`} 
        onClick={(e) => handleClick(e, commandPreviousPage)}
        disabled={isFirstPage}
      >
        {commandPreviousPage?.icon && <Icon icon={commandPreviousPage.icon} className="w-5 h-5" />}
      </Button>
    </Tooltip>
    <form className="flex flex-row items-center gap-3" onSubmit={handlePageChange}>
      <input
        name="page"
        type="text"
        inputMode="numeric"
        pattern="\d*"
        className="border-1 border-gray-600 rounded-md bg-white text-sm text-center p-0 h-8 w-8"
        aria-label="Set page"
        value={props.currentPage}
        onInput={e => {
          // Only allow numbers
          const target = e.target as HTMLInputElement;
          target.value = target.value.replace(/[^0-9]/g, '');
        }}
      />
      <span className="text-sm">{props.pageCount}</span>
    </form>
    <Tooltip position={'top'} content={'Next Page'} trigger={isLastPage ? 'none' : 'hover'}>
      <Button 
        className={`p-1 ${isLastPage ? 'opacity-50 cursor-not-allowed hover:ring-0' : ''}`}
        onClick={(e) => handleClick(e, commandNextPage)}
        disabled={isLastPage}
      >
        {commandNextPage?.icon && <Icon icon={commandNextPage.icon} className="w-5 h-5" />}
      </Button>
    </Tooltip>
  </div>;
};

export const commandMenuRenderer: ComponentRenderFunction<CommandMenuProps> = ({activeCommand, open, position, triggerElement, flatten}) => {
  const {provides: ui} = useUICapability();
  const [history, setHistory] = useState<string[]>([]);
  const lastPushRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) setHistory([]);
  }, [open]);

  useEffect(() => {
    if (!activeCommand) return;

    if (lastPushRef.current === activeCommand) {
      lastPushRef.current = null;
      return;
    }

    setHistory([]);
  }, [activeCommand]);

  if(!ui) return null;

  const items = activeCommand 
    ? ui?.getChildItems(activeCommand, { flatten }) 
    : null;

  const currentMenu =
    history.length > 0 && activeCommand ? ui.getMenuOrAction(activeCommand) : undefined;

  const handleHide = () => {
    ui.hideCommandMenu();
  };

  const handleCommandClick = (command: MenuItem) => {
    if (command.type === 'action') {
      ui.executeCommand(command.id);
      ui.hideCommandMenu();
    } else if (command.type === 'menu') {
      pushMenu(command.id);
    }
  };

  const pushMenu = (menuId: string) => {
    if (activeCommand) setHistory(prev => [...prev, activeCommand]);
    lastPushRef.current = menuId;

    ui.executeCommand(menuId, {
      triggerElement: triggerElement,
      position: position
    });
  };

  const goBack = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    lastPushRef.current = previous;
    ui.executeCommand(previous, {
      triggerElement: triggerElement,
      position: position
    });
  };

  const renderCommandItem = (command: MenuItem, index: number) => {
    if (command.type === 'group') {
      const group = command as Group;
      const groupChildren = ui.getItemsByIds(group.children);
      
      return (
        <Fragment key={command.id}>
          <div className="px-4 py-3 text-xs font-medium text-gray-600 uppercase">
            {group.label}
          </div>
          {groupChildren.map((child, childIndex) => (
            <Fragment key={child.id}>
              {renderCommandItem(child, childIndex)}
            </Fragment>
          ))}
          <hr className="my-2 border-gray-200" />
        </Fragment>
      );
    }

    const divider = command.dividerBefore && index !== 0 ? (
      <hr className="my-2 border-gray-200" />
    ) : null;

    return (
      <Fragment key={command.id}>
        {divider}
        <button 
          disabled={command.disabled ? true : false}
          onClick={() => handleCommandClick(command)} 
          className={`px-4 py-1 cursor-pointer flex flex-row items-center justify-between gap-2 
            ${command.type === 'menu' ? 'menu-item' : ''} 
            ${command.active && !command.disabled ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-blue-900 hover:text-white'} 
            ${command.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
          `}
        >
          <div className="flex flex-row items-center gap-2">
            <div className="flex justify-center items-center w-6 h-6">
              {command.icon && <Icon icon={command.icon} className="w-6 h-6" />}
            </div>
            <div className="text-sm">{command.label}</div>
          </div>
          <div className="flex items-center">
            {command.shortcutLabel && (
              <div className="text-sm mr-2">
                ({command.shortcutLabel})
              </div>
            )}
            {command.type === 'menu' && (
              <Icon icon="chevronRight" className="w-6 h-6" />
            )}
          </div>
        </button>
      </Fragment>
    );
  };

  const menuContent = (
    <Fragment>
      {history.length > 0 && (
        <div
          onClick={goBack}
          className="px-4 py-1 pb-2 cursor-pointer hover:bg-gray-100
                     flex flex-row items-center text-gray-500 gap-2 text-sm font-medium"
        >
          <Icon icon="chevronLeft" className="w-6 h-6 text-gray-500" /> {currentMenu?.label}
        </div>
      )}
      {items?.map((item, index) => renderCommandItem(item, index))}
    </Fragment>
  );

  if (!open) return null;

  // Render as Dropdown if there's a triggerElement, otherwise as SwipeableDrawer
  return ( 
    <Dropdown
      trigger={triggerElement}
      open={open}
      placement={position || 'bottom'}
      className="@max-[900px]:!bottom-0 @max-[900px]:!top-auto @max-[900px]:!left-0 @max-[900px]:!right-0"
      onShow={() => {
    
      }}
      onHide={handleHide}
    >
      {menuContent}
    </Dropdown>)
};

export const commentRender: ComponentRenderFunction<any> = (props, children) => {
  return <div>
    Comments
  </div>;
};

export const sidebarRender: ComponentRenderFunction<any> = (props, children) => {
  return <div>
    Sidebar
  </div>;
};

export const selectButtonRenderer: ComponentRenderFunction<SelectButtonProps> = ({activeCommandId, menuCommandId, active}, children) => {
  const {provides: ui} = useUICapability();
  if(!ui) return null;

  const activeCommand = ui.getMenuOrAction(activeCommandId);

  const handleClick = useCallback((e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!ui || !menuCommandId) return;
    
    const triggerElement = e.currentTarget as HTMLElement;

    ui.executeCommand(menuCommandId, { 
      source: 'click',
      triggerElement: triggerElement
    });
  }, [menuCommandId, ui]);

  return (
    <div style={{ maxWidth: '100px', width: '100px' }}>
      <Button 
        className={`
          !w-full col-start-1 row-start-1 appearance-none rounded-md bg-white py-1.5 pl-3 pr-2 text-[13px] text-gray-900 ${active ? 'outline outline-2 -outline-offset-2 outline-blue-500 text-blue-500' : 'outline outline-1 -outline-offset-1 outline-gray-300'} hover:ring-transparent
          flex flex-row items-center justify-between gap-2
        `} 
        onClick={handleClick}
      >
        <span className="truncate flex-1 min-w-0 text-left">{activeCommand?.label}</span>
        <Icon icon="chevronDown" className="w-4 h-4 text-gray-500" />
      </Button>
    </div>
  );
};