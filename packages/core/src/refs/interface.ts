/* eslint-disable max-classes-per-file */

import {
  FieldMap,
  InterfaceParam,
  InterfaceTypeOptions,
  OutputRef,
  outputShapeKey,
  parentShapeKey,
  PothosInterfaceTypeConfig,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';

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
