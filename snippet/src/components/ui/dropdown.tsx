import { useEffect, useRef } from 'preact/hooks';
import { ComponentChildren, Fragment, h } from 'preact';
import { Dropdown as FlowbiteDropdown, DropdownOptions } from 'flowbite';

interface DropdownProps {
  id: string;
  open: boolean;
  trigger: HTMLElement;
  children: ComponentChildren;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  offsetSkidding?: number;
  offsetDistance?: number;
  delay?: number;
  onShow?: () => void;
  onHide?: () => void;
}

export function Dropdown({
  id,
  open,
  trigger,
  children,
  placement = 'bottom',
  offsetSkidding = 0,
  offsetDistance = 10,
  delay = 300,
  onShow,
  onHide
}: DropdownProps) {
  const targetRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<FlowbiteDropdown | null>(null);

  useEffect(() => {
    // Initialize Flowbite dropdown
    if (targetRef.current && trigger) {
      const options: DropdownOptions = {
        placement,
        triggerType: 'none',
        offsetSkidding,
        offsetDistance,
        delay,
        ignoreClickOutsideClass: 'header',
        onShow,
        onHide
      };

      const instanceOptions = {
        id,
        override: true
      };

      dropdownRef.current = new FlowbiteDropdown(
        targetRef.current,
        trigger,
        options,
        instanceOptions
      );
    }

    // Cleanup
    return () => {
      console.log('cleanup');
    };
  }, [placement, offsetSkidding, offsetDistance, delay]);

  useEffect(() => {
    if (dropdownRef.current) {
      if (open && !dropdownRef.current.isVisible()) {
        dropdownRef.current.show();
      } else if (!open && dropdownRef.current.isVisible()) {
        dropdownRef.current.hide();
      }
    }
  }, [open]);

  return (
    <div 
      id={id}
      ref={targetRef}
      className="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow-sm dark:bg-gray-700 dark:divide-gray-600"
    >
      {children}
    </div>
  );
}

// Subcomponents for better organization
export function DropdownItems({ children }: { children: ComponentChildren }) {
  return (
    <div className="py-2 flex flex-col gap-2">
      {children}
    </div>
  );
}

export function DropdownItem({ 
  children, 
  onClick 
}: { 
  children: ComponentChildren;
  onClick?: () => void;
}) {
  return (
    <li>
      <a 
        href="#" 
        className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
        onClick={(e) => {
          e.preventDefault();
          onClick?.();
        }}
      >
        {children}
      </a>
    </li>
  );
}

export function DropdownDivider() {
  return <hr className="my-1 border-gray-100 dark:border-gray-600" />;
} 