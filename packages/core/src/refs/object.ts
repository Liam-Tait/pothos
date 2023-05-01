/* eslint-disable max-classes-per-file */
import { PothosSchemaError } from '../errors';
import {
  FieldMap,
  InterfaceParam,
  ObjectTypeOptions,
  OutputRef,
  outputShapeKey,
  parentShapeKey,
  PothosMutationTypeConfig,
  PothosObjectTypeConfig,
  PothosOutputFieldConfig,
  PothosQueryTypeConfig,
  PothosSubscriptionTypeConfig,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';
import { FieldRef } from './field';

export type ObjectLikeConfig =
  | PothosObjectTypeConfig
  | PothosQueryTypeConfig
  | PothosMutationTypeConfig
  | PothosSubscriptionTypeConfig;
export class ObjectRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types, ObjectLikeConfig>
  implements OutputRef, PothosSchemaTypes.ObjectRef<Types, T, P>
{
  override kind = 'Object' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  fields = new Set<() => FieldMap>();
  interfaces = new Set<() => InterfaceParam<Types>[]>();

  constructor(name: string) {
    super('Object', name);
  }

  addFields(fields: () => FieldMap) {
    this.fields.add(fields);
  }

  addInterfaces(interfaces: (() => InterfaceParam<Types>[]) | InterfaceParam<Types>[]) {
    this.interfaces.add(() => (Array.isArray(interfaces) ? interfaces : interfaces()));
  }

  getFields(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    config: ObjectLikeConfig,
    fields = new Map<string, PothosOutputFieldConfig<Types>>(),
  ) {
    for (const fieldMap of this.fields) {
      for (const [fieldName, field] of Object.entries(fieldMap())) {
        if (field) {
          if (fields.has(fieldName)) {
            throw new PothosSchemaError(`Duplicate field ${fieldName} on ${config.name}`);
          }

          fields.set(fieldName, (field as FieldRef<Types>).getConfig(builder, fieldName, config));
        }
      }
    }

    return fields;
  }

  override toConfig(builder: PothosSchemaTypes.SchemaBuilder<Types>) {
    const config = super.toConfig(builder) as PothosObjectTypeConfig;

    return {
      ...config,
      // interfaces: this.getInterfaces(config),
    };
  }

  getInterfaces() {
    return [...this.interfaces].reduce<InterfaceParam<SchemaTypes>[]>(
      (all, interfaces) => [...all, ...(interfaces() as InterfaceParam<SchemaTypes>[])],
      [],
    );
  }
}

export class ImplementableObjectRef<
  Types extends SchemaTypes,
  Shape,
  Parent = Shape,
> extends ObjectRef<Types, Shape, Parent> {
  builder: PothosSchemaTypes.SchemaBuilder<Types>;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
    super(name);
    this.builder = builder;
  }

  implement<Interfaces extends InterfaceParam<Types>[]>(
    options: Omit<
      ObjectTypeOptions<Types, ImplementableObjectRef<Types, Shape, Parent>, Parent, Interfaces>,
      'name'
    >,
  ): PothosSchemaTypes.ObjectRef<Types, Shape, Parent> {
    return this.builder.objectType(
      this,
      options as ObjectTypeOptions<
        Types,
        ImplementableObjectRef<Types, Shape, Parent>,
        Parent,
        Interfaces
      >,
    );
  }
}
