/**
 * @fileoverview Registry of internal spec properties keyed by test title path.
 * Used by the browser runtime to store and retrieve per-scenario state (pickle,
 * step list, test case id, etc.).
 */

import type { Pickle, PickleStep } from "@cucumber/messages";
import merge from "lodash/merge";

import { ensure } from "./helpers/assertions";
import type { StrictTimestamp } from "./helpers/messages";
import type { ICaseHook } from "./registry";

/**
 * One slot in the scenario execution list: either a step hook (BeforeStep/AfterStep)
 * or a Gherkin step (pickle step).
 * 
 */
export interface IStep {
  hook?: ICaseHook<Mocha.Context>;
  pickleStep?: PickleStep;
}

/** Return value for InternalSpecProperties.toJSON to hide internals from reporters. */
export const internalPropertiesReplacementText =
  "Internal properties of cypress-cucumber-preprocessor omitted from report.";

/**
 * Internal state stored per scenario (one entry per `it(...)` from a feature).
 * Used by the browser runtime for step execution, timing, and reporting.
 */
export interface InternalSpecProperties {
  pickle: Pickle;
  testCaseStartedId: string;
  currentStepStartedAt?: StrictTimestamp;
  currentStep?: IStep;
  allSteps: IStep[];
  remainingSteps: IStep[];
  toJSON(): typeof internalPropertiesReplacementText;
}

/**
 * Criteria for lookup (find/update). Key is titlePath only — one spec file runs at a time.
 */
export interface LookupCriteria {
  titlePath: string[];
}

/** Full config for a single spec: lookup criteria plus its internal properties. */
export interface RegistrationEntry extends LookupCriteria {
  specProperties: InternalSpecProperties;
}

const GLOBAL_PROPERTY_NAME =
  "__cypress_cucumber_preprocessor_spec_config_registry_dont_use_this";
declare global {
  var __cypress_cucumber_preprocessor_spec_config_registry_dont_use_this:
    | Map<string, InternalSpecProperties>
    | undefined;
}

/**
 * Global registry mapping test title path to internal spec properties.
 * Stores one entry per scenario; find/update by SpecLookupCriteria (titlePath).
 */
export class SpecPropertyRegistry {
  private static cfgs: Map<string, InternalSpecProperties>;

  private constructor() {
    if (globalThis[GLOBAL_PROPERTY_NAME]) {
      SpecPropertyRegistry.cfgs = globalThis[GLOBAL_PROPERTY_NAME];
    } else {
      SpecPropertyRegistry.cfgs = globalThis[GLOBAL_PROPERTY_NAME] = new Map<
        string,
        InternalSpecProperties
      >();
    }
  }

  private static get configs(): Map<string, InternalSpecProperties> {
    if (!globalThis[GLOBAL_PROPERTY_NAME]) {
      globalThis[GLOBAL_PROPERTY_NAME] = new Map<
        string,
        InternalSpecProperties
      >();
    }
    if (!SpecPropertyRegistry.cfgs) {
      SpecPropertyRegistry.cfgs = globalThis[GLOBAL_PROPERTY_NAME];
    }
    return SpecPropertyRegistry.cfgs;
  }

  private static composeKey(criteria: LookupCriteria): string {
    return criteria.titlePath.join("#");
  }

  /**
   * Returns the internal properties for the spec matching the given criteria.
   * Throws if no config is registered for that title path.
   */
  static find(criteria: LookupCriteria): InternalSpecProperties {
    const key = this.composeKey(criteria);
    return ensure(
      this.configs.get(key),
      "Expected to find a config for the arguments",
    );
  }

  /**
   * Registers internal properties for a spec. Overwrites any existing entry
   * for the same title path.
   */
  static register(config: RegistrationEntry): void {
    const key = this.composeKey(config);
    this.configs.set(key, config.specProperties);
  }

  /**
   * Merges partial properties into the existing config for the given spec.
   * Throws if no config is registered for that title path.
   */
  static update(
    spec: LookupCriteria,
    config: Partial<InternalSpecProperties>,
  ): void {
    const key = this.composeKey(spec);

    const merged = merge(
      ensure(
        this.configs.get(key),
        `Expected to find a config for: ${spec.titlePath.join(" > ")}`,
      ),
      config,
    );
    this.configs.set(key, merged);
  }
}
