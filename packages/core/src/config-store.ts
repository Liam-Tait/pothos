/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import { PothosSchemaError } from './errors';
import { BaseTypeRef } from './refs/base';
import { InputObjectRef } from './refs/input-object';
import { InterfaceRef } from './refs/interface';
import { MutationRef } from './refs/mutation';
import { ObjectRef } from './refs/object';
import { QueryRef } from './refs/query';
import { SubscriptionRef } from './refs/subscription';
import { UnionRef } from './refs/union';
import type {
  ConfigurableRef,
  FieldMap,
  GraphQLFieldKind,
  InputFieldMap,
  InputRef,
  OutputType,
  PothosFieldConfig,
  PothosInputFieldConfig,
  PothosOutputFieldConfig,
  PothosTypeConfig,
  SchemaTypes,
} from './types';

export class ConfigStore<Types extends SchemaTypes> {
  typeConfigs = new Map<
    string,
    {
      config: PothosTypeConfig;
      ref: BaseTypeRef<Types>;
    }
  >();

  private fields = new Map<string, Map<string, PothosFieldConfig<Types>>>();

  private refs = new Set<BaseTypeRef<Types>>();

  private pendingActions: (() => void)[] = [];

  private paramAssociations = new Map<unknown, unknown>();

  private pendingTypeConfigResolutions = new Map<
    unknown,
    ((config: PothosTypeConfig, ref: BaseTypeRef<Types>) => void)[]
  >();

  private pending = true;

