"use client";

import { motion } from "motion/react";
import {
  type ComponentType,
  type Dispatch,
  type SetStateAction,
  type SVGProps,
  useState,
  useSyncExternalStore,
} from "react";
import { cn } from "~/lib/utils";

export type DiscreteTabItem<T extends string = string> = {
  id: T;
  title: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
};

export type DiscreteTabsProps<T extends string = string> = {
  items: DiscreteTabItem<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (next: T) => void;
  className?: string;
};

export function DiscreteTabs<T extends string = string>({
  items,
  value,
  defaultValue,
  onChange,
  className,
}: DiscreteTabsProps<T>) {
  const [internal, setInternal] = useState<T>(
    (defaultValue ?? items[0]?.id) as T,
  );
  const active = (value ?? internal) as T;
  const setActive = (next: T) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {items.map((tab) => (
        <DiscreteTabButton
          key={tab.id}
          title={tab.title}
          ButtonIcon={tab.icon}
          isActive={active === tab.id}
          onSelect={() => setActive(tab.id)}
        />
      ))}
    </div>
  );
}

const subscribe = () => () => {};
const getSnapshotTrue = () => true;
const getServerSnapshotFalse = () => false;
function useHasHydrated() {
  return useSyncExternalStore(
    subscribe,
    getSnapshotTrue,
    getServerSnapshotFalse,
  );
}

function DiscreteTabButton({
  title,
  ButtonIcon,
  isActive,
  onSelect,
}: {
  title: string;
  ButtonIcon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  isActive: boolean;
  onSelect: () => void;
}) {
  const isLoaded = useHasHydrated();

  return (
    <motion.div
      layoutId={`button-id-${title}`}
      transition={{
        layout: {
          type: "spring",
          damping: 20,
          stiffness: 230,
          mass: 1.2,
          ease: [0.215, 0.61, 0.355, 1],
        },
      }}
      onClick={onSelect}
      className="flex h-fit w-fit"
      style={{ willChange: "transform" }}
    >
      <motion.div
        layout
        transition={{
          layout: {
            type: "spring",
            damping: 20,
            stiffness: 230,
            mass: 1.2,
          },
        }}
        className={cn(
          "flex cursor-pointer items-center gap-1.5 overflow-hidden rounded-[25px] bg-secondary p-3 font-mono uppercase shadow-md outline-2 outline-background transition-colors duration-75 ease-out",
          isActive && "px-4 text-primary",
          !isActive && "px-3",
        )}
      >
        <motion.div
          layoutId={`icon-id-${title}`}
          className="shrink-0"
          style={{ willChange: "transform" }}
        >
          <ButtonIcon size={22} />
        </motion.div>
        {isActive && (
          <motion.div
            className="flex items-center"
            initial={isLoaded ? { opacity: 0, filter: "blur(4px)" } : false}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: isLoaded ? 0.2 : 0,
              ease: [0.86, 0, 0.07, 1],
            }}
          >
            <motion.span
              layoutId={`text-id-${title}`}
              className="relative inline-block whitespace-nowrap font-mono text-sm font-medium uppercase"
              style={{ willChange: "transform" }}
            >
              {title}
            </motion.span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export type DiscreteTabIcon = ComponentType<
  SVGProps<SVGSVGElement> & { size?: number }
>;
export type DiscreteTabsLegacySetter<T extends string> = Dispatch<
  SetStateAction<T>
>;
