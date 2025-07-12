"use client";

import { ContentType } from "@/types";
import {
  IconMessage,
  IconPencil,
  IconSparkles,
  IconSettings,
  IconCalculator,
  IconAdjustments,
  IconDownload,
  IconMicrophone,
  IconDeviceRemoteFilled,
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
    <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
      <div className="w-16 bg-white/20 backdrop-blur-xl rounded-2xl p-3 border border-white/30 shadow-2xl">
        <TabsList className="flex h-full w-full flex-col items-center justify-center gap-4 bg-transparent p-0">
          <SidebarSwitchItem
            icon={<IconMessage size={20} />}
            contentType="chats"
            onContentTypeChange={onContentTypeChange}
            tooltip="Chats"
            color="from-blue-500 to-cyan-600"
            hoverColor="hover:from-blue-600 hover:to-cyan-700"
          />
          <SidebarSwitchItem
            icon={<IconMicrophone size={20} />}
            contentType="voice-chats"
            onContentTypeChange={onContentTypeChange}
            tooltip="Voice Chats"
            color="from-purple-500 to-pink-600"
            hoverColor="hover:from-purple-600 hover:to-pink-700"
          />
          <SidebarSwitchItem
            icon={<IconSparkles size={20} />}
            contentType="presets"
            onContentTypeChange={onContentTypeChange}
            tooltip="Presets"
            color="from-pink-500 to-rose-600"
            hoverColor="hover:from-pink-600 hover:to-rose-700"
          />
          <SidebarSwitchItem
            icon={<IconPencil size={20} />}
            contentType="prompts"
            onContentTypeChange={onContentTypeChange}
            tooltip="Prompts"
            color="from-green-500 to-emerald-600"
            hoverColor="hover:from-green-600 hover:to-emerald-700"
          />
          <SidebarSwitchItem
            icon={<IconCalculator size={20} />}
            contentType="calculate-score"
            onContentTypeChange={onContentTypeChange}
            tooltip="Calculate Score"
            color="from-orange-500 to-amber-600"
            hoverColor="hover:from-orange-600 hover:to-amber-700"
          />
          <SidebarSwitchItem
            icon={
              <div className="relative">
                <IconDeviceRemoteFilled size={20} />
              </div>
            }
            contentType="voice-calculate-score"
            onContentTypeChange={onContentTypeChange}
            tooltip="Voice Calculate Score"
            color="from-purple-500 to-violet-600"
            hoverColor="hover:from-purple-600 hover:to-violet-700"
          />
          <SidebarSwitchItem
            icon={<IconAdjustments size={20} />}
            contentType="calculation-settings"
            onContentTypeChange={onContentTypeChange}
            tooltip="Calculation Settings"
            color="from-teal-500 to-cyan-600"
            hoverColor="hover:from-teal-600 hover:to-cyan-700"
          />
          <SidebarSwitchItem
            icon={<IconDownload size={20} />}
            contentType="import-export"
            onContentTypeChange={onContentTypeChange}
            tooltip="Import/Export"
            color="from-indigo-500 to-purple-600"
            hoverColor="hover:from-indigo-600 hover:to-purple-700"
          />
          <SidebarSwitchItem
            icon={<IconSettings size={20} />}
            contentType="settings"
            onContentTypeChange={onContentTypeChange}
            tooltip="Settings"
            color="from-slate-500 to-gray-600"
            hoverColor="hover:from-slate-600 hover:to-gray-700"
          />
        </TabsList>
      </div>
    </div>
  );
};

interface SidebarSwitchItemProps {
  icon: React.ReactNode;
  contentType: ContentType;
  onContentTypeChange: (contentType: ContentType) => void;
  tooltip: string;
  color: string;
  hoverColor: string;
}

const SidebarSwitchItem: FC<SidebarSwitchItemProps> = ({
  icon,
  contentType,
  onContentTypeChange,
  tooltip,
  color,
  hoverColor,
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
            className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl transition-all duration-300 border-2 border-white/40 hover:border-white/60 group-data-[state=active]:border-white/80 relative overflow-hidden group shadow-lg hover:shadow-xl"
            value={contentType}
            onClick={() => onContentTypeChange(contentType)}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${color} opacity-50 group-hover:opacity-70 group-data-[state=active]:opacity-80 transition-opacity duration-300`}
            />
            <div
              className={`absolute inset-0 bg-gradient-to-br ${hoverColor} opacity-0 group-hover:opacity-30 transition-opacity duration-300`}
            />
            <motion.div
              className="relative z-10 text-white drop-shadow-2xl filter brightness-110"
              whileHover={{ rotate: 5, scale: 1.1 }}
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
