/* eslint-disable max-classes-per-file */

import { PothosSchemaError } from '../errors';
import {
  FieldMap,
  InterfaceParam,
  InterfaceTypeOptions,
  OutputRef,
  outputShapeKey,
  parentShapeKey,
  PothosInterfaceTypeConfig,
  PothosOutputFieldConfig,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';
import { FieldRef } from './field';

export class InterfaceRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types, PothosInterfaceTypeConfig>
  implements OutputRef, PothosSchemaTypes.InterfaceRef<Types, T, P>
{
  override kind = 'Interface' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  private fields = new Set<() => FieldMap>();
  private interfaces = new Set<() => InterfaceParam<Types>[]>();

  constructor(name: string) {
    super('Interface', name);
  }

  addFields(fields: () => FieldMap) {
    this.fields.add(fields);
  }

  addInterfaces(interfaces: (() => InterfaceParam<Types>[]) | InterfaceParam<Types>[]) {
    this.interfaces.add(() => (Array.isArray(interfaces) ? interfaces : interfaces()));
  }

  getFields(
    builder: PothosSchemaTypes.SchemaBuilder<Types>,
    config: PothosInterfaceTypeConfig,
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
    const config = super.toConfig(builder);

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

export class ImplementableInterfaceRef<
  Types extends SchemaTypes,
  Shape,
  Parent = Shape,
> extends InterfaceRef<Types, Shape, Parent> {
  builder: PothosSchemaTypes.SchemaBuilder<Types>;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
    super(name);
    this.builder = builder;
  }

  implement<Interfaces extends InterfaceParam<Types>[]>(
    options: InterfaceTypeOptions<
      Types,
      ImplementableInterfaceRef<Types, Shape, Parent>,
      Parent,
      Interfaces
    >,
  ) {
    return this.builder.interfaceType(this, options);
  }
}
