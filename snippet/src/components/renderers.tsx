import { DividerComponent, GroupedItemsComponent, Header, ToggleButtonComponent, ToolButtonComponent } from "@embedpdf/plugin-ui";
import { h, Fragment } from 'preact';
import { Button } from './ui/button';
import { Tooltip } from './ui/tooltip';

export const toolButtonRenderer = (props: ToolButtonComponent) => (
  <Tooltip content={props.label!}>
    <Button
      onClick={() => console.log(`Tool ${props.toolName} clicked`)}
    >
      {props.img && <img src={props.img} alt={props.label} className="w-5 h-5" />}
    </Button>
  </Tooltip>
);

export const toggleButtonRenderer = (props: ToggleButtonComponent) => (
  <Tooltip content={props.label!}>
    <Button
      onClick={() => console.log(`Toggle ${props.toggleElement} clicked`)}
      active={false}
    >
      {props.img && <img src={props.img} alt={props.label} className="w-5 h-5" />}
    </Button>
  </Tooltip>
);

export const dividerRenderer = (props: DividerComponent) => {
  return <div className="h-6 w-[1px] bg-gray-200 self-center" />;
};

export const groupedItemsRenderer = (props: GroupedItemsComponent) => {
  const style: h.JSX.CSSProperties = {
    display: 'flex',
    justifyContent: props.justifyContent || 'start',
    gap: `${props.gap || 0}px`,
  };
  return <div style={style}>{props.items}</div>;
};

export const headerRenderer = (props: Header) => {
  const style: h.JSX.CSSProperties = {
    width: props.placement === 'top' || props.placement === 'bottom' ? '100%' : 'auto',
    height: props.placement === 'left' || props.placement === 'right' ? '100%' : 'auto',
    zIndex: 10, // Ensure header stays above other content
    ...props.style,
  };
  return <div style={style}>{props.items}</div>;
};