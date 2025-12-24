import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return (
    <DropdownMenuProvider>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuProvider>
  );
}

interface DropdownMenuProviderProps {
  children: React.ReactNode;
}

function DropdownMenuProvider({ children }: DropdownMenuProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      {children}
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild = false }: DropdownMenuTriggerProps) {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const trigger = React.cloneElement(
    children as React.ReactElement,
    {
      onClick: () => setIsOpen(!isOpen),
      'aria-expanded': isOpen,
      'aria-haspopup': true,
    }
  );

  return (
    <div ref={menuRef}>
      {trigger}
    </div>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function DropdownMenuContent({
  children,
  align = 'end',
  className = ''
}: DropdownMenuContentProps) {
  const { isOpen } = React.useContext(DropdownMenuContext);

  if (!isOpen) return null;

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0'
  };

  return (
    <div
      className={`absolute z-[9999] mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${alignmentClasses[align]} ${className}`}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="menu-button"
      style={{
        zIndex: 99999,
        pointerEvents: 'auto'
      }}
    >
      <div className="py-1" role="none" style={{ pointerEvents: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  className = ''
}: DropdownMenuItemProps) {
  const { setIsOpen } = React.useContext(DropdownMenuContext);

  const handleClick = (e: React.MouseEvent) => {
    console.log('DropdownMenuItem clicked - event triggered'); // Debug log
    e.preventDefault();
    e.stopPropagation();

    if (disabled) {
      console.log('Item is disabled, ignoring click');
      return;
    }

    if (onClick) {
      console.log('Calling onClick handler'); // Debug log
      try {
        onClick();
        console.log('onClick handler executed successfully');
      } catch (error) {
        console.error('Error in onClick handler:', error);
      }
    } else {
      console.log('No onClick handler provided');
    }

    setIsOpen(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('Mouse down on menu item'); // Debug log
    // Don't prevent default - let the click event fire naturally
  };

  return (
    <button
      type="button"
      className={`block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:bg-gray-200'
      } ${className}`}
      role="menuitem"
      onClick={handleClick}
      onDoubleClick={(e) => {
        console.log('Double click on menu item');
        if (!disabled && onClick) {
          console.log('Calling onClick from doubleClick');
          try {
            onClick();
            setIsOpen(false);
          } catch (error) {
            console.error('Error in onClick handler (from doubleClick):', error);
          }
        }
      }}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      style={{ pointerEvents: 'auto' }}
    >
      {children}
    </button>
  );
}

// Context for managing dropdown state
const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});