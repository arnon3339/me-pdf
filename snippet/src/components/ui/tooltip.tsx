import { h, ComponentChildren, Fragment } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { Tooltip as FlowbiteTooltip } from 'flowbite';

interface TooltipProps {
  children: ComponentChildren;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  delay?: number;
  style?: 'light' | 'dark';
  targetElement?: string;
  trigger?: 'hover' | 'click' | 'none';
}

export function Tooltip({ 
  children, 
  content, 
  targetElement,
  position = 'top',
  style = 'dark',
  trigger = 'hover',
  className = '',
  delay = 200 
}: TooltipProps) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipInstance = useRef<FlowbiteTooltip | null>(null);

  useEffect(() => {
    if (triggerRef.current && tooltipRef.current) {
      // Initialize Flowbite tooltip
      tooltipInstance.current = new FlowbiteTooltip(
        tooltipRef.current,
        triggerRef.current,
        {
          placement: position,
          triggerType: trigger,
          onShow: () => {
            // Add any custom show logic here
          },
          onHide: () => {
            // Add any custom hide logic here
          }
        }
      );

      return () => {
        // Cleanup
        if (tooltipInstance.current) {
          tooltipInstance.current.destroy();
        }
      };
    }
  }, [position, trigger]);

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-block"
        data-tooltip-target={targetElement}
        data-tooltip-placement={position}
        data-tooltip-style={style}
        data-tooltip-trigger={trigger}
      >
        {children}
      </div>
      <div
        id={targetElement}
        ref={tooltipRef}
        role="tooltip"
        className={`
          absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium
          ${style === 'dark' 
            ? 'text-white bg-gray-900 dark:bg-gray-700' 
            : 'text-gray-900 bg-white border border-gray-200'
          }
          rounded-lg shadow-sm opacity-0 tooltip transition-opacity duration-300
          ${className}
        `}
      >
        {content}
        <div className="tooltip-arrow" data-popper-arrow></div>
      </div>
    </>
  );
} 