  private builder: PothosSchemaTypes.SchemaBuilder<Types>;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>) {
    this.builder = builder;
  }

  addFields(param: ConfigurableRef<Types>, fields: () => FieldMap) {
    this.onTypeConfig(param, (config, ref) => {
      if (
        !(
          ref instanceof InterfaceRef ||
          ref instanceof ObjectRef ||
          ref instanceof QueryRef ||
          ref instanceof MutationRef ||
          ref instanceof SubscriptionRef
        )
      ) {
        throw new PothosSchemaError(`Can not add fields to ${ref} because it is not an object`);
      }

      ref.addFields(fields);
    });
  }

  addInputFields(param: ConfigurableRef<Types>, fields: () => InputFieldMap) {
    this.onTypeConfig(param, (config, ref) => {
      if (!(ref instanceof InputObjectRef)) {
        throw new PothosSchemaError(
          `Can not add fields to ${ref} because it is not an input object`,
        );
      }

      ref.addFields(fields);
    });
  }

  associateParamWithRef<T>(param: ConfigurableRef<Types>, ref: BaseTypeRef<Types, T>) {
    this.refs.add(ref as BaseTypeRef<Types>);
    const resolved = this.resolveParamAssociations(ref);
    this.paramAssociations.set(param, resolved);

    const pendingResolutions = this.pendingTypeConfigResolutions.get(param) ?? [];

    if (pendingResolutions.length > 0) {
      if (typeof resolved === 'string' && this.typeConfigs.has(resolved)) {
        pendingResolutions.forEach((cb) => {
          const { config, ref: resolvedRef } = this.typeConfigs.get(resolved)!;
          cb(config, resolvedRef);
        });
      } else {
        pendingResolutions.forEach((cb) => {
          this.onTypeConfig(resolved as ConfigurableRef<Types>, cb);
        });
      }
    }

    this.pendingTypeConfigResolutions.delete(param);
  }

  onTypeConfig(
    param: ConfigurableRef<Types>,
    onConfig: (config: PothosTypeConfig, ref: BaseTypeRef<Types>) => void,
  ) {
    const resolved = this.resolveParamAssociations(param);

    if (typeof resolved === 'string' && this.typeConfigs.has(resolved)) {
      onConfig(this.typeConfigs.get(resolved)!.config, this.typeConfigs.get(resolved)!.ref);
    } else {
      if (!this.pendingTypeConfigResolutions.has(resolved)) {
        this.pendingTypeConfigResolutions.set(resolved, []);
      }
      this.pendingTypeConfigResolutions.get(resolved)!.push(onConfig);
    }
  }

  onTypeConfigOfKind<Kind extends PothosTypeConfig['kind']>(
    param: ConfigurableRef<Types>,
    kind: Kind,
    onConfig: (config: PothosTypeConfig & { kind: Kind }) => void,
  ) {
    this.onTypeConfig(param, (config) => {
      if (config.kind !== kind) {
        throw new PothosSchemaError(
          `Expected ${this.describeRef(param)} to be of kind ${kind} but it is of kind ${
            config.kind
          }`,
        );
      }

      onConfig(config as PothosTypeConfig & { kind: Kind });
    });
  }

  addImplementedTypeRef<T>(type: BaseTypeRef<Types, T>) {
    this.refs.add(type as BaseTypeRef<Types>);
    const config = type.toConfig(this.builder) as PothosTypeConfig;

    if (this.typeConfigs.has(config.name)) {
      throw new PothosSchemaError(
        `Duplicate typename: Another type with name ${config.name} already exists.`,
      );
    }

    this.paramAssociations.set(type, config.name);
    this.typeConfigs.set(config.name, { config, ref: type as BaseTypeRef<Types> });

    if (this.pendingTypeConfigResolutions.has(config.name)) {
      const cbs = this.pendingTypeConfigResolutions.get(config.name)!;

      cbs.forEach((cb) => void cb(config, type as BaseTypeRef<Types>));
    }

    this.pendingTypeConfigResolutions.delete(config.name);
  }

  hasImplementation(typeName: string) {
    return this.typeConfigs.has(typeName);
  }

  hasConfig(ref: ConfigurableRef<Types> | string) {
    const resolved = this.resolveParamAssociations(ref);

    if (typeof resolved !== 'string' || !this.typeConfigs.has(resolved)) {
      return false;
    }

    return true;
  }

  getTypeConfig<T extends PothosTypeConfig['kind']>(
    ref: ConfigurableRef<Types> | string,
    kind?: T,
  ) {
    const resolved = this.resolveParamAssociations(ref);

    if (typeof resolved !== 'string' || !this.typeConfigs.has(resolved)) {
      throw new PothosSchemaError(`${this.describeRef(ref)} has not been implemented`);
    }

    const { config } = this.typeConfigs.get(resolved)!;

    if (kind && config.graphqlKind !== kind) {
      throw new PothosSchemaError(
        `Expected ref to resolve to a ${kind} type, but got ${config.kind}`,
      );
    }

    return config as Extract<PothosTypeConfig, { kind: T }>;
  }

  getInputTypeRef(param: ConfigurableRef<Types> | string) {
    const resolved = this.resolveParamAssociations(param);

    if (typeof resolved === 'string' && this.typeConfigs.has(resolved)) {
      const { ref } = this.typeConfigs.get(resolved)!;

      if (ref instanceof BaseTypeRef) {
        if (ref.kind !== 'InputObject' && ref.kind !== 'Enum' && ref.kind !== 'Scalar') {
          throw new PothosSchemaError(
            `Expected ${this.describeRef(ref)} to be an input type but got ${ref.kind}`,
          );
        }

        return ref as unknown as InputRef;
      }
    }

    throw new PothosSchemaError(`${this.describeRef(param)} has not been implemented`);
  }

  getOutputTypeRef(param: ConfigurableRef<Types> | string) {
    const resolved = this.resolveParamAssociations(param);

    if (typeof resolved === 'string' && this.typeConfigs.has(resolved)) {
      const { ref } = this.typeConfigs.get(resolved)!;

      if (ref instanceof BaseTypeRef) {
        if (ref.kind === 'InputObject' || ref.kind === 'InputList') {
          throw new PothosSchemaError(
            `Expected ${ref.name} to be an output type but got ${ref.kind}`,
          );
        }

        return ref as unknown as OutputType<Types>;
      }
    }

    throw new PothosSchemaError(`${this.describeRef(param)} has not been implemented`);
  }

  getFields<T extends GraphQLFieldKind>(
    name: string,
    kind?: T,
  ): Map<string, Extract<PothosFieldConfig<Types>, { graphqlKind: T }>> {
    const typeConfig = this.getTypeConfig(name);

    if (!this.fields.has(name)) {
      this.fields.set(name, new Map());
    }
    const fields = this.fields.get(name)!;

    if (kind && typeConfig.graphqlKind !== kind) {
      throw new PothosSchemaError(
        `Expected ${name} to be a ${kind} type, but found ${typeConfig.graphqlKind}`,
      );
    }

    return fields as Map<string, Extract<PothosFieldConfig<Types>, { graphqlKind: T }>>;
  }

  prepareForBuild() {
    this.pending = false;

    this.refs.forEach((ref) => {
      this.buildFields(ref);

      if (ref instanceof ObjectRef) {
        this.updateTypeConfig(ref, 'Object', (config) => ({
          ...config,
          interfaces: [...(config.interfaces ?? []), ...ref.getInterfaces()],
        }));
      } else if (ref instanceof InterfaceRef) {
        this.updateTypeConfig(ref, 'Interface', (config) => ({
          ...config,
          interfaces: [...(config.interfaces ?? []), ...ref.getInterfaces()],
        }));
      } else if (ref instanceof UnionRef) {
        this.updateTypeConfig(ref, 'Union', (config) => ({
          ...config,
          types: [...config.types, ...ref.getTypes()],
        }));
      }
    });

    const { pendingActions } = this;

    this.pendingActions = [];

    pendingActions.forEach((fn) => void fn());

    if (this.pendingTypeConfigResolutions.size > 0) {
      throw new PothosSchemaError(
        `Missing implementations for some references (${[
          ...this.pendingTypeConfigResolutions.keys(),
        ]
          .map((ref) => this.describeRef(ref as ConfigurableRef<Types>))
          .join(', ')}).`,
      );
    }
  }

  onPrepare(cb: () => void) {
    if (this.pending) {
      this.pendingActions.push(cb);
    } else {
      cb();
    }
  }

  buildFields(ref: BaseTypeRef<Types>) {
    if (ref instanceof InputObjectRef) {
      const config = this.getTypeConfig(ref.name, 'InputObject');

      this.fields.set(
        config.name,
        ref.getFields(
          this.builder,
          config,
          this.fields.get(config.name) as Map<string, PothosInputFieldConfig<Types>>,
        ),
      );
    } else if (ref instanceof ObjectRef) {
      const config = this.getTypeConfig(ref.name, 'Object');
      this.fields.set(
        config.name,
        (ref as ObjectRef<Types, unknown>).getFields(
          this.builder,
          config,
          this.fields.get(ref.name) as Map<string, PothosOutputFieldConfig<Types>>,
        ),
      );
    } else if (ref instanceof InterfaceRef) {
      const config = this.getTypeConfig(ref.name, 'Interface');
      this.fields.set(
        config.name,
        (ref as InterfaceRef<Types, unknown>).getFields(
          this.builder,
          config,
          this.fields.get(ref.name) as Map<string, PothosOutputFieldConfig<Types>>,
        ),
      );
    }
  }

  private updateTypeConfig<T extends PothosTypeConfig['kind']>(
    ref: ConfigurableRef<Types> | string,
    kind: T,
    config: (
      config: Extract<PothosTypeConfig, { kind: T }>,
    ) => Extract<PothosTypeConfig, { kind: T }>,
  ) {
    const resolved = this.resolveParamAssociations(ref);

    if (typeof resolved !== 'string' || !this.typeConfigs.has(resolved)) {
      throw new PothosSchemaError(`${this.describeRef(ref)} has not been implemented`);
    }

    const matched = this.typeConfigs.get(resolved)!;

    if (matched.config.graphqlKind !== kind) {
      throw new PothosSchemaError(
        `Expected ref to resolve to a ${kind} type, but got ${matched.config.kind}`,
      );
    }

    matched.config = {
      ...matched.config,
      ...config(matched.config as Extract<PothosTypeConfig, { kind: T }>),
    };
  }

  private resolveParamAssociations(param: unknown) {
    let current = this.paramAssociations.get(param);

    while (current && this.paramAssociations.has(current)) {
      current = this.paramAssociations.get(current)!;
    }

    return current ?? param;
  }

  private describeRef(ref: unknown): string {
    if (typeof ref === 'string') {
      return ref;
    }

    if (ref && ref.toString !== {}.toString) {
      return String(ref);
    }

    // eslint-disable-next-line func-names
    if (typeof ref === 'function' && ref.name !== function () {}.name) {
      return `function ${ref.name}`;
    }

    return `<unnamed ref or enum>`;
  }
}
