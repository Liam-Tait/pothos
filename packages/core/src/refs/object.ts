/* eslint-disable max-classes-per-file */
import {
  InterfaceParam,
  ObjectTypeOptions,
  OutputRef,
  outputShapeKey,
  parentShapeKey,
  PothosObjectTypeConfig,
  SchemaTypes,
} from '../types';
import BaseTypeRef from './base';

export default class ObjectRef<Types extends SchemaTypes, T, P = T>
  extends BaseTypeRef<Types, PothosObjectTypeConfig>
  implements OutputRef, PothosSchemaTypes.ObjectRef<Types, T, P>
{
  override kind = 'Object' as const;

  [outputShapeKey]!: T;
  [parentShapeKey]!: P;

  constructor(builder: PothosSchemaTypes.SchemaBuilder<Types>, name: string) {
    super(builder, 'Object', name);
  }
}

export class ImplementableObjectRef<
  Types extends SchemaTypes,
  Shape,
  Parent = Shape,
> extends ObjectRef<Types, Shape, Parent> {
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
