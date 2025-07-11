/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analyses from "../analyses.js";
import type * as calculationSettings from "../calculationSettings.js";
import type * as debug from "../debug.js";
import type * as messages from "../messages.js";
import type * as migrations from "../migrations.js";
import type * as prompts from "../prompts.js";
import type * as settings from "../settings.js";
import type * as voiceChats from "../voiceChats.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analyses: typeof analyses;
  calculationSettings: typeof calculationSettings;
  debug: typeof debug;
  messages: typeof messages;
  migrations: typeof migrations;
  prompts: typeof prompts;
  settings: typeof settings;
  voiceChats: typeof voiceChats;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
