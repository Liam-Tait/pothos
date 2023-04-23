/* eslint-disable max-classes-per-file */
import {
  FieldMap,
  InterfaceParam,
  ObjectTypeOptions,
  OutputRef,
  outputShapeKey,
  parentShapeKey,
  PothosObjectTypeConfig,
  SchemaTypes,
} from '../types';
import { BaseTypeRef } from './base';

export class ObjectRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types, PothosObjectTypeConfig>
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
