"use client";

import { ContentType } from "@/types";
import {
  IconMessage,
  IconRobotFace,
  IconBolt,
  IconPencil,
  IconSparkles,
  IconSettings,
  IconCalculator,
  IconAdjustments,
} from "@tabler/icons-react";
import { FC } from "react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WithTooltip } from "@/components/ui/with-tooltip";
import { motion } from "framer-motion";

export const SIDEBAR_ICON_SIZE = 28;

interface SidebarSwitcherProps {
  onContentTypeChange: (contentType: ContentType) => void;
}

export const SidebarSwitcher: FC<SidebarSwitcherProps> = ({
  onContentTypeChange,
}) => {
  return (
    <div className="w-14 border-r h-full border-white/20 bg-white/50 backdrop-blur-xl p-2 relative">
      <TabsList className="flex h-full w-full flex-col items-center justify-center gap-3 bg-transparent p-0">
        <SidebarSwitchItem
          icon={<IconMessage size={20} />}
          contentType="chats"
          onContentTypeChange={onContentTypeChange}
          tooltip="Chats"
        />
        <SidebarSwitchItem
          icon={<IconSparkles size={20} />}
          contentType="presets"
          onContentTypeChange={onContentTypeChange}
          tooltip="Presets"
        />
        <SidebarSwitchItem
          icon={<IconPencil size={20} />}
          contentType="prompts"
          onContentTypeChange={onContentTypeChange}
          tooltip="Prompts"
        />
        <SidebarSwitchItem
          icon={<IconRobotFace size={20} />}
          contentType="assistants"
          onContentTypeChange={onContentTypeChange}
          tooltip="Assistants"
        />{" "}
        <SidebarSwitchItem
          icon={<IconBolt size={20} />}
          contentType="tools"
          onContentTypeChange={onContentTypeChange}
          tooltip="Mentor"
        />
        <SidebarSwitchItem
          icon={<IconCalculator size={20} />}
          contentType="calculate-score"
          onContentTypeChange={onContentTypeChange}
          tooltip="Calculate Score"
        />
        <SidebarSwitchItem
          icon={<IconAdjustments size={20} />}
          contentType="calculation-settings"
          onContentTypeChange={onContentTypeChange}
          tooltip="Calculation Settings"
        />
        <SidebarSwitchItem
          icon={<IconSettings size={20} />}
          contentType="settings"
          onContentTypeChange={onContentTypeChange}
          tooltip="Settings"
        />
      </TabsList>
    </div>
  );
};

interface SidebarSwitchItemProps {
  icon: React.ReactNode;
  contentType: ContentType;
  onContentTypeChange: (contentType: ContentType) => void;
  tooltip: string;
}

const SidebarSwitchItem: FC<SidebarSwitchItemProps> = ({
  icon,
  contentType,
  onContentTypeChange,
  tooltip,
}) => {
  return (
    <WithTooltip
      delayDuration={200}
      side="right"
      display={<div className="text-sm font-medium">{tooltip}</div>}
      trigger={
        <motion.div
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
        >
          <TabsTrigger
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-300 hover:bg-white/80 hover:text-gray-900 hover:shadow-lg data-[state=active]:bg-white/90 data-[state=active]:text-gray-900 data-[state=active]:shadow-lg backdrop-blur-sm"
            value={contentType}
            onClick={() => onContentTypeChange(contentType)}
          >
            <motion.div
              whileHover={{ rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {icon}
            </motion.div>
          </TabsTrigger>
        </motion.div>
      }
    />
  );
};
