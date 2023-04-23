/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
import {
  GraphQLBoolean,
  GraphQLFloat,
  GraphQLID,
  GraphQLInt,
  GraphQLScalarType,
  GraphQLString,
} from 'graphql';
import { PothosSchemaError } from './errors';
import { BaseTypeRef } from './refs/base';
import { BuiltinScalarRef } from './refs/builtin-scalar';
import { InputTypeRef } from './refs/input';
import { MutationRef } from './refs/mutation';
import { ObjectRef } from './refs/object';
import { QueryRef } from './refs/query';
import { SubscriptionRef } from './refs/subscription';
import type {
  ConfigurableRef,
  FieldMap,
  GraphQLFieldKind,
  InputFieldMap,
  InputRef,
  OutputType,
  PothosFieldConfig,
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

    const scalars: GraphQLScalarType[] = [
      GraphQLID,
      GraphQLInt,
      GraphQLFloat,
      GraphQLString,
      GraphQLBoolean,
    ];

    scalars.forEach((scalar) => {
      this.associateParamWithRef(
        scalar.name as ConfigurableRef<Types>,
        new BuiltinScalarRef<Types, unknown, unknown>(scalar),
      );
    });
  }

  addFields(param: ConfigurableRef<Types>, fields: () => FieldMap) {
    this.onConfig(param, (config, ref) => {
      if (
        !(
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
    this.onConfig(param, (config, ref) => {
      if (!(ref instanceof InputTypeRef)) {
        throw new PothosSchemaError(`Can not add fields to ${ref} because it is not an object`);
      }

      ref.addFields(fields);
    });
  }

  associateParamWithRef<T>(param: ConfigurableRef<Types> | string, ref: BaseTypeRef<Types, T>) {
    const resolved = this.resolveParamAssociations(ref);
    this.paramAssociations.set(param, resolved);

    const pendingResolutions = this.pendingTypeConfigResolutions.get(param) ?? [];

    if (pendingResolutions.length === 0) {
      return;
    }

    if (typeof resolved === 'string' && this.typeConfigs.has(resolved)) {
      pendingResolutions.forEach((cb) => {
        const { config, ref: resolvedRef } = this.typeConfigs.get(resolved)!;
        cb(config, resolvedRef);
      });
    } else {
      pendingResolutions.forEach((cb) => {
        this.onConfig(resolved as ConfigurableRef<Types>, cb);
      });
    }

    this.pendingTypeConfigResolutions.delete(param);
  }

  onConfig(
    param: ConfigurableRef<Types>,
    onConfig: (config: PothosTypeConfig, ref: BaseTypeRef<Types>) => void,
  ) {
    const resolved = this.resolveParamAssociations(param);

    if (typeof resolved === 'string' && this.typeConfigs.has(resolved)) {
      onConfig(this.typeConfigs.get(resolved)!.config, this.typeConfigs.get(resolved)!.ref);
    } else {
      if (!this.pendingTypeConfigResolutions.has(param)) {
        this.pendingTypeConfigResolutions.set(param, []);
      }
      this.pendingTypeConfigResolutions.get(param)!.push(onConfig);
    }
  }

  onConfigOfKind<Kind extends PothosTypeConfig['kind']>(
    param: ConfigurableRef<Types>,
    kind: Kind,
    onConfig: (config: PothosTypeConfig & { kind: Kind }) => void,
  ) {
    this.onConfig(param, (config) => {
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
    const config = type.toConfig(this.builder) as PothosTypeConfig;

    if (this.typeConfigs.has(config.name)) {
      throw new PothosSchemaError(
        `Duplicate typename: Another type with name ${config.name} already exists.`,
      );
    }

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
