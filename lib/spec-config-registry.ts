import type { Pickle, PickleStep } from "@cucumber/messages";
import merge from "lodash/merge";

import { ensure } from "./helpers/assertions";
import type { StrictTimestamp } from "./helpers/messages";
import type { ICaseHook } from "./registry";

export interface IStep {
  hook?: ICaseHook<Mocha.Context>;
  pickleStep?: PickleStep;
}

export const internalPropertiesReplacementText =
  "Internal properties of cypress-cucumber-preprocessor omitted from report.";

export interface InternalSpecProperties {
  pickle: Pickle;
  testCaseStartedId: string;
  currentStepStartedAt?: StrictTimestamp;
  currentStep?: IStep;
  allSteps: IStep[];
  remainingSteps: IStep[];
  toJSON(): typeof internalPropertiesReplacementText;
}

/** Criteria for lookup (find/update). Key is titlePath only — one spec file runs at a time. */
export interface SpecLookupCriteria {
  titlePath: string[];
}

export interface SpecConfig extends SpecLookupCriteria {
  specProperties: InternalSpecProperties;
}

const GLOBAL_PROPERTY_NAME =
  "__cypress_cucumber_preprocessor_spec_config_registry_dont_use_this";
declare global {
  var __cypress_cucumber_preprocessor_spec_config_registry_dont_use_this:
    | Map<string, InternalSpecProperties>
    | undefined;
}

export class SpecConfigRegistry {
  private static cfgs: Map<string, InternalSpecProperties>;

  private constructor() {
    if (globalThis[GLOBAL_PROPERTY_NAME]) {
      SpecConfigRegistry.cfgs = globalThis[GLOBAL_PROPERTY_NAME];
    } else {
      SpecConfigRegistry.cfgs = globalThis[GLOBAL_PROPERTY_NAME] = new Map<
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
    if (!SpecConfigRegistry.cfgs) {
      SpecConfigRegistry.cfgs = globalThis[GLOBAL_PROPERTY_NAME];
    }
    return SpecConfigRegistry.cfgs;
  }

  private static composeKey(criteria: SpecLookupCriteria): string {
    return criteria.titlePath.join("#");
  }

  static find(criteria: SpecLookupCriteria): InternalSpecProperties {
    const key = this.composeKey(criteria);
    return ensure(
      this.configs.get(key),
      "Expected to find a config for the arguments",
    );
  }

  static register(config: SpecConfig) {
    const key = this.composeKey(config);
    this.configs.set(key, config.specProperties);
  }

  static update(
    spec: SpecLookupCriteria,
    config: Partial<InternalSpecProperties>,
  ) {
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
